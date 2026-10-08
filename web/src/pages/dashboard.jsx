import { useEffect, useState } from 'react'
import { Plus, Repeat } from 'lucide-react'
import { Header } from '../components/header'
import { DateRangePicker } from '../components/date-range-picker'
import { BalanceCards } from '../components/balance-cards'
import { BalanceChart } from '../components/balance-chart'
import { CategoryBreakdown } from '../components/category-breakdown'
import { MonthlyEvolution } from '../components/monthly-evolution'
import { RecurringDialog } from '../components/recurring-dialog'
import { useSyncRecurring } from '../hooks/use-recurring'
import { TransactionsTable } from '../components/transactions-table'
import { TransactionFormDialog } from '../components/transaction-form-dialog'
import { AccountDialog } from '../components/account-dialog'
import { LegalLinks } from '../components/legal-links'
import { Button } from '../components/ui/button'
import { useAuth } from '../contexts/auth'
import { useDateRange } from '../hooks/use-date-range'
import { useBalance, useTransactions } from '../hooks/use-finance'
import { getErrorMessage } from '../lib/api'

export function DashboardPage() {
  const { user } = useAuth()
  const { from, to, setRange } = useDateRange()
  const balanceQuery = useBalance(from, to)
  const transactionsQuery = useTransactions(from, to)

  const [formState, setFormState] = useState({ open: false, transaction: null })
  const [accountOpen, setAccountOpen] = useState(false)
  const [recurringOpen, setRecurringOpen] = useState(false)

  // Ao abrir o painel, lança as recorrentes que venceram desde a última visita
  const syncRecurring = useSyncRecurring()
  useEffect(() => {
    syncRecurring.mutate()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const openCreate = () => setFormState({ open: true, transaction: null })
  const openEdit = (transaction) => setFormState({ open: true, transaction })
  const closeForm = () => setFormState((s) => ({ ...s, open: false }))

  const error = balanceQuery.error || transactionsQuery.error

  return (
    <div className="min-h-screen">
      <Header onOpenAccount={() => setAccountOpen(true)} />

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Olá, {user?.first_name}</h1>
            <p className="text-sm text-muted">Este é o resumo das suas finanças no período.</p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <DateRangePicker from={from} to={to} onChange={setRange} />
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <Button variant="secondary" onClick={() => setRecurringOpen(true)} className="w-full sm:w-auto">
                <Repeat className="h-4 w-4" /> Recorrentes
              </Button>
              <Button onClick={openCreate} className="w-full sm:w-auto">
                <Plus className="h-4 w-4" /> Adicionar
              </Button>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-expense/40 bg-expense/10 px-4 py-3 text-sm text-expense">
            {getErrorMessage(error, 'Não foi possível carregar os dados.')}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <BalanceCards balance={balanceQuery.data} isLoading={balanceQuery.isLoading} />
          <BalanceChart balance={balanceQuery.data} isLoading={balanceQuery.isLoading} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <CategoryBreakdown transactions={transactionsQuery.data} isLoading={transactionsQuery.isLoading} />
          <MonthlyEvolution />
        </div>

        <TransactionsTable
          transactions={transactionsQuery.data}
          isLoading={transactionsQuery.isLoading}
          onEdit={openEdit}
          onCreate={openCreate}
        />
      </main>

      <footer className="border-t border-border py-6">
        <LegalLinks />
      </footer>

      <TransactionFormDialog open={formState.open} transaction={formState.transaction} onClose={closeForm} />
      <AccountDialog open={accountOpen} onClose={() => setAccountOpen(false)} />
      <RecurringDialog open={recurringOpen} onClose={() => setRecurringOpen(false)} />
    </div>
  )
}
