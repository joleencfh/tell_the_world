import type { UserRole } from '@/lib/types'
import { cn } from './cn'

// Role label (design-system.md 3.4): a short mono label in a thin border at
// 40% of the role colour. A label, not a button: no fill, no hover. The word
// carries the meaning; colour only says which side of the audience pair.

export const ROLE_LABELS: Record<UserRole, string> = {
  creator: 'Creator',
  journalist: 'Journalist',
  expert: 'Expert',
  organisation: 'Organisation',
  admin: 'Admin',
  comms_specialist: 'Communications Specialist',
  other: 'Other',
}

export type RoleSide = 'rose' | 'cobalt' | 'neutral'

/** Which side of the audience pair a role belongs to. */
export const ROLE_SIDE: Record<UserRole, RoleSide> = {
  creator: 'rose',
  journalist: 'rose',
  expert: 'cobalt',
  organisation: 'cobalt',
  admin: 'neutral',
  comms_specialist: 'neutral',
  other: 'neutral',
}

const SIDE_CLASSES: Record<RoleSide, string> = {
  rose: 'border-rose-deep/40 text-rose-deep',
  cobalt: 'border-cobalt/40 text-cobalt',
  neutral: 'border-field-line text-umber-soft',
}

export default function RoleLabel({ role, className }: { role: UserRole; className?: string }) {
  return (
    <span
      className={cn(
        'inline-block shrink-0 rounded-tag border px-1.5 py-px font-mono text-label uppercase',
        SIDE_CLASSES[ROLE_SIDE[role]],
        className,
      )}
    >
      {ROLE_LABELS[role]}
    </span>
  )
}
