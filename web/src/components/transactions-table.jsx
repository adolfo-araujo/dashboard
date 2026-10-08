import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Pencil, Plus, Repeat, Search, Trash2 } from 'lucide-react'
import { Card } from './ui/card'
import { Button } from './ui/button'
import { Input, Select } from './ui/input'
import { ConfirmDialog } from './confirm-dialog'
import { TRANSACTION_TYPES, formatCurrency, formatDate } from '../lib/format'
import { useDeleteTransaction } from '../hooks/use-finance'
import { getErrorMessage } from '../lib/api'
import { cn } from '../lib/cn'
import { getCategory } from '../lib/categories'

function TypeBadge({ type }) {
  const cfg = TRANSACTION_TYPES[type]
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold', cfg.bg, cfg.text)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {cfg.label}
    </span>
  )
}

function RecurringMark({ transaction }) {
  if (!transaction.recurring_id) return null
  return <Repeat className="ml-1.5 inline h-3.5 w-3.5 text-muted" aria-label="Lançamento recorrente" />
}

function CategoryLabel({ transaction }) {
  const category = getCategory(transaction.type, transaction.category)
  const Icon = category.icon
  return (
    <span className={cn('inline-flex items-center gap-1.5', !transaction.category && 'italic text-muted')}>
      <Icon className="h-3.5 w-3.5 shrink-0 text-muted" />
      {category.label}
    </span>
  )
}

function Amount({ transaction }) {
  const sign = transaction.type === 'EARNING' ? '+' : '−'
  return (
    <span className={cn('font-bold tabular-nums', TRANSACTION_TYPES[transaction.type].text)}>
      {sign} {formatCurrency(transaction.amount)}
    </span>
  )
}

export function TransactionsTable({ transactions = [], isLoading, onEdit, onCreate }) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [toDelete, setToDelete] = useState(null)
  const deleteMutation = useDeleteTransaction()

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return transactions.filter(
      (t) =>
        (typeFilter === 'ALL' || t.type === typeFilter) &&
        (!term ||
          t.name.toLowerCase().includes(term) ||
          getCategory(t.type, t.category).label.toLowerCase().includes(term)),
    )
  }, [transactions, search, typeFilter])

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(toDelete.id)
      toast.success('Transação excluída.')
      setToDelete(null)
    } catch (error) {
      toast.error(getErrorMessage(error, 'Não foi possível excluir a transação.'))
    }
  }

  const actions = (t) => (
    <div className="flex justify-end gap-1">
      <Button variant="ghost" size="icon" onClick={() => onEdit(t)} aria-label={`Editar ${t.name}`}>
        <Pencil className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="hover:text-expense"
        onClick={() => setToDelete(t)}
        aria-label={`Excluir ${t.name}`}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )

  return (
    <Card>
      <div className="flex flex-col gap-3 border-b border-border p-5 sm:flex-row sm:items-center">
        <div className="flex-1">
          <h2 className="font-bold">Transações</h2>
          <p className="text-sm text-muted">
            {isLoading ? 'Carregando…' : `${filtered.length} de ${transactions.length} no período`}
          </p>
        </div>
        <div className="relative sm:w-56">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            placeholder="Buscar por nome ou categoria"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            aria-label="Buscar transação"
          />
        </div>
        <Select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="sm:w-40"
          aria-label="Filtrar por tipo"
        >
          <option value="ALL">Todos os tipos</option>
          {Object.entries(TRANSACTION_TYPES).map(([key, cfg]) => (
            <option key={key} value={key}>
              {cfg.plural}
            </option>
          ))}
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3 p-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-md bg-surface-2" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-5 py-14 text-center">
          <p className="font-semibold">
            {transactions.length === 0 ? 'Nenhuma transação neste período' : 'Nada encontrado com esses filtros'}
          </p>
          <p className="max-w-xs text-sm text-muted">
            {transactions.length === 0
              ? 'Adicione sua primeira transação ou escolha outro período.'
              : 'Ajuste a busca ou o tipo para ver mais resultados.'}
          </p>
          {transactions.length === 0 && (
            <Button size="sm" onClick={onCreate} className="mt-1">
              <Plus className="h-4 w-4" /> Adicionar transação
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* desktop */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted">
                  <th className="px-5 py-3 font-medium">Nome</th>
                  <th className="px-5 py-3 font-medium">Categoria</th>
                  <th className="px-5 py-3 font-medium">Tipo</th>
                  <th className="px-5 py-3 font-medium">Data</th>
                  <th className="px-5 py-3 text-right font-medium">Valor</th>
                  <th className="px-5 py-3 text-right font-medium">
                    <span className="sr-only">Ações</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t.id} className="border-t border-border hover:bg-surface-2/50">
                    <td className="px-5 py-3 font-semibold">
                      {t.name}
                      <RecurringMark transaction={t} />
                    </td>
                    <td className="px-5 py-3 text-muted">
                      <CategoryLabel transaction={t} />
                    </td>
                    <td className="px-5 py-3">
                      <TypeBadge type={t.type} />
                    </td>
                    <td className="px-5 py-3 text-muted tabular-nums">{formatDate(t.date)}</td>
                    <td className="px-5 py-3 text-right">
                      <Amount transaction={t} />
                    </td>
                    <td className="px-5 py-2">{actions(t)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* mobile */}
          <ul className="divide-y divide-border md:hidden">
            {filtered.map((t) => (
              <li key={t.id} className="flex items-start justify-between gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">
                    {t.name}
                    <RecurringMark transaction={t} />
                  </p>
                  <p className="mt-1 truncate text-xs text-muted">
                    <CategoryLabel transaction={t} />
                  </p>
                  <div className="mt-1.5 flex items-center gap-2 text-xs text-muted">
                    <TypeBadge type={t.type} />
                    <span className="whitespace-nowrap tabular-nums">{formatDate(t.date)}</span>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="whitespace-nowrap text-sm">
                    <Amount transaction={t} />
                  </span>
                  {actions(t)}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
        title="Excluir transação?"
        description={toDelete ? `"${toDelete.name}" será removida permanentemente.` : ''}
        confirmLabel="Excluir"
      />
    </Card>
  )
}
