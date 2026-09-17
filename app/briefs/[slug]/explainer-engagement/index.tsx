'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { ContentiousPoint, ExplainerComment } from '../page'
import type { EngagementAuthor } from '@/lib/data/explainer-engagement'
import { buttonBase } from './shared'
import { ContentiousPointsList } from './contentious-points'
import { CommentForm, CommentRow } from './comments'

export type { ExplainerSubsectionOption } from './contentious-points'
export { FlagContentiousPointModal } from './contentious-points'
export { ExplainerHeaderWidgets, UsefulLikersModal } from './header-widgets'
export { ContributorsStrip } from './contributors'

// ---------------------------------------------------------------------------
// Explainer engagement (Explainer Engagement Options design pass,
// 2026-08-26–27, superseding brief-page-part2-plan.md Part 5 step 6's
// per-subsection review/endorse) — four mechanisms:
//   1. Usefulness — a plain like (creator/journalist/admin), one icon+count
//      widget under the Explainer's own header, alongside 2 and 3 below.
//   2. Comments — any logged-in member, immediate publish, listed in the
//      footer, jumped to from its header widget. Likeable, and repliable
//      one level deep (migration 050) — LinkedIn-style, icon-only like/
//      reply controls, confirmed with the user 2026-08-27.
//   3. Contentious points (expert/organisation/admin, moderated) — listed
//      in the footer, jumped to from its header widget. Likeable (migration
//      051, own likes table since a point isn't an explainer_comments row)
//      and repliable the same way comments are.
// Private "send feedback to moderators" stays a header-level trigger
// (BriefView.tsx's Explainer SectionHeader action slot) — not part of this
// file. The two modals this file exports (FlagContentiousPointModal,
// UsefulLikersModal) are rendered by brief-modals.tsx, not by the
// components below that trigger them — see BriefView.tsx's own comment on
// why every modal on this page is hoisted to that top level.
//
// Split (2026-09-17, max-lines cleanup) into sibling modules in this
// directory: shared.tsx (icons, LikeReplyBar, reply form/area/row),
// contentious-points.tsx, comments.tsx, header-widgets.tsx, contributors.tsx
// — this file keeps only the composite footer below, re-exporting the rest
// so callers can keep importing from './explainer-engagement' unchanged.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Composite footer — contentious points and comments, each under a stable
// anchor the header widgets scroll to. Usefulness lives in the header
// widgets above, not here. `comments` (from the page's initial load) is a
// flat list of roots and replies together — split here into rootComments
// plus two lookup maps (by parent comment, by contentious point) rather
// than requiring the server to pre-group them.
// ---------------------------------------------------------------------------

export function ExplainerEngagement({
  briefId,
  briefSlug,
  contentiousPoints,
  comments,
  currentUser,
  canFlagContentious,
  onFlagContentious,
}: {
  briefId: string
  briefSlug: string
  contentiousPoints: ContentiousPoint[]
  comments: ExplainerComment[]
  // null when logged out — gates the comment form directly (rather than a
  // separate isLoggedIn flag), since the form also needs the user's display
  // info for its optimistic append.
  currentUser: EngagementAuthor | null
  canFlagContentious: boolean
  onFlagContentious: () => void
}) {
  const [localComments, setLocalComments] = useState(comments)
  // Collapsed to the first root comment by default (2026-08-27), same
  // "Show N more" reveal as ContentiousPointsList above — replies stay
  // fully visible under whichever roots are shown; the cap only applies to
  // how many roots are on screen.
  const [showAllComments, setShowAllComments] = useState(false)

  function appendComment(row: ExplainerComment) {
    setLocalComments((prev) => [...prev, row])
  }

  const rootComments = localComments.filter((c) => !c.parent_comment_id && !c.contentious_point_id)
  const repliesByComment = new Map<string, ExplainerComment[]>()
  const repliesByPoint = new Map<string, ExplainerComment[]>()
  for (const c of localComments) {
    if (c.parent_comment_id) {
      const list = repliesByComment.get(c.parent_comment_id) ?? []
      list.push(c)
      repliesByComment.set(c.parent_comment_id, list)
    } else if (c.contentious_point_id) {
      const list = repliesByPoint.get(c.contentious_point_id) ?? []
      list.push(c)
      repliesByPoint.set(c.contentious_point_id, list)
    }
  }

  const visibleRootComments = showAllComments ? rootComments : rootComments.slice(0, 1)
  const remainingComments = rootComments.length - visibleRootComments.length

  return (
    <div className="mt-10 space-y-8 border-t-[3px] border-ink pt-8">
      <div id="contentious-points" className="scroll-mt-20 space-y-4">
        {canFlagContentious && (
          <button
            type="button"
            onClick={onFlagContentious}
            style={{ touchAction: 'manipulation' }}
            className={`${buttonBase} border border-pink-ink/35 bg-pink-soft text-pink-ink hover:bg-pink-soft/70`}
          >
            <span aria-hidden>⚡</span> Flag a contentious point
          </button>
        )}
        <ContentiousPointsList
          points={contentiousPoints}
          briefId={briefId}
          briefSlug={briefSlug}
          currentUser={currentUser}
          repliesByPoint={repliesByPoint}
          onReplyPosted={appendComment}
        />
      </div>

      <div id="explainer-comments" className="scroll-mt-20 space-y-3">
        {/* Same treatment "Sources" gets elsewhere in the Explainer
            (explainer.tsx) — reused rather than a new label style. */}
        <p className="font-mono text-[10px] font-semibold tracking-[0.2em] uppercase text-blue-ink">
          Comments {rootComments.length > 0 && `(${rootComments.length})`}
        </p>
        {visibleRootComments.length > 0 && (
          <div>
            {visibleRootComments.map((c) => (
              <CommentRow
                key={c.id}
                comment={c}
                briefId={briefId}
                briefSlug={briefSlug}
                currentUser={currentUser}
                replies={repliesByComment.get(c.id) ?? []}
                onReplyPosted={appendComment}
              />
            ))}
          </div>
        )}
        {rootComments.length > 1 && (
          <button
            type="button"
            onClick={() => setShowAllComments((s) => !s)}
            style={{ touchAction: 'manipulation' }}
            className="inline-flex border-[1.5px] border-blue bg-paper px-4 py-1.5 font-mono text-[0.68rem] uppercase tracking-[0.1em] text-blue-ink outline-none transition-colors hover:bg-blue hover:text-white focus-visible:ring-2 focus-visible:ring-blue"
          >
            {showAllComments ? 'Show less' : `Show ${remainingComments} more`}
          </button>
        )}

        {currentUser ? (
          <CommentForm briefId={briefId} briefSlug={briefSlug} currentUser={currentUser} onPosted={appendComment} />
        ) : (
          <p className="font-mono text-[10px] text-ink-faint">
            <Link href="/login" className="text-blue-ink hover:underline">
              Log in
            </Link>{' '}
            to comment.
          </p>
        )}
      </div>
    </div>
  )
}
