import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { PiggyBank, TrendingDown, TrendingUp } from 'lucide-react'
import { Card } from './ui/card'
import { TRANSACTION_TYPES, formatCurrency } from '../lib/format'

const icons = { EARNING: TrendingUp, EXPENSE: TrendingDown, INVESTMENT: PiggyBank }

// Percentuais com 1 casa decimal que sempre somam exatamente 100%.
// Calcula em décimos, arredonda para baixo e distribui o que sobrou
// para quem teve a maior parte decimal descartada.
function toPercentages(values) {
  const total = values.reduce((sum, v) => sum + v, 0)
  if (total === 0) return values.map(() => 0)

  const raw = values.map((v) => (v / total) * 1000)
  const tenths = raw.map(Math.floor)
  let remaining = 1000 - tenths.reduce((sum, t) => sum + t, 0)

  raw
    .map((r, i) => ({ i, rest: r - tenths[i] }))
    .sort((a, b) => b.rest - a.rest)
    .forEach(({ i }) => {
      if (remaining > 0) {
        tenths[i] += 1
        remaining -= 1
      }
    })

  return tenths.map((t) => t / 10)
}

const percentFormat = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })

function formatPercent(pct, value) {
  if (value > 0 && pct === 0) return '< 0,1%'
  return `${percentFormat.format(pct)}%`
}

export function BalanceChart({ balance, isLoading }) {
  const keys = ['EARNING', 'EXPENSE', 'INVESTMENT']
  const values = [
    Number(balance?.earnings ?? 0),
    Number(balance?.expenses ?? 0),
    Number(balance?.investments ?? 0),
  ]
  const percentages = toPercentages(values)
  const data = keys.map((key, i) => ({ key, value: values[i], pct: percentages[i] }))
  const isEmpty = values.every((v) => v === 0)
  const slices = data.filter((d) => d.value > 0).length

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
                paddingAngle={slices > 1 ? 2 : 0}
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
              <span className="text-sm font-bold tabular-nums">{formatPercent(d.pct, d.value)}</span>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}