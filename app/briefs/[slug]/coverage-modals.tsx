'use client'

import { useCallback, useEffect, useId, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { submitCoverage, getCoverageDetail } from '@/lib/briefs/actions'
import { backfillCoverageImage } from '@/lib/admin/actions'
import DuotonePlaceholder from '@/components/ui/DuotonePlaceholder'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Alert from '@/components/ui/Alert'
import Field, { TextInput } from '@/components/ui/Field'
import { getDisplayName } from './helpers'
import { CommentRow, CommentForm, LikersList } from './coverage-comments'
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
    <Modal open onClose={onClose} size="narrow" eyebrow="Covered by" title="Add coverage">
      <p className="font-ui text-ui-sm text-umber-soft">For: {briefTitle}</p>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <Field
          id={urlId}
          label="Article URL"
          hint="We’ll pull the outlet name, title, and image straight from the article."
        >
          {(p) => (
            <TextInput
              {...p}
              ref={urlRef}
              type="url"
              inputMode="url"
              autoComplete="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              maxLength={500}
              placeholder="https://…"
              disabled={isPending || isSubmitted}
            />
          )}
        </Field>

        {feedback && (
          <Alert tone={feedback.type === 'error' ? 'danger' : 'success'}>{feedback.message}</Alert>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-1">
          {!isSubmitted && (
            <Button type="submit" disabled={!canSubmit} pending={isPending} style={{ touchAction: 'manipulation' }}>
              {isPending ? 'Adding…' : 'Submit for review'}
            </Button>
          )}
          <Button variant="ghost" onClick={onClose}>
            {isSubmitted ? 'Close' : 'Cancel'}
          </Button>
        </div>
      </form>
    </Modal>
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
  isAdmin = false,
  onClose,
}: {
  coverage: Coverage
  briefSlug: string
  isLoggedIn: boolean
  isAdmin?: boolean
  onClose: () => void
}) {
  const [comments, setComments] = useState<CoverageComment[] | null>(null)
  const [likers, setLikers] = useState<CoverageAuthor[] | null>(null)
  const [imgFailed, setImgFailed] = useState(false)
  const [imageUrl, setImageUrl] = useState(coverage.image_url)
  const [refetchState, setRefetchState] = useState<'idle' | 'pending' | 'error'>('idle')
  const [, startTransition] = useTransition()
  const showImage = imageUrl && !imgFailed
  const submitterName = coverage.submittingUser ? getDisplayName(coverage.submittingUser) : null

  function handleRefetchImage() {
    setRefetchState('pending')
    startTransition(async () => {
      const result = await backfillCoverageImage(coverage.id)
      if (result.error) {
        setRefetchState('error')
      } else {
        setImageUrl(result.imageUrl ?? null)
        setImgFailed(false)
        setRefetchState('idle')
      }
    })
  }

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
    <Modal open onClose={onClose} eyebrow="Covered by" title="Coverage detail">
      <div className="-mx-5 mt-4 md:-mx-8">
        <div className="relative aspect-[16/9] w-full shrink-0 overflow-hidden bg-bone">
          {showImage ? (
            <img
              src={imageUrl!}
              alt=""
              referrerPolicy="no-referrer"
              onError={() => setImgFailed(true)}
              className="h-full w-full object-cover"
            />
          ) : (
            <DuotonePlaceholder id={coverage.id} className="h-full w-full" />
          )}
        </div>
      </div>

      <div className="mt-5 space-y-5">
        <div>
          <span className="font-mono text-label uppercase text-umber-soft">{coverage.outlet_name}</span>
          <h3 className="mt-1 font-serif text-card-title text-umber">{coverage.title}</h3>
          {isAdmin && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleRefetchImage}
                disabled={refetchState === 'pending'}
                className="focus-ring -m-1 inline-flex min-h-11 items-center rounded-control p-1 font-mono text-label text-umber-soft underline decoration-dotted underline-offset-2 transition-colors hover:text-umber disabled:opacity-50"
              >
                {refetchState === 'pending' ? 'Re-fetching image…' : 'Admin: re-fetch image from article'}
              </button>
              {refetchState === 'error' && (
                <span role="alert" className="font-mono text-label text-brick">
                  Failed — no image found or fetch error.
                </span>
              )}
            </div>
          )}
          {submitterName && coverage.submittingUser && (
            <p className="mt-2 font-ui text-caption text-umber-soft">
              Submitted by{' '}
              <Link href={`/profile/${coverage.submittingUser.id}`} className="focus-ring rounded-control text-umber underline underline-offset-2">
                {submitterName}
              </Link>
            </p>
          )}
          <a
            href={coverage.url}
            target="_blank"
            rel="noopener noreferrer"
            className="focus-ring mt-2 inline-flex min-h-11 items-center gap-1.5 rounded-control font-ui text-ui-sm font-medium text-umber underline underline-offset-2"
          >
            Read the article <span aria-hidden>→</span>
          </a>
        </div>

        <div className="flex flex-wrap items-center gap-5 border-t border-window-line pt-4">
          <LikeButton coverageId={coverage.id} briefSlug={briefSlug} initialCount={coverage.likeCount} initialLiked={coverage.myLike} isLoggedIn={isLoggedIn} />
          {likers === null ? (
            <p className="font-mono text-label text-umber-soft">Loading…</p>
          ) : (
            <LikersList likers={likers} />
          )}
        </div>

        <div className="border-t border-window-line pt-4">
          <p className="mb-3 font-mono text-label uppercase text-umber-soft">
            Comments {comments !== null && `(${comments.length})`}
          </p>
          {comments === null ? (
            <p className="font-mono text-label text-umber-soft">Loading…</p>
          ) : comments.length === 0 ? (
            <p className="font-mono text-label text-umber-soft">No comments yet.</p>
          ) : (
            <div className="space-y-3">
              {comments.map((c) => (
                <CommentRow key={c.id} comment={c} isLoggedIn={isLoggedIn} />
              ))}
            </div>
          )}

          {isLoggedIn ? (
            <div className="mt-4">
              <CommentForm coverageId={coverage.id} onPosted={load} />
            </div>
          ) : (
            <p className="mt-4 border-t border-window-line pt-4 font-ui text-ui-sm text-umber-soft">
              <Link href="/login" className="focus-ring rounded-control text-umber underline underline-offset-2">
                Log in
              </Link>{' '}
              to comment.
            </p>
          )}
        </div>
      </div>
    </Modal>
  )
}
