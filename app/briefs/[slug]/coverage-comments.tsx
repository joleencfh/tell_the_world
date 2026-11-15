'use client'

import { useId, useState, useTransition } from 'react'
import Link from 'next/link'
import Avatar from '@/components/ui/Avatar'
import RoleBadge from '@/components/ui/RoleBadge'
import { submitCoverageComment, voteCoverageComment } from '@/lib/briefs/actions'
import { getDisplayName, formatDate } from './helpers'
import type { CoverageComment, CoverageAuthor } from '@/lib/data/coverage'

// Split out of coverage-modals.tsx (pure move) to keep both files under the
// project's ~500-line convention.

// ---------------------------------------------------------------------------
// Comment vote buttons — directional (up/down), unlike this page's other
// vote controls which are plain toggles (VoteButton in qa-votes.tsx). Casting
// the vote already held removes it; casting the other one switches it.
// Disabled (not link-ified like LikeButton's logged-out state) when logged
// out — voting is secondary here, not worth a second UI shape.
// ---------------------------------------------------------------------------

export function CommentVotes({ comment, isLoggedIn }: { comment: CoverageComment; isLoggedIn: boolean }) {
  const [upCount, setUpCount] = useState(comment.upCount)
  const [downCount, setDownCount] = useState(comment.downCount)
  const [myVote, setMyVote] = useState(comment.myVote)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function vote(direction: 'up' | 'down') {
    setError(null)
    const prevVote = myVote
    const prevUp = upCount
    const prevDown = downCount

    let nextUp = upCount
    let nextDown = downCount
    const nextVote: 'up' | 'down' | null = prevVote === direction ? null : direction

    if (prevVote === 'up') nextUp -= 1
    if (prevVote === 'down') nextDown -= 1
    if (nextVote === 'up') nextUp += 1
    if (nextVote === 'down') nextDown += 1

    setMyVote(nextVote)
    setUpCount(Math.max(0, nextUp))
    setDownCount(Math.max(0, nextDown))

    startTransition(async () => {
      const result = await voteCoverageComment(comment.id, direction)
      if (result.error) {
        setError(result.error)
        setMyVote(prevVote)
        setUpCount(prevUp)
        setDownCount(prevDown)
      }
    })
  }

  return (
    <div className="flex items-center gap-3" aria-live="polite">
      <button
        type="button"
        onClick={() => vote('up')}
        disabled={isPending || !isLoggedIn}
        aria-label={myVote === 'up' ? 'Remove your upvote' : 'Upvote'}
        aria-pressed={myVote === 'up'}
        style={{ touchAction: 'manipulation' }}
        className={`inline-flex cursor-pointer items-center gap-1 font-mono text-[10px] tabular-nums outline-none transition-colors focus-visible:ring-2 focus-visible:ring-pink disabled:cursor-default ${
          myVote === 'up' ? 'text-pink' : 'text-ink-faint hover:text-pink'
        }`}
      >
        <svg viewBox="0 0 12 11" strokeWidth="1.3" strokeLinejoin="round" className={`h-3 w-3 stroke-current ${myVote === 'up' ? 'fill-current' : 'fill-none'}`} aria-hidden>
          <path d="M6 0.8 L11.2 10 L0.8 10 Z" />
        </svg>
        {upCount}
      </button>
      <button
        type="button"
        onClick={() => vote('down')}
        disabled={isPending || !isLoggedIn}
        aria-label={myVote === 'down' ? 'Remove your downvote' : 'Downvote'}
        aria-pressed={myVote === 'down'}
        style={{ touchAction: 'manipulation' }}
        className={`inline-flex cursor-pointer items-center gap-1 font-mono text-[10px] tabular-nums outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ink-soft disabled:cursor-default ${
          myVote === 'down' ? 'text-ink' : 'text-ink-faint hover:text-ink'
        }`}
      >
        <svg viewBox="0 0 12 11" strokeWidth="1.3" strokeLinejoin="round" className={`h-3 w-3 rotate-180 stroke-current ${myVote === 'down' ? 'fill-current' : 'fill-none'}`} aria-hidden>
          <path d="M6 0.8 L11.2 10 L0.8 10 Z" />
        </svg>
        {downCount}
      </button>
      {error && (
        <span role="alert" className="font-mono text-[9px] text-pink-ink">
          {error}
        </span>
      )}
    </div>
  )
}

export function CommentRow({ comment, isLoggedIn }: { comment: CoverageComment; isLoggedIn: boolean }) {
  const name = getDisplayName(comment.author)
  const credential = comment.author.affiliation || comment.author.org_name

  return (
    <div className="space-y-2 border-t border-line pt-3 first:border-t-0 first:pt-0">
      <div className="flex min-w-0 items-center gap-2">
        <Avatar name={name} avatarUrl={comment.author.avatar_url} palette="colored" size="xs" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <Link href={`/profile/${comment.author.id}`} className="truncate font-display text-[0.8rem] font-extrabold text-ink hover:text-pink transition-colors">
              {name}
            </Link>
            {comment.author.role && <RoleBadge role={comment.author.role} variant="outline" size="xs" />}
          </div>
          <p className="truncate font-mono text-[9px] text-ink-faint">
            {credential && `${credential} · `}
            {formatDate(comment.created_at)}
          </p>
        </div>
      </div>
      <p className="break-words pl-8 font-body text-sm leading-relaxed text-ink">{comment.body}</p>
      <div className="pl-8">
        <CommentVotes comment={comment} isLoggedIn={isLoggedIn} />
      </div>
    </div>
  )
}

export function CommentForm({ coverageId, onPosted }: { coverageId: string; onPosted: () => void }) {
  const [body, setBody] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const fieldId = useId()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await submitCoverageComment(coverageId, body)
      if (result.error) {
        setError(result.error)
      } else {
        setBody('')
        onPosted()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 border-t border-line pt-4">
      <label htmlFor={fieldId} className="block font-mono text-[10px] tracking-[0.18em] uppercase text-ink-faint">
        Add a comment
      </label>
      <textarea
        id={fieldId}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        maxLength={1000}
        placeholder="What do you make of this coverage?"
        disabled={isPending}
        className="w-full resize-none border border-line bg-paper px-3 py-2.5 font-body text-sm text-ink placeholder:text-ink-faint/70 focus:outline-none focus:ring-2 focus:ring-pink disabled:opacity-50"
      />
      {error && (
        <p role="alert" className="font-mono text-[10px] text-pink-ink">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={isPending || !body.trim()}
        style={{ touchAction: 'manipulation' }}
        className="bg-ink px-4 py-2 font-mono text-[10px] uppercase tracking-[0.15em] text-paper transition-opacity hover:opacity-90 disabled:opacity-40"
      >
        {isPending ? 'Posting…' : 'Post comment'}
      </button>
    </form>
  )
}

export function LikersList({ likers }: { likers: CoverageAuthor[] }) {
  const [open, setOpen] = useState(false)
  if (likers.length === 0) return <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-faint">No likes yet.</p>

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{ touchAction: 'manipulation' }}
        className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-faint underline decoration-dotted underline-offset-2 outline-none transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-pink"
      >
        {open ? 'Hide' : 'Show'} {likers.length} {likers.length === 1 ? 'like' : 'likes'}
      </button>
      {open && (
        <div className="mt-2 space-y-1.5">
          {likers.map((liker, i) => {
            const name = getDisplayName(liker)
            return (
              <Link key={`${liker.id}-${i}`} href={`/profile/${liker.id}`} className="flex items-center gap-2 transition-colors hover:text-pink">
                <Avatar name={name} avatarUrl={liker.avatar_url} palette="colored" size="xs" />
                <span className="truncate font-body text-xs text-ink">{name}</span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
