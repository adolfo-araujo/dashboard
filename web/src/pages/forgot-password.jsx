import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { MailCheck } from 'lucide-react'
import { AuthLayout } from './auth-layout'
import { Button } from '../components/ui/button'
import { Field, Input } from '../components/ui/input'
import { Honeypot } from '../components/honeypot'
import { api, getErrorMessage } from '../lib/api'

const schema = z.object({
  email: z.string().trim().email('Informe um e-mail válido.'),
})

export function ForgotPasswordPage() {
  const [sentTo, setSentTo] = useState(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { email: '' } })

  const honeypotRef = useRef(null)

  const onSubmit = async ({ email }) => {
    try {
      const website = honeypotRef.current?.value
      await api.post('/users/forgot-password', website ? { email, website } : { email })
      setSentTo(email)
    } catch (error) {
      toast.error(getErrorMessage(error, 'Não foi possível enviar o e-mail. Tente novamente.'))
    }
  }

  return (
    <AuthLayout
      title="Esqueci a senha"
      description="Enviaremos um link para você criar uma senha nova. Seu e-mail é usado só para isso."
      footer={
        <>
          Lembrou a senha?{' '}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Entrar
          </Link>
        </>
      }
    >
      {sentTo ? (
        <div className="space-y-4 text-sm">
          <MailCheck className="mx-auto h-8 w-8 text-primary" />
          <p>
            Se existir uma conta com <span className="font-semibold">{sentTo}</span>, você vai receber um
            e-mail com o link em alguns minutos.
          </p>
          <p className="text-muted">O link vale por 30 minutos. Confira também a caixa de spam.</p>
          <Button variant="secondary" className="w-full" onClick={() => setSentTo(null)}>
            Usar outro e-mail
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Honeypot ref={honeypotRef} name="website" />
          <Field label="E-mail da conta" htmlFor="email" error={errors.email?.message}>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="voce@email.com"
              hasError={!!errors.email}
              {...register('email')}
            />
          </Field>
          <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting}>
            Enviar link
          </Button>
        </form>
      )}
    </AuthLayout>
  )
}
