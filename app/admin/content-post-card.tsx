'use client'

import { useState } from 'react'
import { approveQuote, dismissQuote } from '@/lib/admin/actions'
import type { PendingContentPost } from '@/lib/admin/actions'
import type { FlaggedTerm } from '@/lib/clarity/check'

// Renamed from quote-card.tsx / QuoteCard — this queue now holds any
// pending content_posts row (brief-attached quotes from submitQuote, or
// any-post_type profile posts from createPost, lib/data/admin.ts's
// getPendingContentPosts), not just brief-scoped quotes, so the old name
// actively misled once a flagged profile post could show up here. Also
// disambiguates from the unrelated public-facing app/directory/QuoteCard.tsx.

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function ContentPostCard({ quote }: { quote: PendingContentPost }) {
  const [loading, setLoading] = useState<'approving' | 'dismissing' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const submitterName = quote.users.display_name || quote.users.email.split('@')[0]
  const isQuote = quote.post_type === 'quote'
  const flaggedTerms = (quote.flagged_terms as FlaggedTerm[] | null) ?? []

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
            {quote.briefs?.title ?? 'Profile post'}
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
        <p className="font-mono text-[9px] tracking-[0.18em] uppercase text-ink-soft mb-1">
          {isQuote ? 'Quote' : 'Post'}
        </p>
        <p className="font-body text-sm text-ink font-semibold leading-snug">
          {isQuote ? <>&ldquo;{quote.title}&rdquo;</> : quote.title}
        </p>
        {!isQuote && quote.body && (
          <p className="mt-1 font-body text-xs text-ink-soft leading-snug">{quote.body}</p>
        )}
      </div>
      {flaggedTerms.length > 0 && (
        <div>
          <p className="font-mono text-[9px] tracking-[0.18em] uppercase text-pink-ink mb-1">
            Flagged — {flaggedTerms.length === 1 ? '1 term' : `${flaggedTerms.length} terms`}
          </p>
          <ul className="space-y-1">
            {flaggedTerms.map((term) => (
              <li key={term.id} className="font-body text-xs text-ink-soft leading-snug">
                <span className="font-semibold text-ink">&ldquo;{term.matchedText}&rdquo;</span> — {term.explanation}
              </li>
            ))}
          </ul>
        </div>
      )}
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
