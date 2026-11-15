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
        className="focus-ring -m-1 inline-flex min-h-11 items-center gap-1.5 rounded-control p-1 font-mono text-label tabular-nums text-umber-soft transition-colors hover:text-umber"
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
        className="group/like focus-ring -m-1 inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center gap-1.5 rounded-control p-1 font-mono text-label tabular-nums text-umber-soft transition-colors hover:text-rose disabled:cursor-default"
      >
        <HeartIcon filled={liked} />
        {count}
      </button>
      {error && (
        <span role="alert" className="font-mono text-label text-brick">
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
        className={filled ? 'text-rose' : 'text-current group-hover/like:text-rose'}
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
        className="focus-ring flex h-full cursor-pointer select-none flex-col overflow-hidden rounded-control bg-vellum text-umber shadow-hairline transition-shadow duration-150 motion-reduce:transition-none hover:shadow-menu"
      >
        <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden border-b border-rule bg-bone">
          {showImage ? (
            // Re-hosted on Supabase storage (lib/links/store-image.ts), same
            // tradeoff as Avatar.tsx — plain img, not next/image.
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
          <span className="truncate font-mono text-label uppercase text-umber-soft">
            {coverage.outlet_name}
          </span>
          <h3 className="min-w-0 break-words font-serif text-card-title text-umber line-clamp-2">
            {coverage.title}
          </h3>

          <div className="mt-auto flex items-center justify-between gap-3 border-t border-rule pt-3">
            <span className="truncate font-mono text-label tabular-nums text-umber-soft">{dateLabel}</span>
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
                className="group/link focus-ring flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-cobalt transition-colors hover:bg-cobalt-wash"
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
      <p className="font-ui text-ui-sm text-umber-soft">
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
      <Carousel.Track fadeColor="var(--color-band-soft)" ariaLabel="Press coverage">
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
