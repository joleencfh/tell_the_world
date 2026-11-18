'use client'

import { useState } from 'react'
import { approveQuote, dismissQuote } from '@/lib/admin/actions'
import type { PendingContentPost } from '@/lib/admin/actions'
import type { FlaggedTerm } from '@/lib/clarity/check'
import Button from '@/components/ui/Button'
import Tag from '@/components/ui/Tag'
import { formatDate, QueueItem } from './admin-shared'

// Renamed from quote-card.tsx / QuoteCard — this queue now holds any
// pending content_posts row (brief-attached quotes from submitQuote, or
// any-post_type profile posts from createPost, lib/data/admin.ts's
// getPendingContentPosts), not just brief-scoped quotes, so the old name
// actively misled once a flagged profile post could show up here. Also
// disambiguates from the unrelated public-facing app/directory/QuoteCard.tsx.

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
    <QueueItem
      testId="admin-content-post-card"
      title={quote.briefs?.title ?? 'Profile post'}
      meta={
        <>
          {submitterName}
          {' · '}
          <span className="capitalize">{quote.users.role}</span>
          {' · '}
          {formatDate(quote.created_at)}
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
          <p className="mb-1 font-mono text-label uppercase text-umber-soft">{isQuote ? 'Quote' : 'Post'}</p>
          <p className="font-ui text-ui-sm font-semibold leading-snug text-umber">
            {isQuote ? <>&ldquo;{quote.title}&rdquo;</> : quote.title}
          </p>
          {!isQuote && quote.body && (
            <p className="mt-1 font-ui text-ui-sm leading-snug text-umber-soft">{quote.body}</p>
          )}
        </div>
        {flaggedTerms.length > 0 && (
          <div>
            <p className="mb-1 font-mono text-label uppercase text-brick">
              Flagged — {flaggedTerms.length === 1 ? '1 term' : `${flaggedTerms.length} terms`}
            </p>
            <ul className="space-y-1">
              {flaggedTerms.map((term) => (
                <li key={term.id} className="font-ui text-ui-sm leading-snug text-umber-soft">
                  <span className="font-semibold text-umber">&ldquo;{term.matchedText}&rdquo;</span> — {term.explanation}
                </li>
              ))}
            </ul>
          </div>
        )}
        {quote.topic_tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {quote.topic_tags.map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </div>
        )}
      </div>
    </QueueItem>
  )
}
