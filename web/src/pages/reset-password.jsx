import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { AuthLayout } from './auth-layout'
import { Button } from '../components/ui/button'
import { PasswordField } from '../components/ui/input'
import { api, getErrorMessage } from '../lib/api'
import { passwordSchema } from '../lib/password'

const schema = z
  .object({
    password: passwordSchema,
    passwordConfirmation: z.string().trim(),
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
        <PasswordField label="Nova senha" id="password" hint="8+ caracteres, letras e números" autoComplete="new-password" error={errors.password?.message} {...register('password')} />
        <PasswordField label="Confirmar nova senha" id="passwordConfirmation" autoComplete="new-password" error={errors.passwordConfirmation?.message} {...register('passwordConfirmation')} />
        <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting}>
          Salvar nova senha
        </Button>
      </form>
    </AuthLayout>
  )
}
