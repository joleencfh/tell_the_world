'use client'

import { cloneElement, useEffect, useId, useRef, useState, useTransition, type ReactElement } from 'react'
import Link from 'next/link'
import Avatar from '@/components/ui/Avatar'
import RoleBadge from '@/components/ui/RoleBadge'
import {
  submitContentiousPoint,
  submitContentiousPointLike,
  submitExplainerComment,
  submitExplainerCommentLike,
  submitExplainerUsefulVote,
  getExplainerUsefulLikers,
} from '@/lib/briefs/explainer-engagement-actions'
import { getDisplayName, formatDate } from './helpers'
import type { ContentiousPoint, ExplainerComment, ExplainerUsefulness } from './page'
import type { EngagementAuthor } from '@/lib/data/explainer-engagement'

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
// ---------------------------------------------------------------------------

export interface ExplainerSubsectionOption {
  id: string
  title: string
}

const buttonBase =
  'inline-flex items-center gap-1.5 px-4 py-2 font-mono text-[10px] tracking-[0.1em] uppercase outline-none transition-colors disabled:cursor-default disabled:opacity-60'

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

function ThumbsUpIcon({ filled, className }: { filled: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={`${className ?? 'h-[0.9rem] w-[0.9rem]'} shrink-0 ${filled ? 'fill-current' : 'fill-none'}`} aria-hidden>
      <path
        d="M6 18h9.2c.8 0 1.5-.5 1.7-1.3l1.6-6c.3-1.1-.6-2.2-1.7-2.2h-4.3l.6-3.3c.2-.9-.5-1.7-1.4-1.7-.5 0-.9.3-1.2.7L7 8.5V18ZM2 8.5h3V18H2z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-[0.8rem] w-[0.8rem]" aria-hidden>
      <path d="M4 10h11.5M11 5l5.5 5-5.5 5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ReplyIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-3 w-3 shrink-0" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 4.5h14a1 1 0 0 1 1 1v7.5a1 1 0 0 1-1 1H8.5l-3.8 2.7a.5.5 0 0 1-.8-.4v-2.3H3a1 1 0 0 1-1-1v-7.5a1 1 0 0 1 1-1Z" />
    </svg>
  )
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
            <p className="mt-2 font-body text-xs text-ink-faint">
              Shown publicly with your name once approved — not anonymous.
            </p>
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
// Like + reply bar — icon-only (2026-08-27, matching a LinkedIn-style
// comment thread the user referenced directly). The like button doubles as
// a static, non-interactive display when logged out (no dead click that
// would just come back as a server error) — same spirit as LikeButton's
// logged-out Link state elsewhere on this page, simplified since a reply
// is already the fallback path to prompt login.
// ---------------------------------------------------------------------------

function LikeReplyBar({
  isLoggedIn,
  showLike,
  likeCount,
  myLike,
  onLike,
  likePending,
  replyCount,
  onToggleReply,
  replyOpen,
}: {
  isLoggedIn: boolean
  showLike: boolean
  likeCount?: number
  myLike?: boolean
  onLike?: () => void
  likePending?: boolean
  replyCount?: number
  onToggleReply: () => void
  replyOpen: boolean
}) {
  return (
    <div className="mt-1 flex items-center gap-4">
      {showLike &&
        (isLoggedIn ? (
          <button
            type="button"
            onClick={onLike}
            disabled={likePending}
            aria-pressed={myLike}
            aria-label={myLike ? 'Unlike' : 'Like'}
            style={{ touchAction: 'manipulation' }}
            className={`inline-flex items-center gap-1 font-mono text-[10px] tabular-nums outline-none transition-colors focus-visible:ring-2 focus-visible:ring-blue disabled:cursor-default ${
              myLike ? 'text-blue-ink' : 'text-ink-faint hover:text-blue-ink'
            }`}
          >
            <ThumbsUpIcon filled={!!myLike} className="h-3 w-3" />
            {!!likeCount && likeCount}
          </button>
        ) : (
          <span className="inline-flex items-center gap-1 font-mono text-[10px] tabular-nums text-ink-faint">
            <ThumbsUpIcon filled={false} className="h-3 w-3" />
            {!!likeCount && likeCount}
          </span>
        ))}
      <button
        type="button"
        onClick={onToggleReply}
        aria-expanded={replyOpen}
        aria-label="Reply"
        style={{ touchAction: 'manipulation' }}
        className="inline-flex items-center gap-1 font-mono text-[10px] tabular-nums text-ink-faint outline-none transition-colors hover:text-blue-ink focus-visible:ring-2 focus-visible:ring-blue"
      >
        <ReplyIcon />
        {!!replyCount && replyCount}
      </button>
    </div>
  )
}

// A reply form — points at either a comment or a contentious point (never
// both), same insert this file's top-level CommentForm uses, just carrying
// one of the two id params. No submit-button label, matching the comment
// form's own icon-only convention.
function ReplyForm({
  briefId,
  briefSlug,
  currentUser,
  parentCommentId,
  contentiousPointId,
  placeholder,
  onPosted,
}: {
  briefId: string
  briefSlug: string
  currentUser: EngagementAuthor
  parentCommentId?: string
  contentiousPointId?: string
  placeholder: string
  onPosted: (reply: ExplainerComment) => void
}) {
  const [body, setBody] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const fieldId = useId()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await submitExplainerComment(briefId, briefSlug, body, parentCommentId ?? null, contentiousPointId ?? null)
      if (result.error) {
        setError(result.error)
      } else {
        onPosted({
          id: crypto.randomUUID(),
          body: body.trim(),
          created_at: new Date().toISOString(),
          parent_comment_id: parentCommentId ?? null,
          contentious_point_id: contentiousPointId ?? null,
          users: currentUser,
          likeCount: 0,
          myLike: false,
        })
        setBody('')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="relative mt-2">
      <label htmlFor={fieldId} className="sr-only">{placeholder}</label>
      <textarea
        id={fieldId}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={2}
        maxLength={1000}
        placeholder={placeholder}
        disabled={isPending}
        autoFocus
        className="w-full resize-none border border-line bg-paper py-2 pl-3 pr-11 font-body text-[13px] text-ink placeholder:text-ink-faint/70 focus:outline-none focus:ring-2 focus:ring-pink disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={isPending || !body.trim()}
        aria-label="Post reply"
        style={{ touchAction: 'manipulation' }}
        className="absolute bottom-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-ink text-paper outline-none transition-colors hover:bg-blue-ink focus-visible:ring-2 focus-visible:ring-blue disabled:cursor-default disabled:opacity-40 disabled:hover:bg-ink"
      >
        <ArrowIcon />
      </button>
      {error && (
        <p role="alert" className="mt-1 font-mono text-[10px] text-pink-ink">
          {error}
        </p>
      )}
    </form>
  )
}

// A logged-in-gated reply trigger: the toggled-open area either shows the
// reply form or, logged out, a login prompt — shared by every root/reply
// row below rather than duplicated three times.
function ReplyArea({
  open,
  briefId,
  briefSlug,
  currentUser,
  parentCommentId,
  contentiousPointId,
  replyToName,
  onPosted,
}: {
  open: boolean
  briefId: string
  briefSlug: string
  currentUser: EngagementAuthor | null
  parentCommentId?: string
  contentiousPointId?: string
  replyToName: string
  onPosted: (reply: ExplainerComment) => void
}) {
  if (!open) return null
  if (!currentUser) {
    return (
      <p className="mt-2 font-mono text-[10px] text-ink-faint">
        <Link href="/login" className="text-blue-ink hover:underline">
          Log in
        </Link>{' '}
        to reply.
      </p>
    )
  }
  return (
    <ReplyForm
      briefId={briefId}
      briefSlug={briefSlug}
      currentUser={currentUser}
      parentCommentId={parentCommentId}
      contentiousPointId={contentiousPointId}
      placeholder={`Reply to ${replyToName}…`}
      onPosted={onPosted}
    />
  )
}

// A single reply row — flat (migration 050): replying to a reply still
// posts under the same root, so this component never renders its own
// nested replies, and its reply button carries the root's id straight
// through rather than its own.
function ReplyRow({
  reply,
  briefId,
  briefSlug,
  currentUser,
  rootId,
  rootKind,
  onReplyPosted,
}: {
  reply: ExplainerComment
  briefId: string
  briefSlug: string
  currentUser: EngagementAuthor | null
  rootId: string
  rootKind: 'comment' | 'contentious'
  onReplyPosted: (reply: ExplainerComment) => void
}) {
  const name = getDisplayName({ display_name: reply.users.display_name })
  const [likeCount, setLikeCount] = useState(reply.likeCount)
  const [liked, setLiked] = useState(reply.myLike)
  const [likePending, startLikeTransition] = useTransition()
  const [replyOpen, setReplyOpen] = useState(false)

  function handleLike() {
    const next = !liked
    setLiked(next)
    setLikeCount((c) => Math.max(0, c + (next ? 1 : -1)))
    startLikeTransition(async () => {
      const result = await submitExplainerCommentLike(reply.id, briefSlug)
      if (result.error) {
        setLiked(!next)
        setLikeCount((c) => Math.max(0, c + (next ? -1 : 1)))
      }
    })
  }

  return (
    <div className="flex gap-2 py-2">
      <Avatar name={name} avatarUrl={reply.users.avatar_url} size="2xs" palette="colored" shape={reply.users.role === 'organisation' ? 'square' : 'circle'} />
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-baseline gap-x-2">
          <Link href={`/profile/${reply.users.id}`} className="font-mono text-[10px] font-semibold text-ink hover:text-blue-ink transition-colors">
            {name}
          </Link>
          <span className="font-mono text-[8.5px] text-ink-faint">{formatDate(reply.created_at)}</span>
        </p>
        <p className="mt-0.5 break-words font-body text-[13px] leading-snug text-ink-soft">{reply.body}</p>
        <LikeReplyBar
          isLoggedIn={!!currentUser}
          showLike
          likeCount={likeCount}
          myLike={liked}
          onLike={handleLike}
          likePending={likePending}
          onToggleReply={() => setReplyOpen((o) => !o)}
          replyOpen={replyOpen}
        />
        <ReplyArea
          open={replyOpen}
          briefId={briefId}
          briefSlug={briefSlug}
          currentUser={currentUser}
          parentCommentId={rootKind === 'comment' ? rootId : undefined}
          contentiousPointId={rootKind === 'contentious' ? rootId : undefined}
          replyToName={name}
          onPosted={(r) => {
            onReplyPosted(r)
            setReplyOpen(false)
          }}
        />
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
function ContentiousPointsList({
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

// ---------------------------------------------------------------------------
// Comments — flat thread, any logged-in member, immediate publish, one
// level of likeable/repliable replies (migration 050).
// ---------------------------------------------------------------------------

function CommentRow({
  comment,
  briefId,
  briefSlug,
  currentUser,
  replies,
  onReplyPosted,
}: {
  comment: ExplainerComment
  briefId: string
  briefSlug: string
  currentUser: EngagementAuthor | null
  replies: ExplainerComment[]
  onReplyPosted: (reply: ExplainerComment) => void
}) {
  const name = getDisplayName({ display_name: comment.users.display_name })
  const [likeCount, setLikeCount] = useState(comment.likeCount)
  const [liked, setLiked] = useState(comment.myLike)
  const [likePending, startLikeTransition] = useTransition()
  const [replyOpen, setReplyOpen] = useState(false)

  function handleLike() {
    const next = !liked
    setLiked(next)
    setLikeCount((c) => Math.max(0, c + (next ? 1 : -1)))
    startLikeTransition(async () => {
      const result = await submitExplainerCommentLike(comment.id, briefSlug)
      if (result.error) {
        setLiked(!next)
        setLikeCount((c) => Math.max(0, c + (next ? -1 : 1)))
      }
    })
  }

  return (
    <div className="border-t border-line py-3 first:border-t-0 first:pt-0">
      <div className="flex gap-2.5">
        <Avatar name={name} avatarUrl={comment.users.avatar_url} size="xs" palette="colored" shape={comment.users.role === 'organisation' ? 'square' : 'circle'} />
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-baseline gap-x-2">
            <Link href={`/profile/${comment.users.id}`} className="font-mono text-[10.5px] font-semibold text-ink hover:text-blue-ink transition-colors">
              {name}
            </Link>
            <span className="font-mono text-[9px] text-ink-faint">{formatDate(comment.created_at)}</span>
          </p>
          <p className="mt-0.5 break-words font-body text-sm leading-relaxed text-ink-soft">{comment.body}</p>
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
            parentCommentId={comment.id}
            replyToName={name}
            onPosted={(r) => {
              onReplyPosted(r)
              setReplyOpen(false)
            }}
          />
        </div>
      </div>
      {replies.length > 0 && (
        <div className="ml-[2.65rem] mt-1 border-l-2 border-line pl-3">
          {replies.map((r) => (
            <ReplyRow
              key={r.id}
              reply={r}
              briefId={briefId}
              briefSlug={briefSlug}
              currentUser={currentUser}
              rootId={comment.id}
              rootKind="comment"
              onReplyPosted={onReplyPosted}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Submit is an icon-only arrow inside the field's own bottom-right corner
// (2026-08-26) rather than a labeled button below it — "Add a comment"
// moved into the textarea's own placeholder (a visually-hidden <label>
// keeps a real accessible name; a placeholder alone isn't one).
function CommentForm({
  briefId,
  briefSlug,
  currentUser,
  onPosted,
}: {
  briefId: string
  briefSlug: string
  currentUser: EngagementAuthor
  onPosted: (comment: ExplainerComment) => void
}) {
  const [body, setBody] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const fieldId = useId()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await submitExplainerComment(briefId, briefSlug, body)
      if (result.error) {
        setError(result.error)
      } else {
        // Locally-constructed row for instant display — the real one (with
        // a server-issued id) lands on the next natural page load via this
        // action's revalidatePath; same optimistic-append shape as
        // ReviewEndorseControl's local setStatus elsewhere on this page.
        onPosted({
          id: crypto.randomUUID(),
          body: body.trim(),
          created_at: new Date().toISOString(),
          parent_comment_id: null,
          contentious_point_id: null,
          users: currentUser,
          likeCount: 0,
          myLike: false,
        })
        setBody('')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 border-t border-line pt-4">
      <div className="relative">
        <label htmlFor={fieldId} className="sr-only">Add a comment</label>
        <textarea
          id={fieldId}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          maxLength={1000}
          placeholder="Add a comment"
          disabled={isPending}
          className="w-full resize-none border border-line bg-paper py-2.5 pl-3 pr-12 font-body text-sm text-ink placeholder:text-ink-faint/70 focus:outline-none focus:ring-2 focus:ring-pink disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isPending || !body.trim()}
          aria-label="Post comment"
          style={{ touchAction: 'manipulation' }}
          className="absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-ink text-paper outline-none transition-colors hover:bg-blue-ink focus-visible:ring-2 focus-visible:ring-blue disabled:cursor-default disabled:opacity-40 disabled:hover:bg-ink"
        >
          <ArrowIcon />
        </button>
      </div>
      {error && (
        <p role="alert" className="font-mono text-[10px] text-pink-ink">
          {error}
        </p>
      )}
    </form>
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
          className={`flex h-7 w-7 items-center justify-center border outline-none transition-colors focus-visible:ring-2 focus-visible:ring-blue disabled:cursor-default ${
            liked
              ? 'border-blue bg-blue-soft text-blue-ink'
              : 'border-line-strong bg-paper text-ink-faint hover:border-blue hover:text-blue-ink disabled:hover:border-line-strong disabled:hover:text-ink-faint'
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
          className="font-mono text-sm font-semibold text-ink-soft underline decoration-dotted underline-offset-2 outline-none transition-colors hover:text-blue-ink focus-visible:ring-2 focus-visible:ring-blue"
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
        className="inline-flex items-center gap-1.5 font-mono text-ink-soft no-underline outline-none transition-colors hover:text-blue-ink focus-visible:ring-2 focus-visible:ring-blue"
      >
        <span aria-hidden className="text-[0.95rem] leading-none">{icon}</span>
        <span className="text-sm font-semibold">{count}</span>
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
    <div className="flex flex-wrap items-center gap-6">
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
      className="pointer-events-none absolute left-0 top-full z-30 mt-2 w-60 translate-y-1 border-[1.5px] border-ink bg-paper text-left opacity-0 shadow-lg transition-all duration-150 motion-reduce:transition-none group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100"
    >
      <div className="flex items-center gap-3 border-b border-line px-4 py-3">
        <Avatar name={name} avatarUrl={user.avatar_url} size="sm" palette="colored" shape={user.role === 'organisation' ? 'square' : 'circle'} />
        <div className="min-w-0">
          <p className="truncate font-display text-[0.8rem] font-extrabold uppercase leading-tight text-ink">{name}</p>
          <div className="mt-1"><RoleBadge role={user.role} size="xs" /></div>
        </div>
      </div>
      <div className="px-4 py-3">
        {credential ? (
          <p className="font-body text-[0.72rem] leading-snug text-ink-soft">{credential}</p>
        ) : (
          <p className="font-body text-[0.72rem] italic leading-snug text-ink-faint">
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
      <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink-faint">Contributors</p>
      <div className="flex flex-wrap items-center">
        {contributors.map((user, i) => {
          const name = getDisplayName({ display_name: user.display_name })
          return (
            <span key={user.id} className="group relative inline-flex items-center">
              <Link
                href={`/profile/${user.id}`}
                className="border-b-[1.5px] border-transparent py-0.5 font-mono text-[0.78rem] text-ink outline-none transition-colors hover:border-blue hover:text-blue-ink focus-visible:border-blue focus-visible:text-blue-ink"
              >
                {name}
              </Link>
              <ContributorCard user={user} />
              {i < contributors.length - 1 && (
                <span className="ml-2 text-line-strong" aria-hidden>&middot;</span>
              )}
            </span>
          )
        })}
      </div>
    </div>
  )
}

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
