'use client'

import { useState } from 'react'
import { approveQuestionAnswer, dismissQuestionAnswer } from '@/lib/admin/actions'
import type { PendingQuestionAnswer } from '@/lib/admin/actions'
import Button from '@/components/ui/Button'
import { formatDate, QueueItem } from './admin-shared'

// Split out of cards.tsx to keep that file under the project's ~500-line
// convention (CONTRIBUTING.md) — same card shape as FaqAnswerCard, just for
// question_answers pending rows (brief-page-part2-plan.md §2, Part 7).

export function QuestionAnswerCard({ answer }: { answer: PendingQuestionAnswer }) {
  const [loading, setLoading] = useState<'approving' | 'dismissing' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const submitterName = answer.users.display_name || answer.users.email.split('@')[0]

  async function handleApprove() {
    setLoading('approving')
    setError(null)
    const result = await approveQuestionAnswer(answer.id)
    if (result.error) { setError(result.error); setLoading(null) }
  }

  async function handleDismiss() {
    setLoading('dismissing')
    setError(null)
    const result = await dismissQuestionAnswer(answer.id)
    if (result.error) { setError(result.error); setLoading(null) }
  }

  return (
    <QueueItem
      testId="admin-question-answer-card"
      title={answer.questions.briefs.title}
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
          <p className="font-ui text-ui-sm font-semibold leading-snug text-umber">{answer.questions.question_text}</p>
        </div>
        <div>
          <p className="mb-1 font-mono text-label uppercase text-umber-soft">Answer</p>
          <p className="whitespace-pre-wrap font-ui text-ui-sm leading-relaxed text-umber">{answer.body}</p>
        </div>
      </div>
    </QueueItem>
  )
}
