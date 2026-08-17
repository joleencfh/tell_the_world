import Link from 'next/link'
import type { UserResult } from '@/lib/directory/queries'
import Avatar from '@/components/ui/Avatar'
import RoleBadge from '@/components/ui/RoleBadge'

type UserRole = UserResult['role']

// ---------------------------------------------------------------------------
// Left-border accent per role — adds identity to the grid at a glance.
// Two-Ink Bold semantic tone, same split as RoleBadge: blue = expert/org
// verification, pink = creator/journalist engagement, neutral for admin.
// ---------------------------------------------------------------------------

const ROLE_BORDER: Record<UserRole, string> = {
  creator:      'border-l-pink/40',
  journalist:   'border-l-pink/40',
  expert:       'border-l-blue/40',
  organisation: 'border-l-blue/40',
  admin:        'border-l-line-strong',
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
// Availability dot — only shown when open or limited. Two-Ink Bold has no
// traffic-light palette, so this stays inside the blue/neutral discipline
// rather than introducing a third accent color: blue for the positive
// "open" state, neutral ink-soft for the lesser "limited" state.
// ---------------------------------------------------------------------------

function AvailabilityDot({ status }: { status: string | null }) {
  if (!status || status === 'unavailable') return null
  const isOpen = status === 'open'
  return (
    <span className="inline-flex items-center gap-1">
      <span
        className={`h-1.5 w-1.5 rounded-full shrink-0 ${isOpen ? 'bg-blue' : 'bg-ink-soft/50'}`}
        aria-hidden
      />
      <span
        className={`font-mono text-[8px] tracking-[0.1em] uppercase ${
          isOpen ? 'text-blue-ink' : 'text-ink-soft'
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
      className={`bg-paper-raised border border-line border-l-[3px] ${ROLE_BORDER[user.role]} rounded-xl rounded-l-none flex flex-col overflow-hidden hover:shadow-md transition-shadow duration-200`}
    >
      <div className="p-5 flex flex-col gap-3 flex-1">

        {/* Header: avatar + name + badge */}
        <div className="flex items-start gap-3">
          <Avatar
            name={name}
            avatarUrl={user.avatar_url}
            palette="colored"
            size="md"
            ringClassName="ring-2 ring-line"
          />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-0.5">
              <p className="font-display uppercase text-ink text-sm leading-tight">
                {name}
              </p>
              <RoleBadge role={user.role} size="xs" />
            </div>
            {affiliation && (
              <p className="font-mono text-[9px] tracking-[0.08em] text-ink-soft/80 truncate">
                {affiliation}
              </p>
            )}
          </div>
        </div>

        {/* Bio excerpt */}
        {bioExcerpt && (
          <p className="font-body text-[0.8rem] text-ink-soft leading-relaxed">
            {bioExcerpt}
          </p>
        )}

        {/* Areas of focus chips */}
        {areas.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-auto pt-1">
            {areas.map((area) => (
              <span
                key={area}
                className="px-2 py-0.5 bg-paper text-ink-soft border border-line rounded-full font-mono text-[8px] tracking-[0.08em]"
              >
                {area}
              </span>
            ))}
            {extraAreas > 0 && (
              <span className="px-2 py-0.5 bg-line text-ink-soft rounded-full font-mono text-[8px] tracking-[0.08em]">
                +{extraAreas}
              </span>
            )}
          </div>
        )}

      </div>

      {/* Footer: availability + profile link */}
      <div className="px-5 py-3 border-t border-line flex items-center justify-between gap-3">
        <AvailabilityDot status={user.availability} />
        <Link
          href={`/profile/${user.id}`}
          className="font-mono text-[9px] tracking-[0.15em] uppercase text-ink-soft hover:text-ink transition-colors inline-flex items-center gap-1 group ml-auto"
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
