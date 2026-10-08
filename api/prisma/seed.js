import 'dotenv/config.js'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
import { randomUUID } from 'crypto'

const prisma = new PrismaClient()

const DEMO_EMAIL = 'demo@finance.app'
const DEMO_PASSWORD = '123456'

const templates = [
    { name: 'Salário', type: 'EARNING', category: 'salario', amount: 7800, day: 5 },
    { name: 'Freelance', type: 'EARNING', category: 'freelance', amount: 1850, day: 18 },
    { name: 'Aluguel', type: 'EXPENSE', category: 'moradia', amount: 2200, day: 10 },
    { name: 'Supermercado', type: 'EXPENSE', category: 'alimentacao', amount: 960.4, day: 8 },
    { name: 'Conta de luz', type: 'EXPENSE', category: 'contas', amount: 214.37, day: 15 },
    { name: 'Internet', type: 'EXPENSE', category: 'contas', amount: 119.9, day: 15 },
    { name: 'Restaurante', type: 'EXPENSE', category: 'alimentacao', amount: 186.5, day: 21 },
    { name: 'Academia', type: 'EXPENSE', category: 'saude', amount: 129.9, day: 3 },
    { name: 'Tesouro Selic', type: 'INVESTMENT', category: 'renda_fixa', amount: 1200, day: 6 },
    { name: 'Ações', type: 'INVESTMENT', category: 'acoes', amount: 650, day: 20 },
]

const toDate = (year, month, day) =>
    new Date(Date.UTC(year, month, Math.min(day, 28)))

async function main() {
    const existing = await prisma.user.findUnique({
        where: { email: DEMO_EMAIL },
    })

    if (existing) {
        console.log('Seed: usuário demo já existe, nada a fazer.')
        return
    }

    const userId = randomUUID()

    await prisma.user.create({
        data: {
            id: userId,
            first_name: 'Usuário',
            last_name: 'Demo',
            email: DEMO_EMAIL,
            password: await bcrypt.hash(DEMO_PASSWORD, 10),
            email_verified_at: new Date(),
        },
    })

    const now = new Date()
    const transactions = []

    // mês atual + 5 meses anteriores
    for (let offset = 0; offset < 6; offset++) {
        const ref = new Date(
            Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1),
        )
        const year = ref.getUTCFullYear()
        const month = ref.getUTCMonth()

        for (const t of templates) {
            // no mês atual, só lança o que já "aconteceu"
            if (offset === 0 && t.day > now.getUTCDate()) continue

            const variation = t.type === 'EXPENSE' ? 1 + (offset % 3) * 0.07 : 1
            transactions.push({
                id: randomUUID(),
                user_id: userId,
                name: t.name,
                type: t.type,
                category: t.category,
                amount: Number((t.amount * variation).toFixed(2)),
                date: toDate(year, month, t.day),
            })
        }
    }

    await prisma.transaction.createMany({ data: transactions })

    console.log(
        `Seed: usuário ${DEMO_EMAIL} / ${DEMO_PASSWORD} criado com ${transactions.length} transações.`,
    )
}

main()
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
    .finally(() => prisma.$disconnect())
