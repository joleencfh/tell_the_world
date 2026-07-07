import type { UserRole } from '@/lib/types'

// Shared role badge primitive — consolidates 5 byte-identical "pill" style
// implementations (ContactModal, home, EditProfileModal, ProfileView,
// UserCard) that differed only in padding/text-size, plus BriefView's
// visually distinct dark-theme "outline" style. AdminScreen's role badge is
// intentionally NOT consolidated here — it badges application.desired_role
// (a different type, includes 'other', excludes 'admin') with its own color
// scheme, a different semantic domain from a user's actual role.

export type RoleBadgeSize = 'xs' | 'sm' | 'md'
export type RoleBadgeVariant = 'pill' | 'outline'

const PILL_COLORS: Record<UserRole, string> = {
  creator: 'bg-blue-100 text-blue-700',
  journalist: 'bg-purple-100 text-purple-700',
  expert: 'bg-green-100 text-green-700',
  organisation: 'bg-amber-100 text-amber-700',
  admin: 'bg-red-100 text-red-700',
}

const PILL_LABELS: Record<UserRole, string> = {
  creator: 'Creator',
  journalist: 'Journalist',
  expert: 'Expert',
  organisation: 'Organisation',
  admin: 'Admin',
}

// (padding, text size, letter spacing) per token — every distinct pill
// combination found across the app.
const PILL_SIZE_CLASSES: Record<RoleBadgeSize, string> = {
  xs: 'px-2 py-0.5 text-[8px] tracking-[0.12em]', // UserCard
  sm: 'px-2 py-0.5 text-[9px] tracking-[0.1em]', // home
  md: 'px-2.5 py-0.5 text-[9px] tracking-[0.12em]', // ContactModal, EditProfileModal, ProfileView
}

// BriefView's outline variant uses different labels for organisation
// ("Advocacy Organisation") — kept local to this variant since it's the
// only consumer.
const OUTLINE_LABELS: Record<UserRole, string> = {
  ...PILL_LABELS,
  organisation: 'Advocacy Organisation',
}

export interface RoleBadgeProps {
  role: UserRole
  variant?: RoleBadgeVariant
  size?: RoleBadgeSize
}

export default function RoleBadge({ role, variant = 'pill', size = 'md' }: RoleBadgeProps) {
  if (variant === 'outline') {
    return (
      <span className="font-mono text-[8px] tracking-[0.1em] uppercase text-live/70 border border-live/20 rounded px-1.5 py-0.5 shrink-0">
        {OUTLINE_LABELS[role]}
      </span>
    )
  }

  return (
    <span
      className={`inline-block rounded-full font-mono uppercase shrink-0 ${PILL_SIZE_CLASSES[size]} ${PILL_COLORS[role]}`}
    >
      {PILL_LABELS[role]}
    </span>
  )
}
