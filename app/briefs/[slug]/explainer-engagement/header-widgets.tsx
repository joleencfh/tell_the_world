'use client'

import { cloneElement, useEffect, useId, useState, useTransition, type ReactElement } from 'react'
import Link from 'next/link'
import Avatar from '@/components/ui/Avatar'
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
        className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-max max-w-[11rem] -translate-x-1/2 rounded bg-ink px-2.5 py-1.5 text-center font-body text-[11px] font-normal not-italic leading-snug text-paper opacity-0 shadow-lg transition-opacity duration-150 motion-reduce:transition-none group-hover:opacity-100 group-focus-within:opacity-100"
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
    <div className="flex items-center gap-1 sm:gap-1.5 border sm:border-0 border-line px-1 py-1 sm:px-0 sm:py-0" aria-live="polite">
      <Tooltip label={iconTooltip}>
        <button
          type="button"
          onClick={handleVote}
          disabled={isPending || !canVote}
          aria-pressed={liked}
          aria-label={liked ? 'Unlike' : 'Like'}
          style={{ touchAction: 'manipulation' }}
          className={`flex h-7 w-7 items-center justify-center border-0 sm:border outline-none transition-colors focus-visible:ring-2 focus-visible:ring-blue disabled:cursor-default ${
            liked
              ? 'sm:border-blue sm:bg-blue-soft text-blue-ink'
              : 'sm:border-line-strong bg-paper text-ink-faint hover:text-blue-ink sm:hover:border-blue disabled:hover:text-ink-faint sm:disabled:hover:border-line-strong'
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
          className="font-mono text-xs sm:text-sm font-semibold text-ink-soft no-underline sm:underline sm:decoration-dotted sm:underline-offset-2 outline-none transition-colors hover:text-blue-ink focus-visible:ring-2 focus-visible:ring-blue"
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
        className="inline-flex items-center gap-1 sm:gap-1.5 border sm:border-0 border-line px-1 py-1 sm:px-0 sm:py-0 font-mono text-ink-soft no-underline outline-none transition-colors hover:text-blue-ink focus-visible:ring-2 focus-visible:ring-blue"
      >
        <span aria-hidden className="text-[0.85rem] sm:text-[0.95rem] leading-none">{icon}</span>
        <span className="text-xs sm:text-sm font-semibold">{count}</span>
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
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label="Found this useful">
      <div className="absolute inset-0 bg-ink/60 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-sm overflow-hidden border-[1.5px] border-ink bg-paper">
        <div className="flex items-start justify-between border-b-[1.5px] border-ink px-7 pb-5 pt-7">
          <div>
            <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.2em] text-blue-ink">Explainer &middot; Useful</p>
            <h2 className="font-display text-xl uppercase leading-tight text-ink">Found this useful</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ touchAction: 'manipulation' }}
            className="ml-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-paper-raised text-lg leading-none text-ink-soft outline-none transition-colors hover:bg-line hover:text-ink focus-visible:ring-2 focus-visible:ring-blue"
          >
            ×
          </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto px-7 py-6">
          {likers === null ? (
            <p className="font-mono text-[10px] text-ink-faint">Loading…</p>
          ) : likers.length === 0 ? (
            <p className="font-mono text-xs text-ink-faint">No one yet.</p>
          ) : (
            <div className="space-y-1">
              {likers.map((l) => {
                const name = getDisplayName({ display_name: l.display_name })
                return (
                  <Link key={l.id} href={`/profile/${l.id}`} className="flex items-center gap-2.5 py-1.5 transition-colors hover:text-blue-ink">
                    <Avatar name={name} avatarUrl={l.avatar_url} size="xs" palette="colored" shape={l.role === 'organisation' ? 'square' : 'circle'} />
                    <span className="font-mono text-[11px] text-ink">{name}</span>
                    <span className="font-body text-[10px] italic capitalize text-ink-faint">{l.role}</span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
