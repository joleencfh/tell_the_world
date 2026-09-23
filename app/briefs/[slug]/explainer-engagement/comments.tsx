'use client'

import { useId, useState, useTransition } from 'react'
import Link from 'next/link'
import Avatar from '@/components/ui/Avatar'
import { submitExplainerComment, submitExplainerCommentLike } from '@/lib/briefs/explainer-engagement-actions'
import { getDisplayName, formatDate } from '../helpers'
import type { ExplainerComment } from '../page'
import type { EngagementAuthor } from '@/lib/data/explainer-engagement'
import { ArrowIcon, LikeReplyBar, ReplyArea, ReplyRow } from './shared'

// ---------------------------------------------------------------------------
// Comments — flat thread, any logged-in member, immediate publish, one
// level of likeable/repliable replies (migration 050).
// ---------------------------------------------------------------------------

export function CommentRow({
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
export function CommentForm({
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
