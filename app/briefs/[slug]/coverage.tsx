'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { likeCoverage } from '@/lib/briefs/actions'
import DuotonePlaceholder from '@/components/ui/DuotonePlaceholder'
import { Carousel } from '@/components/ui/Carousel'
import { formatDate } from './helpers'
import type { Coverage } from '@/lib/data/coverage'

// Card/carousel split out of coverage-modals.tsx (AddCoverageModal, and Part
// 9's new CoverageDetailModal) — mirrors quotes.tsx/quote-modals.tsx's split,
// both to stay under the repo's ~500-line convention and because the detail
// modal has to be rendered from brief-modals.tsx, not nested in here (see
// BriefView.tsx's own comment on why every top-level modal lives there:
// position:fixed modals get trapped as a containing block by a completed
// anim-rise transform otherwise).

// ---------------------------------------------------------------------------
// Like button — any logged-in member, true toggle (mirrors quotes.tsx's
// LikeButton, which this predates — kept independent rather than merged
// since Coverage's logged-out state renders pink, not ink-faint, and the
// two already diverged before Part 9). A logged-out visitor sees a static
// count with a link to /login instead of a button — Covered By is visible
// to logged-out visitors on public briefs (unlike Community Q&A, which is
// members-only and never renders this case). Exported so
// CoverageDetailModal (coverage-modals.tsx) can reuse it instead of
// duplicating.
// ---------------------------------------------------------------------------

export function LikeButton({
  coverageId,
  briefSlug,
  initialCount,
  initialLiked,
  isLoggedIn,
}: {
  coverageId: string
  briefSlug: string
  initialCount: number
  initialLiked: boolean
  isLoggedIn: boolean
}) {
  const [count, setCount] = useState(initialCount)
  const [liked, setLiked] = useState(initialLiked)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  if (!isLoggedIn) {
    return (
      <Link
        href="/login"
        onClick={(e) => e.stopPropagation()}
        className="inline-flex items-center gap-1.5 font-mono text-[11px] tabular-nums text-coverage-fg/50 transition-colors hover:text-coverage-fg"
      >
        <HeartIcon filled={false} />
        {count}
      </Link>
    )
  }

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation()
    setError(null)
    const nextLiked = !liked
    setLiked(nextLiked)
    setCount((c) => Math.max(0, c + (nextLiked ? 1 : -1)))
    startTransition(async () => {
      const result = await likeCoverage(coverageId, briefSlug)
      if (result.error) {
        setError(result.error)
        setLiked(!nextLiked)
        setCount((c) => Math.max(0, c + (nextLiked ? -1 : 1)))
      }
    })
  }

  return (
    <div className="flex items-center gap-1.5" aria-live="polite">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        aria-label={liked ? 'Unlike' : 'Like'}
        aria-pressed={liked}
        style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
        className="group/like inline-flex cursor-pointer items-center gap-1.5 rounded-sm p-1 -m-1 font-mono text-[11px] tabular-nums text-coverage-fg/50 outline-none transition-colors hover:text-pink focus-visible:ring-2 focus-visible:ring-pink disabled:cursor-default"
      >
        <HeartIcon filled={liked} />
        {count}
      </button>
      {error && (
        <span role="alert" className="font-mono text-[9px] text-pink">
          {error}
        </span>
      )}
    </div>
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
// Coverage card — a link-preview card: image (real og:image, or Part 0's
// duotone placeholder when none was found/the site had no OG tags), outlet
// name, title, like button, and a bare arrow to the article. The whole card
// is now a click target opening the detail modal (Part 9) — same "click
// card, not a nested interactive element" handling as sources.tsx's
// SourceCard/quotes.tsx's QuoteCard: the arrow keeps its own
// stopPropagation (pre-existing), and the like button now stops
// propagation too (added above) so it doesn't also trigger the modal.
// ---------------------------------------------------------------------------

function CoverageCard({
  coverage,
  briefSlug,
  isLoggedIn,
  onOpen,
}: {
  coverage: Coverage
  briefSlug: string
  isLoggedIn: boolean
  onOpen: () => void
}) {
  const [imgFailed, setImgFailed] = useState(false)
  const showImage = coverage.image_url && !imgFailed
  const dateLabel = coverage.published_date ? formatDate(coverage.published_date) : formatDate(coverage.created_at)

  return (
    <div className="w-[300px] shrink-0 snap-start pt-1 first:pl-1">
      <div
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onOpen()
          }
        }}
        style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
        className="flex h-full cursor-pointer select-none flex-col border border-coverage-fg/15 bg-coverage-bg outline-none transition-all duration-150 motion-reduce:transition-none hover:-translate-x-0.5 hover:-translate-y-0.5 hover:border-pink hover:shadow-[4px_4px_0_0_var(--color-pink)] focus-visible:ring-2 focus-visible:ring-pink"
      >
        <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden border-b border-coverage-fg/15 bg-coverage-fg/5">
          {showImage ? (
            // Arbitrary third-party host — can't be allow-listed for next/image (Avatar.tsx has the same tradeoff).
            <img
              src={coverage.image_url!}
              alt=""
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={() => setImgFailed(true)}
              className="h-full w-full object-cover"
            />
          ) : (
            <DuotonePlaceholder id={coverage.id} className="h-full w-full" />
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2 p-5">
          <span className="truncate font-mono text-[0.65rem] font-semibold uppercase tracking-[0.03em] text-coverage-fg/60">
            {coverage.outlet_name}
          </span>
          <h3 className="min-w-0 break-words font-display text-[1.02rem] font-extrabold leading-[1.3] text-coverage-fg line-clamp-2">
            {coverage.title}
          </h3>

          <div className="mt-auto flex items-center justify-between gap-3 border-t border-coverage-fg/15 pt-3">
            <span className="truncate font-mono text-[0.58rem] text-coverage-fg/40">{dateLabel}</span>
            <div className="flex shrink-0 items-center gap-3">
              <LikeButton
                coverageId={coverage.id}
                briefSlug={briefSlug}
                initialCount={coverage.likeCount}
                initialLiked={coverage.myLike}
                isLoggedIn={isLoggedIn}
              />
              <a
                href={coverage.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Read “${coverage.title}” at ${coverage.outlet_name}`}
                style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
                className="group/link flex h-6 w-6 shrink-0 items-center justify-center rounded-sm text-coverage-fg/50 outline-none transition-colors hover:text-pink focus-visible:ring-2 focus-visible:ring-pink"
                onClick={(e) => e.stopPropagation()}
              >
                <svg
                  viewBox="0 0 20 20"
                  fill="none"
                  aria-hidden
                  className="h-4 w-4 stroke-current stroke-[1.6] transition-all duration-150 motion-reduce:transition-none group-hover/link:translate-x-0.5 group-hover/link:scale-125 group-hover/link:stroke-[2.4]"
                >
                  <path d="M4 10h11.5M10.5 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Coverage band — explicit empty state rather than an empty carousel shell
// (§1.4), styled for the dark band since it's the section's only content
// when there's nothing to show yet. Copy branches on isLoggedIn (brief-page
// onboarding pass, 2026-08-28): adding coverage is open to any logged-in
// member, not gated to expert/organisation like Quotes/CTAs, so this is the
// one of the four onboarding sections where the empty state can put a real,
// achievable action in front of almost anyone reading it.
// ---------------------------------------------------------------------------

export function CoverageCarousel({
  coverage,
  briefSlug,
  isLoggedIn,
  onOpenCoverage,
}: {
  coverage: Coverage[]
  briefSlug: string
  isLoggedIn: boolean
  onOpenCoverage: (coverage: Coverage) => void
}) {
  if (coverage.length === 0) {
    return (
      <p className="font-mono text-xs text-coverage-fg/50">
        {isLoggedIn
          ? 'Coverage of this topic goes here, from mainstream articles to independent newsletters.'
          : 'Coverage of this topic will appear here.'}
      </p>
    )
  }

  return (
    <Carousel.Provider>
      <Carousel.PrevButton />
      <Carousel.NextButton />
      <Carousel.Track fadeColor="var(--color-coverage-bg)" ariaLabel="Press coverage">
        {coverage.map((c) => (
          <CoverageCard
            key={c.id}
            coverage={c}
            briefSlug={briefSlug}
            isLoggedIn={isLoggedIn}
            onOpen={() => onOpenCoverage(c)}
          />
        ))}
      </Carousel.Track>
    </Carousel.Provider>
  )
}
