'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import Avatar from '@/components/ui/Avatar'
import { Carousel } from '@/components/ui/Carousel'
import { likeQuote, logQuoteUsage } from '@/lib/briefs/actions'
import { getDisplayName, formatDate } from './helpers'
import { SectionHeader } from './section-content'
import type { Quote } from './page'

// Split out of section-content.tsx (Quotes was the one section still living
// there rather than in its own file, unlike ctas.tsx/coverage.tsx/faq.tsx) —
// brief-page-part2-plan.md §2, Part 4 touches this section heavily enough
// (add-quote form, detail modal, card-level like/copy) that it earns the
// same per-section file split those already have. AddQuoteModal/
// QuoteDetailModal live in the sibling quote-modals.tsx (also to stay under
// the ~500-line convention); LikeButton/CopyButton are exported here so
// QuoteDetailModal can reuse them rather than duplicating.

// ---------------------------------------------------------------------------
// Like button — any logged-in member, true toggle (mirrors coverage.tsx's
// LikeButton). A logged-out visitor sees a static count with a link to
// /login instead of a button.
// ---------------------------------------------------------------------------

export function LikeButton({
  quoteId,
  briefSlug,
  initialCount,
  initialLiked,
  isLoggedIn,
}: {
  quoteId: string
  briefSlug: string
  initialCount: number
  initialLiked: boolean
  isLoggedIn: boolean
}) {
  const [count, setCount] = useState(initialCount)
  const [liked, setLiked] = useState(initialLiked)
  const [isPending, startTransition] = useTransition()

  if (!isLoggedIn) {
    return (
      <Link
        href="/login"
        onClick={(e) => e.stopPropagation()}
        className="inline-flex items-center gap-1.5 font-mono text-[11px] tabular-nums text-ink-faint transition-colors hover:text-ink"
      >
        <HeartIcon filled={false} />
        {count}
      </Link>
    )
  }

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation()
    const nextLiked = !liked
    setLiked(nextLiked)
    setCount((c) => Math.max(0, c + (nextLiked ? 1 : -1)))
    startTransition(async () => {
      const result = await likeQuote(quoteId, briefSlug)
      if (result.error) {
        setLiked(!nextLiked)
        setCount((c) => Math.max(0, c + (nextLiked ? -1 : 1)))
      }
    })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-label={liked ? 'Unlike' : 'Like'}
      aria-pressed={liked}
      style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
      className="group/like inline-flex cursor-pointer items-center gap-1.5 rounded-sm p-1 -m-1 font-mono text-[11px] tabular-nums text-ink-faint outline-none transition-colors hover:text-pink focus-visible:ring-2 focus-visible:ring-pink disabled:cursor-default"
    >
      <HeartIcon filled={liked} />
      {count}
    </button>
  )
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 16 14" className="h-3.5 w-3.5 shrink-0" aria-hidden>
      <path
        d="M8 13.2S1.4 9.3 1.4 4.9C1.4 2.7 3.1 1 5.2 1c1.2 0 2.2.6 2.8 1.5C8.6 1.6 9.6 1 10.8 1c2.1 0 3.8 1.7 3.8 3.9 0 4.4-6.6 8.3-6.6 8.3Z"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
        className={filled ? 'text-pink' : 'text-current group-hover/like:text-pink'}
      />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Copy button — clipboard write + a content_usage log (Part 4 step 3).
// Logged-out copies still count (logQuoteUsage never requires a session).
// ---------------------------------------------------------------------------

export function CopyButton({ text, quoteId }: { text: string; quoteId: string }) {
  const [copied, setCopied] = useState(false)

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation()
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
    logQuoteUsage(quoteId)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={copied ? 'Copied' : 'Copy quote'}
      title={copied ? 'Copied' : 'Copy quote'}
      style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
      className="inline-flex cursor-pointer items-center rounded-sm p-1 -m-1 text-ink-faint outline-none transition-colors hover:text-blue focus-visible:ring-2 focus-visible:ring-blue"
    >
      {copied ? (
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0 text-blue" aria-hidden>
          <path d="M3 8.5 6.5 12 13 4.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        // The usual "copy" glyph: two overlapping squares — a filled/stroked
        // front square plus the back square's visible corner traced as a
        // partial path, so they read as two distinct squares without an
        // occlusion fill (matches Lucide's Copy icon construction).
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0" aria-hidden>
          <rect x="5.5" y="5.5" width="9" height="9" rx="1" fill="none" stroke="currentColor" strokeWidth="1.3" />
          <path d="M2.5 10.5v-8a1 1 0 0 1 1-1h8" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      )}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Quote card — matches the Two-Ink Bold reference artifact's .qcard: flat
// (no radius/shadow), 1px line border + 3px blue top border, blue avatar
// (square for organisation authors), no decorative watermark. Quote text
// weight dropped from medium (500) to normal (400) — Part 4 step 4, a
// deliberate user-requested divergence from the artifact's own spec, not a
// bug fix. Clicking the card (anywhere but the like/copy buttons or the
// author link) opens the detail modal — same "click card, not a nested
// interactive element" handling as sources.tsx's SourceCard.
// ---------------------------------------------------------------------------

export function QuoteCard({
  quote,
  briefSlug,
  isLoggedIn,
  onOpen,
}: {
  quote: Quote
  briefSlug: string
  isLoggedIn: boolean
  onOpen: () => void
}) {
  const authorName = getDisplayName(quote.users)
  const credential = quote.users.affiliation || quote.users.org_name
  const isOrg = quote.users.role === 'organisation'
  const quoteText = quote.body || quote.title

  return (
    <div className="w-[300px] shrink-0 snap-start pt-1 first:pl-1">
      <div
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen() } }}
        style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
        className="flex h-full cursor-pointer select-none flex-col gap-[0.9rem] border border-line border-t-[3px] border-t-blue bg-paper p-5 outline-none transition-all duration-150 motion-reduce:transition-none hover:-translate-x-0.5 hover:-translate-y-0.5 hover:border-blue hover:shadow-[4px_4px_0_0_var(--color-blue)] focus-visible:ring-2 focus-visible:ring-blue"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[0.62rem] tracking-[0.06em] text-ink-faint tabular-nums">
            {formatDate(quote.created_at)}
          </span>
          <div className="flex items-center gap-3">
            <CopyButton text={quoteText} quoteId={quote.id} />
            <LikeButton
              quoteId={quote.id}
              briefSlug={briefSlug}
              initialCount={quote.likeCount}
              initialLiked={quote.myLike}
              isLoggedIn={isLoggedIn}
            />
          </div>
        </div>
        <p className="flex-1 font-body text-base font-normal leading-[1.5] text-ink">
          &ldquo;{quoteText}&rdquo;
        </p>
        <div className="flex items-center gap-[0.65rem] border-t border-line pt-[0.85rem]">
          <Avatar
            name={authorName}
            avatarUrl={quote.users.avatar_url}
            palette="blue"
            shape={isOrg ? 'square' : 'circle'}
            size="sm"
          />
          <div className="min-w-0 flex-1">
            <Link
              href={`/profile/${quote.users.id}`}
              onClick={(e) => e.stopPropagation()}
              className="block truncate font-display text-[0.85rem] font-extrabold text-ink hover:text-blue transition-colors"
            >
              {authorName}
            </Link>
            {credential && (
              <p className="mt-0.5 truncate font-mono text-[0.62rem] text-ink-soft">{credential}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Quotes carousel — SectionHeader + role filter + "+ Add quote" (org/expert/
// admin) + shared Carousel, matching the reference artifact's #quotes
// section.
// ---------------------------------------------------------------------------

const QUOTE_FILTERS: { value: 'all' | 'expert' | 'organisation'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'expert', label: 'Experts only' },
  { value: 'organisation', label: 'Orgs only' },
]

export function QuotesCarousel({
  quotes,
  briefSlug,
  isLoggedIn,
  canAddQuote,
  onAddQuote,
  onOpenQuote,
}: {
  quotes: Quote[]
  briefSlug: string
  isLoggedIn: boolean
  canAddQuote: boolean
  onAddQuote: () => void
  onOpenQuote: (quote: Quote) => void
}) {
  const [filter, setFilter] = useState<'all' | 'expert' | 'organisation'>('all')
  const filtered = filter === 'all' ? quotes : quotes.filter((q) => q.users.role === filter)

  return (
    <>
      <SectionHeader
        num="03"
        label="Quotes"
        description="Pulled from the platform & source documents on this topic"
        numTone="blue"
        action={
          <div className="flex items-center gap-3">
            <label htmlFor="quote-filter" className="sr-only">
              Filter quotes
            </label>
            <select
              id="quote-filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value as typeof filter)}
              className="border-[1.5px] border-line-strong bg-paper px-3 py-2 font-mono text-[0.68rem] uppercase tracking-[0.04em] text-ink"
            >
              {QUOTE_FILTERS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
            {canAddQuote && (
              <button
                type="button"
                onClick={onAddQuote}
                style={{ touchAction: 'manipulation' }}
                className="border-2 border-blue bg-blue px-4 py-2 font-mono text-[0.68rem] uppercase tracking-[0.08em] text-white outline-none transition-colors hover:bg-paper hover:text-blue focus-visible:ring-2 focus-visible:ring-blue"
              >
                + Add quote
              </button>
            )}
          </div>
        }
      />
      {filtered.length > 0 ? (
        <Carousel.Provider>
          <Carousel.PrevButton />
          <Carousel.NextButton />
          <Carousel.Track fadeColor="var(--color-paper-sunken-blue)" ariaLabel="Expert quotes">
            {filtered.map((q) => (
              <QuoteCard
                key={q.id}
                quote={q}
                briefSlug={briefSlug}
                isLoggedIn={isLoggedIn}
                onOpen={() => onOpenQuote(q)}
              />
            ))}
          </Carousel.Track>
        </Carousel.Provider>
      ) : (
        <p className="font-mono text-xs text-ink-faint">
          {quotes.length === 0 ? 'No quotes yet.' : 'No quotes match this filter.'}
        </p>
      )}
    </>
  )
}

