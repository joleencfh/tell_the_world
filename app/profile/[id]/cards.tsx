'use client'

import { useState } from 'react'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import CategoryChip, { type PostCategory } from '@/components/ui/CategoryChip'
import StatusChip from '@/components/ui/StatusChip'
import Tag from '@/components/ui/Tag'
import { withdrawReview } from '@/lib/briefs/actions'
import type { ProfilePost, ProfileCorrectionProposal, ProfileReview } from './page'

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function truncate(text: string, max: number): string {
  return text.length <= max ? text : text.slice(0, max).trimEnd() + '…'
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const POST_CATEGORIES: readonly PostCategory[] = ['video', 'article', 'paper', 'quote', 'resource']

// Post types are told apart by an icon and a word, never by hue. A type the
// design system does not know falls back to "resource".
function PostTypeBadge({ type }: { type: string }) {
  const category = POST_CATEGORIES.find((c) => c === type) ?? 'resource'
  return <CategoryChip category={category} />
}

const CARD = 'flex flex-col gap-3 rounded-control bg-vellum p-5 shadow-hairline'
const TEXT_LINK =
  'inline-flex min-h-11 items-center gap-1 rounded-control font-ui text-ui-sm text-cobalt underline decoration-cobalt/40 underline-offset-[5px] hover:decoration-cobalt focus-ring'

export function PostCard({ post, onEdit }: { post: ProfilePost; onEdit?: () => void }) {
  return (
    <article className={CARD}>
      <div className="flex items-start justify-between gap-3">
        <p className="flex-1 font-ui text-ui font-semibold leading-snug text-umber">{post.title}</p>
        <div className="flex shrink-0 items-center gap-2">
          <PostTypeBadge type={post.post_type} />
          {onEdit && (
            <Button type="button" variant="ghost" small onClick={onEdit} aria-label="Edit post">
              Edit
            </Button>
          )}
        </div>
      </div>
      {post.body && <p className="font-ui text-ui-sm text-umber-soft">{truncate(post.body, 200)}</p>}
      <div className="mt-auto flex items-center justify-between gap-3 pt-1">
        <span className="text-caption tabular-nums text-umber-soft">{formatDate(post.created_at)}</span>
        {post.url && (
          <a href={post.url} target="_blank" rel="noopener noreferrer" className={`group ${TEXT_LINK}`}>
            View source{' '}
            <span className="transition-transform group-hover:translate-x-0.5" aria-hidden>
              →
            </span>
          </a>
        )}
      </div>
    </article>
  )
}

// ---------------------------------------------------------------------------
// Correction proposal card
// ---------------------------------------------------------------------------

export function CorrectionProposalCard({
  proposal,
  isOwnProfile,
}: {
  proposal: ProfileCorrectionProposal
  isOwnProfile: boolean
}) {
  const isPending = proposal.status === 'pending'
  return (
    <article className={CARD}>
      <div className="flex items-start justify-between gap-3">
        <Link href={`/briefs/${proposal.briefs.slug}`} className={TEXT_LINK}>
          {proposal.briefs.title} →
        </Link>
        {isOwnProfile && isPending && (
          <StatusChip status="pending" label="Pending review" className="shrink-0" />
        )}
      </div>
      <p className="whitespace-pre-wrap font-ui text-ui-sm text-umber">{proposal.contribution_text}</p>
      <span className="text-caption tabular-nums text-umber-soft">{formatDate(proposal.created_at)}</span>
    </article>
  )
}

// ---------------------------------------------------------------------------
// Review history card — one row per brief this user has reviewed/endorsed,
// including ones they've withdrawn (RLS only surfaces those to the owner —
// see getUserReviewHistory's own comment in lib/data/contributions.ts).
// Withdraw button only shows on your own profile, and only while the row is
// still active — nothing to withdraw twice.
// ---------------------------------------------------------------------------

export function ReviewHistoryCard({
  review,
  isOwnProfile,
}: {
  review: ProfileReview
  isOwnProfile: boolean
}) {
  const [status, setStatus] = useState(review.status)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isEndorsement = review.type === 'endorsement'
  const isArchived = status === 'archived'

  async function handleWithdraw() {
    setLoading(true)
    setError(null)
    const result = await withdrawReview(review.id, review.briefs.slug)
    if (result.error) { setError(result.error); setLoading(false) }
    else setStatus('archived')
  }

  return (
    <article className={`${CARD} ${isArchived ? 'bg-bone opacity-70 shadow-none' : ''}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <Link href={`/briefs/${review.briefs.slug}`} className={TEXT_LINK}>
          {review.briefs.title} →
        </Link>
        <div className="flex shrink-0 items-center gap-2">
          <Tag>{isEndorsement ? '★ Endorsed' : '✓ Reviewed'}</Tag>
          {isArchived && <span className="font-mono text-label uppercase text-umber-soft">Withdrawn</span>}
        </div>
      </div>
      {review.body && (
        <p className="whitespace-pre-wrap font-serif text-message text-umber">&ldquo;{review.body}&rdquo;</p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-caption tabular-nums text-umber-soft">{formatDate(review.updated_at)}</span>
        {isOwnProfile && !isArchived && (
          <Button type="button" variant="ghost" small onClick={handleWithdraw} disabled={loading}>
            {loading ? 'Withdrawing…' : 'Withdraw'}
          </Button>
        )}
      </div>
      {error && (
        <p role="alert" className="font-ui text-caption text-brick">
          {error}
        </p>
      )}
    </article>
  )
}
