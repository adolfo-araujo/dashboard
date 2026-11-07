import { useState } from 'react'
import { CheckCircle2, Circle, X } from 'lucide-react'
import { Card } from './ui/card'
import { Button } from './ui/button'
import { useTransactionHistory } from '../hooks/use-finance'
import { useRecurringList } from '../hooks/use-recurring'
import { useBudgetStatus } from '../hooks/use-budgets'
import { today } from '../lib/format'

/**
 * Primeiros passos: aparece enquanto falta algo do básico e some sozinho quando tudo estiver feito.
 * O progresso vem dos próprios dados da pessoa (nada é guardado no navegador).
 */
export function PrimeirosPassos({ onAdd, onRecurring, onImport }) {
  const [oculto, setOculto] = useState(false)
  const historico = useTransactionHistory(true)
  const recorrentes = useRecurringList()
  const orcamentos = useBudgetStatus(today().slice(0, 7))

  if (oculto || historico.isLoading || recorrentes.isLoading || orcamentos.isLoading) return null
  const passos = [
    { feito: (historico.data ?? []).length > 0, titulo: 'Registre seu primeiro lançamento', texto: 'Ou importe o extrato do banco de uma vez.', acoes: [['Adicionar lançamento', onAdd], ['Importar extrato', onImport]] },
    { feito: (recorrentes.data ?? []).length > 0, titulo: 'Cadastre uma conta que se repete', texto: 'Aluguel, salário, assinaturas: o lançamento é criado sozinho todo mês.', acoes: [['Criar recorrente', onRecurring]] },
    { feito: (orcamentos.data ?? []).length > 0, titulo: 'Defina um limite de gastos', texto: 'No cartão de orçamento do mês, escolha o limite de cada categoria.', acoes: [] },
  ]
  const feitos = passos.filter((p) => p.feito).length
  if (feitos === passos.length) return null

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-bold">Primeiros passos</h2>
          <p className="text-sm text-muted">{feitos} de {passos.length} feitos. Leva poucos minutos e deixa o painel completo.</p>
        </div>
        <button type="button" onClick={() => setOculto(true)} className="rounded-md p-1 text-muted hover:text-foreground" aria-label="Ocultar primeiros passos">
          <X className="h-5 w-5" />
        </button>
      </div>
      <ol className="mt-4 space-y-3">
        {passos.map((p) => (
          <li key={p.titulo} className="flex items-start gap-3">
            {p.feito
              ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-label="Feito" />
              : <Circle className="mt-0.5 h-5 w-5 shrink-0 text-muted" aria-label="A fazer" />}
            <div className="flex-1">
              <p className={p.feito ? 'font-semibold text-muted line-through' : 'font-semibold'}>{p.titulo}</p>
              {!p.feito && <p className="text-sm text-muted">{p.texto}</p>}
              {!p.feito && p.acoes.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {p.acoes.map(([rotulo, acao]) => (
                    <Button key={rotulo} size="sm" variant="secondary" onClick={acao}>{rotulo}</Button>
                  ))}
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>
    </Card>
  )
}
