'use client'

import { useState } from 'react'
import { approveContentiousPoint, dismissContentiousPoint } from '@/lib/admin/explainer-actions'
import type { PendingContentiousPoint } from '@/lib/admin/explainer-actions'
import Button from '@/components/ui/Button'
import { formatDate, QueueItem } from './admin-shared'

// Same shape as FaqAnswerCard (faq-answer-card.tsx) — free-text, pending ->
// published moderation, its own file for the same reason that one is split
// out of cards.tsx.

export function ContentiousPointCard({ point }: { point: PendingContentiousPoint }) {
  const [loading, setLoading] = useState<'approving' | 'dismissing' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const submitterName = point.users.display_name || point.users.email.split('@')[0]

  async function handleApprove() {
    setLoading('approving')
    setError(null)
    const result = await approveContentiousPoint(point.id)
    if (result.error) { setError(result.error); setLoading(null) }
  }

  async function handleDismiss() {
    setLoading('dismissing')
    setError(null)
    const result = await dismissContentiousPoint(point.id)
    if (result.error) { setError(result.error); setLoading(null) }
  }

  return (
    <QueueItem
      testId="admin-contentious-point-card"
      title={point.briefs.title}
      meta={
        <>
          {submitterName}
          {' · '}
          <span className="capitalize">{point.users.role}</span>
          {' · '}
          {formatDate(point.created_at)}
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
      <div>
        <p className="mb-1 font-mono text-label uppercase text-umber-soft">
          {point.subsection_label ? `On “${point.subsection_label}”` : 'On the Explainer generally'}
        </p>
        <p className="whitespace-pre-wrap font-ui text-ui-sm leading-relaxed text-umber">{point.body}</p>
      </div>
    </QueueItem>
  )
}
