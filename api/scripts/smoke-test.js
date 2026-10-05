// Teste de ponta a ponta contra uma API rodando (usado no CI e útil localmente).
// Uso: API_URL=http://localhost:8080/api node scripts/smoke-test.js
const API = process.env.API_URL || 'http://localhost:8080/api'

let failures = 0
const check = (label, condition, extra = '') => {
    console.log(`${condition ? '✔' : '✘'} ${label} ${condition ? '' : extra}`)
    if (!condition) failures++
}

const request = async (method, path, { body, token } = {}) => {
    const res = await fetch(`${API}${path}`, {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: body ? JSON.stringify(body) : undefined,
    })
    const text = await res.text()
    return { status: res.status, body: text ? JSON.parse(text) : null }
}

const today = new Date().toISOString().slice(0, 10)
const from = `${today.slice(0, 4)}-01-01`
const to = `${today.slice(0, 4)}-12-31`

const health = await request('GET', '/health')
check('health', health.status === 200)

const wrong = await request('POST', '/users/login', {
    body: { email: 'demo@finance.app', password: 'senha-errada' },
})
check('login com senha errada é recusado', wrong.status === 401, wrong.status)

const email = `smoke-${Date.now()}@test.dev`
const signup = await request('POST', '/users', {
    body: { first_name: 'Smoke', last_name: 'Test', email, password: '123456' },
})
check('cadastro', signup.status === 201, JSON.stringify(signup.body))
check('cadastro não expõe senha', !('password' in (signup.body ?? {})))

const login = await request('POST', '/users/login', {
    body: { email, password: '123456' },
})
check('login', login.status === 200 && login.body?.tokens?.accessToken)
check('login não expõe senha', !('password' in (login.body ?? {})))
const token = login.body?.tokens?.accessToken

const me = await request('GET', '/users/me', { token })
check('GET /users/me', me.status === 200 && me.body.email === email)

const created = await request('POST', '/transactions/me', {
    token,
    body: {
        name: 'Salário',
        date: `${today}T00:00:00.000Z`,
        type: 'EARNING',
        amount: 5000,
    },
})
check('criar transação', created.status === 201, JSON.stringify(created.body))

await request('POST', '/transactions/me', {
    token,
    body: { name: 'Mercado', date: `${today}T00:00:00.000Z`, type: 'EXPENSE', amount: 1000 },
})

const list = await request('GET', `/transactions/me?from=${from}&to=${to}`, { token })
check('listar transações', list.status === 200 && list.body.length === 2)

const balance = await request('GET', `/users/me/balance?from=${from}&to=${to}`, { token })
check(
    'saldo calculado',
    balance.status === 200 && Number(balance.body.balance) === 4000,
    JSON.stringify(balance.body),
)

const updated = await request('PATCH', `/transactions/me/${created.body.id}`, {
    token,
    body: { amount: 6000, name: 'Salário + bônus' },
})
check('editar transação', updated.status === 200 && Number(updated.body.amount) === 6000)

// outro usuário não pode mexer na transação
const other = await request('POST', '/users', {
    body: { first_name: 'Outro', last_name: 'User', email: `other-${Date.now()}@test.dev`, password: '123456' },
})
const otherToken = other.body?.tokens?.accessToken
const forbiddenUpdate = await request('PATCH', `/transactions/me/${created.body.id}`, {
    token: otherToken,
    body: { amount: 1 },
})
check('editar transação de outro usuário é proibido', forbiddenUpdate.status === 403, forbiddenUpdate.status)
const forbiddenDelete = await request('DELETE', `/transactions/me/${created.body.id}`, { token: otherToken })
check('excluir transação de outro usuário é proibido', forbiddenDelete.status === 403, forbiddenDelete.status)

const deleted = await request('DELETE', `/transactions/me/${created.body.id}`, { token })
check('excluir transação', deleted.status === 200)

const refreshed = await request('POST', '/users/refresh-token', {
    body: { refreshToken: login.body?.tokens?.refreshToken },
})
check('refresh token', refreshed.status === 200 && refreshed.body.accessToken)

const patchMe = await request('PATCH', '/users/me', { token, body: { first_name: 'Novo' } })
check('editar usuário', patchMe.status === 200 && patchMe.body.first_name === 'Novo')

const unauth = await request('GET', '/users/me')
check('rota protegida sem token = 401', unauth.status === 401)

const delMe = await request('DELETE', '/users/me', { token })
check('excluir conta', delMe.status === 200)
await request('DELETE', '/users/me', { token: otherToken })

const demo = await request('POST', '/users/login', {
    body: { email: 'demo@finance.app', password: '123456' },
})
check('usuário demo do seed', demo.status === 200)

if (failures) {
    console.error(`\n${failures} verificação(ões) falharam.`)
    process.exit(1)
}
console.log('\nTudo certo!')
