import { cn } from '../../lib/cn'

export function Card({ className, children, ...props }) {
  return (
    <div className={cn('rounded-xl border border-border bg-surface', className)} {...props}>
      {children}
    </div>
  )
}
