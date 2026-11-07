import { Link } from 'react-router-dom'
import dayjs from 'dayjs'
import { CalendarClock, FileText } from 'lucide-react'
import { Card } from './ui/card'
import { useBalance } from '../hooks/use-finance'
import { useRecurringList } from '../hooks/use-recurring'
import { formatCurrency, today } from '../lib/format'

const sinal = (r) => (r.type === 'EARNING' ? 1 : -1) * Number(r.amount)

/**
 * Previsão do saldo no último dia do mês: saldo até o fim do mês com o que já está lançado
 * + recorrentes ativas que ainda vão cair neste mês. Só contas, sem estimativa de gastos do dia a dia.
 */
export function PrevisaoMes() {
  const hoje = today()
  const amanha = dayjs(hoje).add(1, 'day').format('YYYY-MM-DD')
  const fimMes = dayjs(hoje).endOf('month').format('YYYY-MM-DD')
  const saldo = useBalance(amanha, fimMes)
  const recorrentes = useRecurringList()

  const ultimoDia = amanha > fimMes
  if (ultimoDia || saldo.isLoading || recorrentes.isLoading || !saldo.data) return null

  const aCair = (recorrentes.data ?? []).filter((r) => r.active && r.next_date && r.next_date > hoje && r.next_date <= fimMes)
  const lancadoNoFuturo = Number(saldo.data.balance ?? 0)
  const previsto = Number(saldo.data.closingBalance ?? 0) + aCair.reduce((s, r) => s + sinal(r), 0)
  const atual = Number(saldo.data.openingBalance ?? 0)
  const diaFim = dayjs(fimMes).format('DD/MM')

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-bold">
            <CalendarClock className="h-4 w-4 text-primary" aria-hidden="true" /> Previsão para {diaFim}
          </h2>
          <p className="text-sm text-muted">Saldo de hoje + o que já está agendado até o fim do mês</p>
        </div>
        <Link to={`/relatorio-anual?ano=${hoje.slice(0, 4)}`} className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
          <FileText className="h-4 w-4" aria-hidden="true" /> Relatório do ano
        </Link>
      </div>
      <p className={`mt-4 text-2xl font-bold tabular-nums ${previsto < 0 ? 'text-expense' : ''}`}>{formatCurrency(previsto)}</p>
      <ul className="mt-3 space-y-1 text-sm text-muted">
        <li>Saldo hoje: <span className="tabular-nums text-foreground">{formatCurrency(atual)}</span></li>
        {lancadoNoFuturo !== 0 && (
          <li>Lançamentos com data futura neste mês: <span className="tabular-nums text-foreground">{formatCurrency(lancadoNoFuturo)}</span></li>
        )}
        {aCair.map((r) => (
          <li key={r.id}>
            {r.name} (dia {dayjs(r.next_date).format('DD')}): <span className={`tabular-nums ${r.type === 'EARNING' ? 'text-earning' : 'text-expense'}`}>{formatCurrency(sinal(r))}</span>
          </li>
        ))}
      </ul>
      {previsto < 0 && (
        <p className="mt-3 rounded-lg border border-expense/40 bg-expense/10 px-3 py-2 text-sm text-expense">
          Se nada mudar, o saldo fica negativo até o fim do mês.
        </p>
      )}
    </Card>
  )
}
