import { Link, Navigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Loader2, RefreshCw } from 'lucide-react'
import { Logo } from '../components/logo'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { useAuth } from '../contexts/auth'
import { api, getErrorMessage } from '../lib/api'
import { cn } from '../lib/cn'

const number = new Intl.NumberFormat('pt-BR')
const dateTime = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
const shortDate = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' })

const percent = (part, total) => (total > 0 ? `${Math.round((part / total) * 100)}%` : '—')

function Stat({ label, value, detail, highlight }) {
  return (
    <Card className={cn('p-5', highlight && 'border-primary/50')}>
      <p className="text-sm text-muted">{label}</p>
      <p className={cn('mt-2 text-3xl font-extrabold tabular-nums', highlight && 'text-primary')}>{value}</p>
      {detail && <p className="mt-1 text-xs leading-relaxed text-muted">{detail}</p>}
    </Card>
  )
}

function Section({ title, description, children }) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="font-bold">{title}</h2>
        {description && <p className="text-sm text-muted">{description}</p>}
      </div>
      {children}
    </section>
  )
}

export function AdminPage() {
  const { user, isInitializing } = useAuth()

  const { data, error, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['admin-metrics'],
    queryFn: async () => (await api.get('/admin/metrics')).data,
    enabled: Boolean(user),
    retry: false,
  })

  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />

  const forbidden = error?.response?.status === 403
  const maxWeek = Math.max(1, ...(data?.signupsByWeek ?? []).map((w) => w.count))

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Logo />
            <span className="rounded-md bg-surface-2 px-2 py-0.5 text-xs font-semibold text-muted">Admin</span>
          </div>
          <Link to="/" className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Painel
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-10 px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Uso do Valtrea Finance</h1>
            <p className="text-sm text-muted">
              Números agregados. Nenhum dado pessoal ou financeiro individual aparece aqui.
            </p>
          </div>
          {data && (
            <div className="flex items-center gap-3 text-xs text-muted">
              Atualizado em {dateTime.format(new Date(data.generatedAt))}
              <Button variant="secondary" size="sm" onClick={() => refetch()} isLoading={isFetching}>
                {!isFetching && <RefreshCw className="h-4 w-4" />} Atualizar
              </Button>
            </div>
          )}
        </div>

        {forbidden ? (
          <Card className="p-6 text-sm">
            <p className="font-semibold">Acesso restrito</p>
            <p className="mt-1 text-muted">Esta área é só para a administração do Valtrea.</p>
          </Card>
        ) : error ? (
          <Card className="p-6 text-sm text-expense">{getErrorMessage(error, 'Não foi possível carregar os números.')}</Card>
        ) : isLoading || !data ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-xl bg-surface-2" />
            ))}
          </div>
        ) : (
          <>
            <Section
              title="Retenção"
              description="O número mais importante da validação: quem criou a conta há mais de um mês e continua usando."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Stat
                  highlight
                  label="Contas com 30+ dias ativas na última semana"
                  value={percent(data.retention.matureActive, data.retention.matureUsers)}
                  detail={`${number.format(data.retention.matureActive)} de ${number.format(data.retention.matureUsers)} contas com mais de 30 dias.`}
                />
                <Stat
                  label="Lançaram transações nos últimos 7 dias"
                  value={number.format(data.activity.launchers7)}
                  detail={`${number.format(data.activity.transactions7)} lançamentos feitos à mão. Os gerados por recorrentes não contam.`}
                />
              </div>
            </Section>

            <Section title="Contas">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Stat label="Total de contas" value={number.format(data.users.total)} />
                <Stat
                  label="E-mail confirmado"
                  value={percent(data.users.verified, data.users.total)}
                  detail={`${number.format(data.users.verified)} contas.`}
                />
                <Stat label="Novas nos últimos 7 dias" value={number.format(data.users.new7)} />
                <Stat label="Novas nos últimos 30 dias" value={number.format(data.users.new30)} />
              </div>
            </Section>

            <Section title="Atividade" description="Quem abriu o Valtrea Finance no período.">
              <div className="grid gap-4 sm:grid-cols-2">
                <Stat
                  label="Ativos nos últimos 7 dias"
                  value={number.format(data.activity.active7)}
                  detail={`${percent(data.activity.active7, data.users.total)} das contas.`}
                />
                <Stat
                  label="Ativos nos últimos 30 dias"
                  value={number.format(data.activity.active30)}
                  detail={`${percent(data.activity.active30, data.users.total)} das contas.`}
                />
              </div>
            </Section>

            <Section title="Funcionalidades" description="Quantas contas já usaram cada recurso pelo menos uma vez.">
              <div className="grid gap-4 sm:grid-cols-3">
                <Stat
                  label="Lançaram alguma transação"
                  value={percent(data.features.transactions, data.users.total)}
                  detail={`${number.format(data.features.transactions)} contas.`}
                />
                <Stat
                  label="Criaram recorrentes"
                  value={percent(data.features.recurring, data.users.total)}
                  detail={`${number.format(data.features.recurring)} contas.`}
                />
                <Stat
                  label="Definiram orçamento"
                  value={percent(data.features.budgets, data.users.total)}
                  detail={`${number.format(data.features.budgets)} contas.`}
                />
              </div>
            </Section>

            <Section title="Cadastros por semana" description="Últimas 8 semanas, começando na segunda-feira.">
              <Card className="p-5">
                <ul className="space-y-2.5">
                  {data.signupsByWeek.map(({ week, count }) => (
                    <li key={week} className="flex items-center gap-3 text-sm">
                      <span className="w-14 shrink-0 text-muted tabular-nums">
                        {shortDate.format(new Date(`${week}T00:00:00Z`))}
                      </span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${(count / maxWeek) * 100}%` }} />
                      </div>
                      <span className="w-8 text-right font-semibold tabular-nums">{count}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </Section>

            <p className="text-xs leading-relaxed text-muted">
              Contas criadas antes de 15/10/2026 têm data de cadastro estimada (aceite dos termos ou primeira
              transação), e o último acesso só passou a ser registrado a partir dessa data.
            </p>
          </>
        )}
      </main>
    </div>
  )
}
