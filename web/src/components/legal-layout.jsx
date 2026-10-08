import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Logo } from './logo'
import { LegalLinks } from './legal-links'
import { LEGAL } from '../lib/legal'

export function LegalLayout({ title, children }) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link to="/" aria-label="Ir para o início">
            <Logo />
          </Link>
          <Link to="/" className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-muted">Última atualização: {LEGAL.updatedAt}</p>
        <div className="mt-8 space-y-8 text-[15px] leading-relaxed text-foreground/90">{children}</div>
      </main>

      <footer className="border-t border-border py-8">
        <LegalLinks />
      </footer>
    </div>
  )
}

export function Section({ title, children }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-bold text-foreground">{title}</h2>
      {children}
    </section>
  )
}

export function List({ items }) {
  return (
    <ul className="list-disc space-y-1.5 pl-5">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  )
}
