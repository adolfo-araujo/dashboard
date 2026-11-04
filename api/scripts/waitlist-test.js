// Teste da lista de espera do site (routes/waitlist.js), contra a API rodando no CI.
// Usa o banco direto só para pôr um código conhecido no lugar do que iria por e-mail.
// Uso: API_URL=http://localhost:8080/api DATABASE_URL=... node scripts/waitlist-test.js
import crypto from 'crypto'
import { prisma } from '../prisma/prisma.js'
import { hashWaitlistToken } from '../src/routes/waitlist.js'

const API = process.env.API_URL || 'http://localhost:8080/api'
let failures = 0
const check = (label, condition, extra = '') => {
    console.log(`${condition ? '✔' : '✘'} ${label} ${condition ? '' : extra}`)
    if (!condition) failures++
}
const post = async (path, body) => {
    const res = await fetch(`${API}/lista-de-espera${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    })
    return { status: res.status, body: await res.json().catch(() => null) }
}
const show = (r) => `(${r.status}) ${JSON.stringify(r.body)}`

const email = `lista-${Date.now()}@test.dev`
const find = () => prisma.waitlistEntry.findUnique({ where: { email_product: { email, product: 'volta' } } })

const semAceite = await post('', { email, produto: 'volta' })
check('sem aceite = 400', semAceite.status === 400, show(semAceite))
const produtoErrado = await post('', { email, produto: 'banco', aceite: true })
check('produto que não existe = 400', produtoErrado.status === 400, show(produtoErrado))
const emailErrado = await post('', { email: 'nao-e-email', produto: 'volta', aceite: true })
check('e-mail inválido = 400', emailErrado.status === 400, show(emailErrado))

const robo = await post('', { email: `robo-${email}`, produto: 'volta', aceite: true, website: 'spam' })
const roboSalvo = await prisma.waitlistEntry.count({ where: { email: `robo-${email}` } })
check('robô (campo invisível) recebe a mesma resposta e não é salvo', robo.status === 202 && roboSalvo === 0, show(robo))

const pedido = await post('', { email: email.toUpperCase(), produto: 'volta', aceite: true })
const salvo = await find()
check('pedido aceito, e-mail salvo em minúsculas e ainda não confirmado', pedido.status === 202 && salvo && !salvo.confirmed_at, show(pedido))

const repetido = await post('', { email, produto: 'volta', aceite: true })
const depois = await find()
check('repetir logo em seguida não gera outro e-mail (mesmo código)', repetido.status === 202 && depois.token_hash === salvo.token_hash)
check('resposta igual para quem já pediu (não revela a lista)', repetido.body?.message === pedido.body?.message)

// O código real só vai por e-mail: troca por um conhecido para testar o link
const token = crypto.randomBytes(32).toString('hex')
await prisma.waitlistEntry.update({ where: { id: salvo.id }, data: { token_hash: hashWaitlistToken(token) } })

const invalido = await post('/confirmar', { token: 'a'.repeat(64) })
check('link inválido = 400', invalido.status === 400, show(invalido))
const confirmar = await post('/confirmar', { token })
check('confirmar pelo link', confirmar.status === 200 && confirmar.body?.product === 'Valtrea Volta', show(confirmar))
check('inscrição marcada como confirmada', !!(await find())?.confirmed_at)
const confirmarDeNovo = await post('/confirmar', { token })
check('confirmar duas vezes não dá erro', confirmarDeNovo.status === 200, show(confirmarDeNovo))

const sair = await post('/sair', { token })
check('sair da lista apaga o e-mail na hora', sair.status === 200 && !(await find()), show(sair))

await prisma.waitlistEntry.deleteMany({ where: { email: { contains: email } } })
await prisma.$disconnect()
console.log(failures ? `\n${failures} falha(s)` : '\nLista de espera OK')
process.exit(failures ? 1 : 0)
