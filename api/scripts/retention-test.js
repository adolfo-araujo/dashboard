// Teste da rotina de retenção (api/src/jobs/retention.js), direto no banco de teste do CI.
// Uso: DATABASE_URL=... node scripts/retention-test.js
import { prisma } from '../prisma/prisma.js'
import { runRetentionCleanup } from '../src/jobs/retention.js'

let failures = 0
const check = (label, condition) => {
    console.log(`${condition ? '✔' : '✘'} ${label}`)
    if (!condition) failures++
}

const DAY = 24 * 60 * 60 * 1000
const old = new Date(Date.now() - 31 * DAY)
const tag = `ret-${Date.now()}`
const make = (name, data) =>
    prisma.user.create({
        data: {
            first_name: name,
            last_name: 'Retencao',
            email: `${tag}-${name}@test.dev`,
            password: 'hash-de-teste',
            ...data,
        },
    })

const neverConfirmed = await make('nunca-confirmou', { created_at: old })
const recent = await make('recente', {})
const confirmed = await make('confirmado', { created_at: old, email_verified_at: old })
const changedEmail = await make('trocou-email', { created_at: old })
await prisma.transaction.create({
    data: { user_id: changedEmail.id, name: 'Mercado', date: new Date(), amount: 10, type: 'EXPENSE' },
})
const expiredLink = await prisma.passwordResetToken.create({
    data: { user_id: confirmed.id, token_hash: `${tag}-a`.padEnd(64, '0'), expires_at: new Date(Date.now() - 2 * DAY) },
})
const validLink = await prisma.passwordResetToken.create({
    data: { user_id: confirmed.id, token_hash: `${tag}-b`.padEnd(64, '0'), expires_at: new Date(Date.now() + DAY) },
})

const result = await runRetentionCleanup()
const exists = async (id) => !!(await prisma.user.findUnique({ where: { id } }))

check('cadastro nunca confirmado há mais de 30 dias é apagado', !(await exists(neverConfirmed.id)))
check('cadastro recente sem confirmação continua', await exists(recent.id))
check('conta confirmada continua', await exists(confirmed.id))
check('conta com lançamentos que só não confirmou o e-mail novo continua', await exists(changedEmail.id))
check('link de nova senha vencido é apagado', !(await prisma.passwordResetToken.findUnique({ where: { id: expiredLink.id } })))
check('link de nova senha ainda válido continua', !!(await prisma.passwordResetToken.findUnique({ where: { id: validLink.id } })))
check('resultado informa o que foi apagado', result.accounts >= 1 && result.passwordLinks >= 1)

await prisma.user.deleteMany({ where: { email: { startsWith: tag } } })
await prisma.$disconnect()

console.log(failures ? `\n${failures} falha(s)` : '\nRetenção OK')
process.exit(failures ? 1 : 0)
