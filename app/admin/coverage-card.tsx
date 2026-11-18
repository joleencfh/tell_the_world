'use client'

import { useState } from 'react'
import { approveCoverage, dismissCoverage } from '@/lib/admin/actions'
import type { PendingCoverage } from '@/lib/admin/actions'
import Button from '@/components/ui/Button'
import Field, { TextInput } from '@/components/ui/Field'
import { formatDate, QueueItem } from './admin-shared'

// Split out of cards.tsx to keep that file under the project's ~500-line
// convention (CONTRIBUTING.md) — same card shape as CtaCard in
// app/admin/cta-card.tsx, for brief_coverage pending rows
// (two-ink-bold-plan.md Part 7). The extra piece CtaCard doesn't have: an
// optional score field, since score is set by the admin at approval time
// (no separate UI for it elsewhere) rather than self-reported.

export function CoverageCard({ coverage }: { coverage: PendingCoverage }) {
  const [loading, setLoading] = useState<'approving' | 'dismissing' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [score, setScore] = useState('')
  const submitterName = coverage.users.display_name || coverage.users.email.split('@')[0]

  async function handleApprove() {
    setLoading('approving')
    setError(null)
    const trimmed = score.trim()
    const parsed = trimmed ? Number(trimmed) : null
    if (trimmed && (parsed === null || Number.isNaN(parsed))) {
      setError('Score must be a number.')
      setLoading(null)
      return
    }
    const result = await approveCoverage(coverage.id, parsed)
    if (result.error) { setError(result.error); setLoading(null) }
  }

  async function handleDismiss() {
    setLoading('dismissing')
    setError(null)
    const result = await dismissCoverage(coverage.id)
    if (result.error) { setError(result.error); setLoading(null) }
  }

  return (
    <QueueItem
      testId="admin-coverage-card"
      title={coverage.briefs.title}
      meta={
        <>
          {submitterName}
          {' · '}
          <span className="capitalize">{coverage.users.role}</span>
          {' · '}
          {formatDate(coverage.created_at)}
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
        <div className="flex gap-3">
          {coverage.image_url && (
            // Re-hosted on Supabase storage (lib/links/store-image.ts), same
            // tradeoff as Avatar.tsx — plain img, not next/image.
            <img
              src={coverage.image_url}
              alt=""
              referrerPolicy="no-referrer"
              className="h-16 w-24 shrink-0 border border-rule object-cover"
            />
          )}
          <div className="min-w-0 flex-1 space-y-2">
            <div>
              <p className="mb-1 font-mono text-label uppercase text-umber-soft">
                {coverage.outlet_name}
                {coverage.published_date && ` · ${formatDate(coverage.published_date)}`}
              </p>
              <p className="font-ui text-ui-sm font-semibold leading-snug text-umber">{coverage.title}</p>
            </div>
            <a
              href={coverage.url}
              target="_blank"
              rel="noopener noreferrer"
              className="break-all font-ui text-ui-sm text-cobalt underline focus-ring"
            >
              {coverage.url}
            </a>
          </div>
        </div>

        <Field label="Score (optional)" id={`score-${coverage.id}`} className="w-40">
          {(p) => (
            <TextInput
              {...p}
              inputMode="decimal"
              value={score}
              onChange={(e) => setScore(e.target.value)}
              disabled={loading !== null}
              placeholder="e.g. 8.5"
            />
          )}
        </Field>
      </div>
    </QueueItem>
  )
}
