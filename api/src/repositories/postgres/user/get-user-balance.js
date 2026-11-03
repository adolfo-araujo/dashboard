import { Prisma, TransactionType } from '@prisma/client'
import { prisma } from '../../../../prisma/prisma.js'

export class PostgresGetUserBalanceRepository {
    async execute(userId, from, to) {
        const dateFilter = {
            date: {
                gte: new Date(from),
                lte: new Date(to),
            },
        }
        // Uma consulta só, agrupada por tipo (antes eram três consultas seguidas)
        const sums = await prisma.transaction.groupBy({
            by: ['type'],
            where: {
                user_id: userId,
                ...dateFilter,
            },
            _sum: {
                amount: true,
            },
        })
        const sumOf = (type) =>
            sums.find((row) => row.type === type)?._sum.amount ?? null

        const totalExpenses = sumOf(TransactionType.EXPENSE)
        const totalEarnings = sumOf(TransactionType.EARNING)
        const totalInvestments = sumOf(TransactionType.INVESTMENT)

        const _totalEarnings = totalEarnings || new Prisma.Decimal(0)
        const _totalExpenses = totalExpenses || new Prisma.Decimal(0)
        const _totalInvestments = totalInvestments || new Prisma.Decimal(0)

        const total = _totalEarnings
            .plus(_totalExpenses)
            .plus(_totalInvestments)

        const balance = _totalEarnings
            .minus(_totalExpenses)
            .minus(_totalInvestments)

        const earningsPercentage = total.isZero()
            ? 0
            : _totalEarnings.div(total).times(100).floor()
        const expensesPercentage = total.isZero()
            ? 0
            : _totalExpenses.div(total).times(100).floor()
        const investmentsPercentage = total.isZero()
            ? 0
            : _totalInvestments.div(total).times(100).floor()

        return {
            earnings: _totalEarnings,
            expenses: _totalExpenses,
            investments: _totalInvestments,
            earningsPercentage,
            expensesPercentage,
            investmentsPercentage,
            balance,
        }
    }
}
