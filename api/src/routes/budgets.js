import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../../prisma/prisma.js'
import { auth } from '../middlewares/auth.js'
import { CATEGORIES } from '../constants/categories.js'

export const budgetsRouter = Router()

const MONTH = /^\d{4}-\d{2}$/

// GET /api/budgets?month=2026-10
// Limites definidos e quanto já foi gasto em cada categoria no mês
budgetsRouter.get('/', auth, async (request, response) => {
    const month = String(request.query.month ?? '')
    if (!MONTH.test(month)) {
        return response.status(400).send({ message: 'Mês inválido.' })
    }

    try {
        const [year, monthIndex] = month.split('-').map(Number)
        const start = new Date(Date.UTC(year, monthIndex - 1, 1))
        const end = new Date(Date.UTC(year, monthIndex, 0))

        const [budgets, spent] = await Promise.all([
            prisma.budget.findMany({ where: { user_id: request.userId } }),
            prisma.transaction.groupBy({
                by: ['category'],
                where: {
                    user_id: request.userId,
                    type: 'EXPENSE',
                    date: { gte: start, lte: end },
                },
                _sum: { amount: true },
            }),
        ])

        const spentByCategory = new Map(
            spent.map((row) => [row.category, Number(row._sum.amount ?? 0)]),
        )

        const order = CATEGORIES.EXPENSE
        const result = budgets
            .map((b) => ({
                category: b.category,
                amount: Number(b.amount),
                spent: spentByCategory.get(b.category) ?? 0,
            }))
            .sort((a, b) => order.indexOf(a.category) - order.indexOf(b.category))

        return response.status(200).send(result)
    } catch (error) {
        console.error(error)
        return response.status(500).send({ message: 'Internal server error' })
    }
})

const saveSchema = z.object({
    budgets: z
        .array(
            z.object({
                category: z.enum(CATEGORIES.EXPENSE, {
                    errorMap: () => ({ message: 'Categoria inválida.' }),
                }),
                amount: z
                    .number()
                    .min(1, 'O limite mínimo é R$ 1,00.')
                    .max(99999999.99, 'Valor muito alto.'),
            }),
        )
        .max(CATEGORIES.EXPENSE.length),
})

// PUT /api/budgets { budgets: [{ category, amount }] }
// Substitui todos os limites do usuário (categorias fora da lista ficam sem limite)
budgetsRouter.put('/', auth, async (request, response) => {
    const parsed = saveSchema.safeParse(request.body)
    if (!parsed.success) {
        return response
            .status(400)
            .send({ message: parsed.error.errors[0].message })
    }

    try {
        const { budgets } = parsed.data
        const categories = budgets.map((b) => b.category)
        if (new Set(categories).size !== categories.length) {
            return response
                .status(400)
                .send({ message: 'Categoria repetida.' })
        }

        await prisma.$transaction([
            prisma.budget.deleteMany({
                where: { user_id: request.userId, category: { notIn: categories } },
            }),
            ...budgets.map((b) =>
                prisma.budget.upsert({
                    where: {
                        user_id_category: {
                            user_id: request.userId,
                            category: b.category,
                        },
                    },
                    update: { amount: b.amount },
                    create: {
                        user_id: request.userId,
                        category: b.category,
                        amount: b.amount,
                    },
                }),
            ),
        ])

        return response.status(200).send({ saved: budgets.length })
    } catch (error) {
        console.error(error)
        return response.status(500).send({ message: 'Internal server error' })
    }
})
