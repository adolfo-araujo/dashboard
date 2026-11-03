#!/usr/bin/env bash
# Medições leves e não destrutivas no sistema em produção (cerca de 30 requisições).
# Não cria contas, não grava nada no banco e não envia e-mails.
#
# - Tempo de resposta da API sem banco (/api/health) e com 1 consulta ao banco
#   (/api/users/verify-email com um código inválido): a diferença é a distância
#   entre o servidor da API (Render) e o banco (Neon).
# - Se o limite de requisições por IP pode ser enganado com cabeçalhos forjados.
# - Cabeçalhos de segurança e de cache do app e do site.
set -uo pipefail

API=${API:-https://api.valtrea.com.br/api}
APP=${APP:-https://finance.valtrea.com.br}
SITE=${SITE:-https://www.valtrea.com.br}
OUT=${OUT:-loadtest/resultado}
mkdir -p "$OUT"
N=10

median() { sort -n | awk '{a[NR]=$1} END {print (NR%2 ? a[(NR+1)/2] : (a[NR/2]+a[NR/2+1])/2)}'; }

# acorda a API (plano grátis dorme)
curl -s -o /dev/null --max-time 90 "$API/health"

health=$(for _ in $(seq $N); do curl -s -o /dev/null -w '%{time_starttransfer}\n' "$API/health"; sleep 0.3; done | awk '{print $1*1000}' | median)
db=$(for _ in $(seq $N); do
  curl -s -o /dev/null -w '%{time_starttransfer}\n' -X POST -H 'Content-Type: application/json' \
    -d '{"token":"0000000000000000000000000000000000000000000000000000000000000000"}' "$API/users/verify-email"
  sleep 0.3
done | awk '{print $1*1000}' | median)
db_rtt=$(awk "BEGIN{v=$db-$health; print (v<0?0:int(v))}")

hdr() { curl -s -D - -o /dev/null "$@" | tr -d '\r'; }
remaining() { hdr "$API/users/me" "$@" | awk -F': ' 'tolower($1)=="ratelimit-remaining"{print $2}'; }

# Limite por IP: se trocar o cabeçalho reinicia a contagem, o IP pode ser forjado.
r1=$(remaining -H 'cf-connecting-ip: 203.0.113.10')
r2=$(remaining -H 'cf-connecting-ip: 203.0.113.10')
r3=$(remaining -H 'cf-connecting-ip: 203.0.113.99')
if [ -n "$r1" ] && [ -n "$r3" ] && [ "$r3" -gt "$r2" ]; then spoof_cf="SIM (contagem reiniciou: $r1 → $r2 → $r3)"; else spoof_cf="não ($r1 → $r2 → $r3)"; fi
x1=$(remaining -H 'x-forwarded-for: 198.51.100.10')
x2=$(remaining -H 'x-forwarded-for: 198.51.100.10')
x3=$(remaining -H 'x-forwarded-for: 198.51.100.99')
if [ -n "$x1" ] && [ -n "$x3" ] && [ "$x3" -gt "$x2" ]; then spoof_xff="SIM (contagem reiniciou: $x1 → $x2 → $x3)"; else spoof_xff="não ($x1 → $x2 → $x3)"; fi

api_headers=$(hdr "$API/health")
edge=$(echo "$api_headers" | awk -F': ' 'tolower($1)=="cf-ray"{print $2}')
app_headers=$(hdr "$APP/")
asset=$(curl -s "$APP/" | grep -oE '/assets/[^"]+\.js' | head -1)
asset_cache=$(hdr "$APP$asset" | awk -F': ' 'tolower($1)=="cache-control"{print $2}')
has() { echo "$1" | grep -qi "^$2:" && echo "sim" || echo "não"; }

{
  echo "### Sondagem da produção (não destrutiva)"
  echo
  echo "| Medida | Valor |"
  echo "| --- | --- |"
  echo "| API sem banco (/api/health), mediana de $N | ${health%.*} ms |"
  echo "| API com 1 consulta ao banco, mediana de $N | ${db%.*} ms |"
  echo "| Tempo estimado de cada ida e volta API ↔ banco | ~${db_rtt} ms |"
  echo "| Borda da Cloudflare na frente da API (cf-ray) | ${edge:-não encontrada} |"
  echo "| Limite por IP enganável com cf-connecting-ip forjado? | $spoof_cf |"
  echo "| Limite por IP enganável com x-forwarded-for forjado? | $spoof_xff |"
  echo "| App: X-Frame-Options / HSTS / nosniff | $(has "$app_headers" x-frame-options) / $(has "$app_headers" strict-transport-security) / $(has "$app_headers" x-content-type-options) |"
  echo "| App: cache dos arquivos /assets | ${asset_cache:-—} |"
  for page in "$APP/" "$APP/login" "$APP/termos" "$APP/privacidade" "$SITE/" "$API/health" "${API%/api}/docs/"; do
    code=$(curl -s -o /dev/null -w '%{http_code}' -L "$page")
    echo "| Página $page | HTTP $code |"
  done
} > "$OUT/producao.md"

echo "$db_rtt" > "$OUT/db_rtt.txt"
cat "$OUT/producao.md"
[ -n "${GITHUB_STEP_SUMMARY:-}" ] && cat "$OUT/producao.md" >> "$GITHUB_STEP_SUMMARY"
exit 0
