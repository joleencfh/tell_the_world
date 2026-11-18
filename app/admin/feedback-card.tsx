'use client'

import { useState } from 'react'
import { markBriefFeedbackReviewed } from '@/lib/admin/actions'
import type { PendingBriefFeedback } from '@/lib/admin/actions'
import Button from '@/components/ui/Button'
import { formatDate, QueueItem } from './admin-shared'

// Split out of cards.tsx to keep that file under the project's ~500-line
// convention (CONTRIBUTING.md) — same card shape as CorrectionProposalCard
// there, for brief_feedback pending rows (brief-page-part2-plan.md §2,
// Part 0c). Only one action (mark reviewed) — unlike the other moderation
// cards there's no approve/dismiss distinction, since nothing here is
// ever published.

export function FeedbackCard({ feedback }: { feedback: PendingBriefFeedback }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const submitterName = feedback.users.display_name || feedback.users.email.split('@')[0]

  async function handleMarkReviewed() {
    setLoading(true)
    setError(null)
    const result = await markBriefFeedbackReviewed(feedback.id)
    if (result.error) { setError(result.error); setLoading(false) }
  }

  return (
    <QueueItem
      testId="admin-feedback-card"
      title={
        <>
          {feedback.briefs.title}
          {feedback.section && ` · ${feedback.section}`}
        </>
      }
      meta={
        <>
          {submitterName}
          {' · '}
          <span className="capitalize">{feedback.users.role}</span>
          {' · '}
          {formatDate(feedback.created_at)}
        </>
      }
      error={error}
      actions={
        <Button variant="primary" onClick={handleMarkReviewed} disabled={loading} pending={loading}>
          {loading ? 'Marking reviewed…' : 'Mark reviewed'}
        </Button>
      }
    >
      <p className="whitespace-pre-wrap font-ui text-ui-sm leading-relaxed text-umber">{feedback.body}</p>
    </QueueItem>
  )
}
