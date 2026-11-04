import * as Sentry from '@sentry/react'

const dsn = import.meta.env.VITE_SENTRY_DSN

// Monitoramento de erros no navegador (só no site publicado, com a variável configurada)
if (dsn && import.meta.env.PROD) {
  Sentry.init({
    dsn,
    environment: 'production',
    sendDefaultPii: false,
    tracesSampleRate: 0,
    // Erros causados por extensões do navegador não são do Valtrea
    denyUrls: [/extensions\//i, /^chrome-extension:\/\//i, /^moz-extension:\/\//i, /^safari-extension:\/\//i],
  })
}

function CrashScreen() {
  return (
    <main id="conteudo" tabIndex={-1} className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-extrabold tracking-tight">Algo deu errado nesta tela</h1>
      <p className="mt-2 max-w-sm text-sm text-muted">
        O erro já foi registrado para correção. Recarregue a página para continuar. Seus dados estão salvos.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="mt-6 inline-flex h-10 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-background hover:bg-primary-hover"
      >
        Recarregar a página
      </button>
    </main>
  )
}

// Se uma tela quebrar, mostra uma mensagem amigável em vez da página em branco
export function AppErrorBoundary({ children }) {
  return <Sentry.ErrorBoundary fallback={<CrashScreen />}>{children}</Sentry.ErrorBoundary>
}
