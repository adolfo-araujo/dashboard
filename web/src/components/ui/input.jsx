import { forwardRef } from 'react'
import { cn } from '../../lib/cn'

export const inputClass =
  'h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted/70 transition-colors focus:border-primary'

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
