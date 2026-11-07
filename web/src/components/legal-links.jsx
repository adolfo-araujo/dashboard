import { Link, useLocation } from 'react-router-dom'
import { LEGAL } from '../lib/legal'
import { BotaoTema } from './tema'
import { cn } from '../lib/cn'

export function LegalLinks({ className }) {
  const { pathname } = useLocation()
  const assunto = encodeURIComponent('[Valtrea Finance] Sugestão ou problema')
  const corpo = encodeURIComponent(`Página: ${pathname}\n\nConte o que aconteceu ou o que você sugere:\n`)
  return (
    <nav
      aria-label="Informações legais"
      className={cn('flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted', className)}
    >
      <Link to="/ajuda" className="hover:text-foreground hover:underline">
        Ajuda
      </Link>
      <Link to="/novidades" className="hover:text-foreground hover:underline">
        Novidades
      </Link>
      <a href={`mailto:${LEGAL.email}?subject=${assunto}&body=${corpo}`} className="hover:text-foreground hover:underline">
        Enviar sugestão
      </a>
      <BotaoTema />
      <Link to="/termos" className="hover:text-foreground hover:underline">
        Termos de uso
      </Link>
      <Link to="/privacidade" className="hover:text-foreground hover:underline">
        Política de privacidade
      </Link>
      <Link to="/acessibilidade" className="hover:text-foreground hover:underline">
        Acessibilidade
      </Link>
      <a href={`mailto:${LEGAL.email}`} className="hover:text-foreground hover:underline">
        {LEGAL.email}
      </a>
    </nav>
  )
}
