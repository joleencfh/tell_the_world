'use client'

import { useState } from 'react'
import { approveCoverage, dismissCoverage } from '@/lib/admin/actions'
import type { PendingCoverage } from '@/lib/admin/actions'

// Split out of cards.tsx to keep that file under the project's ~500-line
// convention (CONTRIBUTING.md) — same card shape as CtaCard in
// app/admin/cta-card.tsx, for brief_coverage pending rows
// (two-ink-bold-plan.md Part 7). The extra piece CtaCard doesn't have: an
// optional score field, since score is set by the admin at approval time
// (no separate UI for it elsewhere) rather than self-reported.

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

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
    <div className="border border-line bg-paper-raised px-5 py-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-0.5">
          <p className="font-mono text-[9px] tracking-[0.18em] uppercase text-blue-ink">
            {coverage.briefs.title}
          </p>
          <p className="font-mono text-[9px] text-ink-soft">
            {submitterName}
            {' · '}
            <span className="capitalize">{coverage.users.role}</span>
            {' · '}
            {formatDate(coverage.created_at)}
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        {coverage.image_url && (
          // Arbitrary third-party host — can't be allow-listed for next/image.
          <img
            src={coverage.image_url}
            alt=""
            referrerPolicy="no-referrer"
            className="h-16 w-24 shrink-0 border border-line object-cover"
          />
        )}
        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <p className="font-mono text-[9px] tracking-[0.18em] uppercase text-ink-soft mb-1">
              {coverage.outlet_name}
              {coverage.published_date && ` · ${formatDate(coverage.published_date)}`}
            </p>
            <p className="font-body text-sm text-ink font-semibold leading-snug">{coverage.title}</p>
          </div>
          <a
            href={coverage.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-body text-sm text-blue-ink hover:underline break-all"
          >
            {coverage.url}
          </a>
        </div>
      </div>

      <div>
        <label htmlFor={`score-${coverage.id}`} className="block font-mono text-[9px] tracking-[0.18em] uppercase text-ink-soft mb-1">
          Score (optional)
        </label>
        <input
          id={`score-${coverage.id}`}
          type="text"
          inputMode="decimal"
          value={score}
          onChange={(e) => setScore(e.target.value)}
          disabled={loading !== null}
          placeholder="e.g. 8.5"
          className="w-32 border border-line bg-paper px-2.5 py-1.5 font-mono text-xs text-ink disabled:opacity-50"
        />
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
