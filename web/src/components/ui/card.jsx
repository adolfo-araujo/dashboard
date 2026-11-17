import { cn } from '../../lib/cn'

export function Card({ className, children, ...props }) {
  return (
    <div className={cn('vidro rounded-xl', className)} {...props}>
      {children}
    </div>
  )
}
