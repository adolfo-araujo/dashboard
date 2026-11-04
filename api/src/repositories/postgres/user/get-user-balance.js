import { Prisma } from '@prisma/client'
import { prisma } from '../../../../prisma/prisma.js'

const toDecimal = (value) => new Prisma.Decimal(value == null ? 0 : String(value))

export class PostgresGetUserBalanceRepository {
    // Tudo numa consulta só (cada ida ao banco custa ~120 ms em produção):
    // - ganhos, gastos e investimentos do período (from–to);
    // - saldo acumulado antes do período (saldo inicial);
    // - saldo acumulado até hoje (saldo atual), que não depende do período escolhido.
    // Saldo = ganhos − gastos − investimentos (o investido sai do saldo disponível).
    async execute(userId, from, to, today = new Date().toISOString().slice(0, 10)) {
        const [row] = await prisma.$queryRaw`
            SELECT
                SUM(CASE WHEN "date" BETWEEN ${from}::date AND ${to}::date AND "type" = 'EARNING' THEN "amount" END) AS earnings,
                SUM(CASE WHEN "date" BETWEEN ${from}::date AND ${to}::date AND "type" = 'EXPENSE' THEN "amount" END) AS expenses,
                SUM(CASE WHEN "date" BETWEEN ${from}::date AND ${to}::date AND "type" = 'INVESTMENT' THEN "amount" END) AS investments,
                SUM(CASE WHEN "date" < ${from}::date
                         THEN CASE WHEN "type" = 'EARNING' THEN "amount" ELSE -"amount" END END) AS opening,
                SUM(CASE WHEN "date" <= ${today}::date
                         THEN CASE WHEN "type" = 'EARNING' THEN "amount" ELSE -"amount" END END) AS current
            FROM "Transaction"
            WHERE "user_id" = ${userId}
        `

        const _totalEarnings = toDecimal(row?.earnings)
        const _totalExpenses = toDecimal(row?.expenses)
        const _totalInvestments = toDecimal(row?.investments)
        const openingBalance = toDecimal(row?.opening)
        const currentBalance = toDecimal(row?.current)

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
            // resultado do período (ganhos − gastos − investimentos entre from e to)
            balance,
            // extrato: saldo antes do período, saldo ao fim do período e saldo de hoje
            openingBalance,
            closingBalance: openingBalance.plus(balance),
            currentBalance,
            today,
        }
    }
}
