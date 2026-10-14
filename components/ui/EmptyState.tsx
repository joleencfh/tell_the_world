import { cn } from './cn'

// Empty state (design-system.md 3.6): what is missing, what to do, one
// button. Never an illustration. Pass the Button (or link) as `action`.
export default function EmptyState({
  title,
  children,
  action,
  className,
}: {
  title: string
  children?: React.ReactNode
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-start gap-2 py-8', className)}>
      <p className="font-serif text-card-title text-umber">{title}</p>
      {children && <p className="max-w-prose font-ui text-ui-sm text-umber-soft">{children}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
