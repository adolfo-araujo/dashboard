import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../../prisma/prisma.js'
import { auth } from '../middlewares/auth.js'

export const reportsRouter = Router()

const monthlySchema = z.object({
    months: z.coerce.number().int().min(3).max(24).default(12),
    // último dia de referência, no fuso de quem pede (YYYY-MM-DD)
    to: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional(),
})

const pad = (n) => String(n).padStart(2, '0')
const monthKey = (year, month) => `${year}-${pad(month + 1)}`

// GET /api/reports/monthly?months=12&to=2026-10-08
// Totais de ganhos, gastos e investimentos de cada mês (meses sem lançamentos vêm zerados)
reportsRouter.get('/monthly', auth, async (request, response) => {
    const parsed = monthlySchema.safeParse(request.query)
    if (!parsed.success) {
        return response.status(400).send({ message: 'Parâmetros inválidos.' })
    }

    try {
        const { months, to } = parsed.data
        const ref = to ? new Date(`${to}T00:00:00Z`) : new Date()
        const endYear = ref.getUTCFullYear()
        const endMonth = ref.getUTCMonth()

        const start = new Date(Date.UTC(endYear, endMonth - (months - 1), 1))
        const end = new Date(Date.UTC(endYear, endMonth + 1, 0))
        const startStr = start.toISOString().slice(0, 10)
        const endStr = end.toISOString().slice(0, 10)

        const rows = await prisma.$queryRaw`
            SELECT to_char(date_trunc('month', "date"), 'YYYY-MM') AS month,
                   "type"::text AS type,
                   SUM("amount")::float8 AS total
            FROM "Transaction"
            WHERE "user_id" = ${request.userId}
              AND "date" >= ${startStr}::date
              AND "date" <= ${endStr}::date
            GROUP BY 1, 2
        `

        const result = []
        for (let i = 0; i < months; i++) {
            const d = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + i, 1))
            result.push({
                month: monthKey(d.getUTCFullYear(), d.getUTCMonth()),
                earnings: 0,
                expenses: 0,
                investments: 0,
                balance: 0,
            })
        }
        const byMonth = new Map(result.map((r) => [r.month, r]))

        for (const row of rows) {
            const entry = byMonth.get(row.month)
            if (!entry) continue
            const value = Number(row.total) || 0
            if (row.type === 'EARNING') entry.earnings = value
            if (row.type === 'EXPENSE') entry.expenses = value
            if (row.type === 'INVESTMENT') entry.investments = value
        }

        for (const entry of result) {
            entry.balance =
                Math.round(
                    (entry.earnings - entry.expenses - entry.investments) * 100,
                ) / 100
        }

        return response.status(200).send(result)
    } catch (error) {
        console.error(error)
        return response.status(500).send({ message: 'Internal server error' })
    }
})
