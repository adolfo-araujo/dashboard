import { useEffect, useId, useState } from 'react'
import { Bell, CheckCircle2, Heart, MapPin, ArrowUpRight, QrCode, Users, Clock, Wallet, X } from 'lucide-react'
import { COMPANY } from './config'

// Produtos em desenvolvimento e a lista de espera ("Quero ser avisado").
// O site chama /api/lista-de-espera no próprio endereço; a Vercel encaminha para a API do
// Valtrea Finance (vercel.json). Só o e-mail e o produto são guardados, com confirmação por e-mail.
const API = '/api/lista-de-espera'
const PRIVACY_URL = `${COMPANY.financeUrl}/privacidade#lista-de-espera`

const STAGE = {
  desenvolvimento: { label: 'Em desenvolvimento', className: 'border-primary/50 text-primary' },
  planejamento: { label: 'Em planejamento', className: 'border-border text-muted' },
  testes: { label: 'Aberto para testes', className: 'border-primary bg-primary/10 text-primary' },
}

async function post(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message || 'Não foi possível concluir agora. Tente de novo em instantes.')
  return data
}

// ---------- prévias (ilustrações com dados fictícios) ----------

function Frame({ children, note = 'Ilustração do conceito, com dados fictícios.' }) {
  return (
    <figure className="flex h-full flex-col justify-between rounded-xl border border-border bg-background/60 p-4">
      <div aria-hidden="true">{children}</div>
      <figcaption className="mt-3 text-xs text-muted">{note}</figcaption>
    </figure>
  )
}

function PayPreview() {
  return (
    <Frame note="Exemplo com saldo fictício: o Pay está em testes e não movimenta dinheiro real.">
      <div className="rounded-lg bg-gradient-to-br from-[#15803D] to-[#166534] p-4 text-white">
        <p className="text-xs opacity-90">Saldo de teste</p>
        <p className="mt-1 text-2xl font-extrabold tabular-nums">R$ 250,00</p>
      </div>
      <ul className="mt-3 space-y-2 text-sm">
        {[
          ['Para Ana', '- R$ 18,50'],
          ['De Bruno', '+ R$ 40,00'],
        ].map(([who, value]) => (
          <li key={who} className="flex justify-between rounded-lg bg-surface-2 px-3 py-2">
            <span>{who}</span>
            <span className="font-semibold tabular-nums">{value}</span>
          </li>
        ))}
      </ul>
    </Frame>
  )
}

function VoltaPreview() {
  return (
    <Frame>
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-surface-2">
          <QrCode className="h-7 w-7 text-primary" />
        </span>
        <div>
          <p className="text-sm font-bold">Este objeto tem dono</p>
          <p className="text-xs text-muted">Mochila preta · identificação protegida</p>
        </div>
      </div>
      <p className="mt-3 rounded-lg bg-surface-2 px-3 py-2 text-sm text-muted">
        “Encontrei sua mochila. Como combinamos a devolução?”
      </p>
      <span className="mt-3 inline-flex h-9 w-full items-center justify-center rounded-lg bg-primary text-sm font-semibold text-background">
        Avisar o dono
      </span>
    </Frame>
  )
}

function PulsoPreview() {
  return (
    <Frame>
      <p className="text-xs font-semibold text-primary">Iniciativa do bairro</p>
      <p className="mt-1 text-sm font-bold">Revitalizar a praça</p>
      <p className="mt-1 text-xs text-muted">Iluminação, bancos novos e lixeiras.</p>
      <div className="mt-3 h-1.5 rounded-full bg-surface-2">
        <div className="h-full w-[74%] rounded-full bg-primary" />
      </div>
      <div className="mt-2 flex justify-between text-xs">
        <span className="flex items-center gap-1">
          <Users className="h-3.5 w-3.5" /> 184 apoios
        </span>
        <span className="text-muted">meta: 250</span>
      </div>
      <span className="mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-border text-sm font-semibold">
        <Heart className="h-4 w-4" /> Apoiar
      </span>
    </Frame>
  )
}

function AgoraPreview() {
  return (
    <Frame>
      <p className="text-xs font-semibold text-primary">Disponível hoje</p>
      <p className="mt-1 text-sm font-bold">Corte de cabelo</p>
      <p className="mt-1 flex items-center gap-1 text-xs text-muted">
        <MapPin className="h-3.5 w-3.5" /> a 900 m de você
      </p>
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        {['14h00', '16h30', '18h00'].map((h) => (
          <span key={h} className="flex items-center gap-1 rounded-md bg-surface-2 px-2 py-1">
            <Clock className="h-3 w-3" /> {h}
          </span>
        ))}
      </div>
      <span className="mt-3 inline-flex h-9 w-full items-center justify-center rounded-lg bg-primary text-sm font-semibold text-background">
        Reservar horário
      </span>
    </Frame>
  )
}

const PROJECTS = [
  {
    id: 'pay',
    name: 'Valtrea Pay',
    icon: Wallet,
    stage: 'desenvolvimento',
    tagline: 'Pague e receba em segundos.',
    text: 'Carteira digital em testes, no Android: pagamentos entre pessoas por busca, QR Code ou link, integrada ao Valtrea Finance. O saldo é fictício.',
    Preview: PayPreview,
  },
  {
    id: 'volta',
    name: 'Valtrea Volta',
    icon: QrCode,
    stage: 'testes',
    tagline: 'Se perdeu, pode voltar.',
    text: 'Uma etiqueta com QR Code para os seus objetos: quem encontrar avisa você sem ver o seu telefone nem o seu endereço. Já dá para usar no site, de graça; o app Android vem depois.',
    url: 'https://volta.valtrea.com.br',
    Preview: VoltaPreview,
  },
  {
    id: 'pulso',
    name: 'Valtrea Pulso',
    icon: Users,
    stage: 'testes',
    tagline: 'A voz organizada do seu bairro.',
    text: 'Moradores registram o que o bairro precisa, reúnem apoio e acompanham o que acontece com cada iniciativa. Já dá para usar no site, de graça; o app Android vem depois.',
    url: 'https://pulso.valtrea.com.br',
    Preview: PulsoPreview,
  },
  {
    id: 'agora',
    name: 'Valtrea Agora',
    icon: Clock,
    stage: 'testes',
    tagline: 'Oportunidades que acontecem perto de você.',
    text: 'Horários vagos de salões, barbearias e outros serviços da sua região, para reservar ainda hoje. Já dá para usar no site, de graça; o app Android vem depois.',
    url: 'https://agora.valtrea.com.br',
    Preview: AgoraPreview,
  },
]

// ---------- formulário "Quero ser avisado" ----------

function WaitlistForm({ product, name }) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [consent, setConsent] = useState(false)
  const [website, setWebsite] = useState('') // campo invisível contra robôs
  const [status, setStatus] = useState({ kind: 'idle', message: '' })

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-border bg-surface-2 px-5 font-semibold transition-colors hover:bg-border"
      >
        <Bell className="h-4 w-4" /> Quero ser avisado
      </button>
    )
  }

  const submit = async (event) => {
    event.preventDefault()
    setStatus({ kind: 'sending', message: '' })
    try {
      const data = await post('', { email, produto: product, aceite: consent, website })
      setStatus({ kind: 'ok', message: data.message })
    } catch (error) {
      setStatus({ kind: 'error', message: error.message })
    }
  }

  if (status.kind === 'ok') {
    return (
      <p role="status" className="flex items-start gap-2 rounded-lg border border-primary/40 bg-primary/10 p-3 text-sm">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        {status.message}
      </p>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-3" aria-label={`Aviso de lançamento do ${name}`}>
      <div>
        <label htmlFor={`${id}-email`} className="text-sm font-semibold">
          Seu e-mail
        </label>
        <input
          id={`${id}-email`}
          type="email"
          required
          maxLength={100}
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 h-11 w-full rounded-lg border border-border bg-background px-3 text-foreground placeholder:text-muted"
          placeholder="voce@exemplo.com"
        />
      </div>
      {/* Invisível para pessoas: robôs que preenchem tudo caem aqui */}
      <div className="absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden="true">
        <label htmlFor={`${id}-website`}>Site</label>
        <input id={`${id}-website`} tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
      </div>
      <div className="flex items-start gap-2.5 text-sm">
        <input
          id={`${id}-aceite`}
          type="checkbox"
          required
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-1 h-4 w-4 shrink-0 accent-[#55B02E]"
        />
        <label htmlFor={`${id}-aceite`} className="leading-relaxed text-muted">
          Quero receber um e-mail quando o {name} estiver disponível. Vocês usam meu e-mail só para isso, e posso
          sair da lista quando quiser (
          <a href={PRIVACY_URL} className="font-semibold text-primary underline-offset-2 hover:underline">
            Política de privacidade
          </a>
          ).
        </label>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="submit"
          disabled={status.kind === 'sending'}
          className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-5 font-semibold text-background transition-colors hover:bg-primary-hover disabled:opacity-60"
        >
          {status.kind === 'sending' ? 'Enviando…' : 'Avisar quando lançar'}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="inline-flex h-11 items-center justify-center rounded-lg px-4 text-sm font-semibold text-muted hover:text-foreground"
        >
          Cancelar
        </button>
      </div>
      <p role="status" aria-live="polite" className="text-sm text-[#F87171]">
        {status.kind === 'error' ? status.message : ''}
      </p>
    </form>
  )
}

export function ProjetosEmDesenvolvimento() {
  return (
    <div id="em-desenvolvimento" className="mt-16 scroll-mt-20">
      <h3 className="text-2xl font-extrabold tracking-tight">Projetos em desenvolvimento</h3>
      <p className="mt-2 max-w-2xl text-muted">
        O que estamos construindo agora. Os que já estão abertos para testes têm o link; nos outros, deixe seu
        e-mail para saber quando abrir.
      </p>
      <ul className="mt-8 grid gap-6 lg:grid-cols-2">
        {PROJECTS.map(({ id, name, icon: Icon, stage, tagline, text, url, Preview }) => (
          <li key={id} className="grid gap-5 rounded-2xl border border-border bg-surface p-6 sm:grid-cols-[1.2fr_1fr]">
            <div className="flex flex-col">
              <div className="flex flex-wrap items-center gap-2">
                <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                <h4 className="font-bold text-primary">{name}</h4>
                <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STAGE[stage].className}`}>
                  {STAGE[stage].label}
                </span>
              </div>
              <p className="mt-3 text-lg font-extrabold leading-snug">{tagline}</p>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{text}</p>
              <div className="mt-5">
                {url ? (
                  <a
                    href={url}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-background hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    Usar o {name.replace('Valtrea ', '')}
                    <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                    <span className="sr-only">(abre {url.replace('https://', '')})</span>
                  </a>
                ) : (
                  <WaitlistForm product={id} name={name} />
                )}
              </div>
            </div>
            <Preview />
          </li>
        ))}
      </ul>
    </div>
  )
}

// ---------- links do e-mail: ?lista=confirmar&token=... ou ?lista=sair&token=... ----------
// O link abre o site e a pessoa confirma com um botão (e não só por abrir o link), porque alguns
// provedores de e-mail abrem os links sozinhos para checar se são seguros.

const readLink = () => {
  const params = new URLSearchParams(window.location.search)
  const action = params.get('lista')
  const token = params.get('token')
  return (action === 'confirmar' || action === 'sair') && token ? { action, token } : null
}

export function AvisoListaDeEspera() {
  const [link, setLink] = useState(null)
  const [status, setStatus] = useState({ kind: 'idle', message: '' })

  useEffect(() => {
    const found = readLink()
    if (!found) return
    setLink(found)
    // Tira o código do endereço (não fica no histórico nem é compartilhado sem querer)
    window.history.replaceState(null, '', window.location.pathname + window.location.hash)
  }, [])

  if (!link) return null
  const confirming = link.action === 'confirmar'

  const act = async () => {
    setStatus({ kind: 'sending', message: '' })
    try {
      const data = await post(confirming ? '/confirmar' : '/sair', { token: link.token })
      setStatus({
        kind: 'ok',
        message: confirming
          ? `Inscrição confirmada! Avisaremos quando o ${data.product ?? 'produto'} estiver disponível.`
          : data.message,
      })
    } catch (error) {
      setStatus({ kind: 'error', message: error.message })
    }
  }

  return (
    <section
      aria-labelledby="aviso-lista-titulo"
      className="mx-auto mt-6 max-w-6xl px-4 sm:px-6"
    >
      <div className="flex flex-col gap-3 rounded-xl border border-primary/40 bg-surface p-5 sm:flex-row sm:items-center">
        <div className="flex-1">
          <h2 id="aviso-lista-titulo" className="font-bold">
            {confirming ? 'Confirmar aviso de lançamento' : 'Sair da lista de espera'}
          </h2>
          <p role="status" aria-live="polite" className="mt-1 text-sm text-muted">
            {status.kind === 'idle' &&
              (confirming
                ? 'Toque em confirmar para entrar na lista. Usaremos seu e-mail só para esse aviso.'
                : 'Toque no botão para apagar seu e-mail da lista.')}
            {status.kind === 'sending' && 'Enviando…'}
            {status.kind === 'ok' && status.message}
            {status.kind === 'error' && <span className="text-[#F87171]">{status.message}</span>}
          </p>
        </div>
        {status.kind !== 'ok' ? (
          <button
            type="button"
            onClick={act}
            disabled={status.kind === 'sending'}
            className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-5 font-semibold text-background hover:bg-primary-hover disabled:opacity-60"
          >
            {confirming ? 'Confirmar inscrição' : 'Sair da lista'}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setLink(null)}
            aria-label="Fechar aviso"
            className="inline-flex h-11 w-11 items-center justify-center self-end rounded-lg text-muted hover:text-foreground sm:self-auto"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
    </section>
  )
}
