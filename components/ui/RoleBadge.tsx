import type { UserRole } from '@/lib/types'
import RoleLabel from './RoleLabel'

// Compatibility wrapper. The design system has ONE role label (RoleLabel:
// bordered, 12px, no fill), so the old filled "pill" and "outline" variants
// and the three sizes collapse into it. The props are kept so the 12 existing
// callers keep compiling; they are removed as each screen migrates to
// RoleLabel directly (docs/design/design-system/migration.md, section 4).

export type RoleBadgeSize = 'xs' | 'sm' | 'md'
export type RoleBadgeVariant = 'pill' | 'outline'

export interface RoleBadgeProps {
  role: UserRole
  /** @deprecated Ignored: there is one variant. */
  variant?: RoleBadgeVariant
  /** @deprecated Ignored: there is one size. */
  size?: RoleBadgeSize
}

export default function RoleBadge({ role }: RoleBadgeProps) {
  return <RoleLabel role={role} />
}
