'use client'

import Link from 'next/link'
import Avatar from '@/components/ui/Avatar'
import RoleBadge from '@/components/ui/RoleBadge'
import { getDisplayName } from '../helpers'
import type { ContentiousPoint, ExplainerComment } from '../page'
import type { EngagementAuthor } from '@/lib/data/explainer-engagement'

// ---------------------------------------------------------------------------
// Contributors — union of contested-by authors, commenters, and repliers
// (every author present in `comments`, root or reply), deduped. Moved to the
// top of the Explainer section, just above ExplainerHeaderWidgets (design
// proposal confirmed 2026-08-27) — plain linked names rather than the
// previous avatar-chip row, since a name-only list reads faster at the top
// of the section; a hover/focus card (ContributorCard below) carries the
// avatar/role/credential detail that the chips used to show inline. Card
// uses `position: absolute` off a `relative` wrapper, not `fixed`, so it
// doesn't hit the anim-rise containing-block issue documented elsewhere on
// this page (BriefView.tsx) — no need to hoist it to brief-modals.tsx. The
// card itself is deliberately non-interactive (no "View profile" link) —
// it's separated from the name by a gap (mt-2), so the mouse leaves the
// group's hover area crossing that gap and the card closes before a click
// could land; the name link is the only way to reach the profile.
// ---------------------------------------------------------------------------

function contributorCredential(user: EngagementAuthor): string | null {
  if (user.role === 'organisation') return null
  const credential = [user.job_title, user.affiliation].filter(Boolean).join(', ')
  return credential || null
}

function ContributorCard({ user }: { user: EngagementAuthor }) {
  const name = getDisplayName({ display_name: user.display_name })
  const credential = contributorCredential(user)

  return (
    <div
      role="tooltip"
      className="pointer-events-none absolute left-0 top-full z-30 mt-2 w-60 translate-y-1 rounded-control bg-vellum text-left opacity-0 shadow-menu transition-all duration-150 motion-reduce:transition-none group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100"
    >
      <div className="flex items-center gap-3 border-b border-window-line px-4 py-3">
        <Avatar name={name} avatarUrl={user.avatar_url} size="sm" role={user.role} />
        <div className="min-w-0">
          <p className="truncate font-ui text-ui-sm font-semibold text-umber">{name}</p>
          <div className="mt-1"><RoleBadge role={user.role} /></div>
        </div>
      </div>
      <div className="px-4 py-3">
        {credential ? (
          <p className="font-ui text-caption text-umber-soft">{credential}</p>
        ) : (
          <p className="font-ui text-caption text-umber-soft">
            {user.role === 'organisation' ? 'Organisation account' : 'No affiliation on file'}
          </p>
        )}
      </div>
    </div>
  )
}

export function ContributorsStrip({ points, comments }: { points: ContentiousPoint[]; comments: ExplainerComment[] }) {
  const byId = new Map<string, EngagementAuthor>()
  for (const p of points) byId.set(p.users.id, p.users)
  for (const c of comments) byId.set(c.users.id, c.users)
  const contributors = [...byId.values()]

  if (contributors.length === 0) return null

  return (
    <div className="space-y-2">
      <p className="font-mono text-label uppercase text-umber-soft">Contributors</p>
      <div className="flex flex-wrap items-center">
        {contributors.map((user, i) => {
          const name = getDisplayName({ display_name: user.display_name })
          return (
            <span key={user.id} className="group relative inline-flex items-center">
              <Link
                href={`/profile/${user.id}`}
                className="inline-flex min-h-11 items-center border-b-2 border-transparent font-ui text-ui-sm text-umber transition-colors hover:border-cobalt hover:text-cobalt focus-ring"
              >
                {name}
              </Link>
              <ContributorCard user={user} />
              {i < contributors.length - 1 && (
                <span className="ml-2 text-field-line" aria-hidden>&middot;</span>
              )}
            </span>
          )
        })}
      </div>
    </div>
  )
}
