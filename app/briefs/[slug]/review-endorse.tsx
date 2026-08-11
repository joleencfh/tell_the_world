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
}

const buttonBaseClasses =
  'inline-flex items-center gap-1.5 rounded-full border border-blue/40 bg-blue-soft px-4 py-1.5 font-mono text-[10px] tracking-[0.12em] uppercase text-blue-ink transition-colors hover:bg-blue/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue disabled:cursor-default disabled:opacity-60'

export function ReviewEndorseControl({ briefId, briefSlug, sectionId, initialStatus }: ReviewEndorseControlProps) {
  const [status, setStatus] = useState<ContributionStatus>(initialStatus)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function act(target: 'review' | 'endorsement') {
    setError(null)
    startTransition(async () => {
      const result = await setReviewStatus(briefId, briefSlug, sectionId, target)
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
