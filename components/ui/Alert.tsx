import { cn } from './cn'
import { Icon, type IconName } from './icons'

// Inline alert (design-system.md 3.6). Tinted surface, text stays umber, the
// icon and optional lead word carry the status colour. No side stripe.
// role="status", or role="alert" for danger so errors are announced.

export type AlertTone = 'info' | 'success' | 'warning' | 'danger'

export const ALERT_TONES: Record<
  AlertTone,
  { surface: string; accent: string; icon: IconName; role: 'status' | 'alert' }
> = {
  info: { surface: 'bg-cobalt-wash', accent: 'text-cobalt', icon: 'info', role: 'status' },
  success: { surface: 'bg-moss-wash', accent: 'text-moss', icon: 'check', role: 'status' },
  warning: { surface: 'bg-ochre-wash', accent: 'text-ochre', icon: 'warning', role: 'status' },
  danger: { surface: 'bg-brick-wash', accent: 'text-brick', icon: 'alert', role: 'alert' },
}

export default function Alert({
  tone = 'info',
  lead,
  children,
  className,
  id,
}: {
  tone?: AlertTone
  /** Optional bold lead word in the status colour, e.g. "Saved." */
  lead?: string
  children: React.ReactNode
  className?: string
  id?: string
}) {
  const t = ALERT_TONES[tone]
  return (
    <div
      id={id}
      role={t.role}
      className={cn('flex gap-3 rounded-control px-4 py-3 font-ui text-ui-sm text-umber', t.surface, className)}
    >
      <Icon name={t.icon} className={cn('mt-0.5 shrink-0', t.accent)} />
      <p>
        {lead && <strong className={cn('font-semibold', t.accent)}>{lead} </strong>}
        {children}
      </p>
    </div>
  )
}
