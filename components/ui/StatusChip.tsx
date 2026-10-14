import { cn } from './cn'
import { Icon, type IconName } from './icons'

// Status chip (design-system.md 3.5): neutral by default (decision 2). On
// moderation screens a tone may colour the border (at 40%) and the text; the
// icon and the word always stay, so colour only reinforces.

export type Status = 'pending' | 'approved' | 'declined'
export type StatusTone = 'neutral' | 'danger' | 'success' | 'warning'

const STATUSES: Record<Status, { label: string; icon: IconName }> = {
  pending: { label: 'Pending', icon: 'clock' },
  approved: { label: 'Approved', icon: 'check' },
  declined: { label: 'Declined', icon: 'x' },
}

const TONES: Record<StatusTone, string> = {
  neutral: 'border-field-line text-umber',
  danger: 'border-brick/40 text-brick',
  success: 'border-moss/40 text-moss',
  warning: 'border-ochre/40 text-ochre',
}

export default function StatusChip({
  status,
  label,
  tone = 'neutral',
  className,
}: {
  status: Status
  /** Overrides the default word, e.g. "In review". */
  label?: string
  tone?: StatusTone
  className?: string
}) {
  const s = STATUSES[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-tag border px-1.5 py-px font-mono text-label uppercase',
        TONES[tone],
        className,
      )}
    >
      <Icon name={s.icon} />
      {label ?? s.label}
    </span>
  )
}
