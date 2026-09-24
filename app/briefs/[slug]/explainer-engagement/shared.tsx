'use client'

import { useId, useState, useTransition } from 'react'
import Link from 'next/link'
import Avatar from '@/components/ui/Avatar'
import { submitExplainerComment, submitExplainerCommentLike } from '@/lib/briefs/explainer-engagement-actions'
import { getDisplayName, formatDate } from '../helpers'
import type { ExplainerComment } from '../page'
import type { EngagementAuthor } from '@/lib/data/explainer-engagement'

export const buttonBase =
  'inline-flex items-center gap-1.5 px-4 py-2 font-mono text-[10px] tracking-[0.1em] uppercase outline-none transition-colors disabled:cursor-default disabled:opacity-60'

export function ThumbsUpIcon({ filled, className }: { filled: boolean; className?: string }) {
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

export function ArrowIcon() {
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
// Like + reply bar — icon-only (2026-08-27, matching a LinkedIn-style
// comment thread the user referenced directly). The like button doubles as
// a static, non-interactive display when logged out (no dead click that
// would just come back as a server error) — same spirit as LikeButton's
// logged-out Link state elsewhere on this page, simplified since a reply
// is already the fallback path to prompt login.
// ---------------------------------------------------------------------------

export function LikeReplyBar({
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
export function ReplyRow({
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

export { ReplyArea }
