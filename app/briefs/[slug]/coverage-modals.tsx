'use client'

import { useCallback, useEffect, useId, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import Avatar from '@/components/ui/Avatar'
import RoleBadge from '@/components/ui/RoleBadge'
import { submitCoverage, submitCoverageComment, voteCoverageComment, getCoverageDetail } from '@/lib/briefs/actions'
import DuotonePlaceholder from '@/components/ui/DuotonePlaceholder'
import { getDisplayName, formatDate } from './helpers'
import { LikeButton } from './coverage'
import type { Coverage, CoverageComment, CoverageAuthor } from '@/lib/data/coverage'

// Split out of coverage.tsx (which holds the card/carousel) to keep both
// files under the project's ~500-line convention (CONTRIBUTING.md) —
// mirrors quotes.tsx/quote-modals.tsx's split.

// ---------------------------------------------------------------------------
// Add coverage — URL-only propose-then-pending form (any logged-in member,
// unlike SuggestCtaModal's expert/org gate). outlet name, title, and image
// are extracted server-side from the URL's Open Graph tags in submitCoverage
// (lib/briefs/actions.ts) — there's nothing else for the submitter to fill
// in, so unlike SuggestCtaModal this form has exactly one field.
// ---------------------------------------------------------------------------

export function AddCoverageModal({
  briefId,
  briefSlug,
  briefTitle,
  onClose,
}: {
  briefId: string
  briefSlug: string
  briefTitle: string
  onClose: () => void
}) {
  const [url, setUrl] = useState('')
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null)
  const urlRef = useRef<HTMLInputElement>(null)
  const urlId = useId()

  const isSubmitted = feedback?.type === 'success'
  const canSubmit = url.trim().length > 0

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFeedback(null)
    startTransition(async () => {
      const result = await submitCoverage(briefId, briefSlug, url)
      if (result.error) {
        setFeedback({ type: 'error', message: result.error })
        urlRef.current?.focus()
      } else {
        setUrl('')
        setFeedback({ type: 'success', message: 'Coverage submitted for review — it will appear here once approved.' })
      }
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Add coverage"
    >
      <div className="absolute inset-0 bg-ink/60 backdrop-blur-sm" onClick={onClose} aria-hidden />

      <div className="relative w-full max-w-xl overflow-hidden border border-line bg-paper">
        <div className="flex items-start justify-between border-b border-line px-7 pb-5 pt-7">
          <div>
            <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.2em] text-pink-ink">Covered by</p>
            <h2 className="font-display text-xl uppercase leading-tight text-ink">Add coverage</h2>
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
          <div>
            <label htmlFor={urlId} className="mb-2 block font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">
              Article URL
            </label>
            <input
              id={urlId}
              ref={urlRef}
              type="url"
              inputMode="url"
              autoComplete="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              maxLength={500}
              placeholder="https://…"
              disabled={isPending || isSubmitted}
              className="w-full border border-line bg-paper px-4 py-2.5 font-body text-sm text-ink placeholder:text-ink-faint/70 transition focus:outline-none focus:ring-2 focus:ring-pink disabled:opacity-50"
            />
            <p className="mt-2 font-body text-xs text-ink-faint">
              We’ll pull the outlet name, title, and image straight from the article.
            </p>
          </div>

          {feedback && (
            <p
              role={feedback.type === 'error' ? 'alert' : undefined}
              aria-live="polite"
              className={`font-mono text-[10px] tracking-[0.1em] leading-relaxed ${
                feedback.type === 'error' ? 'text-pink-ink' : 'text-blue-ink'
              }`}
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
                {isPending ? 'Adding…' : 'Submit for review'}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink-faint transition-colors hover:text-ink"
            >
              {isSubmitted ? 'Close' : 'Cancel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Comment vote buttons — directional (up/down), unlike this page's other
// vote controls which are plain toggles (VoteButton in qa-votes.tsx). Casting
// the vote already held removes it; casting the other one switches it.
// Disabled (not link-ified like LikeButton's logged-out state) when logged
// out — voting is secondary here, not worth a second UI shape.
// ---------------------------------------------------------------------------

function CommentVotes({ comment, isLoggedIn }: { comment: CoverageComment; isLoggedIn: boolean }) {
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

function CommentRow({ comment, isLoggedIn }: { comment: CoverageComment; isLoggedIn: boolean }) {
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

function CommentForm({ coverageId, onPosted }: { coverageId: string; onPosted: () => void }) {
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

function LikersList({ likers }: { likers: CoverageAuthor[] }) {
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

// ---------------------------------------------------------------------------
// Coverage detail — the click-through modal (Part 9). Header reuses the
// card's own image/outlet/title, plus the submitting TTW user when present
// (brief_coverage.submitted_by, cheap to add once joined — lib/data/
// coverage.ts). Comments and likers are fetched together on open
// (getCoverageDetail) rather than bundled into the page's initial load.
// ---------------------------------------------------------------------------

export function CoverageDetailModal({
  coverage,
  briefSlug,
  isLoggedIn,
  onClose,
}: {
  coverage: Coverage
  briefSlug: string
  isLoggedIn: boolean
  onClose: () => void
}) {
  const [comments, setComments] = useState<CoverageComment[] | null>(null)
  const [likers, setLikers] = useState<CoverageAuthor[] | null>(null)
  const [imgFailed, setImgFailed] = useState(false)
  const showImage = coverage.image_url && !imgFailed
  const submitterName = coverage.submittingUser ? getDisplayName(coverage.submittingUser) : null

  const load = useCallback(async () => {
    const result = await getCoverageDetail(coverage.id)
    setComments(result.comments)
    setLikers(result.likers)
  }, [coverage.id])

  // Guarded against a state update after unmount on the initial fetch
  // (mirrors qa-votes.tsx's VoterModal); the post-submit reload triggered
  // from CommentForm below reuses `load` directly without that guard since
  // the modal is still open when it fires.
  useEffect(() => {
    let cancelled = false
    getCoverageDetail(coverage.id).then((result) => {
      if (cancelled) return
      setComments(result.comments)
      setLikers(result.likers)
    })
    return () => {
      cancelled = true
    }
  }, [coverage.id])

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label="Coverage detail">
      <div className="absolute inset-0 bg-ink/60 backdrop-blur-sm" onClick={onClose} aria-hidden />

      <div className="relative flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden border border-line bg-paper">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-line px-7 pb-5 pt-7">
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-pink-ink">Covered by</p>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ touchAction: 'manipulation' }}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-paper-raised text-lg leading-none text-ink-soft outline-none transition-colors hover:bg-line hover:text-ink focus-visible:ring-2 focus-visible:ring-pink"
          >
            ×
          </button>
        </div>

        <div className="overflow-y-auto">
          <div className="relative aspect-[16/9] w-full shrink-0 overflow-hidden border-b border-line bg-ink/5">
            {showImage ? (
              <img
                src={coverage.image_url!}
                alt=""
                referrerPolicy="no-referrer"
                onError={() => setImgFailed(true)}
                className="h-full w-full object-cover"
              />
            ) : (
              <DuotonePlaceholder id={coverage.id} className="h-full w-full" />
            )}
          </div>

          <div className="space-y-5 px-7 py-6">
            <div>
              <span className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.03em] text-ink-faint">{coverage.outlet_name}</span>
              <h2 className="mt-1 font-display text-lg font-extrabold leading-tight text-ink">{coverage.title}</h2>
              {submitterName && coverage.submittingUser && (
                <p className="mt-2 font-mono text-[10px] text-ink-faint">
                  Submitted by{' '}
                  <Link href={`/profile/${coverage.submittingUser.id}`} className="text-ink-soft hover:text-pink transition-colors">
                    {submitterName}
                  </Link>
                </p>
              )}
              <a
                href={coverage.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-pink-ink hover:underline"
              >
                Read the article <span aria-hidden>→</span>
              </a>
            </div>

            <div className="flex items-center gap-5 border-t border-line pt-4">
              <LikeButton coverageId={coverage.id} briefSlug={briefSlug} initialCount={coverage.likeCount} initialLiked={coverage.myLike} isLoggedIn={isLoggedIn} />
              {likers === null ? (
                <p className="font-mono text-[10px] text-ink-faint">Loading…</p>
              ) : (
                <LikersList likers={likers} />
              )}
            </div>

            <div className="border-t border-line pt-4">
              <p className="mb-3 font-mono text-[9px] uppercase tracking-[0.2em] text-ink-faint">
                Comments {comments !== null && `(${comments.length})`}
              </p>
              {comments === null ? (
                <p className="font-mono text-[10px] text-ink-faint">Loading…</p>
              ) : comments.length === 0 ? (
                <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-faint">No comments yet.</p>
              ) : (
                <div className="space-y-3">
                  {comments.map((c) => (
                    <CommentRow key={c.id} comment={c} isLoggedIn={isLoggedIn} />
                  ))}
                </div>
              )}

              {isLoggedIn ? (
                <CommentForm coverageId={coverage.id} onPosted={load} />
              ) : (
                <p className="mt-4 border-t border-line pt-4 font-mono text-[10px] text-ink-faint">
                  <Link href="/login" className="text-pink-ink hover:underline">
                    Log in
                  </Link>{' '}
                  to comment.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
