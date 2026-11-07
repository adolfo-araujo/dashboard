import { useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { FileUp } from 'lucide-react'
import { Dialog } from './ui/dialog'
import { Button } from './ui/button'
import { Select } from './ui/input'
import { api, getErrorMessage } from '../lib/api'
import { CATEGORIES } from '../lib/categories'
import { TRANSACTION_TYPES, formatCurrency, formatDate, toApiDate } from '../lib/format'
import { lerExtrato } from '../lib/extrato'
import { sugerirCategoria } from '../lib/sugestoes'
import { useTransactionHistory } from '../hooks/use-finance'

// Até 150 por vez: a API aceita 300 pedidos a cada 5 minutos por pessoa.
const MAXIMO = 150

const normal = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
const chave = (data, valor, nome) => `${data}|${Number(valor).toFixed(2)}|${normal(nome).slice(0, 50)}`

/** Importar extrato do banco (OFX ou CSV): lido no navegador, revisado pela pessoa e só então salvo. */
export function ImportDialog({ open, onClose }) {
  const queryClient = useQueryClient()
  const history = useTransactionHistory(open)
  const [arquivo, setArquivo] = useState(null)
  const [linhas, setLinhas] = useState([])
  const [positivoEhGasto, setPositivoEhGasto] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [progresso, setProgresso] = useState(0)

  const existentes = useMemo(
    () => new Set((history.data ?? []).map((t) => chave(String(t.date).slice(0, 10), t.amount, t.name))),
    [history.data],
  )

  const montar = (brutas, inverter) =>
    brutas.slice(0, MAXIMO).map((l, i) => {
      const valor = inverter ? -l.valor : l.valor
      const type = valor < 0 ? 'EXPENSE' : 'EARNING'
      const nome = l.nome.slice(0, 50)
      const amount = Math.abs(valor)
      const duplicado = existentes.has(chave(l.data, amount, nome))
      const pequeno = amount < 1
      const sugestao = sugerirCategoria(nome, type, history.data ?? [])
      return {
        id: i, data: l.data, name: nome, amount, type, bruto: l,
        category: sugestao?.chave ?? 'outros', marcado: !duplicado && !pequeno, duplicado, pequeno,
      }
    })

  const escolher = async (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > 2 * 1024 * 1024) return toast.error('Arquivo grande demais (máximo 2 MB).')
    let texto = await f.text()
    // Muitos bancos ainda gravam em Latin-1: se aparecerem caracteres quebrados, relê nessa codificação
    if (texto.includes('�')) texto = new TextDecoder('windows-1252').decode(await f.arrayBuffer())
    const { formato, linhas: brutas } = lerExtrato(f.name, texto)
    if (brutas.length === 0) {
      setArquivo(null)
      setLinhas([])
      return toast.error('Não encontramos lançamentos nesse arquivo. Use o extrato em OFX ou CSV (com colunas de data e valor).')
    }
    setArquivo({ nome: f.name, formato, total: brutas.length, brutas })
    setPositivoEhGasto(false)
    setLinhas(montar(brutas, false))
  }

  const inverter = (v) => {
    setPositivoEhGasto(v)
    if (arquivo) setLinhas(montar(arquivo.brutas, v))
  }

  const mudar = (id, campos) => setLinhas((ls) => ls.map((l) => (l.id === id ? { ...l, ...campos } : l)))
  const marcadas = linhas.filter((l) => l.marcado)

  const fechar = () => {
    if (salvando) return
    setArquivo(null)
    setLinhas([])
    onClose()
  }

  const importar = async () => {
    setSalvando(true)
    setProgresso(0)
    let feitos = 0
    try {
      for (const l of marcadas) {
        await api.post('/transactions/me', {
          name: l.name, amount: Math.round(l.amount * 100) / 100, date: toApiDate(l.data), type: l.type, category: l.category,
        })
        feitos += 1
        setProgresso(feitos)
      }
      toast.success(`${feitos} lançamentos importados.`)
      setArquivo(null)
      setLinhas([])
      onClose()
    } catch (error) {
      toast.error(`${feitos} importados; o resto não: ${getErrorMessage(error)}`)
      setLinhas((ls) => ls.map((l) => (marcadas.slice(0, feitos).some((m) => m.id === l.id) ? { ...l, marcado: false, duplicado: true } : l)))
    } finally {
      setSalvando(false)
      for (const k of ['balance', 'transactions', 'monthly', 'budgets']) queryClient.invalidateQueries({ queryKey: [k] })
    }
  }

  return (
    <Dialog open={open} onClose={fechar} wide title="Importar extrato"
      description="Arquivo OFX ou CSV baixado do app ou site do seu banco. Ele é lido aqui no navegador e você revisa tudo antes de salvar.">
      <div className="mt-4 space-y-4">
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-background px-4 py-6 text-sm font-semibold hover:border-primary">
          <FileUp className="h-5 w-5 text-primary" aria-hidden="true" />
          {arquivo ? `${arquivo.nome} (${arquivo.formato})` : 'Escolher arquivo do extrato'}
          <input type="file" accept=".ofx,.csv,.txt,text/csv,application/x-ofx" className="sr-only" onChange={escolher} disabled={salvando} />
        </label>

        {arquivo && (
          <>
            {arquivo.total > MAXIMO && (
              <p className="text-sm text-muted">O arquivo tem {arquivo.total} lançamentos; mostramos os {MAXIMO} primeiros. Importe o resto depois.</p>
            )}
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[#55B02E]" checked={positivoEhGasto}
                onChange={(e) => inverter(e.target.checked)} disabled={salvando} />
              <span>É fatura de cartão de crédito (os valores positivos são gastos)</span>
            </label>
            <ul className="max-h-[45vh] divide-y divide-border overflow-y-auto rounded-xl border border-border">
              {linhas.map((l) => (
                <li key={l.id} className={`grid gap-2 p-3 sm:grid-cols-[auto_1fr_auto] sm:items-center ${l.marcado ? '' : 'opacity-60'}`}>
                  <input type="checkbox" className="h-4 w-4 accent-[#55B02E]" checked={l.marcado} disabled={salvando}
                    aria-label={`Importar ${l.name} de ${formatDate(l.data)}`} onChange={(e) => mudar(l.id, { marcado: e.target.checked })} />
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{l.name}</p>
                    <p className="text-xs text-muted">
                      {formatDate(l.data)} · <span className={TRANSACTION_TYPES[l.type].text}>{formatCurrency(l.amount)}</span>
                      {l.duplicado && ' · já existe'}{l.pequeno && ' · abaixo de R$ 1,00'}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Select aria-label={`Tipo de ${l.name}`} value={l.type} disabled={salvando}
                      onChange={(e) => {
                        const type = e.target.value
                        const sug = sugerirCategoria(l.name, type, history.data ?? [])
                        mudar(l.id, { type, category: sug?.chave ?? 'outros' })
                      }}>
                      {Object.entries(TRANSACTION_TYPES).map(([k, cfg]) => <option key={k} value={k}>{cfg.label}</option>)}
                    </Select>
                    <Select aria-label={`Categoria de ${l.name}`} value={l.category} disabled={salvando}
                      onChange={(e) => mudar(l.id, { category: e.target.value })}>
                      {(CATEGORIES[l.type] ?? []).map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                    </Select>
                  </div>
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted">
              Os que já existem (mesma data, valor e nome) e os abaixo de R$ 1,00 vêm desmarcados. A categoria é sugerida pelo nome e
              pelo que você já registrou; confira antes de importar.
            </p>
          </>
        )}

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" className="flex-1" onClick={fechar} disabled={salvando}>Cancelar</Button>
          <Button type="button" className="flex-1" onClick={importar} isLoading={salvando}
            disabled={marcadas.length === 0 || marcadas.some((l) => l.amount < 1)}>
            {salvando ? `Importando ${progresso} de ${marcadas.length}…` : `Importar ${marcadas.length} lançamentos`}
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
