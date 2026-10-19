import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Copy, Link2, Wallet } from 'lucide-react'
import { Card } from './ui/card'
import { Button } from './ui/button'
import { Dialog } from './ui/dialog'
import { usePayIntegration, useCreatePayToken, useDisconnectPay } from '../hooks/use-pay-integration'
import { formatCurrency } from '../lib/format'
import { getErrorMessage } from '../lib/api'

const dateTime = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

function ConnectDialog({ open, onClose }) {
  const createToken = useCreatePayToken()
  const queryClient = useQueryClient()
  const [token, setToken] = useState('')

  useEffect(() => {
    if (!open) return
    setToken('')
    createToken
      .mutateAsync()
      .then((data) => setToken(data.token))
      .catch((error) => toast.error(getErrorMessage(error, 'Não foi possível gerar o código.')))
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(token)
      toast.success('Código copiado.')
    } catch {
      toast.error('Não foi possível copiar. Selecione o código e copie manualmente.')
    }
  }

  const close = () => {
    // O Pay manda o primeiro saldo assim que o código é colado: atualiza o cartão ao fechar.
    queryClient.invalidateQueries({ queryKey: ['pay-integration'] })
    queryClient.invalidateQueries({ queryKey: ['transactions'] })
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={close}
      title="Conectar Valtrea Pay"
      description="Seus pagamentos da carteira entram aqui sozinhos: enviados como gastos e recebidos como ganhos."
    >
      <ol className="list-decimal space-y-1 pl-5 text-sm">
        <li>Copie o código abaixo.</li>
        <li>No app Valtrea Pay, abra <b>Perfil → Valtrea Finance</b>.</li>
        <li>Cole o código e toque em <b>Conectar</b>.</li>
      </ol>
      <div className="mt-4 rounded-lg border border-border bg-surface-2 p-3">
        {token ? (
          <code className="block break-all text-sm">{token}</code>
        ) : (
          <div className="h-5 animate-pulse rounded bg-surface" />
        )}
      </div>
      <p className="mt-2 text-xs text-muted">
        O código aparece só agora. Se perder, gere outro: o anterior para de funcionar. Ele só permite que o Pay
        lance pagamentos e envie o saldo, nunca ler seus dados.
      </p>
      <div className="mt-5 flex gap-3">
        <Button variant="secondary" className="flex-1" onClick={close}>
          Fechar
        </Button>
        <Button className="flex-1" onClick={copy} disabled={!token}>
          <Copy className="h-4 w-4" /> Copiar código
        </Button>
      </div>
    </Dialog>
  )
}

export function PayWalletCard() {
  const { data, isLoading } = usePayIntegration()
  const disconnect = useDisconnectPay()
  const [open, setOpen] = useState(false)

  const onDisconnect = async () => {
    try {
      await disconnect.mutateAsync()
      toast.success('Valtrea Pay desconectado. As transações já lançadas continuam aqui.')
    } catch (error) {
      toast.error(getErrorMessage(error, 'Não foi possível desconectar.'))
    }
  }

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-earning/10 text-earning">
            <Wallet className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-bold">Carteira Valtrea Pay</h2>
            {isLoading ? (
              <div className="mt-1 h-4 w-40 animate-pulse rounded bg-surface-2" />
            ) : data?.connected ? (
              <p className="text-sm text-muted">
                {data.balance != null ? (
                  <>
                    Saldo <b className="text-foreground tabular-nums">{formatCurrency(data.balance)}</b>
                    {data.balance_at && ` · atualizado ${dateTime.format(new Date(data.balance_at))}`}
                  </>
                ) : (
                  'Conectado. Falta colar o código no app Pay.'
                )}
              </p>
            ) : (
              <p className="text-sm text-muted">Lance seus pagamentos da carteira automaticamente.</p>
            )}
          </div>
        </div>
        {!isLoading &&
          (data?.connected ? (
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
                Gerar novo código
              </Button>
              <Button variant="secondary" size="sm" onClick={onDisconnect} isLoading={disconnect.isPending}>
                Desconectar
              </Button>
            </div>
          ) : (
            <Button size="sm" onClick={() => setOpen(true)}>
              <Link2 className="h-4 w-4" /> Conectar
            </Button>
          ))}
      </div>
      <ConnectDialog open={open} onClose={() => setOpen(false)} />
    </Card>
  )
}
