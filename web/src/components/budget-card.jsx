import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Target } from 'lucide-react'
import { Card } from './ui/card'
import { Button } from './ui/button'
import { Dialog } from './ui/dialog'
import { Input } from './ui/input'
import { useBudgetStatus, useSaveBudgets } from '../hooks/use-budgets'
import { CATEGORIES, getCategory } from '../lib/categories'
import { formatCurrency, today } from '../lib/format'
import { getErrorMessage } from '../lib/api'
import { cn } from '../lib/cn'

const monthName = new Intl.DateTimeFormat('pt-BR', { month: 'long', timeZone: 'UTC' })

// verde até 80%, amarelo até 100%, vermelho acima
const levelOf = (spent, amount) => {
  const ratio = amount > 0 ? spent / amount : 0
  if (ratio >= 1) return 'over'
  if (ratio >= 0.8) return 'near'
  return 'ok'
}

const LEVEL_STYLE = {
  ok: { bar: '#55B02E', text: 'text-muted' },
  near: { bar: '#F5A524', text: 'text-[#F5A524]' },
  over: { bar: '#E93030', text: 'text-expense' },
}

function BudgetDialog({ open, onClose, budgets }) {
  const saveMutation = useSaveBudgets()
  const [values, setValues] = useState({})
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    const initial = {}
    for (const b of budgets) initial[b.category] = String(b.amount)
    setValues(initial)
    setError('')
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async (event) => {
    event.preventDefault()
    const list = []
    for (const category of CATEGORIES.EXPENSE) {
      const raw = (values[category.key] ?? '').toString().replace(',', '.').trim()
      if (!raw) continue
      const amount = Number(raw)
      if (!Number.isFinite(amount) || amount < 1) {
        setError(`Valor inválido em ${category.label}. Use pelo menos R$ 1,00 ou deixe em branco.`)
        return
      }
      list.push({ category: category.key, amount: Math.round(amount * 100) / 100 })
    }
    try {
      await saveMutation.mutateAsync(list)
      toast.success('Orçamentos salvos.')
      onClose()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Não foi possível salvar os orçamentos.'))
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Orçamento mensal"
      description="Defina quanto quer gastar por mês em cada categoria. Deixe em branco para não ter limite."
    >
      <form onSubmit={handleSave} className="space-y-4" noValidate>
        <ul className="divide-y divide-border">
          {CATEGORIES.EXPENSE.map(({ key, label, icon: Icon }) => (
            <li key={key} className="flex items-center gap-3 py-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-expense/10 text-expense">
                <Icon className="h-4 w-4" />
              </span>
              <label htmlFor={`budget-${key}`} className="flex-1 text-sm font-medium">
                {label}
              </label>
              <div className="relative w-32">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">R$</span>
                <Input
                  id={`budget-${key}`}
                  type="number"
                  inputMode="decimal"
                  min="1"
                  step="0.01"
                  placeholder="Sem limite"
                  className="pl-9 text-right"
                  value={values[key] ?? ''}
                  onChange={(e) => {
                    setValues((v) => ({ ...v, [key]: e.target.value }))
                    setError('')
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
        {error && <p className="text-xs font-medium text-expense">{error}</p>}
        <div className="flex gap-3">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" className="flex-1" isLoading={saveMutation.isPending}>
            Salvar orçamentos
          </Button>
        </div>
      </form>
    </Dialog>
  )
}

export function BudgetCard() {
  const month = today().slice(0, 7)
  const { data: budgets = [], isLoading } = useBudgetStatus(month)
  const [open, setOpen] = useState(false)
  const previousLevels = useRef(null)

  // Avisa quando uma categoria muda de faixa (chegou a 80% ou passou do limite)
  useEffect(() => {
    if (isLoading) return
    const current = new Map(budgets.map((b) => [b.category, levelOf(b.spent, b.amount)]))
    const previous = previousLevels.current
    if (previous) {
      for (const b of budgets) {
        const before = previous.get(b.category) ?? 'ok'
        const now = current.get(b.category)
        if (before === now) continue
        const label = getCategory('EXPENSE', b.category).label
        if (now === 'over') {
          toast.error(`Você passou do orçamento de ${label}: ${formatCurrency(b.spent)} de ${formatCurrency(b.amount)}.`)
        } else if (now === 'near' && before === 'ok') {
          toast.warning(`Atenção: ${label} já usou ${Math.round((b.spent / b.amount) * 100)}% do orçamento do mês.`)
        }
      }
    }
    previousLevels.current = current
  }, [budgets, isLoading])

  const title = `Orçamento de ${monthName.format(new Date(`${month}-01T00:00:00Z`))}`

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-bold">{title}</h2>
          <p className="text-sm text-muted">Quanto já foi gasto do limite de cada categoria</p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
          <Target className="h-4 w-4" /> Definir orçamentos
        </Button>
      </div>

      {isLoading ? (
        <div className="mt-5 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-md bg-surface-2" />
          ))}
        </div>
      ) : budgets.length === 0 ? (
        <div className="mt-6 flex flex-col items-start gap-2">
          <p className="text-sm text-muted">
            Nenhum orçamento definido. Defina limites mensais para as categorias em que você quer gastar menos.
          </p>
        </div>
      ) : (
        <ul className="mt-5 space-y-4">
          {budgets.map((b) => {
            const category = getCategory('EXPENSE', b.category)
            const Icon = category.icon
            const level = levelOf(b.spent, b.amount)
            const style = LEVEL_STYLE[level]
            const pct = b.amount > 0 ? Math.min((b.spent / b.amount) * 100, 100) : 0
            const diff = b.amount - b.spent
            return (
              <li key={b.category}>
                <div className="flex items-center gap-3 text-sm">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-expense/10 text-expense">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1 truncate font-medium">{category.label}</span>
                  <span className="whitespace-nowrap tabular-nums">
                    <span className="font-bold">{formatCurrency(b.spent)}</span>
                    <span className="text-muted"> de {formatCurrency(b.amount)}</span>
                  </span>
                </div>
                <div className="ml-11 mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-2">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: style.bar }} />
                </div>
                <p className={cn('ml-11 mt-1 text-xs', style.text)}>
                  {diff >= 0 ? `Restam ${formatCurrency(diff)}` : `Passou ${formatCurrency(-diff)} do limite`}
                </p>
              </li>
            )
          })}
        </ul>
      )}

      <BudgetDialog open={open} onClose={() => setOpen(false)} budgets={budgets} />
    </Card>
  )
}
