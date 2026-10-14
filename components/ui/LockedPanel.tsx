import { cn } from './cn'
import { Icon } from './icons'

// Locked panel (design-system.md 3.6): the members-only and pending states.
// It names the state in its title and says why in one sentence; it never
// hides the title it stands in for. Pass the right action (join the waitlist,
// sign in) as `action`.
export default function LockedPanel({
  title = 'Members only',
  children,
  action,
  className,
}: {
  title?: string
  children: React.ReactNode
  action?: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn('rounded-control bg-vellum p-6 shadow-hairline', className)}>
      <div className="flex items-center gap-2 font-mono text-label uppercase text-umber-soft">
        <Icon name="lock" />
        Locked
      </div>
      <h2 className="mt-2 font-serif text-card-title text-umber">{title}</h2>
      <p className="mt-1.5 max-w-prose font-ui text-ui-sm text-umber-soft">{children}</p>
      {action && <div className="mt-4">{action}</div>}
    </section>
  )
}
