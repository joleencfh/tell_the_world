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

// Two-Ink Bold semantic tone, same split as OUTLINE_TONE_CLASSES below:
// blue = expert/org verification, pink = creator/journalist engagement,
// neutral ink for admin/comms specialist/other (no dedicated tone yet).
const PILL_COLORS: Record<UserRole, string> = {
  creator: 'bg-pink-soft text-pink-ink',
  journalist: 'bg-pink-soft text-pink-ink',
  expert: 'bg-blue-soft text-blue-ink',
  organisation: 'bg-blue-soft text-blue-ink',
  admin: 'bg-paper-raised text-ink-soft',
  comms_specialist: 'bg-paper-raised text-ink-soft',
  other: 'bg-paper-raised text-ink-soft',
}

const PILL_LABELS: Record<UserRole, string> = {
  creator: 'Creator',
  journalist: 'Journalist',
  expert: 'Expert',
  organisation: 'Organisation',
  admin: 'Admin',
  comms_specialist: 'Communications Specialist',
  other: 'Other',
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

// Two-Ink Bold semantic tone: blue = expert/org verification, pink =
// creator/journalist engagement (same split as app/briefs/[slug]/BriefView.tsx's
// voterTone), neutral ink for admin. text-pink-ink not raw text-pink — this
// label renders at 8px, well under the large-text contrast exemption (§1.1).
const OUTLINE_TONE_CLASSES: Record<UserRole, string> = {
  creator: 'text-pink-ink border-pink/20',
  journalist: 'text-pink-ink border-pink/20',
  expert: 'text-blue border-blue/20',
  organisation: 'text-blue border-blue/20',
  admin: 'text-ink-soft border-line-strong',
  comms_specialist: 'text-ink-soft border-line-strong',
  other: 'text-ink-soft border-line-strong',
}

export interface RoleBadgeProps {
  role: UserRole
  variant?: RoleBadgeVariant
  size?: RoleBadgeSize
}

export default function RoleBadge({ role, variant = 'pill', size = 'md' }: RoleBadgeProps) {
  if (variant === 'outline') {
    return (
      <span
        className={`font-mono text-[8px] tracking-[0.1em] uppercase border rounded px-1.5 py-0.5 shrink-0 ${OUTLINE_TONE_CLASSES[role]}`}
      >
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
