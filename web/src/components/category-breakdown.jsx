import { useMemo, useState } from 'react'
import { Card } from './ui/card'
import { TRANSACTION_TYPES, formatCurrency } from '../lib/format'
import { getCategory } from '../lib/categories'
import { formatPercent, toPercentages } from '../lib/percent'
import { cn } from '../lib/cn'

const TABS = [
  { type: 'EXPENSE', label: 'Gastos' },
  { type: 'EARNING', label: 'Ganhos' },
  { type: 'INVESTMENT', label: 'Investimentos' },
]

export function CategoryBreakdown({ transactions = [], isLoading }) {
  const [type, setType] = useState('EXPENSE')
  const cfg = TRANSACTION_TYPES[type]

  const rows = useMemo(() => {
    const totals = new Map()
    for (const t of transactions) {
      if (t.type !== type) continue
      const key = t.category ?? null
      totals.set(key, (totals.get(key) ?? 0) + Number(t.amount))
    }
    const list = [...totals.entries()]
      .map(([key, value]) => ({ category: getCategory(type, key), value }))
      .sort((a, b) => b.value - a.value)
    const pcts = toPercentages(list.map((r) => r.value))
    return list.map((r, i) => ({ ...r, pct: pcts[i] }))
  }, [transactions, type])

  const max = rows[0]?.value ?? 0

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-bold">Por categoria</h2>
          <p className="text-sm text-muted">Para onde o dinheiro foi no período</p>
        </div>
        <div role="tablist" aria-label="Tipo" className="inline-flex rounded-lg border border-border bg-background p-1">
          {TABS.map((tab) => (
            <button
              key={tab.type}
              role="tab"
              aria-selected={type === tab.type}
              onClick={() => setType(tab.type)}
              className={cn(
                'flex-1 rounded-md px-3 py-1.5 text-sm font-semibold transition-colors sm:flex-none',
                type === tab.type ? 'bg-surface-2 text-foreground' : 'text-muted hover:text-foreground',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="mt-5 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-9 animate-pulse rounded-md bg-surface-2" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <p className="mt-6 text-sm text-muted">Nenhum lançamento de {cfg.plural.toLowerCase()} neste período.</p>
      ) : (
        <ul className="mt-5 space-y-4">
          {rows.map(({ category, value, pct }) => {
            const Icon = category.icon
            return (
              <li key={category.key ?? 'none'}>
                <div className="flex items-center gap-3 text-sm">
                  <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', cfg.bg, cfg.text)}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1 truncate font-medium">{category.label}</span>
                  <span className="font-bold tabular-nums">{formatCurrency(value)}</span>
                  <span className="w-14 text-right text-xs text-muted tabular-nums">{formatPercent(pct, value)}</span>
                </div>
                <div className="ml-11 mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${max ? (value / max) * 100 : 0}%`, backgroundColor: cfg.color }}
                  />
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}
