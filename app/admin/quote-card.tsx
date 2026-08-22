'use client'

import { useState } from 'react'
import { approveQuote, dismissQuote } from '@/lib/admin/actions'
import type { PendingQuote } from '@/lib/admin/actions'

// Split out of cards.tsx to keep that file under the project's ~500-line
// convention (CONTRIBUTING.md) — same card shape as CtaCard in
// app/admin/cta-card.tsx, just for content_posts pending quote rows
// (brief-page-part2-plan.md §2, Part 4).

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function QuoteCard({ quote }: { quote: PendingQuote }) {
  const [loading, setLoading] = useState<'approving' | 'dismissing' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const submitterName = quote.users.display_name || quote.users.email.split('@')[0]

  async function handleApprove() {
    setLoading('approving')
    setError(null)
    const result = await approveQuote(quote.id)
    if (result.error) { setError(result.error); setLoading(null) }
  }

  async function handleDismiss() {
    setLoading('dismissing')
    setError(null)
    const result = await dismissQuote(quote.id)
    if (result.error) { setError(result.error); setLoading(null) }
  }

  return (
    <div className="border border-line bg-paper-raised px-5 py-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-0.5">
          <p className="font-mono text-[9px] tracking-[0.18em] uppercase text-blue-ink">
            {quote.briefs?.title ?? 'Unknown brief'}
          </p>
          <p className="font-mono text-[9px] text-ink-soft">
            {submitterName}
            {' · '}
            <span className="capitalize">{quote.users.role}</span>
            {' · '}
            {formatDate(quote.created_at)}
          </p>
        </div>
      </div>
      <div>
        <p className="font-mono text-[9px] tracking-[0.18em] uppercase text-ink-soft mb-1">Quote</p>
        <p className="font-body text-sm text-ink font-semibold leading-snug">&ldquo;{quote.title}&rdquo;</p>
      </div>
      {quote.topic_tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {quote.topic_tags.map((tag) => (
            <span key={tag} className="border border-line px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.06em] text-ink-soft">
              {tag}
            </span>
          ))}
        </div>
      )}
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
