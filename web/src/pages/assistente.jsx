import { useEffect, useRef, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Brain, Loader2, SendHorizontal, Trash2 } from 'lucide-react'
import { Logo } from '../components/logo'
import { Button } from '../components/ui/button'
import { useAuth } from '../contexts/auth'
import { api, getErrorMessage } from '../lib/api'
import { cn } from '../lib/cn'

const CHAVE = 'finance-app:assistente'
const INICIO = [
  {
    de: 'assistente',
    texto: 'Oi! Eu sou a Valtrea Assistente. Me conte seus gastos e ganhos do jeito que você fala, que eu lanço no Finance. Também respondo sobre o seu dinheiro, comparo meses, dou sugestões e aviso do orçamento.',
  },
]
const SUGESTOES = ['Gastei 40 no mercado', 'Quanto gastei esse mês?', 'Estou gastando muito?', 'O que você consegue fazer?']

const ACOES_OK = ['lancado', 'corrigido']
const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
// Quem pediu ao sistema menos movimento recebe as respostas de uma vez, sem efeito.
const semMovimento = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
// Tempo para "escrever" um texto: rápido em frases curtas, no máximo ~0,7 s nas longas.
const QUADROS = 45
const MS_POR_QUADRO = 16
const tempoDeEscrita = (texto) => Math.min(texto.length, QUADROS) * MS_POR_QUADRO

// Mostra o texto aparecendo aos poucos. O leitor de tela recebe a frase inteira de uma vez.
function TextoDigitado({ texto, animar }) {
  const [visiveis, setVisiveis] = useState(animar ? 0 : texto.length)
  useEffect(() => {
    if (!animar) return undefined
    const passo = Math.max(1, Math.ceil(texto.length / QUADROS))
    const id = setInterval(() => {
      setVisiveis((n) => {
        const proximo = Math.min(texto.length, n + passo)
        if (proximo >= texto.length) clearInterval(id)
        return proximo
      })
    }, MS_POR_QUADRO)
    return () => clearInterval(id)
  }, [texto, animar])
  return (
    <>
      <span className="sr-only">{texto}</span>
      <span aria-hidden="true" className={cn(visiveis < texto.length && 'cursor-escrevendo')}>
        {texto.slice(0, visiveis)}
      </span>
    </>
  )
}

// A conversa fica só nesta aba do navegador (some ao fechar); o servidor não guarda o texto.
const lerConversa = () => {
  try {
    return JSON.parse(sessionStorage.getItem(CHAVE)) ?? INICIO
  } catch {
    return INICIO
  }
}

export function AssistentePage() {
  const { user, isInitializing } = useAuth()
  const queryClient = useQueryClient()
  const [mensagens, setMensagens] = useState(lerConversa)
  const [opcoes, setOpcoes] = useState(SUGESTOES)
  const [texto, setTexto] = useState('')
  const [pensando, setPensando] = useState(false)
  const [ocupado, setOcupado] = useState(false)
  const fimRef = useRef(null)
  const campoRef = useRef(null)
  const listaRef = useRef(null)

  useEffect(() => {
    try {
      // as marcas de animação não vão para o armazenamento: ao recarregar, nada se mexe de novo
      const guardar = mensagens.slice(-60).map(({ nova, ok, ...m }) => m)
      sessionStorage.setItem(CHAVE, JSON.stringify(guardar))
    } catch {
      // sem armazenamento da aba: a conversa só não sobrevive a um recarregar
    }
  }, [mensagens])

  // Acompanha o fim da conversa enquanto ela cresce (inclusive durante a "escrita")
  useEffect(() => {
    const lista = listaRef.current
    if (!lista || typeof ResizeObserver === 'undefined') return undefined
    const observador = new ResizeObserver(() => fimRef.current?.scrollIntoView({ block: 'end' }))
    observador.observe(lista)
    return () => observador.disconnect()
  }, [user, isInitializing])

  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />

  async function enviar(conteudo) {
    const limpo = conteudo.trim()
    if (!limpo || ocupado) return
    const parado = semMovimento()
    setTexto('')
    setOpcoes([])
    setMensagens((m) => [...m, { de: 'voce', texto: limpo, nova: !parado }])
    setOcupado(true)
    setPensando(true)
    const inicio = Date.now()
    try {
      const { data } = await api.post('/assistente/mensagens', { texto: limpo })
      queryClient.invalidateQueries()
      // os três pontinhos ficam um instante, mesmo quando a resposta chega rápido
      if (!parado) await esperar(Math.max(0, 600 - (Date.now() - inicio)))
      const respostas = data.respostas ?? []
      // listas longas (ex.: últimos lançamentos) entram em cascata; respostas curtas são "escritas"
      const emCascata = respostas.length > 2
      for (const [i, resposta] of respostas.entries()) {
        if (i > 0 && !parado) {
          if (emCascata) {
            await esperar(90)
          } else {
            setPensando(true)
            await esperar(450)
          }
        }
        setPensando(false)
        const escrever = !parado && !(emCascata && i > 0)
        const ok = i === 0 && ACOES_OK.includes(data.acao)
        setMensagens((m) => [...m, { de: 'assistente', texto: resposta, nova: !parado, escrever, ok }])
        if (escrever) await esperar(tempoDeEscrita(resposta) + 150)
      }
      setOpcoes(data.opcoes ?? [])
    } catch (error) {
      setPensando(false)
      setMensagens((m) => [...m, { de: 'assistente', texto: getErrorMessage(error), erro: true, nova: !parado }])
    } finally {
      setPensando(false)
      setOcupado(false)
      campoRef.current?.focus()
    }
  }

  async function esquecer() {
    if (!window.confirm('Apagar tudo o que a assistente aprendeu com você e o assunto da conversa? Seus lançamentos continuam.')) return
    try {
      await api.delete('/assistente/memoria')
      setMensagens((m) => [
        ...m,
        { de: 'assistente', texto: 'Pronto, esqueci o que tinha aprendido. Seus lançamentos não mudaram.', nova: true },
      ])
    } catch (error) {
      setMensagens((m) => [...m, { de: 'assistente', texto: getErrorMessage(error), erro: true, nova: true }])
    }
  }

  function limpar() {
    setMensagens(INICIO)
    setOpcoes(SUGESTOES)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-border/50 bg-background/70 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Logo />
            <span className="rounded-md bg-surface-2 px-2 py-0.5 text-xs font-semibold text-muted">Assistente</span>
          </div>
          <Link to="/" className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Painel
          </Link>
        </div>
      </header>

      <main id="conteudo" tabIndex={-1} className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 sm:px-6">
        <div className="flex items-center justify-between gap-2 py-3 text-xs text-muted">
          <p className="flex items-center gap-1.5">
            <Brain className="h-4 w-4 text-primary" /> Funciona dentro do Valtrea, sem IA de fora. Aprende com você e lembra do assunto por 30 minutos.
          </p>
          <div className="flex shrink-0 gap-1">
            <Button variant="ghost" size="sm" onClick={limpar}>
              Limpar conversa
            </Button>
            <Button variant="ghost" size="sm" onClick={esquecer} title="Esquecer o que o assistente aprendeu">
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Esquecer o que aprendeu</span>
            </Button>
          </div>
        </div>

        <ol ref={listaRef} className="flex-1 space-y-3 pb-4" aria-live="polite" aria-label="Conversa com o assistente">
          {mensagens.map((m, i) => (
            <li key={i} className={cn('flex', m.de === 'voce' ? 'justify-end' : 'justify-start')}>
              <p
                className={cn(
                  'max-w-[85%] whitespace-pre-line rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                  m.de === 'voce' ? 'rounded-br-md bg-primary text-background' : 'rounded-bl-md bg-surface-2',
                  m.erro && 'border border-expense text-expense',
                  m.nova && (m.ok ? 'balao-ok' : 'balao-entra'),
                  m.nova && (m.de === 'voce' ? 'balao-entra-voce' : 'balao-entra-assistente'),
                )}
              >
                <span className="sr-only">{m.de === 'voce' ? 'Você: ' : 'Assistente: '}</span>
                {m.de === 'assistente' ? <TextoDigitado texto={m.texto} animar={Boolean(m.escrever)} /> : m.texto}
              </p>
            </li>
          ))}
          {pensando && (
            <li className="flex justify-start">
              <p className="balao-entra balao-entra-assistente flex items-center rounded-2xl rounded-bl-md bg-surface-2 px-4 py-3.5 text-muted">
                <span className="digitando flex items-center gap-1" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </span>
                <span className="sr-only">O assistente está escrevendo</span>
              </p>
            </li>
          )}
          <li ref={fimRef} aria-hidden="true" />
        </ol>

        <div className="sticky bottom-0 space-y-2 bg-background/80 pb-4 pt-2 backdrop-blur-md">
          {opcoes.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {opcoes.map((o, i) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => enviar(o)}
                  disabled={ocupado}
                  style={{ animationDelay: `${i * 60}ms` }}
                  className="opcao-entra botao-vidro rounded-full px-3 py-1.5 text-sm text-foreground disabled:opacity-60"
                >
                  {o}
                </button>
              ))}
            </div>
          )}
          <form
            className="flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              enviar(texto)
            }}
          >
            <label htmlFor="mensagem" className="sr-only">
              Mensagem para o assistente
            </label>
            <input
              id="mensagem"
              ref={campoRef}
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              maxLength={300}
              autoComplete="off"
              autoFocus
              placeholder='Ex.: "gastei 40 no mercado"'
              className="h-11 flex-1 rounded-full border border-border bg-surface px-4 text-base text-foreground placeholder:text-muted/70 focus:border-primary sm:text-sm"
            />
            <Button
              type="submit"
              size="icon"
              className="h-11 w-11 transition-transform active:scale-90"
              isLoading={pensando}
              disabled={!texto.trim() || ocupado}
            >
              {!pensando && <SendHorizontal className="h-4 w-4" />}
              <span className="sr-only">Enviar</span>
            </Button>
          </form>
        </div>
      </main>
    </div>
  )
}
