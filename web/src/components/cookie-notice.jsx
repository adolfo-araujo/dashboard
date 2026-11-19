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
      className="fixed inset-x-0 bottom-3 z-40 mx-auto max-w-lg px-3"
    >
      <div className="vidro flex flex-row items-center gap-3 rounded-2xl p-3 pl-4 text-sm sm:rounded-full sm:py-2.5 sm:pl-5">
        <Cookie className="hidden h-5 w-5 shrink-0 text-primary sm:block" aria-hidden="true" />
        <p className="flex-1 text-xs leading-snug text-foreground sm:text-sm">
          Usamos só o armazenamento essencial para manter você conectado. Nada de cookies de rastreamento
          ou publicidade.{' '}
          <Link to="/privacidade#cookies" className="font-semibold text-primary underline-offset-2 hover:underline">
            Saiba mais sobre cookies
          </Link>
        </p>
        <button
          type="button"
          onClick={close}
          className="botao-verde h-9 shrink-0 rounded-full bg-primary px-4 font-semibold text-background hover:bg-primary-hover"
        >
          Entendi
        </button>
      </div>
    </section>
  )
}
