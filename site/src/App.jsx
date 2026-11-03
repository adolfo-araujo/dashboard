import {
  ArrowUpRight,
  Globe,
  LayoutDashboard,
  Mail,
  MessageCircle,
  MapPin,
  ServerCog,
  Wrench,
  CheckCircle2,
} from 'lucide-react'
import { COMPANY } from './config'

const mailto = (subject) => `mailto:${COMPANY.email}?subject=${encodeURIComponent(subject)}`
const whatsappUrl = COMPANY.whatsapp
  ? `https://wa.me/${COMPANY.whatsapp}?text=${encodeURIComponent('Olá! Vim pelo site da Valtrea e gostaria de um orçamento.')}`
  : null

function Logo({ className = '' }) {
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden="true">
        <rect width="32" height="32" rx="8" fill="#55B02E" />
        <path d="M9 10.5L15.5 23L23.5 9" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M18.5 9H23.5V14" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="text-lg font-extrabold tracking-tight">Valtrea</span>
    </span>
  )
}

const btn = {
  primary:
    'inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 font-semibold text-background transition-colors hover:bg-primary-hover',
  secondary:
    'inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-border bg-surface-2 px-5 font-semibold text-foreground transition-colors hover:bg-border',
}

const services = [
  {
    icon: Globe,
    title: 'Sites e páginas de venda',
    text: 'Site institucional, página de lançamento ou portfólio. Rápido, bonito no celular e pronto para aparecer no Google.',
  },
  {
    icon: LayoutDashboard,
    title: 'Sistemas web sob medida',
    text: 'Painéis de gestão, área do cliente, controle de estoque ou financeiro. Com login seguro, banco de dados e relatórios.',
  },
  {
    icon: ServerCog,
    title: 'Presença digital completa',
    text: 'Domínio próprio, e-mail profissional com o nome da sua empresa e hospedagem configurados do jeito certo.',
  },
  {
    icon: Wrench,
    title: 'Manutenção mensal',
    text: 'Atualizações, backups, correções e pequenas melhorias, para o seu sistema continuar funcionando depois da entrega.',
  },
]

const steps = [
  { title: 'Conversa', text: 'Entendemos o seu negócio e o problema que o site ou sistema precisa resolver.' },
  { title: 'Proposta', text: 'Você recebe escopo, prazo e preço fechados, por escrito, antes de qualquer pagamento.' },
  { title: 'Desenvolvimento', text: 'Entregas parciais para você acompanhar e ajustar o caminho durante o projeto.' },
  { title: 'Entrega e suporte', text: 'Publicação no seu domínio, treinamento rápido e suporte depois do lançamento.' },
]

const commitments = [
  'Escopo, prazo e preço combinados por escrito antes de começar.',
  'Domínio, contas e código registrados no nome do cliente.',
  'Segurança e proteção de dados seguindo a LGPD desde o início.',
  'Tudo pensado primeiro para o celular.',
]

const financeFeatures = [
  'Saldo, gráficos e evolução mês a mês',
  'Categorias e orçamento mensal com alertas',
  'Lançamentos recorrentes automáticos',
  'Exportação em planilha e app instalável',
]

export default function App() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <a href="#inicio" aria-label="Valtrea, início">
            <Logo />
          </a>
          <nav className="flex items-center gap-1 text-sm font-semibold">
            <a href="#servicos" className="hidden rounded-lg px-3 py-2 text-muted hover:text-foreground md:inline">
              Serviços
            </a>
            <a href="#produtos" className="hidden rounded-lg px-3 py-2 text-muted hover:text-foreground md:inline">
              Produtos
            </a>
            <a href="#como-trabalhamos" className="hidden rounded-lg px-3 py-2 text-muted hover:text-foreground md:inline">
              Como trabalhamos
            </a>
            <a href="#contato" className="ml-2 inline-flex h-9 items-center rounded-lg bg-primary px-4 text-background hover:bg-primary-hover">
              Fale conosco
            </a>
          </nav>
        </div>
      </header>

      <main id="inicio">
        {/* Abertura */}
        <section className="mx-auto max-w-6xl px-4 pb-20 pt-16 sm:px-6 lg:pt-28">
          <h1 className="max-w-3xl text-4xl font-black leading-[1.05] tracking-tight sm:text-6xl">
            Tecnologia sob medida para o seu negócio crescer.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
            A Valtrea cria sites, sistemas web e produtos digitais. Do domínio ao painel de gestão, com código de
            qualidade e suporte depois da entrega.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a href="#contato" className={btn.primary}>
              Solicitar orçamento
            </a>
            <a href="#produtos" className={btn.secondary}>
              Conhecer nossos produtos
            </a>
          </div>
          <p className="mt-5 flex items-center gap-2 text-sm text-muted">
            <MapPin className="h-4 w-4" /> {COMPANY.city}, atendendo todo o Brasil
          </p>
        </section>

        {/* Serviços */}
        <section id="servicos" className="scroll-mt-16 border-t border-border">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <h2 className="max-w-xl text-3xl font-extrabold tracking-tight">O que fazemos para a sua empresa</h2>
            <div className="mt-12 grid gap-x-12 sm:grid-cols-2">
              {services.map(({ icon: Icon, title, text }) => (
                <div key={title} className="flex gap-4 border-t border-border py-7">
                  <Icon className="mt-0.5 h-6 w-6 shrink-0 text-primary" />
                  <div>
                    <h3 className="text-lg font-bold">{title}</h3>
                    <p className="mt-1.5 leading-relaxed text-muted">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Produtos */}
        <section id="produtos" className="scroll-mt-16 border-t border-border bg-surface/40">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <h2 className="text-3xl font-extrabold tracking-tight">Nossos produtos</h2>
            <p className="mt-3 max-w-xl text-muted">
              Além de desenvolver para clientes, criamos produtos próprios. Eles também mostram, na prática, o que
              entregamos.
            </p>

            <div className="mt-10 grid overflow-hidden rounded-2xl border border-border bg-surface lg:grid-cols-[1.1fr_1fr]">
              <div className="p-7 sm:p-10">
                <p className="text-sm font-bold text-primary">Valtrea Finance</p>
                <h3 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
                  Saiba para onde vai o seu dinheiro.
                </h3>
                <p className="mt-3 leading-relaxed text-muted">
                  Controle financeiro pessoal gratuito, no computador e no celular. Registre ganhos, gastos e
                  investimentos e acompanhe tudo em um painel simples.
                </p>
                <ul className="mt-6 space-y-2.5">
                  {financeFeatures.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
                <a href={COMPANY.financeUrl} className={`${btn.primary} mt-8`}>
                  Acessar o Valtrea Finance <ArrowUpRight className="h-4 w-4" />
                </a>
              </div>

              {/* Prévia simplificada do produto */}
              <div className="flex items-center border-t border-border bg-background/60 p-7 sm:p-10 lg:border-l lg:border-t-0" aria-hidden="true">
                <div className="w-full rounded-xl border border-border bg-surface p-5 shadow-2xl shadow-black/40">
                  <p className="text-sm text-muted">Saldo de outubro</p>
                  <p className="mt-2 text-3xl font-extrabold tabular-nums">R$ 4.218,40</p>
                  <div className="mt-5 space-y-3 text-sm">
                    {[
                      ['Moradia', 72, 'R$ 2.200,00'],
                      ['Alimentação', 48, 'R$ 1.146,90'],
                      ['Transporte', 21, 'R$ 412,00'],
                    ].map(([label, pct, value]) => (
                      <div key={label}>
                        <div className="flex justify-between">
                          <span className="text-muted">{label}</span>
                          <span className="font-semibold tabular-nums">{value}</span>
                        </div>
                        <div className="mt-1.5 h-1.5 rounded-full bg-surface-2">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <p className="mt-6 text-sm text-muted">Novos produtos em desenvolvimento.</p>
          </div>
        </section>

        {/* Como trabalhamos */}
        <section id="como-trabalhamos" className="scroll-mt-16 border-t border-border">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <h2 className="text-3xl font-extrabold tracking-tight">Como trabalhamos</h2>
            <ol className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map(({ title, text }, i) => (
                <li key={title}>
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-primary text-lg font-extrabold text-primary">
                    {i + 1}
                  </span>
                  <h3 className="mt-4 font-bold">{title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{text}</p>
                </li>
              ))}
            </ol>

            <ul className="mt-16 grid gap-x-12 border-t border-border sm:grid-cols-2">
              {commitments.map((c) => (
                <li key={c} className="flex items-start gap-3 border-b border-border py-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Contato */}
        <section id="contato" className="scroll-mt-16 border-t border-border bg-surface/40">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <h2 className="max-w-2xl text-3xl font-extrabold tracking-tight sm:text-4xl">
              Tem um projeto em mente? Vamos conversar.
            </h2>
            <p className="mt-4 max-w-xl leading-relaxed text-muted">
              Conte o que você precisa. Respondemos em até um dia útil com os próximos passos, sem compromisso.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href={mailto('Orçamento pelo site')} className={btn.primary}>
                <Mail className="h-4 w-4" /> {COMPANY.email}
              </a>
              {whatsappUrl && (
                <a href={whatsappUrl} target="_blank" rel="noreferrer" className={btn.secondary}>
                  <MessageCircle className="h-4 w-4" /> Conversar no WhatsApp
                </a>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-10 text-sm text-muted sm:px-6 md:flex-row md:justify-between">
          <Logo />
          <nav className="flex flex-wrap justify-center gap-x-5 gap-y-1">
            <a href={COMPANY.financeUrl} className="hover:text-foreground hover:underline">
              Valtrea Finance
            </a>
            <a href={`${COMPANY.financeUrl}/termos`} className="hover:text-foreground hover:underline">
              Termos de uso
            </a>
            <a href={`${COMPANY.financeUrl}/privacidade`} className="hover:text-foreground hover:underline">
              Privacidade
            </a>
            <a href={`mailto:${COMPANY.email}`} className="hover:text-foreground hover:underline">
              {COMPANY.email}
            </a>
          </nav>
          <p className="text-xs">© 2026 Valtrea</p>
        </div>
      </footer>
    </div>
  )
}
