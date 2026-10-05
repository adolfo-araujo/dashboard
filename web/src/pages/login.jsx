import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { AuthLayout } from './auth-layout'
import { Button } from '../components/ui/button'
import { Field, Input } from '../components/ui/input'
import { useAuth } from '../contexts/auth'
import { getErrorMessage } from '../lib/api'

const schema = z.object({
  email: z.string().trim().email('Informe um e-mail válido.'),
  password: z.string().trim().min(6, 'A senha tem pelo menos 6 caracteres.'),
})

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { email: '', password: '' } })

  const onSubmit = async (values) => {
    try {
      await login(values)
      navigate('/', { replace: true })
    } catch (error) {
      const status = error?.response?.status
      toast.error(
        status === 401 || status === 404 ? 'E-mail ou senha incorretos.' : getErrorMessage(error),
      )
    }
  }

  const fillDemo = () => {
    setValue('email', 'demo@finance.app')
    setValue('password', '123456')
  }

  return (
    <AuthLayout
      title="Entrar"
      description="Acesse seu painel financeiro."
      footer={
        <>
          Ainda não tem conta?{' '}
          <Link to="/signup" className="font-semibold text-primary hover:underline">
            Criar conta
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Field label="E-mail" htmlFor="email" error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" placeholder="voce@email.com" hasError={!!errors.email} {...register('email')} />
        </Field>
        <Field label="Senha" htmlFor="password" error={errors.password?.message}>
          <Input id="password" type="password" autoComplete="current-password" placeholder="••••••" hasError={!!errors.password} {...register('password')} />
        </Field>
        <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting}>
          Entrar
        </Button>
      </form>
      <button
        type="button"
        onClick={fillDemo}
        className="mt-4 w-full rounded-lg border border-dashed border-border px-3 py-2.5 text-left text-xs text-muted hover:border-primary hover:text-foreground"
      >
        Usar conta demo: <span className="font-semibold text-foreground">demo@finance.app</span> / 123456
      </button>
    </AuthLayout>
  )
}
