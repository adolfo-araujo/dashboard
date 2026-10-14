import { Router } from 'express'
import { prisma } from '../../prisma/prisma.js'
import { auth } from '../middlewares/auth.js'

export const adminRouter = Router()

// E-mails com acesso ao painel, separados por vírgula (variável ADMIN_EMAILS no Render)
const adminEmails = () =>
    (process.env.ADMIN_EMAILS || '')
        .split(',')
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean)

async function requireAdmin(request, response, next) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: request.userId },
            select: { email: true },
        })
        if (!user || !adminEmails().includes(user.email.toLowerCase())) {
            return response.status(403).send({ message: 'Forbidden' })
        }
        next()
    } catch (error) {
        console.error(error)
        return response.status(500).send({ message: 'Internal server error' })
    }
}

// GET /api/admin/me
// Diz se a conta logada é administradora (usado para mostrar o atalho no menu).
// Responde sempre 200, para não gerar erro no navegador de quem não é admin.
adminRouter.get('/me', auth, async (request, response) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: request.userId },
            select: { email: true },
        })
        const isAdmin = Boolean(user) && adminEmails().includes(user.email.toLowerCase())
        return response.status(200).send({ isAdmin })
    } catch (error) {
        console.error(error)
        return response.status(500).send({ message: 'Internal server error' })
    }
})

const DAY = 24 * 60 * 60 * 1000
const daysAgo = (days) => new Date(Date.now() - days * DAY)

// Segunda-feira (UTC) da semana de uma data, no formato YYYY-MM-DD
const weekStart = (date) => {
    const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
    const weekday = (d.getUTCDay() + 6) % 7
    d.setUTCDate(d.getUTCDate() - weekday)
    return d.toISOString().slice(0, 10)
}

// GET /api/admin/metrics
// Só números agregados: nenhum dado pessoal ou financeiro individual é retornado.
adminRouter.get('/metrics', auth, requireAdmin, async (request, response) => {
    try {
        const d7 = daysAgo(7)
        const d30 = daysAgo(30)
        const WEEKS = 8
        const firstWeek = new Date(`${weekStart(new Date())}T00:00:00Z`)
        firstWeek.setUTCDate(firstWeek.getUTCDate() - (WEEKS - 1) * 7)

        // lançamentos feitos pela pessoa (os gerados por recorrentes não contam)
        const manual = { recurring_id: null }

        const [
            totalUsers,
            verifiedUsers,
            newUsers7,
            newUsers30,
            active7,
            active30,
            matureUsers,
            matureActive,
            transactions7,
            launchers7,
            usersWithTransactions,
            usersWithRecurring,
            usersWithBudget,
            weeklyRows,
        ] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { email_verified_at: { not: null } } }),
            prisma.user.count({ where: { created_at: { gte: d7 } } }),
            prisma.user.count({ where: { created_at: { gte: d30 } } }),
            prisma.user.count({ where: { last_seen_at: { gte: d7 } } }),
            prisma.user.count({ where: { last_seen_at: { gte: d30 } } }),
            prisma.user.count({ where: { created_at: { lte: d30 } } }),
            prisma.user.count({
                where: { created_at: { lte: d30 }, last_seen_at: { gte: d7 } },
            }),
            prisma.transaction.count({ where: { ...manual, created_at: { gte: d7 } } }),
            prisma.transaction.groupBy({
                by: ['user_id'],
                where: { ...manual, created_at: { gte: d7 } },
            }),
            prisma.transaction.groupBy({ by: ['user_id'], where: manual }),
            prisma.recurringTransaction.groupBy({ by: ['user_id'] }),
            prisma.budget.groupBy({ by: ['user_id'] }),
            prisma.$queryRaw`
                SELECT to_char(date_trunc('week', "created_at"), 'YYYY-MM-DD') AS week,
                       COUNT(*)::int AS count
                FROM "User"
                WHERE "created_at" >= ${firstWeek}
                GROUP BY 1
            `,
        ])

        const byWeek = new Map(weeklyRows.map((row) => [row.week, Number(row.count)]))
        const signupsByWeek = []
        for (let i = 0; i < WEEKS; i++) {
            const d = new Date(firstWeek)
            d.setUTCDate(d.getUTCDate() + i * 7)
            const week = d.toISOString().slice(0, 10)
            signupsByWeek.push({ week, count: byWeek.get(week) ?? 0 })
        }

        return response.status(200).send({
            generatedAt: new Date().toISOString(),
            users: {
                total: totalUsers,
                verified: verifiedUsers,
                new7: newUsers7,
                new30: newUsers30,
            },
            activity: {
                active7,
                active30,
                launchers7: launchers7.length,
                transactions7,
            },
            retention: {
                matureUsers,
                matureActive,
            },
            features: {
                transactions: usersWithTransactions.length,
                recurring: usersWithRecurring.length,
                budgets: usersWithBudget.length,
            },
            signupsByWeek,
        })
    } catch (error) {
        console.error(error)
        return response.status(500).send({ message: 'Internal server error' })
    }
})
