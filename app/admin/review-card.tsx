'use client'

import { useState } from 'react'
import { archiveBriefReview } from '@/lib/admin/actions'
import type { BriefReview } from '@/lib/admin/actions'

// No approve/dismiss here — reviews/endorsements publish immediately (see
// getBriefReviews' own comment in lib/admin/actions.ts). The only action is
// the × button: an admin-only soft-remove (archiveBriefReview), separate
// from a contributor's own self-withdraw on their profile — see that
// action's own comment for why it archives rather than deletes.

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function ReviewCard({ review }: { review: BriefReview }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const submitterName = review.users.display_name || review.users.email.split('@')[0]
  const isEndorsement = review.type === 'endorsement'

  async function handleRemove() {
    setLoading(true)
    setError(null)
    const result = await archiveBriefReview(review.id, review.briefs.slug)
    if (result.error) { setError(result.error); setLoading(false) }
  }

  return (
    <div className="border border-line bg-paper-raised px-5 py-4 space-y-2">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="font-mono text-[9px] tracking-[0.18em] uppercase text-blue-ink">
          {review.briefs.title}
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`font-mono text-[9px] tracking-[0.1em] uppercase px-2 py-0.5 ${
              isEndorsement ? 'bg-pink text-white' : 'bg-blue text-white'
            }`}
          >
            {isEndorsement ? '★ Endorsed' : '✓ Reviewed'}
          </span>
          <button
            type="button"
            onClick={handleRemove}
            disabled={loading}
            aria-label="Remove from list"
            title="Remove from list"
            className="font-mono text-xs leading-none text-ink-soft hover:text-ink disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ×
          </button>
        </div>
      </div>
      <p className="font-mono text-[9px] text-ink-soft">
        {submitterName}
        {' · '}
        <span className="capitalize">{review.users.role}</span>
        {' · '}
        {formatDate(review.updated_at)}
      </p>
      {review.body && (
        <p className="font-body text-sm text-ink leading-relaxed whitespace-pre-wrap">&ldquo;{review.body}&rdquo;</p>
      )}
      {error && <p className="font-mono text-[10px] text-red-600">{error}</p>}
    </div>
  )
}
