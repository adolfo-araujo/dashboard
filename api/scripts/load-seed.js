// Cria usuários de teste para o teste de carga (NUNCA rode no banco de produção).
// Cada usuário recebe 6 meses de transações, uma recorrente e limites de orçamento,
// para o teste consultar um volume parecido com o de um usuário real.
//
// Uso: LOAD_USERS=1000 DATABASE_URL=... node scripts/load-seed.js
import bcrypt from 'bcrypt'
import { randomUUID } from 'crypto'
import { prisma } from '../prisma/prisma.js'

const TOTAL = Number(process.env.LOAD_USERS || 100)
const PASSWORD = process.env.LOAD_PASSWORD || '123456'
const BATCH = 100

if (/neon\.tech|render\.com/.test(process.env.DATABASE_URL ?? '')) {
    console.error('Recusado: este script só pode rodar num banco de teste.')
    process.exit(1)
}

const hash = await bcrypt.hash(PASSWORD, 10)
const now = new Date()
const day = (monthsAgo, d) =>
    new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - monthsAgo, d))

const expenses = [
    ['Mercado', 'alimentacao', 450],
    ['Restaurante', 'alimentacao', 90],
    ['Uber', 'transporte', 35],
    ['Combustível', 'transporte', 220],
    ['Farmácia', 'saude', 60],
    ['Cinema', 'lazer', 70],
    ['Roupas', 'compras', 180],
    ['Luz', 'contas', 140],
    ['Internet', 'contas', 110],
    ['Streaming', 'assinaturas', 45],
]

console.time('seed')
for (let start = 0; start < TOTAL; start += BATCH) {
    const users = []
    const transactions = []
    const recurring = []
    const budgets = []

    for (let i = start; i < Math.min(start + BATCH, TOTAL); i++) {
        const id = randomUUID()
        users.push({
            id,
            first_name: 'Carga',
            last_name: String(i),
            email: `loadtest-${i}@test.dev`,
            password: hash,
            email_verified_at: now,
            terms_accepted_at: now,
            terms_version: 'load-test',
        })
        for (let m = 5; m >= 0; m--) {
            transactions.push({
                id: randomUUID(),
                user_id: id,
                name: 'Salário',
                date: day(m, 5),
                amount: 5000,
                type: 'EARNING',
                category: 'salario',
            })
            transactions.push({
                id: randomUUID(),
                user_id: id,
                name: 'Tesouro Selic',
                date: day(m, 10),
                amount: 300,
                type: 'INVESTMENT',
                category: 'renda_fixa',
            })
            for (const [k, [name, category, amount]] of expenses.entries()) {
                transactions.push({
                    id: randomUUID(),
                    user_id: id,
                    name,
                    date: day(m, 1 + ((k * 3 + i) % 27)),
                    amount: amount + (i % 7) * 3,
                    type: 'EXPENSE',
                    category,
                })
            }
        }
        recurring.push({
            id: randomUUID(),
            user_id: id,
            name: 'Aluguel',
            amount: 1500,
            type: 'EXPENSE',
            category: 'moradia',
            day_of_month: 10,
            start_date: day(0, 1),
            generated_until: day(0, 10),
        })
        budgets.push(
            { id: randomUUID(), user_id: id, category: 'alimentacao', amount: 800 },
            { id: randomUUID(), user_id: id, category: 'lazer', amount: 200 },
        )
    }

    await prisma.user.createMany({ data: users, skipDuplicates: true })
    await prisma.transaction.createMany({ data: transactions, skipDuplicates: true })
    await prisma.recurringTransaction.createMany({ data: recurring, skipDuplicates: true })
    await prisma.budget.createMany({ data: budgets, skipDuplicates: true })
    console.log(`  ${Math.min(start + BATCH, TOTAL)}/${TOTAL} usuários`)
}
console.timeEnd('seed')
console.log(`Pronto: ${TOTAL} usuários loadtest-N@test.dev / ${PASSWORD}, ~${TOTAL * 72} transações.`)
await prisma.$disconnect()
