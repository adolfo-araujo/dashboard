import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { PiggyBank, TrendingDown, TrendingUp } from 'lucide-react'
import { Dialog } from './ui/dialog'
import { Button } from './ui/button'
import { Field, Input, Select } from './ui/input'
import { cn } from '../lib/cn'
import { TRANSACTION_TYPES, toApiDate, toDateOnly, today } from '../lib/format'
import { useCreateTransaction, useUpdateTransaction } from '../hooks/use-finance'
import { getErrorMessage } from '../lib/api'
import { CATEGORIES } from '../lib/categories'

const schema = z.object({
  name: z.string().trim().min(1, 'Informe um nome.').max(50, 'Máximo de 50 caracteres.'),
  amount: z.coerce
    .number({ invalid_type_error: 'Informe um valor.' })
    .min(1, 'O valor mínimo é R$ 1,00.')
    .max(99999999.99, 'Valor muito alto.'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe uma data.'),
  type: z.enum(['EARNING', 'EXPENSE', 'INVESTMENT']),
  category: z.string().min(1, 'Escolha uma categoria.'),
})

const typeIcons = { EARNING: TrendingUp, EXPENSE: TrendingDown, INVESTMENT: PiggyBank }

const emptyValues = () => ({ name: '', amount: '', date: today(), type: 'EXPENSE', category: '' })

export function TransactionFormDialog({ open, onClose, transaction }) {
  const isEditing = Boolean(transaction)
  const createMutation = useCreateTransaction()
  const updateMutation = useUpdateTransaction()

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema), defaultValues: emptyValues() })

  useEffect(() => {
    if (!open) return
    reset(
      transaction
        ? {
            name: transaction.name,
            amount: Number(transaction.amount),
            date: toDateOnly(transaction.date),
            type: transaction.type,
            category: transaction.category ?? '',
          }
        : emptyValues(),
    )
  }, [open, transaction, reset])

  const selectedType = watch('type')
  const categoryOptions = CATEGORIES[selectedType] ?? []

  useEffect(() => {
    const current = getValues('category')
    if (current && !categoryOptions.some((c) => c.key === current)) {
      setValue('category', '')
    }
  }, [selectedType]) // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = async (values) => {
    const payload = {
      ...values,
      amount: Math.round(values.amount * 100) / 100,
      date: toApiDate(values.date),
    }
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: transaction.id, ...payload })
        toast.success('Transação atualizada.')
      } else {
        await createMutation.mutateAsync(payload)
        toast.success('Transação adicionada.')
      }
      onClose()
    } catch (error) {
      toast.error(getErrorMessage(error, 'Não foi possível salvar a transação.'))
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEditing ? 'Editar transação' : 'Adicionar transação'}
      description={isEditing ? 'Altere os dados e salve.' : 'Registre um ganho, gasto ou investimento.'}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Field label="Nome" htmlFor="name" error={errors.name?.message}>
          <Input id="name" placeholder="Ex.: Supermercado" hasError={!!errors.name} {...register('name')} />
        </Field>

        <Field label="Valor (R$)" htmlFor="amount" error={errors.amount?.message}>
          <Input
            id="amount"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="1"
            placeholder="0,00"
            hasError={!!errors.amount}
            {...register('amount')}
          />
        </Field>

        <Field label="Data" htmlFor="date" error={errors.date?.message}>
          <Input id="date" type="date" hasError={!!errors.date} {...register('date')} />
        </Field>

        <Field label="Tipo" error={errors.type?.message}>
          <Controller
            control={control}
            name="type"
            render={({ field }) => (
              <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Tipo">
                {Object.entries(TRANSACTION_TYPES).map(([key, cfg]) => {
                  const Icon = typeIcons[key]
                  const active = field.value === key
                  return (
                    <button
                      key={key}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => field.onChange(key)}
                      className={cn(
                        'flex flex-col items-center gap-1 rounded-lg border px-2 py-3 text-xs font-semibold transition-colors',
                        active ? `${cfg.bg} ${cfg.text} border-current` : 'border-border text-muted hover:text-foreground',
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      {cfg.label}
                    </button>
                  )
                })}
              </div>
            )}
          />
        </Field>

        <Field label="Categoria" htmlFor="category" error={errors.category?.message}>
          <Select id="category" hasError={!!errors.category} {...register('category')}>
            <option value="">Escolha uma categoria</option>
            {categoryOptions.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </Select>
        </Field>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            className="flex-1"
            isLoading={createMutation.isPending || updateMutation.isPending}
          >
            {isEditing ? 'Salvar alterações' : 'Adicionar'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
