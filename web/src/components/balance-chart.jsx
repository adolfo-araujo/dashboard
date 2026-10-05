import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { PiggyBank, TrendingDown, TrendingUp } from 'lucide-react'
import { Card } from './ui/card'
import { TRANSACTION_TYPES, formatCurrency } from '../lib/format'

const icons = { EARNING: TrendingUp, EXPENSE: TrendingDown, INVESTMENT: PiggyBank }

export function BalanceChart({ balance, isLoading }) {
  const data = [
    { key: 'EARNING', value: Number(balance?.earnings ?? 0), pct: Number(balance?.earningsPercentage ?? 0) },
    { key: 'EXPENSE', value: Number(balance?.expenses ?? 0), pct: Number(balance?.expensesPercentage ?? 0) },
    { key: 'INVESTMENT', value: Number(balance?.investments ?? 0), pct: Number(balance?.investmentsPercentage ?? 0) },
  ]
  const isEmpty = data.every((d) => d.value === 0)

  return (
    <Card className="flex h-full flex-col p-6">
      <h2 className="font-bold">Distribuição</h2>
      <p className="text-sm text-muted">Como o dinheiro se movimentou no período</p>

      <div className="relative mx-auto my-4 h-48 w-48">
        {isLoading ? (
          <div className="h-full w-full animate-pulse rounded-full border-[18px] border-surface-2" />
        ) : isEmpty ? (
          <div className="flex h-full w-full items-center justify-center rounded-full border-[18px] border-surface-2 text-center text-xs text-muted">
            Sem dados
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="key"
                innerRadius="68%"
                outerRadius="100%"
                 paddingAngle={data.filter((d) => d.value > 0).length > 1 ? 2 : 0}
                stroke="none"
              >
                {data.map((d) => (
                  <Cell key={d.key} fill={TRANSACTION_TYPES[d.key].color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, key) => [formatCurrency(value), TRANSACTION_TYPES[key].plural]}
                contentStyle={{
                  background: '#1C2026',
                  border: '1px solid #272C34',
                  borderRadius: 8,
                  color: '#ECEEF1',
                }}
                itemStyle={{ color: '#ECEEF1' }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      <ul className="mt-auto space-y-3">
        {data.map((d) => {
          const cfg = TRANSACTION_TYPES[d.key]
          const Icon = icons[d.key]
          return (
            <li key={d.key} className="flex items-center gap-3">
              <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${cfg.bg} ${cfg.text}`}>
                <Icon className="h-4 w-4" />
              </span>
              <span className="flex-1 text-sm text-muted">{cfg.plural}</span>
              <span className="text-sm font-bold tabular-nums">{d.pct}%</span>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
