import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { AuthLayout } from './auth-layout'
import { Button } from '../components/ui/button'
import { Field, Input } from '../components/ui/input'
import { api, getErrorMessage } from '../lib/api'

const schema = z
  .object({
    password: z.string().min(6, 'A senha precisa ter pelo menos 6 caracteres.'),
    passwordConfirmation: z.string(),
  })
  .refine((v) => v.password === v.passwordConfirmation, {
    message: 'As senhas não coincidem.',
    path: ['passwordConfirmation'],
  })

export function ResetPasswordPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const token = params.get('token') ?? ''
  const isValidLink = /^[a-f0-9]{64}$/.test(token)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { password: '', passwordConfirmation: '' },
  })

  const onSubmit = async ({ password }) => {
    try {
      await api.post('/users/reset-password', { token, password })
      toast.success('Senha redefinida. Entre com a nova senha.')
      navigate('/login', { replace: true })
    } catch (error) {
      toast.error(getErrorMessage(error, 'Não foi possível redefinir a senha.'))
    }
  }

  if (!isValidLink) {
    return (
      <AuthLayout title="Link inválido" description="Este link de redefinição não é válido ou está incompleto.">
        <Link to="/forgot-password">
          <Button className="w-full" size="lg">
            Pedir um novo link
          </Button>
        </Link>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Criar nova senha"
      description="Escolha uma senha nova para a sua conta."
      footer={
        <Link to="/login" className="font-semibold text-primary hover:underline">
          Voltar para o login
        </Link>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Field label="Nova senha" htmlFor="password" error={errors.password?.message}>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            hasError={!!errors.password}
            {...register('password')}
          />
        </Field>
        <Field label="Confirmar nova senha" htmlFor="passwordConfirmation" error={errors.passwordConfirmation?.message}>
          <Input
            id="passwordConfirmation"
            type="password"
            autoComplete="new-password"
            hasError={!!errors.passwordConfirmation}
            {...register('passwordConfirmation')}
          />
        </Field>
        <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting}>
          Salvar nova senha
        </Button>
      </form>
    </AuthLayout>
  )
}
