import { Link } from 'react-router-dom'
import {
  CalendarRange,
  Download,
  EyeOff,
  FileDown,
  Lock,
  MousePointerClick,
  PieChart,
  PiggyBank,
  Repeat,
  ShieldCheck,
  Tags,
  Target,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { Logo } from '../components/logo'
import { LegalLinks } from '../components/legal-links'

const features = [
  {
    icon: CalendarRange,
    title: 'Saldo de qualquer período',
    text: 'Escolha o mês, os últimos três meses, o ano ou datas personalizadas e veja quanto entrou, saiu e foi investido.',
  },
  {
    icon: PieChart,
    title: 'Distribuição em um gráfico',
    text: 'Entenda de relance a proporção entre ganhos, gastos e investimentos, com percentuais que sempre fecham em 100%.',
  },
  {
    icon: MousePointerClick,
    title: 'Lançamentos em segundos',
    text: 'Registre uma transação com nome, valor, data, tipo e categoria. Busque, edite ou exclua quando precisar.',
  },
  {
    icon: Tags,
    title: 'Gastos por categoria',
    text: 'Moradia, alimentação, transporte e outras. Veja quanto foi para cada categoria e onde dá para economizar.',
  },
  {
    icon: Repeat,
    title: 'Contas fixas no automático',
    text: 'Cadastre aluguel, salário e assinaturas uma vez. O Valtrea lança todo mês no dia certo, sem duplicar.',
  },
  {
    icon: Target,
    title: 'Orçamento por categoria',
    text: 'Defina um limite para cada tipo de gasto e acompanhe quanto ainda resta no mês antes de estourar.',
  },
  {
    icon: TrendingUp,
    title: 'Evolução mês a mês',
    text: 'Compare ganhos, gastos e investimentos dos últimos meses e veja se o seu saldo está melhorando.',
  },
  {
    icon: FileDown,
    title: 'Seus dados em planilha',
    text: 'Baixe todas as suas transações em CSV para abrir no Excel ou no Google Planilhas quando quiser.',
  },
  {
    icon: Download,
    title: 'No celular, como app',
    text: 'Adicione o Valtrea à tela inicial do celular ou do computador e lance um gasto na hora em que ele acontece.',
  },
]

const steps = [
  { title: 'Crie sua conta', text: 'Cadastre-se com seu e-mail e confirme pelo link que enviamos.' },
  { title: 'Registre suas transações', text: 'Adicione os ganhos, gastos e investimentos do mês.' },
  { title: 'Planeje o mês', text: 'Cadastre as contas fixas, defina limites por categoria e acompanhe o saldo.' },
]

const security = [
  { icon: Lock, text: 'Conexão criptografada em todo o site.' },
  { icon: ShieldCheck, text: 'Senha guardada com criptografia. Nem nós conseguimos lê-la.' },
  { icon: EyeOff, text: 'Sem anúncios. Não vendemos nem compartilhamos seus dados para publicidade.' },
  { icon: Trash2, text: 'Exclua sua conta e todos os seus dados quando quiser.' },
]

const faq = [
  {
    q: 'O Valtrea é gratuito?',
    a: 'Sim. Você cria sua conta e usa todas as funções sem pagar nada e sem cadastrar cartão de crédito.',
  },
  {
    q: 'O Valtrea acessa minha conta bancária?',
    a: 'Não. Você registra suas transações no próprio Valtrea. Ele não se conecta a bancos, não vê seus extratos e não movimenta dinheiro.',
  },
  {
    q: 'Funciona no celular?',
    a: 'Sim, pelo navegador ou instalado como app. No Android, abra o menu do Chrome e toque em "Instalar app". No iPhone, abra no Safari, toque em Compartilhar e depois em "Adicionar à Tela de Início".',
  },
  {
    q: 'Preciso lançar as contas fixas todo mês?',
    a: 'Não. Cadastre como recorrente (aluguel, salário, assinaturas) e o Valtrea cria o lançamento sozinho no dia escolhido. Dá para pausar ou encerrar quando quiser.',
  },
  {
    q: 'Consigo levar meus dados para outro lugar?',
    a: 'Sim. Em Minha conta, baixe todas as suas transações em um arquivo CSV, que abre no Excel e no Google Planilhas.',
  },
  {
    q: 'Posso excluir minha conta?',
    a: 'Sim, a qualquer momento, em Minha conta. Seu cadastro e todas as suas transações são apagados de forma permanente.',
  },
]

// Links com aparência de botão (evita colocar <button> dentro de <a>)
const linkButton = {
  base: 'inline-flex items-center justify-center rounded-full font-semibold transition-colors',
  primary: 'botao-verde bg-primary text-background hover:bg-primary-hover',
  secondary: 'botao-vidro text-foreground',
  sm: 'h-9 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
}
const lb = (variant, size, extra = '') => `${linkButton.base} ${linkButton[variant]} ${linkButton[size]} ${extra}`

const money = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

// Prévia do painel com dados de exemplo. Mesma aparência do produto real.
function ProductPreview() {
  const parts = [
    { label: 'Ganhos', value: 8350, pct: 66.9, color: '#55B02E', icon: TrendingUp, cls: 'bg-earning/10 text-earning' },
    { label: 'Gastos', value: 3481.6, pct: 27.9, color: '#E93030', icon: TrendingDown, cls: 'bg-expense/10 text-expense' },
    { label: 'Investimentos', value: 650, pct: 5.2, color: '#60A5FA', icon: PiggyBank, cls: 'bg-investment/10 text-investment' },
  ]
  let offset = 0

  return (
    <div
      role="img"
      aria-label="Exemplo do painel do Valtrea: saldo do período de R$ 4.218,40, com ganhos, gastos, investimentos e um gráfico de distribuição."
      className="relative vidro rounded-3xl p-5 sm:p-7"
    >
      <div className="flex items-center gap-2.5 text-sm text-muted">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-2 text-foreground">
          <Wallet className="h-4 w-4" />
        </span>
        Saldo de outubro
      </div>
      <p className="mt-3 text-4xl font-bold tracking-tight tabular-nums">{money(4218.4)}</p>

      <div className="mt-6 grid items-center gap-6 sm:grid-cols-[1fr_auto]">
        <ul className="space-y-3">
          {parts.map(({ label, value, pct, icon: Icon, cls }) => (
            <li key={label} className="flex items-center gap-3">
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${cls}`}>
                <Icon className="h-4 w-4" />
              </span>
              <span className="flex-1 text-sm text-muted">{label}</span>
              <span className="text-sm font-bold tabular-nums">{money(value)}</span>
              <span className="w-12 text-right text-xs text-muted tabular-nums">
                {pct.toLocaleString('pt-BR')}%
              </span>
            </li>
          ))}
        </ul>

        <svg viewBox="0 0 120 120" className="mx-auto h-32 w-32 -rotate-90" aria-hidden="true">
          <circle cx="60" cy="60" r="44" fill="none" stroke="rgb(var(--c-surface-2))" strokeWidth="16" />
          {parts.map(({ label, pct, color }) => {
            const el = (
              <circle
                key={label}
                cx="60"
                cy="60"
                r="44"
                fill="none"
                stroke={color}
                strokeWidth="16"
                pathLength="100"
                strokeDasharray={`${Math.max(pct - 1, 0.5)} 100`}
                strokeDashoffset={-offset}
              />
            )
            offset += pct
            return el
          })}
        </svg>
      </div>

      <div className="mt-6 divide-y divide-border border-t border-border text-sm">
        {[
          ['Salário', 'Ganho', 'text-earning', '+ R$ 7.800,00'],
          ['Supermercado', 'Gasto', 'text-expense', '− R$ 612,35'],
          ['Tesouro Selic', 'Investimento', 'text-investment', '− R$ 650,00'],
        ].map(([name, type, cls, value]) => (
          <div key={name} className="flex items-center justify-between py-2.5">
            <div>
              <p className="font-semibold">{name}</p>
              <p className="text-xs text-muted">{type}</p>
            </div>
            <span className={`font-bold tabular-nums ${cls}`}>{value}</span>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-muted">Exemplo com valores fictícios.</p>
    </div>
  )
}

export function LandingPage() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border/50 bg-background/70 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <nav className="flex items-center gap-2">
            <Link to="/login" className="botao-vidro inline-flex h-9 items-center whitespace-nowrap rounded-full px-4 text-sm font-semibold text-foreground">
              Entrar
            </Link>
            <Link to="/signup" className={lb('primary', 'sm', 'hidden whitespace-nowrap min-[460px]:inline-flex')}>
              Criar conta grátis
            </Link>
          </nav>
        </div>
      </header>

      <main id="conteudo" tabIndex={-1}>
        {/* Abertura */}
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-12 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pt-24">
          <div>
            <p className="botao-vidro inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold text-muted sm:text-sm">
              <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" /> Gratuito · no computador e no celular
            </p>
            <h1 className="mt-6 max-w-xl text-[2.5rem] font-extrabold leading-[1.03] sm:text-6xl lg:text-7xl">
              Saiba para onde
              <span className="block text-primary">vai o seu dinheiro.</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-muted">
              Registre ganhos, gastos e investimentos, automatize as contas fixas e defina limites por categoria.
              Tudo em um painel simples, gratuito, no computador e no celular.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/signup" className={lb('primary', 'lg', 'w-full sm:w-auto')}>
                Criar conta grátis
              </Link>
              <Link to="/login" className={lb('secondary', 'lg', 'w-full sm:w-auto')}>
                Já tenho conta
              </Link>
            </div>
            <p className="mt-4 text-sm text-muted">Sem cartão de crédito. Exclua sua conta quando quiser.</p>
          </div>
          <ProductPreview />
        </section>

        {/* Funcionalidades */}
        <section>
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
            <h2 className="max-w-2xl text-3xl font-extrabold sm:text-5xl">
              Tudo para organizar suas finanças, sem complicação
            </h2>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map(({ icon: Icon, title, text }) => (
                <div key={title} className="vidro rounded-3xl p-6">
                  <span className="botao-vidro flex h-12 w-12 items-center justify-center rounded-2xl">
                    <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 text-lg font-extrabold">{title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Passos */}
        <section className="border-y border-border/70 bg-surface-2/60">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
            <h2 className="text-3xl font-extrabold sm:text-5xl">Comece em três passos</h2>
            <ol className="mt-12 grid gap-4 md:grid-cols-3">
              {steps.map(({ title, text }, i) => (
                <li key={title} className="vidro flex gap-4 rounded-3xl p-6">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary font-display text-lg font-extrabold text-background">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="font-bold">{title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted">{text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Segurança */}
        <section>
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_1.2fr] lg:py-28">
            <div>
              <h2 className="text-3xl font-extrabold sm:text-5xl">Seus dados ficam com você</h2>
              <p className="mt-4 max-w-md leading-relaxed text-muted">
                Suas finanças são assunto seu. O Valtrea guarda só o necessário para funcionar e segue a Lei Geral
                de Proteção de Dados.
              </p>
              <Link to="/privacidade" className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">
                Ler a Política de privacidade
              </Link>
            </div>
            <ul className="vidro divide-y divide-border/70 rounded-3xl px-6">
              {security.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-4 py-4">
                  <Icon className="h-5 w-5 shrink-0 text-primary" />
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Perguntas frequentes */}
        <section className="border-t border-border/70 bg-surface-2/60">
          <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:py-28">
            <h2 className="text-3xl font-extrabold sm:text-5xl">Perguntas frequentes</h2>
            <div className="mt-8 space-y-3">
              {faq.map(({ q, a }) => (
                <details key={q} className="vidro group rounded-2xl px-5 py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                    {q}
                    <span className="text-xl text-muted transition-transform group-open:rotate-45" aria-hidden="true">
                      +
                    </span>
                  </summary>
                  <p className="mt-3 leading-relaxed text-muted">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Chamada final */}
        <section className="px-4 py-20 sm:px-6 lg:py-28">
          <div className="relative mx-auto flex max-w-6xl flex-col items-start gap-6 overflow-hidden rounded-[2rem] bg-[linear-gradient(160deg,#0F3D2E_0%,#1E5A26_55%,#2E6619_100%)] px-6 py-14 text-white shadow-[0_30px_60px_-30px_rgba(15,61,46,0.7)] sm:px-12 md:flex-row md:items-center md:justify-between">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_80%_at_50%_0%,rgba(255,255,255,0.16),transparent_70%)]" aria-hidden="true" />
            <div className="relative">
              <h2 className="text-3xl font-extrabold sm:text-5xl">Organize seu mês ainda hoje.</h2>
              <p className="mt-3 text-lg text-white/85">Leva menos de um minuto para criar sua conta.</p>
            </div>
            <Link to="/signup" className="relative inline-flex h-12 items-center justify-center rounded-full bg-white px-7 font-semibold text-[#0F3D2E] shadow-[0_10px_24px_-12px_rgba(0,0,0,0.5)] transition-transform hover:-translate-y-0.5">
              Criar conta grátis
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/70 bg-surface/60">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-10 sm:px-6 md:flex-row md:justify-between">
          <Logo />
          <LegalLinks />
          <p className="text-xs text-muted">
            Um produto da{' '}
            <a href="https://www.valtrea.com.br" className="font-semibold hover:text-foreground hover:underline">
              Valtrea
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}
