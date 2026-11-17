import { Logo } from '../components/logo'
import { LegalLinks } from '../components/legal-links'

export function AuthLayout({ title, description, children, footer }) {
  return (
    <main id="conteudo" tabIndex={-1} className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <Logo className="mb-8" />
      <div className="w-full max-w-sm vidro rounded-2xl p-6 sm:p-8">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-muted">{description}</p>
        <div className="mt-6">{children}</div>
      </div>
      {footer && <div className="mt-6 text-sm text-muted">{footer}</div>}
      <LegalLinks className="mt-10" />
    </main>
  )
}
