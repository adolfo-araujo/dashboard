import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CircleCheck, CircleX, Loader2 } from 'lucide-react'
import { AuthLayout } from './auth-layout'
import { Button } from '../components/ui/button'
import { useAuth } from '../contexts/auth'
import { api, getErrorMessage } from '../lib/api'

// Página aberta pelo link do e-mail: /verify-email?token=...
export function VerifyEmailPage() {
  const [params] = useSearchParams()
  const { user, refreshUser } = useAuth()
  const token = params.get('token') ?? ''
  const [status, setStatus] = useState('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const started = useRef(false)

  useEffect(() => {
    // garante uma única chamada, mesmo com o StrictMode do React
    if (started.current) return
    started.current = true

    const verify = async () => {
      try {
        await api.post('/users/verify-email', { token })
        setStatus('success')
        refreshUser().catch(() => {})
      } catch (error) {
        setErrorMessage(getErrorMessage(error, 'Não foi possível confirmar o e-mail.'))
        setStatus('error')
      }
    }
    verify()
  }, [token, refreshUser])

  if (status === 'loading') {
    return (
      <AuthLayout title="Confirmando seu e-mail" description="Só um instante.">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
      </AuthLayout>
    )
  }

  if (status === 'error') {
    return (
      <AuthLayout title="Não foi possível confirmar" description={errorMessage}>
        <div className="space-y-4 text-sm">
          <CircleX className="mx-auto h-8 w-8 text-expense" />
          <p className="text-muted">
            O link pode ter expirado ou já ter sido substituído por um mais novo. Entre na sua conta e
            clique em <span className="font-semibold text-foreground">Reenviar e-mail</span>.
          </p>
          <Link to={user ? '/' : '/login'} className="block">
            <Button className="w-full">{user ? 'Ir para o painel' : 'Entrar'}</Button>
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="E-mail confirmado" description="Sua conta está pronta para usar.">
      <div className="space-y-4">
        <CircleCheck className="mx-auto h-8 w-8 text-primary" />
        <Link to={user ? '/' : '/login'} className="block">
          <Button className="w-full" size="lg">
            {user ? 'Ir para o painel' : 'Entrar'}
          </Button>
        </Link>
      </div>
    </AuthLayout>
  )
}
