import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { AlertTriangle } from 'lucide-react'
import { Dialog } from './ui/dialog'
import { Button } from './ui/button'
import { Field, Input } from './ui/input'
import { useAuth } from '../contexts/auth'
import { getErrorMessage } from '../lib/api'

const schema = z.object({
  first_name: z.string().trim().min(1, 'Informe seu nome.').max(50),
  last_name: z.string().trim().min(1, 'Informe seu sobrenome.').max(50),
  email: z.string().trim().email('E-mail inválido.'),
  password: z
    .string()
    .trim()
    .refine((v) => v === '' || v.length >= 6, 'A senha precisa ter pelo menos 6 caracteres.'),
})

function DeleteAccountDialog({ open, onClose }) {
  const { deleteAccount } = useAuth()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (open) {
      setPassword('')
      setError('')
    }
  }, [open])

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!password) {
      setError('Digite sua senha para confirmar.')
      return
    }
    setIsDeleting(true)
    try {
      await deleteAccount(password)
      toast.success('Conta excluída. Enviamos uma confirmação para o seu e-mail.')
    } catch (err) {
      if (err?.response?.status === 403) {
        setError('Senha incorreta.')
      } else {
        toast.error(getErrorMessage(err, 'Não foi possível excluir a conta.'))
      }
      setIsDeleting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Excluir sua conta?"
      description="Esta ação é permanente e não pode ser desfeita."
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="rounded-lg border border-expense/40 bg-expense/10 p-3 text-sm">
          <p className="font-semibold text-expense">Serão apagados para sempre:</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5 text-foreground">
            <li>seu cadastro (nome, e-mail e senha)</li>
            <li>todas as suas transações</li>
          </ul>
        </div>
        <Field label="Digite sua senha para confirmar" htmlFor="delete-password" error={error}>
          <Input
            id="delete-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              setError('')
            }}
            hasError={!!error}
          />
        </Field>
        <div className="flex gap-3">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="danger" className="flex-1" isLoading={isDeleting}>
            Excluir definitivamente
          </Button>
        </div>
      </form>
    </Dialog>
  )
}

export function AccountDialog({ open, onClose }) {
  const { user, updateUser } = useAuth()
  const [confirmDelete, setConfirmDelete] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (open && user) {
      reset({ first_name: user.first_name, last_name: user.last_name, email: user.email, password: '' })
    }
  }, [open, user, reset])

  const onSubmit = async ({ password, ...values }) => {
    try {
      const updated = await updateUser(password ? { ...values, password } : values)
      if (!updated?.email_verified_at) {
        toast.success('Dados atualizados. Confirme o novo e-mail pelo link que enviamos.')
      } else {
        toast.success('Dados atualizados.')
      }
      onClose()
    } catch (error) {
      toast.error(getErrorMessage(error, 'Não foi possível atualizar seus dados.'))
    }
  }

  return (
    <>
      <Dialog open={open && !confirmDelete} onClose={onClose} title="Minha conta" description="Atualize seus dados de acesso.">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nome" htmlFor="acc-first" error={errors.first_name?.message}>
              <Input id="acc-first" hasError={!!errors.first_name} {...register('first_name')} />
            </Field>
            <Field label="Sobrenome" htmlFor="acc-last" error={errors.last_name?.message}>
              <Input id="acc-last" hasError={!!errors.last_name} {...register('last_name')} />
            </Field>
          </div>
          <Field label="E-mail" htmlFor="acc-email" error={errors.email?.message}>
            <Input id="acc-email" type="email" hasError={!!errors.email} {...register('email')} />
          </Field>
          <Field label="Nova senha" htmlFor="acc-pass" error={errors.password?.message}>
            <Input
              id="acc-pass"
              type="password"
              placeholder="Deixe em branco para manter a atual"
              autoComplete="new-password"
              hasError={!!errors.password}
              {...register('password')}
            />
          </Field>
          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            Salvar alterações
          </Button>
        </form>

        <div className="mt-6 rounded-xl border border-expense/40 bg-expense/5 p-4">
          <div className="flex items-center gap-2 text-expense">
            <AlertTriangle className="h-4 w-4" />
            <p className="text-sm font-bold">Zona de perigo</p>
          </div>
          <p className="mt-2 text-sm text-muted">
            Excluir a conta apaga seu cadastro e todas as suas transações de forma permanente. Não é possível
            recuperar depois.
          </p>
          <Button variant="danger" size="sm" className="mt-3 w-full sm:w-auto" onClick={() => setConfirmDelete(true)}>
            Excluir minha conta
          </Button>
        </div>
      </Dialog>

      <DeleteAccountDialog open={confirmDelete} onClose={() => setConfirmDelete(false)} />
    </>
  )
}
