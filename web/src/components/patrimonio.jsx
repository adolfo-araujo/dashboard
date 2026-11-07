import { useMemo } from 'react'
import dayjs from 'dayjs'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card } from './ui/card'
import { useBalance, useMonthlySummary } from '../hooks/use-finance'
import { formatCurrency, today } from '../lib/format'
import { coresDoGrafico, useTemaClaro } from '../lib/tema'

const MESES = 12
const mesCurto = new Intl.DateTimeFormat('pt-BR', { month: 'short', timeZone: 'UTC' })
const mesLongo = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' })
const compacto = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 })
const dataDo = (mes) => new Date(`${mes}-01T00:00:00Z`)

// Cores com contraste suficiente nos dois temas
const series = (claro) => ({
  saldo: { rotulo: 'Saldo no fim do mês', cor: claro ? '#387A1E' : '#55B02E' },
  investido: { rotulo: 'Investido no período (somado)', cor: claro ? '#1D4ED8' : '#60A5FA' },
})

function Dica({ active, payload, label, SERIES }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-xs shadow-xl">
      <p className="mb-1 font-bold capitalize">{mesLongo.format(dataDo(label))}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: SERIES[p.dataKey].cor }} />
          <span className="text-muted">{SERIES[p.dataKey].rotulo}:</span>
          <span className="font-semibold tabular-nums">{formatCurrency(p.value)}</span>
        </p>
      ))}
    </div>
  )
}

/**
 * Seu dinheiro ao longo do tempo: saldo no fim de cada mês (saldo anterior + resultado de cada mês)
 * e quanto foi investido no período, somado mês a mês. Tudo calculado com os lançamentos registrados.
 */
export function Patrimonio() {
  const claro = useTemaClaro()
  const cores = coresDoGrafico(claro)
  const SERIES = series(claro)
  const hoje = today()
  const resumo = useMonthlySummary(MESES, hoje)
  const inicio = resumo.data?.[0] ? `${resumo.data[0].month}-01` : dayjs(hoje).subtract(MESES - 1, 'month').startOf('month').format('YYYY-MM-DD')
  const saldo = useBalance(inicio, dayjs(hoje).endOf('month').format('YYYY-MM-DD'))

  const pontos = useMemo(() => {
    if (!resumo.data || !saldo.data) return []
    let acumulado = Number(saldo.data.openingBalance ?? 0)
    let investido = 0
    return resumo.data.map((m) => {
      acumulado += m.balance
      investido += m.investments
      return { mes: m.month, saldo: Math.round(acumulado * 100) / 100, investido: Math.round(investido * 100) / 100 }
    })
  }, [resumo.data, saldo.data])

  const carregando = resumo.isLoading || saldo.isLoading
  const vazio = !carregando && (resumo.data ?? []).every((m) => !m.earnings && !m.expenses && !m.investments)
  if (vazio) return null
  const ultimo = pontos[pontos.length - 1]
  const primeiro = pontos[0]

  return (
    <Card className="flex flex-col p-5 sm:p-6">
      <h2 className="font-bold">Seu dinheiro ao longo do tempo</h2>
      <p className="text-sm text-muted">Saldo no fim de cada mês e quanto você investiu nos últimos {MESES} meses</p>

      <div className="mt-5 h-56">
        {carregando || !ultimo ? (
          <div className="h-full animate-pulse rounded-lg bg-surface-2" />
        ) : (
          <>
            <div role="img" aria-label="Gráfico do saldo no fim de cada mês e do total investido; os valores estão na tabela a seguir" className="h-full w-full">
              <div aria-hidden="true" className="h-full w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={pontos} margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
                    <CartesianGrid stroke={cores.grade} vertical={false} />
                    <XAxis dataKey="mes" tickFormatter={(m) => mesCurto.format(dataDo(m)).replace('.', '')}
                      tick={{ fill: cores.fraco, fontSize: 12 }} axisLine={false} tickLine={false} interval={1} />
                    <YAxis tickFormatter={(v) => compacto.format(v)} tick={{ fill: cores.fraco, fontSize: 12 }}
                      axisLine={false} tickLine={false} width={48} />
                    <Tooltip content={<Dica SERIES={SERIES} />} cursor={{ stroke: cores.grade }} />
                    <Line dataKey="saldo" type="monotone" stroke={SERIES.saldo.cor} strokeWidth={2.5} dot={{ r: 2.5, fill: SERIES.saldo.cor }} />
                    <Line dataKey="investido" type="monotone" stroke={SERIES.investido.cor} strokeWidth={2} strokeDasharray="5 4" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="sr-only">
              <table>
                <caption>Saldo no fim de cada mês e total investido</caption>
                <thead><tr><th scope="col">Mês</th><th scope="col">Saldo no fim do mês</th><th scope="col">Investido no período</th></tr></thead>
                <tbody>
                  {pontos.map((p) => (
                    <tr key={p.mes}><th scope="row">{mesLongo.format(dataDo(p.mes))}</th><td>{formatCurrency(p.saldo)}</td><td>{formatCurrency(p.investido)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        {Object.values(SERIES).map((s) => (
          <span key={s.rotulo} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.cor }} />
            {s.rotulo}
          </span>
        ))}
      </div>

      {ultimo && (
        <dl className="mt-5 grid grid-cols-1 gap-3 border-t border-border pt-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-muted">Saldo no fim de {mesLongo.format(dataDo(ultimo.mes)).split(' ')[0]}</dt>
            <dd className={`font-bold tabular-nums ${ultimo.saldo < 0 ? 'text-expense' : ''}`}>{formatCurrency(ultimo.saldo)}</dd>
          </div>
          <div>
            <dt className="text-muted">Mudança em {MESES} meses</dt>
            <dd className="font-bold tabular-nums">{formatCurrency(ultimo.saldo - Number(saldo.data?.openingBalance ?? 0))}</dd>
          </div>
          <div>
            <dt className="text-muted">Investido desde {mesLongo.format(dataDo(primeiro.mes)).split(' ')[0]}</dt>
            <dd className="font-bold tabular-nums">{formatCurrency(ultimo.investido)}</dd>
          </div>
        </dl>
      )}
    </Card>
  )
}
