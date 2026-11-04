// Teste de ponta a ponta contra uma API rodando (usado no CI e útil localmente).
// Uso: API_URL=http://localhost:8080/api node scripts/smoke-test.js
// Para testar o painel de administração, rode a API com ADMIN_EMAILS=smoke-admin@test.dev
const API = process.env.API_URL || 'http://localhost:8080/api'
const ADMIN_EMAIL = 'smoke-admin@test.dev'
const PASSWORD = 'senha1234'
const NEW_PASSWORD = 'novaSenha5678'

let failures = 0
const check = (label, condition, extra = '') => {
    console.log(`${condition ? '✔' : '✘'} ${label} ${condition ? '' : extra}`)
    if (!condition) failures++
}
const section = (title) => console.log(`\n— ${title}`)

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
    let parsed = null
    try {
        parsed = text ? JSON.parse(text) : null
    } catch {
        parsed = text
    }
    return { status: res.status, body: parsed, headers: res.headers }
}
const show = (res) => `(${res.status}) ${JSON.stringify(res.body)}`

const unique = (prefix) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@test.dev`
const signup = (email, first_name = 'Smoke', password = PASSWORD) =>
    request('POST', '/users', {
        body: { first_name, last_name: 'Test', email, password },
    })
const login = (email, password = PASSWORD) =>
    request('POST', '/users/login', { body: { email, password } })

// Datas em UTC, como a API trabalha
const now = new Date()
const today = now.toISOString().slice(0, 10)
const year = now.getUTCFullYear()
const monthIdx = now.getUTCMonth()
const pad = (n) => String(n).padStart(2, '0')
const thisMonth = `${year}-${pad(monthIdx + 1)}`
const from = `${year}-01-01`
const to = `${year}-12-31`
const dateTime = (date) => `${date}T00:00:00.000Z`

// ------------------------------------------------------------
section('Saúde e segurança')

const health = await request('GET', '/health')
check('health', health.status === 200)

const me401 = await request('GET', '/users/me')
check('rota protegida sem token = 401', me401.status === 401, show(me401))
check('cabeçalho nosniff', me401.headers.get('x-content-type-options') === 'nosniff')
check('cabeçalho anti-iframe', me401.headers.get('x-frame-options') === 'DENY')
check('CSP na API', (me401.headers.get('content-security-policy') ?? '').includes("default-src 'none'"))
check('não anuncia o Express', !me401.headers.get('x-powered-by'))
check('limite de requisições informado', Number(me401.headers.get('ratelimit-limit')) > 0)

const wrong = await login('demo@finance.app', 'senha-errada')
check('login com senha errada é recusado', wrong.status === 401, show(wrong))
const unknown = await login(unique('ninguem'), 'qualquer1')
check('e-mail não cadastrado responde igual a senha errada (401)', unknown.status === 401, show(unknown))

const notFound = await request('GET', '/rota-que-nao-existe')
check('rota inexistente = 404 em JSON', notFound.status === 404 && notFound.body?.message === 'Not found', show(notFound))

const evil = await fetch(`${API}/health`, { headers: { Origin: 'https://site-malicioso.example' } })
check('CORS não libera outros sites', evil.headers.get('access-control-allow-origin') !== '*' && evil.headers.get('access-control-allow-origin') !== 'https://site-malicioso.example')

const huge = await request('POST', '/users/login', { body: { email: 'a@a.com', password: 'x'.repeat(200_000) } })
check('corpo gigante é recusado (413)', huge.status === 413, show(huge))

for (const weak of ['1234567', 'somenteletras', '12345678']) {
    const res = await signup(unique('fraca'), 'Fraca', weak)
    check(`senha fraca "${weak}" é recusada`, res.status === 400, show(res))
}

// ------------------------------------------------------------
section('Conta')

const email = unique('smoke')
const created = await signup(email)
check('cadastro', created.status === 201, show(created))
check('cadastro não expõe senha', !('password' in (created.body ?? {})))
check('cadastro grava aceite dos termos', Boolean(created.body?.terms_accepted_at))

const duplicated = await signup(email)
check('cadastro com e-mail repetido é recusado', duplicated.status >= 400 && duplicated.status < 500, show(duplicated))

const logged = await login(email)
check('login', logged.status === 200 && logged.body?.tokens?.accessToken, show(logged))
check('login não expõe senha', !('password' in (logged.body ?? {})))
const token = logged.body?.tokens?.accessToken

const me = await request('GET', '/users/me', { token })
check('GET /users/me', me.status === 200 && me.body?.email === email, show(me))
check('conta nova começa sem e-mail confirmado', me.body?.email_verified_at == null)

const refreshed = await request('POST', '/users/refresh-token', {
    body: { refreshToken: logged.body?.tokens?.refreshToken },
})
check('refresh token', refreshed.status === 200 && refreshed.body?.accessToken, show(refreshed))

const patchMe = await request('PATCH', '/users/me', { token, body: { first_name: 'Novo' } })
check('editar usuário', patchMe.status === 200 && patchMe.body?.first_name === 'Novo', show(patchMe))
check('editar sem trocar senha não gera tokens novos', !patchMe.body?.tokens)

// Trocar a senha encerra as outras sessões (o token de renovação antigo para de valer)
await new Promise((resolve) => setTimeout(resolve, 1100))
const weakChange = await request('PATCH', '/users/me', { token, body: { password: 'abc' } })
check('trocar para senha fraca é recusado', weakChange.status === 400, show(weakChange))
const changed = await request('PATCH', '/users/me', { token, body: { password: NEW_PASSWORD } })
check('trocar senha devolve tokens novos', changed.status === 200 && changed.body?.tokens?.refreshToken && !('password' in changed.body), show(changed))
const oldRefresh = await request('POST', '/users/refresh-token', { body: { refreshToken: logged.body?.tokens?.refreshToken } })
check('sessão antiga não renova depois da troca de senha', oldRefresh.status === 401, show(oldRefresh))
const newRefresh = await request('POST', '/users/refresh-token', { body: { refreshToken: changed.body?.tokens?.refreshToken } })
check('sessão nova renova normalmente', newRefresh.status === 200, show(newRefresh))
const oldPassword = await login(email, PASSWORD)
check('senha antiga não entra mais', oldPassword.status === 401, show(oldPassword))
const newPassword = await login(email, NEW_PASSWORD)
check('senha nova entra', newPassword.status === 200, show(newPassword))

const resend = await request('POST', '/users/me/resend-verification', { token })
check('reenvio do e-mail de confirmação respeita 1 por minuto', resend.status === 429, show(resend))

const badVerify = await request('POST', '/users/verify-email', { body: { token: 'a'.repeat(64) } })
check('link de confirmação inválido = 400', badVerify.status === 400, show(badVerify))

const forgot = await request('POST', '/users/forgot-password', { body: { email: unique('ninguem') } })
check('esqueci a senha não revela se o e-mail existe', forgot.status === 200, show(forgot))

const badReset = await request('POST', '/users/reset-password', {
    body: { token: 'b'.repeat(64), password: 'senha-nova-123' },
})
check('link de redefinição inválido = 400', badReset.status === 400, show(badReset))

// ------------------------------------------------------------
section('Transações')

const salary = await request('POST', '/transactions/me', {
    token,
    body: { name: 'Salário', date: dateTime(today), type: 'EARNING', amount: 5000, category: 'salario' },
})
check('criar transação', salary.status === 201, show(salary))

const market = await request('POST', '/transactions/me', {
    token,
    body: { name: 'Mercado', date: dateTime(today), type: 'EXPENSE', amount: 1000, category: 'alimentacao' },
})
check('criar gasto com categoria', market.status === 201 && market.body?.category === 'alimentacao', show(market))

const wrongCategory = await request('POST', '/transactions/me', {
    token,
    body: { name: 'Errado', date: dateTime(today), type: 'EXPENSE', amount: 10, category: 'salario' },
})
check('categoria que não é do tipo = 400', wrongCategory.status === 400, show(wrongCategory))

const list = await request('GET', `/transactions/me?from=${from}&to=${to}`, { token })
check('listar transações', list.status === 200 && list.body?.length === 2, show(list))

const balance = await request('GET', `/users/me/balance?from=${from}&to=${to}`, { token })
check('saldo calculado', balance.status === 200 && Number(balance.body?.balance) === 4000, show(balance))

// Saldo atual (até hoje) e extrato: saldo no início, resultado e saldo no fim do período
const money = (v) => Number(v ?? NaN)
const statement = await request('GET', `/users/me/balance?from=${from}&to=${to}&today=${today}`, { token })
check(
    'extrato do ano: início 0, fim 4000, atual 4000',
    statement.status === 200 &&
        money(statement.body?.openingBalance) === 0 &&
        money(statement.body?.closingBalance) === 4000 &&
        money(statement.body?.currentBalance) === 4000 &&
        statement.body?.today === today,
    show(statement),
)
const nextYear = await request('GET', `/users/me/balance?from=${year + 1}-01-01&to=${year + 1}-12-31&today=${today}`, { token })
check(
    'período seguinte começa com o saldo anterior',
    nextYear.status === 200 &&
        money(nextYear.body?.openingBalance) === 4000 &&
        money(nextYear.body?.balance) === 0 &&
        money(nextYear.body?.closingBalance) === 4000 &&
        money(nextYear.body?.currentBalance) === 4000,
    show(nextYear),
)
const lastYear = await request('GET', `/users/me/balance?from=${year - 1}-01-01&to=${year - 1}-12-31&today=${today}`, { token })
check(
    'período passado não muda o saldo atual',
    lastYear.status === 200 &&
        money(lastYear.body?.openingBalance) === 0 &&
        money(lastYear.body?.closingBalance) === 0 &&
        money(lastYear.body?.currentBalance) === 4000,
    show(lastYear),
)
const beforeToday = await request('GET', `/users/me/balance?from=${from}&to=${to}&today=${year - 1}-12-31`, { token })
check('saldo atual respeita a data de hoje do aparelho', money(beforeToday.body?.currentBalance) === 0, show(beforeToday))
const badToday = await request('GET', `/users/me/balance?from=${from}&to=${to}&today=ontem`, { token })
check('data de hoje inválida = 400', badToday.status === 400, show(badToday))

// LGPD: baixar meus dados (acesso e portabilidade) e aceite de nova versão dos termos
const myData = await request('GET', '/users/me/export', { token })
const myDataText = JSON.stringify(myData.body ?? {})
check(
    'baixar meus dados traz conta e transações',
    myData.status === 200 &&
        typeof myData.body?.account?.email === 'string' &&
        myData.body?.transactions?.length === 2 &&
        Array.isArray(myData.body?.budgets) &&
        myData.headers.get('content-disposition')?.includes('valtrea-meus-dados'),
    show(myData),
)
check('baixar meus dados nunca traz senha nem códigos', !/password|token_hash|\$2[aby]\$/.test(myDataText))
check('baixar meus dados exige login', (await request('GET', '/users/me/export')).status === 401)
const meTerms = await request('GET', '/users/me', { token })
const termsWrong = await request('POST', '/users/me/terms', { token, body: { version: '2000-01-01' } })
check('aceitar versão antiga dos termos = 400', termsWrong.status === 400, show(termsWrong))
const termsOk = await request('POST', '/users/me/terms', { token, body: { version: meTerms.body?.terms_version } })
check(
    'aceite da versão vigente dos termos fica registrado',
    termsOk.status === 200 && termsOk.body?.terms_version === meTerms.body?.terms_version && !!termsOk.body?.terms_accepted_at,
    show(termsOk),
)

const updated = await request('PATCH', `/transactions/me/${salary.body?.id}`, {
    token,
    body: { amount: 6000, name: 'Salário + bônus' },
})
check('editar transação', updated.status === 200 && Number(updated.body?.amount) === 6000, show(updated))

// outro usuário não pode mexer na transação
const otherEmail = unique('other')
await signup(otherEmail, 'Outro')
const otherToken = (await login(otherEmail)).body?.tokens?.accessToken
const forbiddenUpdate = await request('PATCH', `/transactions/me/${salary.body?.id}`, {
    token: otherToken,
    body: { amount: 1 },
})
check('editar transação de outro usuário é proibido', forbiddenUpdate.status === 403, show(forbiddenUpdate))
const forbiddenDelete = await request('DELETE', `/transactions/me/${salary.body?.id}`, { token: otherToken })
check('excluir transação de outro usuário é proibido', forbiddenDelete.status === 403, show(forbiddenDelete))
const otherList = await request('GET', `/transactions/me?from=${from}&to=${to}`, { token: otherToken })
check('outro usuário não vê as transações', otherList.status === 200 && otherList.body?.length === 0, show(otherList))

// ------------------------------------------------------------
section('Relatórios e exportação')

const monthly = await request('GET', `/reports/monthly?months=3&to=${today}`, { token })
const current = Array.isArray(monthly.body) ? monthly.body.at(-1) : null
check('evolução mensal com 3 meses', monthly.status === 200 && monthly.body?.length === 3, show(monthly))
check(
    'mês atual com ganhos e gastos',
    current?.month === thisMonth && current?.earnings === 6000 && current?.expenses === 1000 && current?.balance === 5000,
    JSON.stringify(current),
)
const badMonthly = await request('GET', '/reports/monthly?months=99', { token })
check('evolução mensal com parâmetro inválido = 400', badMonthly.status === 400, show(badMonthly))

const exported = await request('GET', '/reports/export', { token })
check(
    'exportação traz todas as transações',
    exported.status === 200 && exported.body?.length === 2 && exported.body.every((t) => !('user_id' in t)),
    show(exported),
)

// ------------------------------------------------------------
section('Orçamento')

const saveBudget = await request('PUT', '/budgets', {
    token,
    body: { budgets: [{ category: 'alimentacao', amount: 800 }, { category: 'lazer', amount: 300 }] },
})
check('salvar limites', saveBudget.status === 200 && saveBudget.body?.saved === 2, show(saveBudget))

const budgets = await request('GET', `/budgets?month=${thisMonth}`, { token })
const food = budgets.body?.find?.((b) => b.category === 'alimentacao')
check('limites com gasto do mês', budgets.status === 200 && budgets.body?.length === 2, show(budgets))
check('gasto por categoria somado', food?.amount === 800 && food?.spent === 1000, JSON.stringify(food))

const replaceBudget = await request('PUT', '/budgets', {
    token,
    body: { budgets: [{ category: 'alimentacao', amount: 900 }] },
})
const afterReplace = await request('GET', `/budgets?month=${thisMonth}`, { token })
check(
    'salvar substitui os limites anteriores',
    replaceBudget.status === 200 && afterReplace.body?.length === 1 && afterReplace.body[0].amount === 900,
    show(afterReplace),
)

const badBudget = await request('PUT', '/budgets', {
    token,
    body: { budgets: [{ category: 'salario', amount: 100 }] },
})
check('limite em categoria que não é de gasto = 400', badBudget.status === 400, show(badBudget))
const noMonth = await request('GET', '/budgets', { token })
check('orçamento sem mês = 400', noMonth.status === 400, show(noMonth))
const otherBudgets = await request('GET', `/budgets?month=${thisMonth}`, { token: otherToken })
check('outro usuário não vê os limites', otherBudgets.status === 200 && otherBudgets.body?.length === 0, show(otherBudgets))

// ------------------------------------------------------------
section('Recorrentes')

// Começa dois meses atrás, no dia 5: devem ser gerados os meses passados
// e o atual (se hoje já passou do dia 5).
const startDate = new Date(Date.UTC(year, monthIdx - 2, 1)).toISOString().slice(0, 10)
const expectedOccurrences = 2 + (now.getUTCDate() >= 5 ? 1 : 0)

const rule = await request('POST', '/recurring', {
    token,
    body: {
        name: 'Aluguel',
        amount: 1500,
        type: 'EXPENSE',
        category: 'moradia',
        day_of_month: 5,
        start_date: startDate,
    },
})
check('criar recorrente', rule.status === 201 && rule.body?.next_date, show(rule))

const badRule = await request('POST', '/recurring', {
    token,
    body: { name: 'X', amount: 10, type: 'EARNING', category: 'moradia', day_of_month: 5, start_date: startDate },
})
check('recorrente com categoria de outro tipo = 400', badRule.status === 400, show(badRule))
const badDay = await request('POST', '/recurring', {
    token,
    body: { name: 'X', amount: 10, type: 'EXPENSE', category: 'moradia', day_of_month: 32, start_date: startDate },
})
check('recorrente com dia 32 = 400', badDay.status === 400, show(badDay))

const sync = await request('POST', '/recurring/sync', { token, body: { today } })
check(
    `sincronizar gera ${expectedOccurrences} lançamentos`,
    sync.status === 200 && sync.body?.created === expectedOccurrences,
    show(sync),
)
const syncAgain = await request('POST', '/recurring/sync', { token, body: { today } })
check('sincronizar de novo não duplica', syncAgain.status === 200 && syncAgain.body?.created === 0, show(syncAgain))
const badSync = await request('POST', '/recurring/sync', { token, body: {} })
check('sincronizar sem data = 400', badSync.status === 400, show(badSync))

const rules = await request('GET', '/recurring', { token })
check('listar recorrentes', rules.status === 200 && rules.body?.length === 1, show(rules))

const paused = await request('PATCH', `/recurring/${rule.body?.id}`, { token, body: { active: false } })
check('pausar recorrente', paused.status === 200 && paused.body?.active === false && paused.body?.next_date === null, show(paused))

const otherPatch = await request('PATCH', `/recurring/${rule.body?.id}`, { token: otherToken, body: { active: true } })
check('outro usuário não altera a recorrente', otherPatch.status === 404, show(otherPatch))

const removed = await request('DELETE', `/recurring/${rule.body?.id}`, { token })
check('excluir recorrente', removed.status === 200, show(removed))
const afterRemove = await request('GET', `/transactions/me?from=${startDate}&to=${to}`, { token })
check(
    'lançamentos gerados continuam após excluir a recorrente',
    afterRemove.status === 200 && afterRemove.body?.length === 2 + expectedOccurrences,
    show(afterRemove),
)

// ------------------------------------------------------------
section('Administração')

const adminMe = await request('GET', '/admin/me', { token })
check('usuário comum não é admin', adminMe.status === 200 && adminMe.body?.isAdmin === false, show(adminMe))
const metrics403 = await request('GET', '/admin/metrics', { token })
check('usuário comum não vê as métricas', metrics403.status === 403, show(metrics403))

let adminLogin = await login(ADMIN_EMAIL)
if (adminLogin.status !== 200) {
    await signup(ADMIN_EMAIL, 'Admin')
    adminLogin = await login(ADMIN_EMAIL)
}
const adminToken = adminLogin.body?.tokens?.accessToken
const adminCheck = await request('GET', '/admin/me', { token: adminToken })
if (adminCheck.body?.isAdmin) {
    const metrics = await request('GET', '/admin/metrics', { token: adminToken })
    check(
        'admin vê as métricas agregadas',
        metrics.status === 200 &&
            metrics.body?.users?.total >= 3 &&
            metrics.body?.signupsByWeek?.length === 8 &&
            'retention' in metrics.body,
        show(metrics),
    )
} else {
    console.log('  (ADMIN_EMAILS sem smoke-admin@test.dev: teste do admin pulado)')
}
await request('DELETE', '/users/me', { token: adminToken, body: { password: PASSWORD } })

// ------------------------------------------------------------
section('Bloqueio por tentativas de login')

const lockEmail = unique('lock')
await signup(lockEmail, 'Lock')
for (let i = 0; i < 5; i++) await login(lockEmail, 'senha-errada')
const blocked = await login(lockEmail)
check('6ª tentativa bloqueada mesmo com a senha certa', blocked.status === 429, show(blocked))
const otherStillWorks = await login(otherEmail)
check('bloqueio não afeta outras contas', otherStillWorks.status === 200, show(otherStillWorks))

// ------------------------------------------------------------
section('Integração Valtrea Pay')

const payOff = await request('GET', '/integrations/pay', { token })
check('começa desconectado', payOff.status === 200 && payOff.body?.connected === false, show(payOff))

const payToken = await request('POST', '/integrations/pay/token', { token })
check('gera código de conexão', payToken.status === 201 && payToken.body?.token?.startsWith('vfp_'), show(payToken))
const code = payToken.body?.token

const payTx = { external_id: `pay:${Date.now()}:SAIDA`, name: 'Valtrea Pay · Bruno', amount: 12.34, type: 'EXPENSE', date: today }
const sent = await request('POST', '/integrations/pay/transactions', { token: code, body: payTx })
check('Pay lança um pagamento', sent.status === 201 && sent.body?.amount === '12.34', show(sent))
const resent = await request('POST', '/integrations/pay/transactions', { token: code, body: payTx })
check('reenviar o mesmo pagamento não duplica', resent.status === 200 && resent.body?.id === sent.body?.id, show(resent))

const userToken = await request('POST', '/integrations/pay/transactions', { token, body: payTx })
check('login do Finance não serve como código do Pay', userToken.status === 401, show(userToken))
const codeAsLogin = await request('GET', '/users/me', { token: code })
check('código do Pay não serve como login', codeAsLogin.status === 401, show(codeAsLogin))

const bal = await request('PUT', '/integrations/pay/balance', { token: code, body: { balance: 87.66, at: new Date().toISOString() } })
check('Pay atualiza o saldo', bal.status === 200 && bal.body?.updated === true, show(bal))
const oldBal = await request('PUT', '/integrations/pay/balance', { token: code, body: { balance: 1, at: '2020-01-01T00:00:00Z' } })
check('saldo antigo é ignorado', oldBal.status === 200 && oldBal.body?.updated === false, show(oldBal))

const payOn = await request('GET', '/integrations/pay', { token })
check('painel mostra conectado com saldo', payOn.body?.connected === true && payOn.body?.balance === 87.66, show(payOn))

const otherSeesNothing = await request('GET', '/integrations/pay', { token: otherToken })
check('outro usuário não vê a conexão', otherSeesNothing.body?.connected === false, show(otherSeesNothing))

const newCode = await request('POST', '/integrations/pay/token', { token })
const oldCode = await request('PUT', '/integrations/pay/balance', { token: code, body: { balance: 1, at: new Date().toISOString() } })
check('gerar código novo invalida o anterior', newCode.status === 201 && oldCode.status === 401, show(oldCode))

const unlink = await request('DELETE', '/integrations/pay', { token })
const afterUnlink = await request('PUT', '/integrations/pay/balance', { token: newCode.body?.token, body: { balance: 1, at: new Date().toISOString() } })
check('desconectar invalida o código', unlink.status === 200 && afterUnlink.status === 401, show(afterUnlink))

// ------------------------------------------------------------
section('Exclusão de conta')

const delWithout = await request('DELETE', '/users/me', { token })
check('excluir conta sem senha = 400', delWithout.status === 400, show(delWithout))
const delWrong = await request('DELETE', '/users/me', { token, body: { password: 'errada' } })
check('excluir conta com senha errada = 403', delWrong.status === 403, show(delWrong))
const delMe = await request('DELETE', '/users/me', { token, body: { password: NEW_PASSWORD } })
check('excluir conta', delMe.status === 200, show(delMe))
const deletedRefresh = await request('POST', '/users/refresh-token', { body: { refreshToken: newRefresh.body?.refreshToken } })
check('conta excluída não renova sessão', deletedRefresh.status === 401, show(deletedRefresh))
const afterDelete = await login(email, NEW_PASSWORD)
check('conta excluída não entra mais', afterDelete.status !== 200, show(afterDelete))

await request('DELETE', '/users/me', { token: otherToken, body: { password: PASSWORD } })

// ------------------------------------------------------------
section('Conta de demonstração')

const demo = await login('demo@finance.app', '123456')
check('usuário demo do seed', demo.status === 200, show(demo))

if (failures) {
    console.error(`\n${failures} verificação(ões) falharam.`)
    process.exit(1)
}
console.log('\nTudo certo!')
