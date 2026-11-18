'use client'

import { useState } from 'react'
import { archiveBriefReview } from '@/lib/admin/actions'
import type { BriefReview } from '@/lib/admin/actions'
import Button from '@/components/ui/Button'
import { Icon } from '@/components/ui/icons'
import StatusChip from '@/components/ui/StatusChip'
import { AdminError, formatDate } from './admin-shared'

// No approve/dismiss here — reviews/endorsements publish immediately (see
// getBriefReviews' own comment in lib/admin/actions.ts). The only action is
// the × button: an admin-only soft-remove (archiveBriefReview), separate
// from a contributor's own self-withdraw on their profile — see that
// action's own comment for why it archives rather than deletes.

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
    <div className="space-y-2 border border-rule bg-vellum px-5 py-4" data-testid="admin-review-card">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="min-w-0 flex-1 font-ui text-ui-sm font-semibold text-umber">{review.briefs.title}</p>
        <div className="flex shrink-0 items-center gap-2">
          <StatusChip
            status="approved"
            label={isEndorsement ? 'Endorsed' : 'Reviewed'}
            tone={isEndorsement ? 'success' : 'neutral'}
          />
          <Button
            variant="ghost"
            icon
            onClick={handleRemove}
            disabled={loading}
            aria-label="Remove from list"
            title="Remove from list"
          >
            <Icon name="x" />
          </Button>
        </div>
      </div>
      <p className="font-ui text-ui-sm text-umber-soft">
        {submitterName}
        {' · '}
        <span className="capitalize">{review.users.role}</span>
        {' · '}
        {formatDate(review.updated_at)}
      </p>
      {review.body && (
        <p className="whitespace-pre-wrap font-ui text-ui-sm leading-relaxed text-umber">&ldquo;{review.body}&rdquo;</p>
      )}
      <AdminError message={error} />
    </div>
  )
}
