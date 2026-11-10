import Link from 'next/link'
import type { UserResult } from '@/lib/directory/queries'
import Author from '@/components/ui/Author'
import { buttonClasses } from '@/components/ui/Button'
import Tag from '@/components/ui/Tag'

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
// Availability — only shown when open or limited. A dot plus a word, so it is
// never colour alone: cobalt for the positive "open" state, neutral for the
// lesser "limited" state.
// ---------------------------------------------------------------------------

function AvailabilityDot({ status }: { status: string | null }) {
  if (!status || status === 'unavailable') return null
  const isOpen = status === 'open'
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={`size-1.5 shrink-0 rounded-full ${isOpen ? 'bg-cobalt-bright' : 'bg-umber-soft'}`}
        aria-hidden
      />
      <span className={`font-mono text-label uppercase ${isOpen ? 'text-cobalt' : 'text-umber-soft'}`}>
        {isOpen ? 'Available' : 'Limited'}
      </span>
    </span>
  )
}

// ---------------------------------------------------------------------------
// UserCard — the Member card (design-system.md 3.5): Author block, a short
// bio, and one primary action.
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
    <article className="flex h-full flex-col overflow-hidden rounded-control bg-vellum shadow-hairline">
      <div className="flex flex-1 flex-col gap-3 p-5">

        <Author name={name} avatarUrl={user.avatar_url} role={user.role} affiliation={affiliation} size="md" />

        {bioExcerpt && <p className="font-ui text-ui-sm text-umber-soft">{bioExcerpt}</p>}

        {areas.length > 0 && (
          <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
            {areas.map((area) => (
              <Tag key={area}>{area}</Tag>
            ))}
            {extraAreas > 0 && (
              <span className="inline-block rounded-tag bg-bone px-2 py-0.5 font-mono text-label tabular-nums text-umber-soft">
                +{extraAreas}
              </span>
            )}
          </div>
        )}

      </div>

      {/* Footer: availability + profile link */}
      <div className="flex items-center justify-between gap-3 border-t border-window-line px-5 py-3">
        <AvailabilityDot status={user.availability} />
        <Link
          href={`/profile/${user.id}`}
          className={buttonClasses({ variant: 'primary', small: true, className: 'ml-auto' })}
        >
          View profile
        </Link>
      </div>
    </article>
  )
}
