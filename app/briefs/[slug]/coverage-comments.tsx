'use client'

import { useId, useState, useTransition } from 'react'
import Link from 'next/link'
import Author from '@/components/ui/Author'
import Button from '@/components/ui/Button'
import Field, { Textarea } from '@/components/ui/Field'
import { submitCoverageComment, voteCoverageComment } from '@/lib/briefs/actions'
import { getDisplayName, formatDate } from './helpers'
import type { CoverageComment, CoverageAuthor } from '@/lib/data/coverage'

// Split out of coverage-modals.tsx (pure move, then restyled) to keep both
// files under the project's ~500-line convention.

// ---------------------------------------------------------------------------
// Comment vote buttons — directional (up/down), unlike this page's other
// vote controls which are plain toggles (VoteButton in qa-votes.tsx). Casting
// the vote already held removes it; casting the other one switches it.
// Disabled (not link-ified like LikeButton's logged-out state) when logged
// out — voting is secondary here, not worth a second UI shape.
// ---------------------------------------------------------------------------

const VOTE_BUTTON =
  'focus-ring -m-1 inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center gap-1.5 rounded-control p-1 font-mono text-label tabular-nums transition-colors disabled:cursor-default'

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
    <div className="flex flex-wrap items-center gap-3" aria-live="polite">
      <button
        type="button"
        onClick={() => vote('up')}
        disabled={isPending || !isLoggedIn}
        aria-label={myVote === 'up' ? 'Remove your upvote' : 'Upvote'}
        aria-pressed={myVote === 'up'}
        style={{ touchAction: 'manipulation' }}
        className={`${VOTE_BUTTON} ${myVote === 'up' ? 'text-rose' : 'text-umber-soft hover:text-rose'}`}
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
        className={`${VOTE_BUTTON} ${myVote === 'down' ? 'text-umber' : 'text-umber-soft hover:text-umber'}`}
      >
        <svg viewBox="0 0 12 11" strokeWidth="1.3" strokeLinejoin="round" className={`h-3 w-3 rotate-180 stroke-current ${myVote === 'down' ? 'fill-current' : 'fill-none'}`} aria-hidden>
          <path d="M6 0.8 L11.2 10 L0.8 10 Z" />
        </svg>
        {downCount}
      </button>
      {error && (
        <span role="alert" className="font-mono text-label text-brick">
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
    <div className="space-y-2 border-t border-window-line pt-3 first:border-t-0 first:pt-0">
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-x-3 gap-y-1">
        <Link href={`/profile/${comment.author.id}`} className="focus-ring min-w-0 rounded-control">
          <Author
            name={name}
            role={comment.author.role ?? undefined}
            affiliation={credential}
            avatarUrl={comment.author.avatar_url}
            size="xs"
          />
        </Link>
        <p className="font-mono text-label tabular-nums text-umber-soft">{formatDate(comment.created_at)}</p>
      </div>
      <p className="break-words pl-10 font-ui text-ui-sm leading-relaxed text-umber">{comment.body}</p>
      <div className="pl-10">
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
    <form onSubmit={handleSubmit} className="space-y-3 border-t border-window-line pt-4">
      <Field id={fieldId} label="Add a comment" error={error}>
        {(p) => (
          <Textarea
            {...p}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            maxLength={1000}
            placeholder="What do you make of this coverage?"
            disabled={isPending}
            className="resize-none"
          />
        )}
      </Field>
      <Button type="submit" small disabled={!body.trim()} pending={isPending} style={{ touchAction: 'manipulation' }}>
        {isPending ? 'Posting…' : 'Post comment'}
      </Button>
    </form>
  )
}

export function LikersList({ likers }: { likers: CoverageAuthor[] }) {
  const [open, setOpen] = useState(false)
  if (likers.length === 0) return <p className="font-mono text-label text-umber-soft">No likes yet.</p>

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        style={{ touchAction: 'manipulation' }}
        className="focus-ring -m-1 inline-flex min-h-11 items-center rounded-control p-1 font-mono text-label text-umber-soft underline decoration-dotted underline-offset-2 transition-colors hover:text-umber"
      >
        {open ? 'Hide' : 'Show'} {likers.length} {likers.length === 1 ? 'like' : 'likes'}
      </button>
      {open && (
        <div className="mt-2 space-y-1">
          {likers.map((liker, i) => {
            const name = getDisplayName(liker)
            return (
              <Link
                key={`${liker.id}-${i}`}
                href={`/profile/${liker.id}`}
                className="focus-ring flex min-h-11 items-center rounded-control"
              >
                <Author name={name} avatarUrl={liker.avatar_url} size="xs" />
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
