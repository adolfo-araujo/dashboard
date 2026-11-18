import { forwardRef, useId, useState } from 'react'
import { OlhoAberto, OlhoFechado } from '../olho'
import { cn } from '../../lib/cn'

export const inputClass =
  'h-10 w-full rounded-xl border border-border bg-surface px-3 text-base sm:text-sm text-foreground placeholder:text-muted/70 transition-colors focus:border-primary'

export const Input = forwardRef(function Input({ className, hasError, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(inputClass, hasError && 'border-expense', className)}
      {...props}
    />
  )
})

export const Select = forwardRef(function Select({ className, hasError, children, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={cn(inputClass, 'cursor-pointer', hasError && 'border-expense', className)}
      {...props}
    >
      {children}
    </select>
  )
})

export function Field({ label, htmlFor, error, children }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-foreground">
        {label}
      </label>
      {children}
      {error && <p className="text-xs font-medium text-expense">{error}</p>}
    </div>
  )
}

/** Campo de senha: o rótulo fica dentro e sobe para a borda ao digitar; o olho mostra ou esconde a senha. */
export const PasswordField = forwardRef(function PasswordField({ label, id, error, hint, placeholder, hasError, className, ...props }, ref) {
  const gerado = useId()
  const campo = id || gerado
  const [visivel, setVisivel] = useState(false)
  const dica = hint || placeholder
  const descricao = [dica && `${campo}-dica`, error && `${campo}-erro`].filter(Boolean).join(' ') || undefined
  const erro = hasError || !!error
  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="relative mt-2">
        <input
          ref={ref}
          id={campo}
          type={visivel ? 'text' : 'password'}
          placeholder=" "
          aria-invalid={erro || undefined}
          aria-describedby={descricao}
          className={cn(
            'peer h-12 w-full rounded-xl border-2 bg-surface pl-3.5 pr-12 text-base text-foreground outline-none transition-colors duration-200 sm:text-sm',
            erro ? 'border-expense' : 'border-border focus:border-primary [&:not(:placeholder-shown)]:border-primary',
          )}
          {...props}
        />
        <label
          htmlFor={campo}
          className={cn(
            'pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 bg-surface px-1 text-sm transition-all duration-200',
            'peer-focus:top-0 peer-focus:text-xs peer-focus:font-semibold peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:font-semibold',
            erro ? 'text-expense' : 'text-muted peer-focus:text-primary peer-[:not(:placeholder-shown)]:text-primary',
          )}
        >
          {label}
        </label>
        <button
          type="button"
          onClick={() => setVisivel((atual) => !atual)}
          aria-label={visivel ? 'Ocultar senha' : 'Mostrar senha'}
          aria-pressed={visivel}
          aria-controls={campo}
          className={cn(
            'absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg transition-colors',
            visivel ? 'text-primary' : 'text-muted hover:text-foreground',
          )}
        >
          {visivel ? <OlhoAberto /> : <OlhoFechado />}
        </button>
      </div>
      {dica && (
        <p id={`${campo}-dica`} className="text-xs text-muted">
          {dica}
        </p>
      )}
      {error && (
        <p id={`${campo}-erro`} className="text-xs font-medium text-expense">
          {error}
        </p>
      )}
    </div>
  )
})
