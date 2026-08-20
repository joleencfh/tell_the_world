'use client'

import { useState } from 'react'
import { markBriefFeedbackReviewed } from '@/lib/admin/actions'
import type { PendingBriefFeedback } from '@/lib/admin/actions'

// Split out of cards.tsx to keep that file under the project's ~500-line
// convention (CONTRIBUTING.md) — same card shape as CorrectionProposalCard
// there, for brief_feedback pending rows (brief-page-part2-plan.md §2,
// Part 0c). Only one action (mark reviewed) — unlike the other moderation
// cards there's no approve/dismiss distinction, since nothing here is
// ever published.

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

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
    <div className="border border-line bg-paper-raised px-5 py-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-0.5">
          <p className="font-mono text-[9px] tracking-[0.18em] uppercase text-blue-ink">
            {feedback.briefs.title}
            {feedback.section && ` · ${feedback.section}`}
          </p>
          <p className="font-mono text-[9px] text-ink-soft">
            {submitterName}
            {' · '}
            <span className="capitalize">{feedback.users.role}</span>
            {' · '}
            {formatDate(feedback.created_at)}
          </p>
        </div>
      </div>
      <p className="font-body text-sm text-ink leading-relaxed whitespace-pre-wrap">
        {feedback.body}
      </p>
      {error && <p className="font-mono text-[10px] text-red-600">{error}</p>}
      <div className="flex gap-3">
        <button
          onClick={handleMarkReviewed}
          disabled={loading}
          className="font-mono text-[10px] tracking-[0.18em] uppercase px-5 py-2.5 bg-ink text-paper hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? 'Marking reviewed…' : 'Mark reviewed'}
        </button>
      </div>
    </div>
  )
}
