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

export function CookieNotice() {
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
      aria-label="Aviso de cookies"
      className="fixed inset-x-0 bottom-0 z-40 p-3 sm:bottom-4 sm:left-4 sm:right-auto sm:max-w-md sm:p-0"
    >
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface-2 p-4 text-sm shadow-2xl sm:flex-row sm:items-center">
        <p className="flex-1 leading-relaxed text-foreground">
          Este site não usa cookies de rastreamento nem de publicidade.{' '}
          <a
            href={`${COMPANY.financeUrl}/privacidade#cookies`}
            className="font-semibold text-primary underline-offset-2 hover:underline"
          >
            Saiba mais
          </a>
        </p>
        <button
          type="button"
          onClick={close}
          className="h-9 shrink-0 rounded-lg bg-primary px-4 font-semibold text-background hover:bg-primary-hover"
        >
          Entendi
        </button>
      </div>
    </section>
  )
}
