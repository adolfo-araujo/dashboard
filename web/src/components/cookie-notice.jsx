import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Cookie } from 'lucide-react'

// Aviso de cookies. O Valtrea não usa cookies de rastreamento nem de publicidade:
// só guarda no navegador o necessário para manter a pessoa conectada. Por isso o
// aviso é informativo (não há o que recusar). Some depois de "Entendi".
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
        <Cookie className="hidden h-5 w-5 shrink-0 text-primary sm:block" aria-hidden="true" />
        <p className="flex-1 leading-relaxed text-foreground">
          Usamos só o armazenamento essencial para manter você conectado. Nada de cookies de rastreamento
          ou publicidade.{' '}
          <Link to="/privacidade#cookies" className="font-semibold text-primary underline-offset-2 hover:underline">
            Saiba mais
          </Link>
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
