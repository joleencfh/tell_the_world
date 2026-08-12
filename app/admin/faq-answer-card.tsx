'use client'

import { useState } from 'react'
import { approveFaqAnswer, dismissFaqAnswer } from '@/lib/admin/actions'
import type { PendingFaqAnswer } from '@/lib/admin/actions'

// Split out of cards.tsx to keep that file under the project's ~500-line
// convention (CONTRIBUTING.md) — same card shape as CorrectionProposalCard
// there, just for brief_faq_answers pending rows (two-ink-bold-plan.md
// Part 4b).

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

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
    <div className="border border-edge bg-card px-5 py-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-0.5">
          <p className="font-mono text-[9px] tracking-[0.18em] uppercase text-live">
            {answer.briefs.title}
          </p>
          <p className="font-mono text-[9px] text-soft">
            {submitterName}
            {' · '}
            <span className="capitalize">{answer.users.role}</span>
            {' · '}
            {formatDate(answer.created_at)}
          </p>
        </div>
      </div>
      <div>
        <p className="font-mono text-[9px] tracking-[0.18em] uppercase text-soft mb-1">Question</p>
        <p className="font-serif text-sm text-dark font-semibold leading-snug">{answer.question}</p>
      </div>
      <div>
        <p className="font-mono text-[9px] tracking-[0.18em] uppercase text-soft mb-1">Answer</p>
        <p className="font-serif text-sm text-dark leading-relaxed whitespace-pre-wrap">{answer.body}</p>
      </div>
      {error && <p className="font-mono text-[10px] text-red-600">{error}</p>}
      <div className="flex gap-3">
        <button
          onClick={handleApprove}
          disabled={loading !== null}
          className="font-mono text-[10px] tracking-[0.18em] uppercase px-5 py-2.5 bg-dark text-white hover:bg-text transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading === 'approving' ? 'Approving…' : 'Approve'}
        </button>
        <button
          onClick={handleDismiss}
          disabled={loading !== null}
          className="font-mono text-[10px] tracking-[0.18em] uppercase px-5 py-2.5 border border-edge text-soft hover:border-text hover:text-text transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading === 'dismissing' ? 'Dismissing…' : 'Dismiss'}
        </button>
      </div>
    </div>
  )
}
