'use client'

import { useState } from 'react'
import { approveQuestionAnswer, dismissQuestionAnswer } from '@/lib/admin/actions'
import type { PendingQuestionAnswer } from '@/lib/admin/actions'

// Split out of cards.tsx to keep that file under the project's ~500-line
// convention (CONTRIBUTING.md) — same card shape as FaqAnswerCard, just for
// question_answers pending rows (brief-page-part2-plan.md §2, Part 7).

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

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
    <div className="border border-line bg-paper-raised px-5 py-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-0.5">
          <p className="font-mono text-[9px] tracking-[0.18em] uppercase text-blue-ink">
            {answer.questions.briefs.title}
          </p>
          <p className="font-mono text-[9px] text-ink-soft">
            {submitterName}
            {' · '}
            <span className="capitalize">{answer.users.role}</span>
            {' · '}
            {formatDate(answer.created_at)}
          </p>
        </div>
      </div>
      <div>
        <p className="font-mono text-[9px] tracking-[0.18em] uppercase text-ink-soft mb-1">Question</p>
        <p className="font-body text-sm text-ink font-semibold leading-snug">{answer.questions.question_text}</p>
      </div>
      <div>
        <p className="font-mono text-[9px] tracking-[0.18em] uppercase text-ink-soft mb-1">Answer</p>
        <p className="font-body text-sm text-ink leading-relaxed whitespace-pre-wrap">{answer.body}</p>
      </div>
      {error && <p className="font-mono text-[10px] text-red-600">{error}</p>}
      <div className="flex gap-3">
        <button
          onClick={handleApprove}
          disabled={loading !== null}
          className="font-mono text-[10px] tracking-[0.18em] uppercase px-5 py-2.5 bg-ink text-paper hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading === 'approving' ? 'Approving…' : 'Approve'}
        </button>
        <button
          onClick={handleDismiss}
          disabled={loading !== null}
          className="font-mono text-[10px] tracking-[0.18em] uppercase px-5 py-2.5 border border-line text-ink-soft hover:border-ink hover:text-ink transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading === 'dismissing' ? 'Dismissing…' : 'Dismiss'}
        </button>
      </div>
    </div>
  )
}
