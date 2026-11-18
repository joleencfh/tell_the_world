'use client'

import { useState } from 'react'
import { approveFaqAnswer, dismissFaqAnswer } from '@/lib/admin/actions'
import type { PendingFaqAnswer } from '@/lib/admin/actions'
import Button from '@/components/ui/Button'
import { formatDate, QueueItem } from './admin-shared'

// Split out of cards.tsx to keep that file under the project's ~500-line
// convention (CONTRIBUTING.md) — same card shape as CorrectionProposalCard
// there, just for brief_faq_answers pending rows (two-ink-bold-plan.md
// Part 4b).

export function FaqAnswerCard({ answer }: { answer: PendingFaqAnswer }) {
  const [loading, setLoading] = useState<'approving' | 'dismissing' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const submitterName = answer.users.display_name || answer.users.email.split('@')[0]

  async function handleApprove() {
    setLoading('approving')
    setError(null)
    const result = await approveFaqAnswer(answer.id)
    if (result.error) { setError(result.error); setLoading(null) }
  }

  async function handleDismiss() {
    setLoading('dismissing')
    setError(null)
    const result = await dismissFaqAnswer(answer.id)
    if (result.error) { setError(result.error); setLoading(null) }
  }

  return (
    <QueueItem
      testId="admin-faq-answer-card"
      title={answer.briefs.title}
      meta={
        <>
          {submitterName}
          {' · '}
          <span className="capitalize">{answer.users.role}</span>
          {' · '}
          {formatDate(answer.created_at)}
        </>
      }
      error={error}
      actions={
        <>
          <Button
            variant="primary"
            onClick={handleApprove}
            disabled={loading !== null}
            pending={loading === 'approving'}
          >
            {loading === 'approving' ? 'Approving…' : 'Approve'}
          </Button>
          <Button
            variant="secondary"
            onClick={handleDismiss}
            disabled={loading !== null}
            pending={loading === 'dismissing'}
          >
            {loading === 'dismissing' ? 'Dismissing…' : 'Dismiss'}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div>
          <p className="mb-1 font-mono text-label uppercase text-umber-soft">Question</p>
          <p className="font-ui text-ui-sm font-semibold leading-snug text-umber">{answer.question}</p>
        </div>
        <div>
          <p className="mb-1 font-mono text-label uppercase text-umber-soft">Answer</p>
          <p className="whitespace-pre-wrap font-ui text-ui-sm leading-relaxed text-umber">{answer.body}</p>
        </div>
      </div>
    </QueueItem>
  )
}
