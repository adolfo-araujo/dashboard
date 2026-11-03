#!/usr/bin/env bash
# Sobe banco + API com os mesmos limites de CPU e memória de um plano do Render,
# cria os usuários de teste e roda o k6. Usado pelos workflows do GitHub Actions.
#
# Variáveis:
#   USERS          pessoas usando ao mesmo tempo (padrão 100)
#   CPUS / MEMORY  limite de cada cópia da API (ex.: 0.1 e 512m = plano Free do Render)
#   INSTANCES      quantas cópias da API, atrás de um balanceador (padrão 1)
#   DB_LATENCY_MS  atraso extra entre API e banco, para imitar a distância Render ↔ Neon
#   RAMP / HOLD    tempo de chegada das pessoas e tempo de uso simultâneo
#   LABEL          nome do cenário no relatório
set -euo pipefail

USERS=${USERS:-100}
CPUS=${CPUS:-0.5}
MEMORY=${MEMORY:-512m}
INSTANCES=${INSTANCES:-1}
DB_LATENCY_MS=${DB_LATENCY_MS:-0}
RAMP=${RAMP:-1m}
HOLD=${HOLD:-3m}
LABEL=${LABEL:-"API ${CPUS} CPU"}
OUT=${OUT:-loadtest/resultado}
ROOT=$(cd "$(dirname "$0")/.." && pwd)

mkdir -p "$OUT"
DB_URL="postgresql://postgres:password@db:5432/finance"

cleanup() { docker rm -f db lb $(seq -f "api%g" 1 "$INSTANCES") >/dev/null 2>&1 || true; docker network rm lt >/dev/null 2>&1 || true; }
trap cleanup EXIT
cleanup
docker network create lt >/dev/null

echo "::group::Banco de dados (Postgres 16, 1 CPU, 1 GB)"
docker run -d --name db --network lt --cpus 1 --memory 1g --cap-add NET_ADMIN \
  -e POSTGRES_PASSWORD=password -e POSTGRES_DB=finance postgres:16 >/dev/null
until docker exec db pg_isready -U postgres -d finance >/dev/null 2>&1; do sleep 1; done
sleep 2
if [ "$DB_LATENCY_MS" != "0" ]; then
  docker exec db sh -c "apt-get update -qq >/dev/null && apt-get install -y -qq iproute2 >/dev/null && tc qdisc add dev eth0 root netem delay ${DB_LATENCY_MS}ms"
  echo "Atraso de ${DB_LATENCY_MS} ms entre a API e o banco"
fi
echo "::endgroup::"

echo "::group::API (imagem Docker do projeto)"
docker build -q -t valtrea-api "$ROOT/api" >/dev/null
docker run --rm --network lt -e DATABASE_URL="$DB_URL" -e LOAD_USERS="$USERS" valtrea-api \
  sh -c "npx prisma migrate deploy >/dev/null && node scripts/load-seed.js"

for i in $(seq 1 "$INSTANCES"); do
  docker run -d --name "api$i" --network lt --cpus "$CPUS" --memory "$MEMORY" \
    -e DATABASE_URL="$DB_URL" -e JWT_ACCESS_TOKEN_SECRET=carga-access -e JWT_REFRESH_TOKEN_SECRET=carga-refresh \
    -e PORT=8080 -e NODE_ENV=production valtrea-api node index.js >/dev/null
done

UPSTREAM=$(for i in $(seq 1 "$INSTANCES"); do echo "server api$i:8080;"; done)
cat > "$OUT/nginx.conf" <<EOF
events { worker_connections 4096; }
http {
  upstream api { least_conn; ${UPSTREAM} keepalive 64; }
  server {
    listen 8080;
    location / {
      proxy_pass http://api;
      proxy_http_version 1.1;
      proxy_set_header Connection "";
      proxy_set_header cf-connecting-ip \$http_cf_connecting_ip;
      proxy_read_timeout 60s;
    }
  }
}
EOF
docker run -d --name lb --network lt -p 8080:8080 -v "$ROOT/$OUT/nginx.conf:/etc/nginx/nginx.conf:ro" nginx:1.27-alpine >/dev/null

for _ in $(seq 1 60); do
  curl -sf http://localhost:8080/api/health >/dev/null && break
  sleep 1
done
curl -sf http://localhost:8080/api/health >/dev/null || { docker logs api1 | tail -50; exit 1; }
echo "${INSTANCES} cópia(s) da API no ar, cada uma com ${CPUS} CPU e ${MEMORY}"
echo "::endgroup::"

# Uso de CPU e memória das cópias da API durante o teste
( while true; do docker stats --no-stream --format '{{.Name}},{{.CPUPerc}},{{.MemUsage}}' $(seq -f "api%g" 1 "$INSTANCES") >> "$OUT/stats.csv" 2>/dev/null || true; sleep 5; done ) &
STATS_PID=$!

set +e
k6 run --quiet \
  -e USERS="$USERS" -e SEEDED_USERS="$USERS" -e RAMP="$RAMP" -e HOLD="$HOLD" \
  -e API_URL=http://localhost:8080/api -e LABEL="$LABEL" \
  -e SUMMARY_FILE="$OUT/resumo.md" -e JSON_FILE="$OUT/resumo.json" \
  "$ROOT/loadtest/usuarios.js"
K6_EXIT=$?
set -e
kill $STATS_PID 2>/dev/null || true

# Pico de memória e se alguma cópia caiu por falta de memória
PEAK_MEM=$(awk -F, '{split($3,a," "); print a[1]}' "$OUT/stats.csv" 2>/dev/null | sed 's/MiB//;s/GiB/*1024/' | bc 2>/dev/null | sort -n | tail -1)
PEAK_CPU=$(awk -F, '{gsub("%","",$2); print $2}' "$OUT/stats.csv" 2>/dev/null | sort -n | tail -1)
OOM=$(for i in $(seq 1 "$INSTANCES"); do docker inspect "api$i" --format '{{.State.OOMKilled}} {{.RestartCount}} {{.State.Running}}'; done | tr '\n' ';')
{
  echo "| Pico de CPU de uma cópia | ${PEAK_CPU:-—}% (limite: $(awk "BEGIN{print $CPUS*100}")%) |"
  echo "| Pico de memória de uma cópia | ${PEAK_MEM:-—} MiB (limite: ${MEMORY}) |"
  echo "| Estado das cópias (sem memória? reinícios, no ar?) | ${OOM} |"
  echo
  echo "_Cenário: ${INSTANCES} × API com ${CPUS} CPU e ${MEMORY}; banco Postgres 16 com 1 CPU; atraso API↔banco de ${DB_LATENCY_MS} ms; ${RAMP} de chegada e ${HOLD} de uso simultâneo._"
} >> "$OUT/resumo.md"

grep -h "lento" <(for i in $(seq 1 "$INSTANCES"); do docker logs "api$i" 2>&1; done) | sed -E 's/ levou [0-9]+ ms.*//' | sort | uniq -c | sort -rn | head -10 > "$OUT/rotas-lentas.txt" || true
if [ -s "$OUT/rotas-lentas.txt" ]; then
  { echo; echo "<details><summary>Rotas que passaram de 1 s (alerta do Sentry)</summary>"; echo; echo '```'; cat "$OUT/rotas-lentas.txt"; echo '```'; echo "</details>"; } >> "$OUT/resumo.md"
fi

cat "$OUT/resumo.md"
[ -n "${GITHUB_STEP_SUMMARY:-}" ] && cat "$OUT/resumo.md" >> "$GITHUB_STEP_SUMMARY"
exit $K6_EXIT
