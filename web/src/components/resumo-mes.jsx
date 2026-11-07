import { useMemo } from 'react'
import dayjs from 'dayjs'
import { useQuery } from '@tanstack/react-query'
import { Sparkles, TrendingDown, TrendingUp } from 'lucide-react'
import { Card } from './ui/card'
import { api } from '../lib/api'
import { formatCurrency, today } from '../lib/format'
import { getCategory } from '../lib/categories'
import { resumoDoMes } from '../lib/sugestoes'

const nomeMes = (iso) => new Intl.DateTimeFormat('pt-BR', { month: 'long', timeZone: 'UTC' }).format(new Date(`${iso}T12:00:00Z`))
const pct = (agora, antes) => Math.round((Math.abs(agora - antes) / antes) * 100)

/** Resumo em frases: gastos deste mês até hoje × o mesmo período do mês passado. Só contas, sem estimativa. */
export function ResumoMes() {
  const hoje = today()
  const inicioMesPassado = dayjs(hoje).subtract(1, 'month').startOf('month').format('YYYY-MM-DD')
  const consulta = useQuery({
    queryKey: ['transactions', 'resumo', inicioMesPassado, hoje],
    queryFn: async () => (await api.get('/transactions/me', { params: { from: inicioMesPassado, to: hoje } })).data,
  })
  const r = useMemo(() => (consulta.data ? resumoDoMes(consulta.data, hoje) : null), [consulta.data, hoje])

  if (!r?.temDados) return null
  const mesPassado = nomeMes(inicioMesPassado)
  const subiu = r.totalAgora > r.totalAntes

  return (
    <Card className="p-5 sm:p-6">
      <h2 className="flex items-center gap-2 font-bold">
        <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" /> Resumo do mês
      </h2>
      <p className="text-sm text-muted">Gastos até o dia {r.dia}, comparados com o mesmo período de {mesPassado}</p>
      <p className="mt-4 leading-relaxed">
        Você gastou <strong>{formatCurrency(r.totalAgora)}</strong> até agora
        {r.totalAntes > 0 && r.totalAgora !== r.totalAntes ? (
          <>
            , <strong className={subiu ? 'text-expense' : 'text-earning'}>
              {pct(r.totalAgora, r.totalAntes)}% {subiu ? 'a mais' : 'a menos'}
            </strong>{' '}
            que em {mesPassado} ({formatCurrency(r.totalAntes)}).
          </>
        ) : r.totalAntes > 0 ? (
          <>, o mesmo que em {mesPassado}.</>
        ) : (
          <>. Em {mesPassado}, até o dia {r.dia}, não havia gastos registrados.</>
        )}
      </p>
      {r.variacoes.length > 0 && (
        <ul className="mt-3 space-y-2">
          {r.variacoes.map((v) => {
            const Icone = v.diferenca > 0 ? TrendingUp : TrendingDown
            return (
              <li key={v.categoria} className="flex items-start gap-2 text-sm">
                <Icone className={`mt-0.5 h-4 w-4 shrink-0 ${v.diferenca > 0 ? 'text-expense' : 'text-earning'}`} aria-hidden="true" />
                <span>
                  <strong>{getCategory('EXPENSE', v.categoria).label}</strong>: {formatCurrency(v.agora)},{' '}
                  {pct(v.agora, v.antes)}% {v.diferenca > 0 ? 'a mais' : 'a menos'} ({formatCurrency(v.antes)} em {mesPassado})
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}
