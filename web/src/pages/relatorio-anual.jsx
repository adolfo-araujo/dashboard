import { useMemo } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Loader2, Printer } from 'lucide-react'
import { useAuth } from '../contexts/auth'
import { api, getErrorMessage } from '../lib/api'
import { getCategory } from '../lib/categories'
import { formatCurrency, toDateOnly, today } from '../lib/format'

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
const TIPOS = [['EARNING', 'Ganhos'], ['EXPENSE', 'Gastos'], ['INVESTMENT', 'Investimentos']]

function calcular(transacoes) {
  const meses = MESES.map(() => ({ EARNING: 0, EXPENSE: 0, INVESTMENT: 0 }))
  const categorias = { EARNING: {}, EXPENSE: {}, INVESTMENT: {} }
  for (const t of transacoes) {
    const valor = Number(t.amount) || 0
    const mes = Number(toDateOnly(t.date).slice(5, 7)) - 1
    meses[mes][t.type] += valor
    const c = t.category || ''
    categorias[t.type][c] = (categorias[t.type][c] ?? 0) + valor
  }
  const total = { EARNING: 0, EXPENSE: 0, INVESTMENT: 0 }
  meses.forEach((m) => TIPOS.forEach(([k]) => { total[k] += m[k] }))
  return { meses, categorias, total }
}

/** Relatório do ano para imprimir ou salvar em PDF (ajuda na declaração do Imposto de Renda). Tudo calculado no navegador. */
export function RelatorioAnualPage() {
  const { user, isInitializing } = useAuth()
  const [params, setParams] = useSearchParams()
  const anoAtual = Number(today().slice(0, 4))
  const ano = Math.min(Math.max(Number(params.get('ano')) || anoAtual, 2000), anoAtual)

  const consulta = useQuery({
    queryKey: ['transactions', 'ano', ano],
    queryFn: async () => (await api.get('/transactions/me', { params: { from: `${ano}-01-01`, to: `${ano}-12-31` } })).data,
    enabled: Boolean(user),
  })
  const r = useMemo(() => (consulta.data ? calcular(consulta.data) : null), [consulta.data])

  if (isInitializing) return null
  if (!user) return <Navigate to="/login" replace />

  return (
    <main id="conteudo" tabIndex={-1} className="min-h-screen bg-white px-4 py-6 text-black print:p-0">
      <div className="mx-auto mb-6 flex max-w-[210mm] flex-wrap items-center gap-2 print:hidden">
        <button type="button" onClick={() => window.print()} disabled={!r}
          className="inline-flex h-11 items-center gap-2 rounded-lg bg-black px-5 font-semibold text-white disabled:opacity-50">
          <Printer className="h-4 w-4" aria-hidden="true" /> Imprimir ou salvar em PDF
        </button>
        <label className="flex h-11 items-center gap-2 rounded-lg border border-black/30 px-3 font-semibold">
          Ano
          <select value={ano} onChange={(e) => setParams({ ano: e.target.value })} className="bg-transparent">
            {Array.from({ length: 6 }, (_, i) => anoAtual - i).map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </label>
        <Link to="/" className="inline-flex h-11 items-center rounded-lg border border-black/30 px-5 font-semibold">Voltar ao painel</Link>
      </div>

      <article className="mx-auto max-w-[210mm] border border-black/20 p-[12mm] print:border-0 print:p-0">
        <header className="flex items-end justify-between gap-4 border-b-2 border-black pb-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest">Valtrea Finance</p>
            <h1 className="text-3xl font-black">Relatório de {ano}</h1>
          </div>
          <p className="text-right text-sm">{user.first_name} {user.last_name}<br />Gerado em {new Date().toLocaleDateString('pt-BR')}</p>
        </header>

        {consulta.isLoading && <p className="mt-8 flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Carregando…</p>}
        {consulta.error && <p className="mt-8 text-red-700">{getErrorMessage(consulta.error, 'Não foi possível carregar o relatório.')}</p>}

        {r && (
          <>
            <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[...TIPOS, ['SALDO', 'Resultado do ano']].map(([k, rotulo]) => {
                const v = k === 'SALDO' ? r.total.EARNING - r.total.EXPENSE - r.total.INVESTMENT : r.total[k]
                return (
                  <div key={k} className="rounded-lg border border-black/20 p-3">
                    <p className="text-xs font-semibold uppercase text-gray-600">{rotulo}</p>
                    <p className="mt-1 text-lg font-bold tabular-nums">{formatCurrency(v)}</p>
                  </div>
                )
              })}
            </section>

            <h2 className="mt-8 text-lg font-bold">Mês a mês</h2>
            <table className="mt-2 w-full text-sm tabular-nums">
              <thead>
                <tr className="border-b border-black text-left">
                  <th className="py-1.5 font-semibold">Mês</th>
                  {TIPOS.map(([k, rotulo]) => <th key={k} className="py-1.5 text-right font-semibold">{rotulo}</th>)}
                  <th className="py-1.5 text-right font-semibold">Resultado</th>
                </tr>
              </thead>
              <tbody>
                {r.meses.map((m, i) => (
                  <tr key={MESES[i]} className="border-b border-black/10">
                    <td className="py-1.5">{MESES[i]}</td>
                    {TIPOS.map(([k]) => <td key={k} className="py-1.5 text-right">{formatCurrency(m[k])}</td>)}
                    <td className="py-1.5 text-right font-semibold">{formatCurrency(m.EARNING - m.EXPENSE - m.INVESTMENT)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-8 grid gap-6 sm:grid-cols-3 print:grid-cols-3">
              {TIPOS.map(([k, rotulo]) => {
                const linhas = Object.entries(r.categorias[k]).sort((a, b) => b[1] - a[1])
                return (
                  <section key={k} className="break-inside-avoid">
                    <h2 className="text-lg font-bold">{rotulo} por categoria</h2>
                    {linhas.length === 0 ? <p className="mt-2 text-sm text-gray-600">Nada registrado.</p> : (
                      <table className="mt-2 w-full text-sm tabular-nums">
                        <tbody>
                          {linhas.map(([c, v]) => (
                            <tr key={c} className="border-b border-black/10">
                              <td className="py-1">{getCategory(k, c).label}</td>
                              <td className="py-1 text-right">{formatCurrency(v)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </section>
                )
              })}
            </div>

            <p className="mt-10 text-xs text-gray-600">
              Feito com o que foi registrado no Valtrea Finance de 1º de janeiro a 31 de dezembro de {ano}
              ({consulta.data.length} {consulta.data.length === 1 ? 'lançamento' : 'lançamentos'}). Serve como apoio para
              organizar a declaração do Imposto de Renda; não substitui os informes oficiais dos bancos e empregadores.
            </p>
          </>
        )}
      </article>
    </main>
  )
}
