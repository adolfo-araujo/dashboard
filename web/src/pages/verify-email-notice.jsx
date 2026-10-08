import { useState } from 'react'
import { toast } from 'sonner'
import { MailCheck } from 'lucide-react'
import { AuthLayout } from './auth-layout'
import { Button } from '../components/ui/button'
import { useAuth } from '../contexts/auth'
import { api, getErrorMessage } from '../lib/api'

// Mostrada no lugar do painel enquanto o e-mail não for confirmado
export function VerifyEmailNoticePage() {
  const { user, refreshUser, logout } = useAuth()
  const [isResending, setIsResending] = useState(false)
  const [isChecking, setIsChecking] = useState(false)

  const resend = async () => {
    setIsResending(true)
    try {
      await api.post('/users/me/resend-verification')
      toast.success('Enviamos um novo e-mail de confirmação.')
    } catch (error) {
      toast.error(getErrorMessage(error, 'Não foi possível reenviar o e-mail.'))
    } finally {
      setIsResending(false)
    }
  }

  const checkAgain = async () => {
    setIsChecking(true)
    try {
      const data = await refreshUser()
      if (!data?.email_verified_at) {
        toast.error('Ainda não identificamos a confirmação. Clique no link do e-mail.')
      }
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setIsChecking(false)
    }
  }

  return (
    <AuthLayout
      title="Confirme seu e-mail"
      description="Falta só um passo para começar a usar o Valtrea."
      footer={
        <button onClick={logout} className="font-semibold text-primary hover:underline">
          Sair e entrar com outra conta
        </button>
      }
    >
      <div className="space-y-4 text-sm">
        <MailCheck className="mx-auto h-8 w-8 text-primary" />
        <p>
          Enviamos um link de confirmação para <span className="font-semibold">{user?.email}</span>. Abra
          o e-mail e clique em <span className="font-semibold">Confirmar e-mail</span>.
        </p>
        <p className="text-muted">O link vale por 24 horas. Confira também a caixa de spam.</p>
        <Button className="w-full" onClick={checkAgain} isLoading={isChecking}>
          Já confirmei
        </Button>
        <Button variant="secondary" className="w-full" onClick={resend} isLoading={isResending}>
          Reenviar e-mail
        </Button>
      </div>
    </AuthLayout>
  )
}
