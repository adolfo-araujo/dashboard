import { useMemo, useState } from 'react'
import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card } from './ui/card'
import { useMonthlySummary } from '../hooks/use-finance'
import { formatCurrency, today } from '../lib/format'
import { cn } from '../lib/cn'

const monthFormat = new Intl.DateTimeFormat('pt-BR', { month: 'short', timeZone: 'UTC' })
const monthYearFormat = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' })
const compact = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 })

const toDate = (month) => new Date(`${month}-01T00:00:00Z`)
const shortMonth = (month) => monthFormat.format(toDate(month)).replace('.', '')

const SERIES = {
  earnings: { label: 'Ganhos', color: '#55B02E' },
  expenses: { label: 'Gastos', color: '#E93030' },
  balance: { label: 'Saldo do mês', color: '#ECEEF1' },
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const title = monthYearFormat.format(toDate(label))
  return (
    <div className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-xs shadow-xl">
      <p className="mb-1 font-bold capitalize">{title}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: SERIES[p.dataKey].color }} />
          <span className="text-muted">{SERIES[p.dataKey].label}:</span>
          <span className="font-semibold tabular-nums">{formatCurrency(p.value)}</span>
        </p>
      ))}
    </div>
  )
}

export function MonthlyEvolution() {
  const [months, setMonths] = useState(12)
  const { data = [], isLoading } = useMonthlySummary(months, today())

  const summary = useMemo(() => {
    const n = data.length || 1
    const sum = (key) => data.reduce((acc, m) => acc + m[key], 0)
    return {
      avgEarnings: sum('earnings') / n,
      avgExpenses: sum('expenses') / n,
      totalBalance: sum('balance'),
    }
  }, [data])

  const isEmpty = !isLoading && data.every((m) => !m.earnings && !m.expenses && !m.investments)

  return (
    <Card className="flex flex-col p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-bold">Evolução mês a mês</h2>
          <p className="text-sm text-muted">Ganhos, gastos e saldo dos últimos {months} meses</p>
        </div>
        <div role="tablist" aria-label="Quantidade de meses" className="inline-flex rounded-lg border border-border bg-background p-1">
          {[6, 12].map((n) => (
            <button
              key={n}
              role="tab"
              aria-selected={months === n}
              onClick={() => setMonths(n)}
              className={cn(
                'flex-1 rounded-md px-3 py-1.5 text-sm font-semibold transition-colors sm:flex-none',
                months === n ? 'bg-surface-2 text-foreground' : 'text-muted hover:text-foreground',
              )}
            >
              {n} meses
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 h-64">
        {isLoading ? (
          <div className="h-full animate-pulse rounded-lg bg-surface-2" />
        ) : isEmpty ? (
          <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted">
            Nenhum lançamento nos últimos {months} meses.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
              <CartesianGrid stroke="#272C34" vertical={false} />
              <XAxis
                dataKey="month"
                tickFormatter={shortMonth}
                tick={{ fill: '#8D939D', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                interval={months > 6 ? 1 : 0}
              />
              <YAxis
                tickFormatter={(v) => compact.format(v)}
                tick={{ fill: '#8D939D', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                width={48}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Bar dataKey="earnings" fill={SERIES.earnings.color} radius={[4, 4, 0, 0]} maxBarSize={18} />
              <Bar dataKey="expenses" fill={SERIES.expenses.color} radius={[4, 4, 0, 0]} maxBarSize={18} />
              <Line
                dataKey="balance"
                type="monotone"
                stroke={SERIES.balance.color}
                strokeWidth={2}
                dot={{ r: 2.5, fill: SERIES.balance.color }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        {Object.values(SERIES).map((s) => (
          <span key={s.label} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
            {s.label}
          </span>
        ))}
      </div>

      <dl className="mt-5 grid grid-cols-1 gap-3 border-t border-border pt-4 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-muted">Média de ganhos</dt>
          <dd className="font-bold tabular-nums">{formatCurrency(summary.avgEarnings)}</dd>
        </div>
        <div>
          <dt className="text-muted">Média de gastos</dt>
          <dd className="font-bold tabular-nums">{formatCurrency(summary.avgExpenses)}</dd>
        </div>
        <div>
          <dt className="text-muted">Saldo acumulado</dt>
          <dd className={cn('font-bold tabular-nums', summary.totalBalance < 0 && 'text-expense')}>
            {formatCurrency(summary.totalBalance)}
          </dd>
        </div>
      </dl>
    </Card>
  )
}
