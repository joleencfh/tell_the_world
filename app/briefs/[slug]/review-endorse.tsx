'use client'

import { useState, useTransition } from 'react'
import { setReviewStatus } from '@/lib/briefs/actions'
import type { ContributionStatus } from '@/lib/data/contributions'

// Brief-level control (Part 1, sectionId null) and — reusing the same
// component — per-Explainer-subsection control (Part 3, sectionId set).
// See two-ink-bold-plan.md §2 "Reusing brief_contributions".

interface ReviewEndorseControlProps {
  briefId: string
  briefSlug: string
  sectionId: string | null
  initialStatus: ContributionStatus
  // Optional free-text note (Contribute menu's modal only, §ReviewEndorseModal
  // below) included with whichever action the user takes next. The header's
  // own inline usage of this control has no textarea, so it's simply
  // omitted there.
  comment?: string
}

const buttonBaseClasses =
  'inline-flex items-center gap-1.5 rounded-full border border-blue/40 bg-blue-soft px-4 py-1.5 font-mono text-[10px] tracking-[0.12em] uppercase text-blue-ink transition-colors hover:bg-blue/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue disabled:cursor-default disabled:opacity-60'

export function ReviewEndorseControl({ briefId, briefSlug, sectionId, initialStatus, comment }: ReviewEndorseControlProps) {
  const [status, setStatus] = useState<ContributionStatus>(initialStatus)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function act(target: 'review' | 'endorsement') {
    setError(null)
    startTransition(async () => {
      const result = await setReviewStatus(briefId, briefSlug, sectionId, target, comment)
      if (result.error) {
        setError(result.error)
      } else {
        setStatus(target)
      }
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-3" aria-live="polite">
      <button
        type="button"
        onClick={() => act('review')}
        disabled={isPending || status !== 'none'}
        style={{ touchAction: 'manipulation' }}
        className={buttonBaseClasses}
      >
        {status === 'none' ? (isPending ? 'Marking…' : 'Mark as reviewed') : '✓ Reviewed'}
      </button>
      <button
        type="button"
        onClick={() => act('endorsement')}
        disabled={isPending || status === 'none' || status === 'endorsement'}
        style={{ touchAction: 'manipulation' }}
        className={buttonBaseClasses}
      >
        {status === 'endorsement' ? '★ Endorsed' : isPending && status === 'review' ? 'Endorsing…' : 'Endorse'}
      </button>
      {error && (
        <p role="alert" className="font-mono text-[10px] text-pink-ink">
          {error}
        </p>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Review/endorse modal — Contribute menu's "Review or endorse this brief"
// entry point (brief-page-part2-plan.md §2, Part 2 step 1). One item, one
// modal: ReviewEndorseControl already exposes both actions as its own two
// buttons, so there's no need for two separate menu entries into it (a
// single combined item was a deliberate simplification over the plan's
// original "Endorse this brief" / "Add a review" pair, 2026-08-22). Also
// carries an optional free-text comment (max 500 chars, stored in
// brief_contributions.body) the reviewer can attach to whichever action
// they take. Rendered at BriefView's top level like its other modals — not
// nested inside the hero's Contribute menu — for the same anim-rise
// containing-block reason documented on ReviewersModal in
// section-content.tsx.
// ---------------------------------------------------------------------------

export function ReviewEndorseModal({
  briefId,
  briefSlug,
  briefTitle,
  initialStatus,
  onClose,
}: {
  briefId: string
  briefSlug: string
  briefTitle: string
  initialStatus: ContributionStatus
  onClose: () => void
}) {
  const [comment, setComment] = useState('')

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Review or endorse this brief"
    >
      <div className="absolute inset-0 bg-ink/60 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-md overflow-hidden border border-line bg-paper">
        <div className="flex items-start justify-between border-b border-line px-7 pb-5 pt-7">
          <div>
            <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.2em] text-blue-ink">Review &amp; endorse</p>
            <h2 className="font-display text-xl uppercase leading-tight text-ink">Review or endorse this brief</h2>
            <p className="mt-1.5 font-body text-xs italic leading-snug text-ink-soft">For: {briefTitle}</p>
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
        <div className="px-7 py-6">
          <p className="mb-4 font-body text-sm text-ink-soft">
            Mark this brief as reviewed for accuracy, or endorse it as worth sharing.
          </p>
          <div className="mb-4">
            <label htmlFor="review-endorse-comment" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">
              Add a comment (optional)
            </label>
            <textarea
              id="review-endorse-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Anything you'd like to add?"
              className="w-full resize-none border border-line bg-paper px-4 py-2.5 font-body text-sm text-ink placeholder:text-ink-faint/70 transition focus:outline-none focus:ring-2 focus:ring-blue"
            />
            <p className="mt-1 font-mono text-[9px] text-ink-faint text-right">{comment.length} / 500</p>
          </div>
          <ReviewEndorseControl
            briefId={briefId}
            briefSlug={briefSlug}
            sectionId={null}
            initialStatus={initialStatus}
            comment={comment}
          />
        </div>
      </div>
    </div>
  )
}
