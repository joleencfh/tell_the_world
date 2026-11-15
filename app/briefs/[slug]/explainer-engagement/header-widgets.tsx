'use client'

import { cloneElement, useEffect, useId, useState, useTransition, type ReactElement } from 'react'
import Link from 'next/link'
import Author from '@/components/ui/Author'
import Modal from '@/components/ui/Modal'
import { submitExplainerUsefulVote, getExplainerUsefulLikers } from '@/lib/briefs/explainer-engagement-actions'
import { getDisplayName } from '../helpers'
import type { ExplainerUsefulness } from '../page'
import type { EngagementAuthor } from '@/lib/data/explainer-engagement'
import { ThumbsUpIcon } from './shared'

// ---------------------------------------------------------------------------
// Tooltip — same visual language as the Explainer body's existing keyterm
// tooltip (explainer.tsx's Keyterm component): dark ink bubble, plain
// sentence-case body text, fades in on hover/focus. Clones its child to
// attach aria-describedby automatically rather than requiring every call
// site to generate and wire its own id. Only used by the header widgets
// below — the comment/reply like+reply icons are deliberately tooltip-free
// (2026-08-27), same reasoning as the comment submit button: a hover color
// change is enough for something this small and repeated.
// ---------------------------------------------------------------------------

function Tooltip({ label, children }: { label: string; children: ReactElement }) {
  const id = useId()
  return (
    <span className="group relative inline-flex" style={{ touchAction: 'manipulation' }}>
      {cloneElement(children, { 'aria-describedby': id } as Record<string, unknown>)}
      <span
        role="tooltip"
        id={id}
        className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-max max-w-[11rem] -translate-x-1/2 rounded-control bg-umber px-2.5 py-1.5 text-center font-ui text-caption font-normal not-italic text-parchment opacity-0 shadow-menu transition-opacity duration-150 motion-reduce:transition-none group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {label}
      </span>
    </span>
  )
}

// ---------------------------------------------------------------------------
// Header widgets — usefulness, comments, contentious, in that order, right
// under the Explainer SectionHeader's own description (explainer.tsx
// renders this first, before the subsections). Comments/contentious have
// nothing to vote on, so their whole icon+count is one scroll-link down to
// the footer below; usefulness is the only real vote, split into two
// separate click targets (icon votes, count opens the likers modal).
// ---------------------------------------------------------------------------

function UsefulWidget({
  briefId,
  briefSlug,
  usefulness,
  canVote,
  isLoggedIn,
  onShowLikers,
}: {
  briefId: string
  briefSlug: string
  usefulness: ExplainerUsefulness
  canVote: boolean
  isLoggedIn: boolean
  onShowLikers: () => void
}) {
  const [count, setCount] = useState(usefulness.count)
  const [liked, setLiked] = useState(usefulness.liked)
  const [isPending, startTransition] = useTransition()

  function handleVote() {
    if (!canVote || isPending) return
    const nextLiked = !liked
    setLiked(nextLiked)
    setCount((c) => Math.max(0, c + (nextLiked ? 1 : -1)))
    startTransition(async () => {
      const result = await submitExplainerUsefulVote(briefId, briefSlug)
      if (result.error) {
        setLiked(!nextLiked)
        setCount((c) => Math.max(0, c + (nextLiked ? -1 : 1)))
      }
    })
  }

  const iconTooltip = !isLoggedIn
    ? 'Log in to vote'
    : !canVote
      ? 'Creators, journalists, and admin can vote'
      : liked
        ? 'You marked this useful — click to undo'
        : 'Mark as useful'

  return (
    <div className="flex items-center gap-1.5" aria-live="polite">
      <Tooltip label={iconTooltip}>
        <button
          type="button"
          onClick={handleVote}
          disabled={isPending || !canVote}
          aria-pressed={liked}
          aria-label={liked ? 'Unlike' : 'Like'}
          style={{ touchAction: 'manipulation' }}
          className={`flex size-11 items-center justify-center rounded-control border transition-colors focus-ring disabled:cursor-default ${
            liked
              ? 'border-cobalt bg-cobalt-wash text-cobalt'
              : 'border-field-line bg-vellum text-umber-soft hover:border-cobalt hover:text-cobalt disabled:hover:border-field-line disabled:hover:text-umber-soft'
          }`}
        >
          <ThumbsUpIcon filled={liked} />
        </button>
      </Tooltip>
      <Tooltip label="See who found this useful">
        <button
          type="button"
          onClick={onShowLikers}
          style={{ touchAction: 'manipulation' }}
          className="inline-flex min-h-11 min-w-11 items-center justify-center font-ui text-ui-sm font-semibold tabular-nums text-umber-soft underline underline-offset-2 transition-colors hover:text-cobalt focus-ring"
        >
          {count}
        </button>
      </Tooltip>
    </div>
  )
}

function ScrollWidget({ href, icon, count, label }: { href: string; icon: string; count: number; label: string }) {
  return (
    <Tooltip label={label}>
      <a
        href={href}
        style={{ touchAction: 'manipulation' }}
        className="inline-flex min-h-11 items-center gap-1.5 font-ui text-umber-soft no-underline transition-colors hover:text-cobalt focus-ring"
      >
        <span aria-hidden className="text-ui leading-none">{icon}</span>
        <span className="text-ui-sm font-semibold tabular-nums">{count}</span>
      </a>
    </Tooltip>
  )
}

export function ExplainerHeaderWidgets({
  briefId,
  briefSlug,
  usefulness,
  canVoteUseful,
  isLoggedIn,
  commentsCount,
  contentiousCount,
  onShowUsefulLikers,
}: {
  briefId: string
  briefSlug: string
  usefulness: ExplainerUsefulness
  canVoteUseful: boolean
  isLoggedIn: boolean
  commentsCount: number
  contentiousCount: number
  onShowUsefulLikers: () => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-2.5 sm:gap-6">
      <UsefulWidget
        briefId={briefId}
        briefSlug={briefSlug}
        usefulness={usefulness}
        canVote={canVoteUseful}
        isLoggedIn={isLoggedIn}
        onShowLikers={onShowUsefulLikers}
      />
      <ScrollWidget href="#explainer-comments" icon="💬" count={commentsCount} label="Jump to comments" />
      <ScrollWidget href="#contentious-points" icon="⚡" count={contentiousCount} label="Jump to contentious points" />
    </div>
  )
}

// ---------------------------------------------------------------------------
// "Found this useful" — fetched on open, not part of the page's initial
// load (mirrors CoverageDetailModal's likers fetch). Rendered by
// brief-modals.tsx, triggered by UsefulWidget's count button above.
// ---------------------------------------------------------------------------

export function UsefulLikersModal({ briefId, onClose }: { briefId: string; onClose: () => void }) {
  const [likers, setLikers] = useState<EngagementAuthor[] | null>(null)

  useEffect(() => {
    let cancelled = false
    getExplainerUsefulLikers(briefId).then((result) => {
      if (!cancelled) setLikers(result)
    })
    return () => {
      cancelled = true
    }
  }, [briefId])

  return (
    <Modal open onClose={onClose} size="narrow" eyebrow="Explainer · Useful" title="Found this useful">
      <div className="mt-3 max-h-[60vh] overflow-y-auto">
        {likers === null ? (
          <p className="font-ui text-ui-sm text-umber-soft">Loading…</p>
        ) : likers.length === 0 ? (
          <p className="font-ui text-ui-sm text-umber-soft">No one yet.</p>
        ) : (
          <ul className="space-y-1">
            {likers.map((l) => {
              const name = getDisplayName({ display_name: l.display_name })
              return (
                <li key={l.id}>
                  <Link href={`/profile/${l.id}`} className="focus-ring flex min-h-11 items-center rounded-control transition-colors hover:text-cobalt">
                    <Author name={name} role={l.role} avatarUrl={l.avatar_url} size="sm" />
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </Modal>
  )
}
