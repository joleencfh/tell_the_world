'use client'

import { useState, useTransition } from 'react'
import Button from '@/components/ui/Button'
import Field, { Textarea } from '@/components/ui/Field'
import Modal from '@/components/ui/Modal'
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
      <Button
        type="button"
        variant="secondary"
        small
        onClick={() => act('review')}
        disabled={isPending || status !== 'none'}
        style={{ touchAction: 'manipulation' }}
      >
        {status === 'none' ? (isPending ? 'Marking…' : 'Mark as reviewed') : '✓ Reviewed'}
      </Button>
      <Button
        type="button"
        variant="secondary"
        small
        onClick={() => act('endorsement')}
        disabled={isPending || status === 'none' || status === 'endorsement'}
        style={{ touchAction: 'manipulation' }}
      >
        {status === 'endorsement' ? '★ Endorsed' : isPending && status === 'review' ? 'Endorsing…' : 'Endorse'}
      </Button>
      {error && (
        <p role="alert" className="font-ui text-ui-sm text-brick">
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
    <Modal open onClose={onClose} size="narrow" eyebrow="Review & endorse" title="Review or endorse this brief">
      <p className="mb-1 font-ui text-ui-sm text-umber-soft">For: {briefTitle}</p>
      <p className="mb-5 font-ui text-ui-sm text-umber">
        Mark this brief as reviewed for accuracy, or endorse it as worth sharing.
      </p>
      <Field label="Add a comment" optional hint={`${comment.length} / 500`} className="mb-5">
        {(p) => (
          <Textarea
            {...p}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Anything you'd like to add?"
            className="resize-none"
          />
        )}
      </Field>
      <ReviewEndorseControl
        briefId={briefId}
        briefSlug={briefSlug}
        sectionId={null}
        initialStatus={initialStatus}
        comment={comment}
      />
    </Modal>
  )
}
