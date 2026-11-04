import { PiggyBank, TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import { Card } from './ui/card'
import { formatCurrency, formatDate } from '../lib/format'
import { cn } from '../lib/cn'

function Skeleton({ className }) {
  return <div className={cn('animate-pulse rounded-md bg-surface-2', className)} />
}

function StatCard({ icon: Icon, label, value, iconClass, isLoading }) {
  return (
    <Card className="flex items-center justify-between gap-3 p-4 sm:block sm:p-5">
      <div className="flex items-center gap-2.5">
        <span className={cn('flex h-9 w-9 items-center justify-center rounded-lg', iconClass)}>
          <Icon className="h-[18px] w-[18px]" />
        </span>
        <span className="text-sm font-medium text-muted">{label}</span>
      </div>
      {isLoading ? (
        <Skeleton className="h-6 w-28 sm:mt-4 sm:h-8 sm:w-36" />
      ) : (
        <p className="text-lg font-bold tabular-nums sm:mt-4 sm:text-2xl">{formatCurrency(value)}</p>
      )}
    </Card>
  )
}

const signed = (value) => (value > 0 ? `+${formatCurrency(value)}` : formatCurrency(value))

function StatementItem({ label, caption, value, isLoading, valueClass }) {
  return (
    <div className="flex items-baseline justify-between gap-3 sm:block">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted">{caption}</p>
      </div>
      {isLoading ? (
        <Skeleton className="h-6 w-24 sm:mt-2" />
      ) : (
        <p className={cn('text-lg font-bold tabular-nums sm:mt-2 sm:text-xl', valueClass)}>{value}</p>
      )}
    </div>
  )
}

export function BalanceCards({ balance, isLoading, from, to }) {
  const current = Number(balance?.currentBalance ?? 0)
  const opening = Number(balance?.openingBalance ?? 0)
  const result = Number(balance?.balance ?? 0)
  const closing = Number(balance?.closingBalance ?? 0)
  const today = balance?.today
  const endIsFuture = today && to > today

  return (
    <div className="space-y-4">
      <Card className="relative overflow-hidden p-6 sm:p-8">
        {/* Saldo atual: tudo o que foi lançado até hoje, qualquer que seja o período escolhido */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-2 text-foreground">
              <Wallet className="h-[18px] w-[18px]" />
            </span>
            <span className="text-sm font-medium text-muted">Saldo atual</span>
          </div>
          {today && <span className="text-xs text-muted">hoje, {formatDate(today)}</span>}
        </div>
        {isLoading ? (
          <Skeleton className="mt-4 h-12 w-56" />
        ) : (
          <p
            className={cn(
              'mt-4 text-4xl font-extrabold tracking-tight tabular-nums sm:text-5xl',
              current < 0 && 'text-expense',
            )}
          >
            {formatCurrency(current)}
          </p>
        )}

        {/* Extrato do período escolhido */}
        <div className="mt-6 border-t border-border pt-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Extrato de {formatDate(from)} a {formatDate(to)}
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3 sm:gap-6">
            <StatementItem
              label="Saldo no início"
              caption={`antes de ${formatDate(from)}`}
              value={formatCurrency(opening)}
              valueClass={opening < 0 && 'text-expense'}
              isLoading={isLoading}
            />
            <StatementItem
              label="Resultado do período"
              caption="ganhos − gastos − investimentos"
              value={signed(result)}
              valueClass={result > 0 ? 'text-earning' : result < 0 ? 'text-expense' : undefined}
              isLoading={isLoading}
            />
            <StatementItem
              label="Saldo no fim"
              caption={endIsFuture ? `previsto para ${formatDate(to)}` : `em ${formatDate(to)}`}
              value={formatCurrency(closing)}
              valueClass={closing < 0 && 'text-expense'}
              isLoading={isLoading}
            />
          </div>
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
        <StatCard
          icon={TrendingUp}
          label="Ganhos"
          value={balance?.earnings}
          iconClass="bg-earning/10 text-earning"
          isLoading={isLoading}
        />
        <StatCard
          icon={TrendingDown}
          label="Gastos"
          value={balance?.expenses}
          iconClass="bg-expense/10 text-expense"
          isLoading={isLoading}
        />
        <StatCard
          icon={PiggyBank}
          label="Investimentos"
          value={balance?.investments}
          iconClass="bg-investment/10 text-investment"
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}