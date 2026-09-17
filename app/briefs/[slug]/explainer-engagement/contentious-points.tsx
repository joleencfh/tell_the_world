'use client'

import { useId, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import Avatar from '@/components/ui/Avatar'
import { submitContentiousPoint, submitContentiousPointLike } from '@/lib/briefs/explainer-engagement-actions'
import { getDisplayName } from '../helpers'
import type { ContentiousPoint, ExplainerComment } from '../page'
import type { EngagementAuthor } from '@/lib/data/explainer-engagement'
import { LikeReplyBar, ReplyArea, ReplyRow } from './shared'

export interface ExplainerSubsectionOption {
  id: string
  title: string
}

// ---------------------------------------------------------------------------
// Flag a contentious point — expert/organisation/admin, pending admin
// approval (same propose-then-pending shape as AddCoverageModal/
// SuggestCtaModal). Optional subsection dropdown, same denormalized-label
// tagging shape as FeedbackModal's own (feedback.tsx).
// ---------------------------------------------------------------------------

export function FlagContentiousPointModal({
  briefId,
  briefSlug,
  briefTitle,
  subsections,
  onClose,
}: {
  briefId: string
  briefSlug: string
  briefTitle: string
  subsections: ExplainerSubsectionOption[]
  onClose: () => void
}) {
  const [body, setBody] = useState('')
  const [subsectionId, setSubsectionId] = useState('')
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null)
  const bodyRef = useRef<HTMLTextAreaElement>(null)
  const bodyId = useId()
  const subsectionFieldId = useId()

  const isSubmitted = feedback?.type === 'success'
  const canSubmit = body.trim().length > 0

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFeedback(null)
    const label = subsections.find((s) => s.id === subsectionId)?.title ?? null
    startTransition(async () => {
      const result = await submitContentiousPoint(briefId, briefSlug, body, label)
      if (result.error) {
        setFeedback({ type: 'error', message: result.error })
        bodyRef.current?.focus()
      } else {
        setBody('')
        setFeedback({ type: 'success', message: 'Thanks — submitted for review. It will appear here once approved.' })
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label="Flag a contentious point">
      <div className="absolute inset-0 bg-ink/60 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-xl overflow-hidden border border-line bg-paper">
        <div className="flex items-start justify-between border-b border-line px-7 pb-5 pt-7">
          <div>
            <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.2em] text-pink-ink">Public &middot; visible to every reader</p>
            <h2 className="font-display text-xl uppercase leading-tight text-ink">Flag a contentious point</h2>
            <p className="mt-1.5 font-body text-xs italic leading-snug text-ink-soft">For: {briefTitle}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ touchAction: 'manipulation' }}
            className="ml-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-paper-raised text-lg leading-none text-ink-soft outline-none transition-colors hover:bg-line hover:text-ink focus-visible:ring-2 focus-visible:ring-pink"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-7 py-6">
          {subsections.length > 0 && (
            <div>
              <label htmlFor={subsectionFieldId} className="mb-2 block font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">
                Which part is this about? (optional)
              </label>
              <select
                id={subsectionFieldId}
                value={subsectionId}
                onChange={(e) => setSubsectionId(e.target.value)}
                disabled={isPending || isSubmitted}
                className="w-full border border-line bg-paper px-4 py-2.5 font-body text-sm text-ink transition focus:outline-none focus:ring-2 focus:ring-pink disabled:opacity-50"
              >
                <option value="">General — about the Explainer as a whole</option>
                {subsections.map((s) => (
                  <option key={s.id} value={s.id}>{s.title}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label htmlFor={bodyId} className="mb-2 block font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">
              Your take
            </label>
            <textarea
              id={bodyId}
              ref={bodyRef}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              maxLength={1000}
              placeholder="What's contentious here, and what's your read on it?"
              disabled={isPending || isSubmitted}
              className="w-full resize-none border border-line bg-paper px-4 py-2.5 font-body text-sm text-ink placeholder:text-ink-faint/70 transition focus:outline-none focus:ring-2 focus:ring-pink disabled:opacity-50"
            />
          </div>

          {feedback && (
            <p
              role={feedback.type === 'error' ? 'alert' : undefined}
              aria-live="polite"
              className={`font-mono text-[10px] tracking-[0.1em] leading-relaxed ${feedback.type === 'error' ? 'text-pink-ink' : 'text-blue-ink'}`}
            >
              {feedback.message}
            </p>
          )}

          <div className="flex items-center gap-4 pt-1">
            {!isSubmitted && (
              <button
                type="submit"
                disabled={isPending || !canSubmit}
                style={{ touchAction: 'manipulation' }}
                className="bg-ink px-6 py-3 font-mono text-xs uppercase tracking-widest text-paper transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {isPending ? 'Submitting…' : 'Submit for review'}
              </button>
            )}
            <button type="button" onClick={onClose} className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink-faint transition-colors hover:text-ink">
              {isSubmitted ? 'Close' : 'Cancel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Contentious points panel
// ---------------------------------------------------------------------------

function ContentiousPointRow({
  point,
  briefId,
  briefSlug,
  currentUser,
  replies,
  onReplyPosted,
}: {
  point: ContentiousPoint
  briefId: string
  briefSlug: string
  currentUser: EngagementAuthor | null
  replies: ExplainerComment[]
  onReplyPosted: (reply: ExplainerComment) => void
}) {
  const name = getDisplayName({ display_name: point.users.display_name })
  const credential = [point.users.job_title, point.users.affiliation || point.users.org_name].filter(Boolean).join(', ')
  const [likeCount, setLikeCount] = useState(point.likeCount)
  const [liked, setLiked] = useState(point.myLike)
  const [likePending, startLikeTransition] = useTransition()
  const [replyOpen, setReplyOpen] = useState(false)

  function handleLike() {
    const next = !liked
    setLiked(next)
    setLikeCount((c) => Math.max(0, c + (next ? 1 : -1)))
    startLikeTransition(async () => {
      const result = await submitContentiousPointLike(point.id, briefSlug)
      if (result.error) {
        setLiked(!next)
        setLikeCount((c) => Math.max(0, c + (next ? -1 : 1)))
      }
    })
  }

  return (
    <div className="py-2.5 first:pt-0 [&:not(:first-child)]:border-t [&:not(:first-child)]:border-pink-ink/15">
      <div className="flex gap-2.5">
        <Avatar name={name} avatarUrl={point.users.avatar_url} size="xs" palette="colored" shape={point.users.role === 'organisation' ? 'square' : 'circle'} />
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-baseline gap-x-2">
            <Link href={`/profile/${point.users.id}`} className="font-mono text-[10.5px] font-semibold text-ink hover:text-pink-ink transition-colors">
              {name}
            </Link>
            {credential && <span className="font-body text-[10px] italic text-ink-faint">{credential}</span>}
            {point.subsection_label && (
              <span className="border border-pink-ink/30 bg-paper px-1.5 py-[0.05rem] font-mono text-[8.5px] text-pink-ink">
                on &ldquo;{point.subsection_label}&rdquo;
              </span>
            )}
          </p>
          <p className="mt-0.5 break-words font-body text-sm leading-relaxed text-ink-soft">{point.body}</p>
          <LikeReplyBar
            isLoggedIn={!!currentUser}
            showLike
            likeCount={likeCount}
            myLike={liked}
            onLike={handleLike}
            likePending={likePending}
            replyCount={replies.length}
            onToggleReply={() => setReplyOpen((o) => !o)}
            replyOpen={replyOpen}
          />
          <ReplyArea
            open={replyOpen}
            briefId={briefId}
            briefSlug={briefSlug}
            currentUser={currentUser}
            contentiousPointId={point.id}
            replyToName={name}
            onPosted={(r) => {
              onReplyPosted(r)
              setReplyOpen(false)
            }}
          />
        </div>
      </div>
      {replies.length > 0 && (
        <div className="ml-[2.65rem] mt-1 border-l-2 border-pink-ink/20 pl-3">
          {replies.map((r) => (
            <ReplyRow
              key={r.id}
              reply={r}
              briefId={briefId}
              briefSlug={briefSlug}
              currentUser={currentUser}
              rootId={point.id}
              rootKind="contentious"
              onReplyPosted={onReplyPosted}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Collapsed to the first point by default (2026-08-27) — a "Show N more"
// reveal, same plain-reveal shape as SourcesGrid's own (sources.tsx), just
// capped at 1 instead of 6 since these read more like individual posts
// than a grid.
export function ContentiousPointsList({
  points,
  briefId,
  briefSlug,
  currentUser,
  repliesByPoint,
  onReplyPosted,
}: {
  points: ContentiousPoint[]
  briefId: string
  briefSlug: string
  currentUser: EngagementAuthor | null
  repliesByPoint: Map<string, ExplainerComment[]>
  onReplyPosted: (reply: ExplainerComment) => void
}) {
  const [showAll, setShowAll] = useState(false)
  if (points.length === 0) return null

  const visible = showAll ? points : points.slice(0, 1)
  const remaining = points.length - visible.length

  return (
    <div className="border-l-[3px] border-pink bg-pink-soft px-4 py-3.5">
      <p className="mb-1 flex items-center gap-1.5 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-pink-ink">
        <span aria-hidden>⚡</span> Contested &middot; {points.length} {points.length === 1 ? 'expert' : 'experts'}
      </p>
      {visible.map((p) => (
        <ContentiousPointRow
          key={p.id}
          point={p}
          briefId={briefId}
          briefSlug={briefSlug}
          currentUser={currentUser}
          replies={repliesByPoint.get(p.id) ?? []}
          onReplyPosted={onReplyPosted}
        />
      ))}
      {points.length > 1 && (
        <button
          type="button"
          onClick={() => setShowAll((s) => !s)}
          style={{ touchAction: 'manipulation' }}
          className="mt-2 inline-flex border-[1.5px] border-pink bg-paper px-4 py-1.5 font-mono text-[0.68rem] uppercase tracking-[0.1em] text-pink-ink outline-none transition-colors hover:bg-pink hover:text-white focus-visible:ring-2 focus-visible:ring-pink"
        >
          {showAll ? 'Show less' : `Show ${remaining} more`}
        </button>
      )}
    </div>
  )
}
