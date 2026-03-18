import Link from 'next/link'
import type { UserResult } from '@/lib/directory/queries'

type UserRole = UserResult['role']

// ---------------------------------------------------------------------------
// Avatar — coloured initials (matches BriefView pattern)
// ---------------------------------------------------------------------------

const AVATAR_COLORS = [
  'bg-amber-700',
  'bg-emerald-700',
  'bg-sky-700',
  'bg-purple-700',
  'bg-rose-700',
]

function Avatar({ name, avatarUrl }: { name: string; avatarUrl: string | null }) {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className="w-10 h-10 rounded-full object-cover shrink-0 ring-2 ring-edge"
      />
    )
  }
  return (
    <div
      className={`w-10 h-10 ${AVATAR_COLORS[idx]} rounded-full flex items-center justify-center shrink-0 select-none`}
    >
      <span className="text-white text-sm font-bold">{name.charAt(0).toUpperCase()}</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Role badge — exact colours from ProfileView
// ---------------------------------------------------------------------------

const ROLE_BADGE_CLASS: Record<UserRole, string> = {
  creator:      'bg-blue-100 text-blue-700',
  journalist:   'bg-purple-100 text-purple-700',
  expert:       'bg-green-100 text-green-700',
  organisation: 'bg-amber-100 text-amber-700',
  admin:        'bg-red-100 text-red-700',
}

const ROLE_LABEL: Record<UserRole, string> = {
  creator:      'Creator',
  journalist:   'Journalist',
  expert:       'Expert',
  organisation: 'Organisation',
  admin:        'Admin',
}

// Left-border accent per role — adds identity to the grid at a glance
const ROLE_BORDER: Record<UserRole, string> = {
  creator:      'border-l-blue-300',
  journalist:   'border-l-purple-300',
  expert:       'border-l-green-300',
  organisation: 'border-l-amber-300',
  admin:        'border-l-red-300',
}

// ---------------------------------------------------------------------------
// Affiliation line — what to show varies by role
// ---------------------------------------------------------------------------

function affiliationLine(user: UserResult): string | null {
  if (user.role === 'expert')       return user.affiliation ?? null
  if (user.role === 'organisation') return user.org_name ?? null
  if (user.role === 'creator' || user.role === 'journalist') {
    if (!user.primary_platform) return null
    return user.primary_platform.charAt(0).toUpperCase() + user.primary_platform.slice(1)
  }
  return null
}

// ---------------------------------------------------------------------------
// Availability dot — only shown when open or limited
// ---------------------------------------------------------------------------

function AvailabilityDot({ status }: { status: string | null }) {
  if (!status || status === 'unavailable') return null
  const isOpen = status === 'open'
  return (
    <span className="inline-flex items-center gap-1">
      <span
        className={`h-1.5 w-1.5 rounded-full shrink-0 ${isOpen ? 'bg-green-500' : 'bg-amber-400'}`}
        aria-hidden
      />
      <span
        className={`font-mono text-[8px] tracking-[0.1em] uppercase ${
          isOpen ? 'text-green-700' : 'text-amber-600'
        }`}
      >
        {isOpen ? 'Available' : 'Limited'}
      </span>
    </span>
  )
}

// ---------------------------------------------------------------------------
// UserCard
// ---------------------------------------------------------------------------

export default function UserCard({ user }: { user: UserResult }) {
  const name        = user.display_name?.trim() || 'Unknown'
  const affiliation = affiliationLine(user)
  const bioExcerpt  = user.bio
    ? user.bio.length > 120 ? user.bio.slice(0, 120).trimEnd() + '…' : user.bio
    : null
  const areas    = (user.areas_of_focus ?? []).slice(0, 3)
  const extraAreas = (user.areas_of_focus?.length ?? 0) - areas.length

  return (
    <article
      className={`bg-card border border-edge border-l-[3px] ${ROLE_BORDER[user.role]} rounded-xl rounded-l-none flex flex-col overflow-hidden hover:shadow-md transition-shadow duration-200`}
    >
      <div className="p-5 flex flex-col gap-3 flex-1">

        {/* Header: avatar + name + badge */}
        <div className="flex items-start gap-3">
          <Avatar name={name} avatarUrl={user.avatar_url} />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-0.5">
              <p className="font-display uppercase text-dark text-sm leading-tight">
                {name}
              </p>
              <span
                className={`shrink-0 inline-block px-2 py-0.5 rounded-full font-mono text-[8px] tracking-[0.12em] uppercase ${ROLE_BADGE_CLASS[user.role]}`}
              >
                {ROLE_LABEL[user.role]}
              </span>
            </div>
            {affiliation && (
              <p className="font-mono text-[9px] tracking-[0.08em] text-soft/80 truncate">
                {affiliation}
              </p>
            )}
          </div>
        </div>

        {/* Bio excerpt */}
        {bioExcerpt && (
          <p className="font-serif text-[0.8rem] text-soft leading-relaxed">
            {bioExcerpt}
          </p>
        )}

        {/* Areas of focus chips */}
        {areas.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-auto pt-1">
            {areas.map((area) => (
              <span
                key={area}
                className="px-2 py-0.5 bg-green-50 text-green-700 rounded-full font-mono text-[8px] tracking-[0.08em]"
              >
                {area}
              </span>
            ))}
            {extraAreas > 0 && (
              <span className="px-2 py-0.5 bg-edge text-soft rounded-full font-mono text-[8px] tracking-[0.08em]">
                +{extraAreas}
              </span>
            )}
          </div>
        )}

      </div>

      {/* Footer: availability + profile link */}
      <div className="px-5 py-3 border-t border-edge flex items-center justify-between gap-3">
        <AvailabilityDot status={user.availability} />
        <Link
          href={`/profile/${user.id}`}
          className="font-mono text-[9px] tracking-[0.15em] uppercase text-live hover:opacity-75 transition-opacity inline-flex items-center gap-1 group ml-auto"
        >
          View profile{' '}
          <span className="group-hover:translate-x-0.5 transition-transform" aria-hidden>
            →
          </span>
        </Link>
      </div>
    </article>
  )
}
