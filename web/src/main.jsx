// Monitoramento de erros: fica em primeiro lugar para começar a funcionar antes do resto do site
import { AppErrorBoundary } from './components/error-boundary'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import App from './App'
import { CookieNotice } from './components/cookie-notice'
import { AvisoServidorLento } from './components/aviso-servidor-lento'
import { useTema } from './components/tema'
import { AuthProvider } from './contexts/auth'
import './fonts.css'
import './index.css'
import { api } from './lib/api'
import { TemaNoCanto } from './components/tema'

// acorda a API (plano gratuito do Render) enquanto a pessoa vê a tela de login
api.get('/health').catch(() => {})

function ToasterTema(props) {
  const tema = useTema()
  return <Toaster theme={tema === 'claro' ? 'light' : 'dark'} {...props} />
}

const queryClient = new QueryClient({
  defaultOptions: {
    // Dados ficam 30 s em cache no navegador: abrir e fechar telas e diálogos não
    // repete a mesma consulta na API. Toda alteração (criar, editar, excluir)
    // invalida o cache na hora, então nada fica desatualizado.
    queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30_000 },
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <AppErrorBoundary>
            <App />
            <TemaNoCanto />
          </AppErrorBoundary>
          <CookieNotice />
          <AvisoServidorLento />
          <ToasterTema position="top-right" richColors />
        </AuthProvider>
      </BrowserRouter>

    </QueryClientProvider>
  </React.StrictMode>,
)

// PWA: registra o service worker só no site publicado (não atrapalha o modo dev)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
  })
}