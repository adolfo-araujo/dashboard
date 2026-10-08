import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { ArrowLeft, Pause, Pencil, PiggyBank, Play, Plus, Repeat, Trash2, TrendingDown, TrendingUp } from 'lucide-react'
import { Dialog } from './ui/dialog'
import { Button } from './ui/button'
import { Field, Input, Select } from './ui/input'
import { CATEGORIES, getCategory } from '../lib/categories'
import { TRANSACTION_TYPES, formatCurrency, formatDate, today } from '../lib/format'
import { getErrorMessage } from '../lib/api'
import { cn } from '../lib/cn'
import {
  useCreateRecurring,
  useDeleteRecurring,
  useRecurringList,
  useUpdateRecurring,
} from '../hooks/use-recurring'

const typeIcons = { EARNING: TrendingUp, EXPENSE: TrendingDown, INVESTMENT: PiggyBank }

const schema = z
  .object({
    name: z.string().trim().min(1, 'Informe um nome.').max(50, 'Máximo de 50 caracteres.'),
    amount: z.coerce
      .number({ invalid_type_error: 'Informe um valor.' })
      .min(1, 'O valor mínimo é R$ 1,00.')
      .max(99999999.99, 'Valor muito alto.'),
    type: z.enum(['EARNING', 'EXPENSE', 'INVESTMENT']),
    category: z.string().min(1, 'Escolha uma categoria.'),
    day_of_month: z.coerce
      .number({ invalid_type_error: 'Informe o dia.' })
      .int('Use um número inteiro.')
      .min(1, 'Entre 1 e 31.')
      .max(31, 'Entre 1 e 31.'),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe a data de início.'),
    end_date: z.string().optional(),
  })
  .refine((v) => !v.end_date || v.end_date >= v.start_date, {
    message: 'Deve ser depois do início.',
    path: ['end_date'],
  })

const emptyValues = () => ({
  name: '',
  amount: '',
  type: 'EXPENSE',
  category: '',
  day_of_month: Number(today().slice(8, 10)),
  start_date: today(),
  end_date: '',
})

function RecurringForm({ rule, onDone }) {
  const createMutation = useCreateRecurring()
  const updateMutation = useUpdateRecurring()
  const isEditing = Boolean(rule)

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: rule
      ? {
          name: rule.name,
          amount: Number(rule.amount),
          type: rule.type,
          category: rule.category ?? '',
          day_of_month: rule.day_of_month,
          start_date: rule.start_date,
          end_date: rule.end_date ?? '',
        }
      : emptyValues(),
  })

  const selectedType = watch('type')
  const categoryOptions = CATEGORIES[selectedType] ?? []

  useEffect(() => {
    const current = getValues('category')
    if (current && !categoryOptions.some((c) => c.key === current)) setValue('category', '')
  }, [selectedType]) // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = async ({ end_date, ...values }) => {
    const payload = {
      ...values,
      amount: Math.round(values.amount * 100) / 100,
      end_date: end_date || null,
    }
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: rule.id, ...payload })
        toast.success('Recorrente atualizada.')
      } else {
        await createMutation.mutateAsync(payload)
        toast.success('Recorrente criada.')
      }
      onDone()
    } catch (error) {
      toast.error(getErrorMessage(error, 'Não foi possível salvar a recorrente.'))
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <Field label="Nome" htmlFor="rec-name" error={errors.name?.message}>
        <Input id="rec-name" placeholder="Ex.: Aluguel" hasError={!!errors.name} {...register('name')} />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Valor (R$)" htmlFor="rec-amount" error={errors.amount?.message}>
          <Input
            id="rec-amount"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="1"
            placeholder="0,00"
            hasError={!!errors.amount}
            {...register('amount')}
          />
        </Field>
        <Field label="Todo dia" htmlFor="rec-day" error={errors.day_of_month?.message}>
          <Input
            id="rec-day"
            type="number"
            inputMode="numeric"
            min="1"
            max="31"
            hasError={!!errors.day_of_month}
            {...register('day_of_month')}
          />
        </Field>
      </div>

      <Field label="Tipo">
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

      <Field label="Categoria" htmlFor="rec-category" error={errors.category?.message}>
        <Select id="rec-category" hasError={!!errors.category} {...register('category')}>
          <option value="">Escolha uma categoria</option>
          {categoryOptions.map((c) => (
            <option key={c.key} value={c.key}>
              {c.label}
            </option>
          ))}
        </Select>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Começa em" htmlFor="rec-start" error={errors.start_date?.message}>
          <Input id="rec-start" type="date" hasError={!!errors.start_date} {...register('start_date')} />
        </Field>
        <Field label="Termina em (opcional)" htmlFor="rec-end" error={errors.end_date?.message}>
          <Input id="rec-end" type="date" hasError={!!errors.end_date} {...register('end_date')} />
        </Field>
      </div>

      {!isEditing && (
        <p className="text-xs text-muted">
          Se o início for uma data passada, os meses que já passaram também serão lançados. Nos meses com menos
          dias, o lançamento cai no último dia do mês.
        </p>
      )}

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" className="flex-1" onClick={onDone}>
          Cancelar
        </Button>
        <Button type="submit" className="flex-1" isLoading={createMutation.isPending || updateMutation.isPending}>
          {isEditing ? 'Salvar alterações' : 'Criar recorrente'}
        </Button>
      </div>
    </form>
  )
}

function RecurringItem({ rule, onEdit }) {
  const updateMutation = useUpdateRecurring()
  const deleteMutation = useDeleteRecurring()
  const [confirming, setConfirming] = useState(false)
  const cfg = TRANSACTION_TYPES[rule.type]
  const category = getCategory(rule.type, rule.category)
  const Icon = category.icon

  const toggleActive = async () => {
    try {
      await updateMutation.mutateAsync({ id: rule.id, active: !rule.active })
      toast.success(rule.active ? 'Recorrente pausada.' : 'Recorrente retomada.')
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const remove = async () => {
    try {
      await deleteMutation.mutateAsync(rule.id)
      toast.success('Recorrente excluída. Os lançamentos já criados foram mantidos.')
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  return (
    <li className={cn('py-3', !rule.active && 'opacity-60')}>
      <div className="flex items-start gap-3">
        <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', cfg.bg, cfg.text)}>
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{rule.name}</p>
          <p className="text-xs text-muted">
            Todo dia {rule.day_of_month}, {category.label}
          </p>
          <p className="mt-0.5 text-xs text-muted">
            {rule.active
              ? rule.next_date
                ? `Próximo lançamento: ${formatDate(rule.next_date)}`
                : 'Encerrada'
              : 'Pausada'}
          </p>
        </div>
        <span className={cn('whitespace-nowrap text-sm font-bold tabular-nums', cfg.text)}>
          {formatCurrency(rule.amount)}
        </span>
      </div>
      <div className="mt-2 flex justify-end gap-1">
        {confirming ? (
          <>
            <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
              Cancelar
            </Button>
            <Button size="sm" variant="danger" onClick={remove} isLoading={deleteMutation.isPending}>
              Confirmar exclusão
            </Button>
          </>
        ) : (
          <>
            <Button size="icon" variant="ghost" onClick={() => onEdit(rule)} aria-label={`Editar ${rule.name}`}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={toggleActive}
              disabled={updateMutation.isPending}
              aria-label={rule.active ? `Pausar ${rule.name}` : `Retomar ${rule.name}`}
            >
              {rule.active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="hover:text-expense"
              onClick={() => setConfirming(true)}
              aria-label={`Excluir ${rule.name}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </li>
  )
}

export function RecurringDialog({ open, onClose }) {
  const [view, setView] = useState({ name: 'list', rule: null })
  const { data: rules = [], isLoading } = useRecurringList(open)

  useEffect(() => {
    if (open) setView({ name: 'list', rule: null })
  }, [open])

  const backToList = () => setView({ name: 'list', rule: null })

  if (view.name === 'form') {
    return (
      <Dialog
        open={open}
        onClose={onClose}
        title={view.rule ? 'Editar recorrente' : 'Nova recorrente'}
        description="Lançada automaticamente todo mês no dia escolhido."
      >
        <button
          type="button"
          onClick={backToList}
          className="-mt-2 mb-4 flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar para a lista
        </button>
        <RecurringForm rule={view.rule} onDone={backToList} />
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onClose={onClose} title="Recorrentes" description="Lançamentos que se repetem todo mês.">
      <Button className="w-full" onClick={() => setView({ name: 'form', rule: null })}>
        <Plus className="h-4 w-4" /> Nova recorrente
      </Button>

      {isLoading ? (
        <div className="mt-4 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-surface-2" />
          ))}
        </div>
      ) : rules.length === 0 ? (
        <div className="mt-6 flex flex-col items-center gap-2 text-center">
          <Repeat className="h-8 w-8 text-muted" />
          <p className="font-semibold">Nenhuma recorrente ainda</p>
          <p className="max-w-xs text-sm text-muted">
            Cadastre salário, aluguel e assinaturas uma vez e eles são lançados sozinhos todo mês.
          </p>
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-border">
          {rules.map((rule) => (
            <RecurringItem key={rule.id} rule={rule} onEdit={(r) => setView({ name: 'form', rule: r })} />
          ))}
        </ul>
      )}
    </Dialog>
  )
}
