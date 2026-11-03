// Teste de carga do Valtrea Finance (k6: https://k6.io).
//
// Simula pessoas usando o app ao mesmo tempo. Cada pessoa virtual:
//   1. faz login uma vez;
//   2. abre o painel (as mesmas 9 chamadas que o app faz ao carregar);
//   3. "lê" a tela por 5 a 15 segundos;
//   4. às vezes lança uma transação, troca o período ou exporta os dados;
//   5. repete até o fim do teste.
//
// Uso: k6 run -e USERS=100 -e API_URL=http://localhost:8080/api loadtest/usuarios.js
// Os usuários loadtest-N@test.dev são criados antes por api/scripts/load-seed.js.

import http from 'k6/http'
import { check, sleep } from 'k6'

const API = __ENV.API_URL || 'http://localhost:8080/api'
const USERS = Number(__ENV.USERS || 100)
const SEEDED = Number(__ENV.SEEDED_USERS || USERS)
const RAMP = __ENV.RAMP || '1m'
const HOLD = __ENV.HOLD || '3m'
const PASSWORD = __ENV.PASSWORD || '123456'

export const options = {
    scenarios: {
        uso: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: RAMP, target: USERS }, // pessoas chegando aos poucos
                { duration: HOLD, target: USERS }, // todas usando ao mesmo tempo
                { duration: '20s', target: 0 },
            ],
            gracefulRampDown: '15s',
        },
    },
    // Critério de "aguenta": 95% das respostas em menos de 1 s e menos de 1% de erros.
    // O login é mais lento de propósito (a senha é conferida com bcrypt), então tem 2 s.
    thresholds: {
        http_req_failed: ['rate<0.01'],
        'http_req_duration{tipo:leitura}': ['p(95)<1000'],
        'http_req_duration{tipo:escrita}': ['p(95)<1000'],
        'http_req_duration{tipo:login}': ['p(95)<2000'],
        checks: ['rate>0.99'],
    },
    summaryTrendStats: ['avg', 'med', 'p(90)', 'p(95)', 'p(99)', 'max'],
    discardResponseBodies: true,
}

const pad = (n) => String(n).padStart(2, '0')
const today = () => {
    const d = new Date()
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
}
const monthRange = () => {
    const d = new Date()
    const y = d.getUTCFullYear()
    const m = d.getUTCMonth()
    const last = new Date(Date.UTC(y, m + 1, 0)).getUTCDate()
    return [`${y}-${pad(m + 1)}-01`, `${y}-${pad(m + 1)}-${pad(last)}`, `${y}-${pad(m + 1)}`]
}

// Cada pessoa virtual tem seu próprio IP simulado, como na vida real
// (o limite de requisições da API é por IP).
let token = null
const headers = () => ({
    'Content-Type': 'application/json',
    'cf-connecting-ip': `10.${(__VU >> 16) & 255}.${(__VU >> 8) & 255}.${__VU & 255}`,
    ...(token && { Authorization: `Bearer ${token}` }),
})
const params = (tipo, rota) => ({ headers: headers(), tags: { tipo, rota } })

function login() {
    const email = `loadtest-${(__VU - 1) % SEEDED}@test.dev`
    const res = http.post(
        `${API}/users/login`,
        JSON.stringify({ email, password: PASSWORD }),
        { ...params('login', 'POST /users/login'), responseType: 'text' },
    )
    const ok = check(res, { 'login 200': (r) => r.status === 200 })
    token = ok ? JSON.parse(res.body).tokens.accessToken : null
}

function openDashboard(from, to, month) {
    const get = (path, rota) => ['GET', `${API}${path}`, null, params('leitura', rota)]
    const responses = http.batch([
        get('/users/me', 'GET /users/me'),
        get(`/users/me/balance?from=${from}&to=${to}`, 'GET /users/me/balance'),
        get(`/transactions/me?from=${from}&to=${to}`, 'GET /transactions/me'),
        get(`/reports/monthly?months=6&to=${to}`, 'GET /reports/monthly'),
        get(`/budgets?month=${month}`, 'GET /budgets'),
        get('/recurring', 'GET /recurring'),
        get('/integrations/pay', 'GET /integrations/pay'),
        get('/admin/me', 'GET /admin/me'),
    ])
    check(responses, { 'painel carregou': (rs) => rs.every((r) => r.status === 200) })

    const sync = http.post(
        `${API}/recurring/sync`,
        JSON.stringify({ today: today() }),
        params('escrita', 'POST /recurring/sync'),
    )
    check(sync, { 'sync 200': (r) => r.status === 200 })
}

export default function () {
    if (!token) {
        login()
        if (!token) {
            sleep(5)
            return
        }
    }

    const [from, to, month] = monthRange()
    openDashboard(from, to, month)
    sleep(5 + Math.random() * 10)

    const roll = Math.random()
    if (roll < 0.3) {
        // lança um gasto e o painel atualiza saldo e lista
        const created = http.post(
            `${API}/transactions/me`,
            JSON.stringify({
                name: 'Café',
                date: `${today()}T00:00:00.000Z`,
                type: 'EXPENSE',
                amount: 8.5,
                category: 'alimentacao',
            }),
            params('escrita', 'POST /transactions/me'),
        )
        check(created, { 'transação criada': (r) => r.status === 201 })
        http.batch([
            ['GET', `${API}/users/me/balance?from=${from}&to=${to}`, null, params('leitura', 'GET /users/me/balance')],
            ['GET', `${API}/transactions/me?from=${from}&to=${to}`, null, params('leitura', 'GET /transactions/me')],
        ])
    } else if (roll < 0.45) {
        // troca o período para "este ano"
        const y = new Date().getUTCFullYear()
        http.batch([
            ['GET', `${API}/users/me/balance?from=${y}-01-01&to=${y}-12-31`, null, params('leitura', 'GET /users/me/balance')],
            ['GET', `${API}/transactions/me?from=${y}-01-01&to=${y}-12-31`, null, params('leitura', 'GET /transactions/me')],
        ])
    } else if (roll < 0.5) {
        const res = http.get(`${API}/reports/export`, params('leitura', 'GET /reports/export'))
        check(res, { 'exportação 200': (r) => r.status === 200 })
    }
    sleep(5 + Math.random() * 10)
}

export function handleSummary(data) {
    const m = data.metrics
    const ms = (metric, stat) => (metric?.values?.[stat] != null ? Math.round(metric.values[stat]) : '—')
    const pct = (v) => (v == null ? '—' : `${(v * 100).toFixed(2)}%`)
    const rows = [
        ['Requisições', m.http_reqs?.values?.count ?? 0],
        ['Requisições por segundo', (m.http_reqs?.values?.rate ?? 0).toFixed(1)],
        ['Erros', pct(m.http_req_failed?.values?.rate)],
        ['Leitura: mediana / p95 / p99 (ms)', `${ms(m['http_req_duration{tipo:leitura}'], 'med')} / ${ms(m['http_req_duration{tipo:leitura}'], 'p(95)')} / ${ms(m['http_req_duration{tipo:leitura}'], 'p(99)')}`],
        ['Escrita: mediana / p95 / p99 (ms)', `${ms(m['http_req_duration{tipo:escrita}'], 'med')} / ${ms(m['http_req_duration{tipo:escrita}'], 'p(95)')} / ${ms(m['http_req_duration{tipo:escrita}'], 'p(99)')}`],
        ['Login: mediana / p95 / p99 (ms)', `${ms(m['http_req_duration{tipo:login}'], 'med')} / ${ms(m['http_req_duration{tipo:login}'], 'p(95)')} / ${ms(m['http_req_duration{tipo:login}'], 'p(99)')}`],
    ]
    const failed = Object.entries(data.metrics)
        .filter(([, v]) => v.thresholds && Object.values(v.thresholds).some((t) => !t.ok))
        .map(([k]) => k)
    const verdict = failed.length === 0 ? 'APROVADO' : `REPROVADO (${failed.join(', ')})`
    const title = `${__ENV.LABEL || 'Teste de carga'}: ${USERS} pessoas ao mesmo tempo`
    const md =
        `### ${title} — ${verdict}\n\n| Medida | Valor |\n| --- | --- |\n` +
        rows.map(([k, v]) => `| ${k} | ${v} |`).join('\n') +
        '\n'
    return {
        stdout: `\n${md}\n`,
        [__ENV.SUMMARY_FILE || 'resumo.md']: md,
        [__ENV.JSON_FILE || 'resumo.json']: JSON.stringify(
            {
                label: __ENV.LABEL,
                users: USERS,
                verdict,
                reqs: m.http_reqs?.values?.count,
                rps: m.http_reqs?.values?.rate,
                errors: m.http_req_failed?.values?.rate,
                leitura: m['http_req_duration{tipo:leitura}']?.values,
                escrita: m['http_req_duration{tipo:escrita}']?.values,
                login: m['http_req_duration{tipo:login}']?.values,
            },
            null,
            2,
        ),
    }
}
