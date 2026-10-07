import { PiggyBank, TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import { Card } from './ui/card'
import { formatCurrency } from '../lib/format'
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

export function BalanceCards({ balance, isLoading }) {
  const total = Number(balance?.balance ?? 0)

  return (
    <div className="space-y-4">
      <Card className="relative overflow-hidden p-6 sm:p-8">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-2 text-foreground">
            <Wallet className="h-[18px] w-[18px]" />
          </span>
          <span className="text-sm font-medium text-muted">Saldo do período</span>
        </div>
        {isLoading ? (
          <Skeleton className="mt-4 h-12 w-56" />
        ) : (
          <p
            className={cn(
              'mt-4 text-4xl font-extrabold tracking-tight tabular-nums sm:text-5xl',
              total < 0 && 'text-expense',
            )}
          >
            {formatCurrency(total)}
          </p>
        )}
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