import { forwardRef } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '../../lib/cn'

const variants = {
  // texto escuro no verde: contraste 7:1 (texto branco ficava em 2,7:1)
  primary: 'bg-primary text-background hover:bg-primary-hover',
  secondary: 'bg-surface-2 text-foreground border border-border hover:bg-border',
  ghost: 'text-muted hover:text-foreground hover:bg-surface-2',
  danger: 'bg-danger text-white hover:bg-danger-hover',
  outline: 'border border-border text-foreground hover:bg-surface-2',
}

const sizes = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-11 px-5 text-base',
  icon: 'h-9 w-9',
}

export const Button = forwardRef(function Button(
  { className, variant = 'primary', size = 'md', isLoading, disabled, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
})
