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

const schema = z
  .object({
    first_name: z.string().trim().min(1, 'Informe seu nome.').max(50),
    last_name: z.string().trim().min(1, 'Informe seu sobrenome.').max(50),
    email: z.string().trim().email('Informe um e-mail válido.').max(100),
    password: z.string().trim().min(6, 'A senha precisa ter pelo menos 6 caracteres.'),
    passwordConfirmation: z.string().trim(),
    terms: z.literal(true, { errorMap: () => ({ message: 'Aceite os termos para continuar.' }) }),
  })
  .refine((v) => v.password === v.passwordConfirmation, {
    message: 'As senhas não coincidem.',
    path: ['passwordConfirmation'],
  })

export function SignupPage() {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { first_name: '', last_name: '', email: '', password: '', passwordConfirmation: '', terms: false },
  })

  // eslint-disable-next-line no-unused-vars
  const onSubmit = async ({ passwordConfirmation, terms, ...values }) => {
    try {
      await signup(values)
      toast.success('Conta criada. Bem-vindo!')
      navigate('/', { replace: true })
    } catch (error) {
      toast.error(getErrorMessage(error, 'Não foi possível criar a conta.'))
    }
  }

  return (
    <AuthLayout
      title="Criar conta"
      description="Comece a organizar seu dinheiro."
      footer={
        <>
          Já tem conta?{' '}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Entrar
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nome" htmlFor="first_name" error={errors.first_name?.message}>
            <Input id="first_name" autoComplete="given-name" hasError={!!errors.first_name} {...register('first_name')} />
          </Field>
          <Field label="Sobrenome" htmlFor="last_name" error={errors.last_name?.message}>
            <Input id="last_name" autoComplete="family-name" hasError={!!errors.last_name} {...register('last_name')} />
          </Field>
        </div>
        <Field label="E-mail" htmlFor="email" error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" hasError={!!errors.email} {...register('email')} />
        </Field>
        <Field label="Senha" htmlFor="password" error={errors.password?.message}>
          <Input id="password" type="password" autoComplete="new-password" hasError={!!errors.password} {...register('password')} />
        </Field>
        <Field label="Confirmar senha" htmlFor="passwordConfirmation" error={errors.passwordConfirmation?.message}>
          <Input
            id="passwordConfirmation"
            type="password"
            autoComplete="new-password"
            hasError={!!errors.passwordConfirmation}
            {...register('passwordConfirmation')}
          />
        </Field>
        <div>
          <label className="flex items-start gap-2 text-sm text-muted">
            <input type="checkbox" className="mt-0.5 h-4 w-4 accent-primary" {...register('terms')} />
            Li e aceito os termos de uso e a política de privacidade.
          </label>
          {errors.terms && <p className="mt-1 text-xs font-medium text-expense">{errors.terms.message}</p>}
        </div>
        <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting}>
          Criar conta
        </Button>
      </form>
    </AuthLayout>
  )
}
