import { Link } from 'react-router-dom'
import { LEGAL } from '../lib/legal'
import { cn } from '../lib/cn'

export function LegalLinks({ className }) {
  return (
    <nav
      aria-label="Informações legais"
      className={cn('flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted', className)}
    >
      <Link to="/termos" className="hover:text-foreground hover:underline">
        Termos de uso
      </Link>
      <Link to="/privacidade" className="hover:text-foreground hover:underline">
        Política de privacidade
      </Link>
      <a href={`mailto:${LEGAL.email}`} className="hover:text-foreground hover:underline">
        {LEGAL.email}
      </a>
    </nav>
  )
}
