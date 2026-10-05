import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Dialog } from './ui/dialog'
import { Button } from './ui/button'
import { Field, Input } from './ui/input'
import { ConfirmDialog } from './confirm-dialog'
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

export function AccountDialog({ open, onClose }) {
  const { user, updateUser, deleteAccount } = useAuth()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

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
      await updateUser(password ? { ...values, password } : values)
      toast.success('Dados atualizados.')
      onClose()
    } catch (error) {
      toast.error(getErrorMessage(error, 'Não foi possível atualizar seus dados.'))
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteAccount()
      toast.success('Conta excluída.')
    } catch (error) {
      toast.error(getErrorMessage(error, 'Não foi possível excluir a conta.'))
      setIsDeleting(false)
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

        <div className="mt-6 border-t border-border pt-5">
          <p className="text-sm font-semibold">Excluir conta</p>
          <p className="mt-1 text-sm text-muted">Remove sua conta e todas as transações. Não dá para desfazer.</p>
          <Button variant="outline" size="sm" className="mt-3 text-expense" onClick={() => setConfirmDelete(true)}>
            Excluir minha conta
          </Button>
        </div>
      </Dialog>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title="Excluir sua conta?"
        description="Todos os seus dados serão apagados permanentemente."
        confirmLabel="Excluir conta"
      />
    </>
  )
}
