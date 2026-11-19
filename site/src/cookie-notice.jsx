import { useState } from 'react'
import { COMPANY } from './config'

// Aviso de cookies do site. O site não usa cookies nem ferramentas de rastreamento;
// o aviso é só informativo e some depois de "Entendi".
const KEY = 'valtrea:aviso-cookies'

const seen = () => {
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

const TEXTOS = {
  pt: ['Aviso de cookies', 'Este site não usa cookies de rastreamento nem de publicidade.', 'Saiba mais sobre cookies', 'Entendi'],
  en: ['Cookie notice', 'This site does not use tracking or advertising cookies.', 'Learn more (in Portuguese)', 'Got it'],
  es: ['Aviso de cookies', 'Este sitio no usa cookies de rastreo ni de publicidad.', 'Más información (en portugués)', 'Entendido'],
}

export function CookieNotice({ idioma = 'pt' }) {
  const t = TEXTOS[idioma] ?? TEXTOS.pt
  const [open, setOpen] = useState(() => !seen())
  if (!open) return null

  const close = () => {
    try {
      localStorage.setItem(KEY, '1')
    } catch {
      // navegação privada sem armazenamento: só fecha nesta visita
    }
    setOpen(false)
  }

  return (
    <section
      aria-label={t[0]}
      className="fixed inset-x-0 bottom-3 z-40 mx-auto max-w-lg px-3"
    >
      <div className="vidro flex flex-row items-center gap-3 rounded-2xl p-3 pl-4 text-sm sm:rounded-full sm:py-2.5 sm:pl-5">
        <p className="flex-1 text-xs leading-snug text-foreground sm:text-sm">
          {t[1]}{' '}
          <a
            href={`${COMPANY.financeUrl}/privacidade#cookies`}
            className="font-semibold text-primary underline-offset-2 hover:underline"
          >
            {t[2]}
          </a>
        </p>
        <button
          type="button"
          onClick={close}
          className="botao-verde h-9 shrink-0 rounded-full bg-primary px-4 font-semibold text-background hover:bg-primary-hover"
        >
          {t[3]}
        </button>
      </div>
    </section>
  )
}
