'use client'

import Link from 'next/link'
import type { ProfilePost, ProfileContribution } from './page'

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

function PostTypeBadge({ type }: { type: string }) {
  const cls: Record<string, string> = {
    video: 'bg-red-100 text-red-700',
    article: 'bg-blue-100 text-blue-700',
    paper: 'bg-green-100 text-green-700',
    quote: 'bg-purple-100 text-purple-700',
    resource: 'bg-amber-100 text-amber-700',
  }
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full font-mono text-[9px] tracking-[0.1em] uppercase ${cls[type] ?? 'bg-gray-100 text-gray-600'}`}
    >
      {type}
    </span>
  )
}

export function PostCard({ post, onEdit }: { post: ProfilePost; onEdit?: () => void }) {
  return (
    <article className="bg-card border border-edge rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <p className="font-serif text-sm font-bold text-dark leading-snug flex-1">
          {post.title}
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <PostTypeBadge type={post.post_type} />
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="font-mono text-[9px] tracking-[0.1em] uppercase text-soft/60 hover:text-text transition-colors"
              aria-label="Edit post"
            >
              Edit
            </button>
          )}
        </div>
      </div>
      {post.body && (
        <p className="font-serif text-sm text-soft leading-relaxed">
          {truncate(post.body, 200)}
        </p>
      )}
      <div className="flex items-center justify-between gap-3 mt-auto pt-1">
        <span className="font-mono text-[9px] text-soft/70">{formatDate(post.created_at)}</span>
        {post.url && (
          <a
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[9px] tracking-[0.15em] uppercase text-live hover:opacity-75 transition-opacity inline-flex items-center gap-1 group"
          >
            View source{' '}
            <span className="group-hover:translate-x-0.5 transition-transform" aria-hidden>
              →
            </span>
          </a>
        )}
      </div>
    </article>
  )
}

// ---------------------------------------------------------------------------
// Contribution card
// ---------------------------------------------------------------------------

export function ContributionCard({
  contribution,
  isOwnProfile,
}: {
  contribution: ProfileContribution
  isOwnProfile: boolean
}) {
  const isPending = contribution.status === 'pending'
  return (
    <article className="bg-card border border-edge rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <Link
          href={`/briefs/${contribution.briefs.slug}`}
          className="font-mono text-[9px] tracking-[0.15em] uppercase text-live hover:opacity-75 transition-opacity"
        >
          {contribution.briefs.title} →
        </Link>
        {isOwnProfile && isPending && (
          <span className="shrink-0 font-mono text-[9px] tracking-[0.1em] uppercase text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
            Pending review
          </span>
        )}
      </div>
      <p className="font-serif text-sm text-text leading-relaxed whitespace-pre-wrap">
        {contribution.contribution_text}
      </p>
      <span className="font-mono text-[9px] text-soft/70">{formatDate(contribution.created_at)}</span>
    </article>
  )
}
