'use client'

import { useId, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { submitCoverage, likeCoverage } from '@/lib/briefs/actions'
import DuotonePlaceholder from '@/components/ui/DuotonePlaceholder'
import { Carousel } from '@/components/ui/Carousel'
import { HeaderChip } from './section-content'
import { formatDate } from './helpers'
import type { Coverage } from '@/lib/data/coverage'

// ---------------------------------------------------------------------------
// Like button — any logged-in member, true toggle (mirrors voteQuestion's
// shape in lib/briefs/actions.ts / qa-votes.tsx's VoteButton). A logged-out
// visitor sees a static count with a link to /login instead of a button —
// Covered By is visible to logged-out visitors on public briefs (unlike
// Community Q&A, which is members-only and never renders this case).
// ---------------------------------------------------------------------------

function LikeButton({
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
        className="inline-flex items-center gap-1.5 font-mono text-[11px] tabular-nums text-coverage-fg/50 transition-colors hover:text-coverage-fg"
      >
        <HeartIcon filled={false} />
        {count}
      </Link>
    )
  }

  function handleClick() {
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
// name, title, score badge (only if admin set one at approval), like
// button, and a bare arrow to the article — same "arrow, not button
// chrome" link treatment as CtaCard, and for the same reason: the whole
// card can't itself be the <a> because the like button is another
// interactive element and <button> can't nest inside <a>.
// ---------------------------------------------------------------------------

function CoverageCard({ coverage, briefSlug, isLoggedIn }: { coverage: Coverage; briefSlug: string; isLoggedIn: boolean }) {
  const [imgFailed, setImgFailed] = useState(false)
  const showImage = coverage.image_url && !imgFailed
  const dateLabel = coverage.published_date ? formatDate(coverage.published_date) : formatDate(coverage.created_at)

  return (
    <div className="w-[300px] shrink-0 snap-start pt-1 first:pl-1">
      <div className="flex h-full flex-col border border-coverage-fg/15 bg-coverage-bg transition-all duration-150 motion-reduce:transition-none hover:-translate-x-0.5 hover:-translate-y-0.5 hover:border-pink hover:shadow-[4px_4px_0_0_var(--color-pink)]">
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
          {coverage.score !== null && (
            <div className="absolute right-2 top-2">
              <HeaderChip tone="blue">Score {coverage.score}</HeaderChip>
            </div>
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
// when there's nothing to show yet.
// ---------------------------------------------------------------------------

export function CoverageCarousel({ coverage, briefSlug, isLoggedIn }: { coverage: Coverage[]; briefSlug: string; isLoggedIn: boolean }) {
  if (coverage.length === 0) {
    return <p className="font-mono text-xs text-coverage-fg/50">No coverage yet.</p>
  }

  return (
    <Carousel.Provider>
      <Carousel.PrevButton />
      <Carousel.NextButton />
      <Carousel.Track fadeColor="var(--color-coverage-bg)" ariaLabel="Press coverage">
        {coverage.map((c) => (
          <CoverageCard key={c.id} coverage={c} briefSlug={briefSlug} isLoggedIn={isLoggedIn} />
        ))}
      </Carousel.Track>
    </Carousel.Provider>
  )
}

// ---------------------------------------------------------------------------
// Add coverage — URL-only propose-then-pending form (any logged-in member,
// unlike SuggestCtaModal's expert/org gate). outlet name, title, and image
// are extracted server-side from the URL's Open Graph tags in submitCoverage
// (lib/briefs/actions.ts) — there's nothing else for the submitter to fill
// in, so unlike SuggestCtaModal this form has exactly one field.
// ---------------------------------------------------------------------------

export function AddCoverageModal({
  briefId,
  briefSlug,
  briefTitle,
  onClose,
}: {
  briefId: string
  briefSlug: string
  briefTitle: string
  onClose: () => void
}) {
  const [url, setUrl] = useState('')
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null)
  const urlRef = useRef<HTMLInputElement>(null)
  const urlId = useId()

  const isSubmitted = feedback?.type === 'success'
  const canSubmit = url.trim().length > 0

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFeedback(null)
    startTransition(async () => {
      const result = await submitCoverage(briefId, briefSlug, url)
      if (result.error) {
        setFeedback({ type: 'error', message: result.error })
        urlRef.current?.focus()
      } else {
        setUrl('')
        setFeedback({ type: 'success', message: 'Coverage submitted for review — it will appear here once approved.' })
      }
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Add coverage"
    >
      <div className="absolute inset-0 bg-ink/60 backdrop-blur-sm" onClick={onClose} aria-hidden />

      <div className="relative w-full max-w-xl overflow-hidden border border-line bg-paper">
        <div className="flex items-start justify-between border-b border-line px-7 pb-5 pt-7">
          <div>
            <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.2em] text-pink-ink">Covered by</p>
            <h2 className="font-display text-xl uppercase leading-tight text-ink">Add coverage</h2>
            <p className="mt-1.5 font-body text-xs italic leading-snug text-ink-soft">For: {briefTitle}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ touchAction: 'manipulation' }}
            className="ml-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-paper-raised text-lg leading-none text-ink-soft outline-none transition-colors hover:bg-line hover:text-ink focus-visible:ring-2 focus-visible:ring-pink"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-7 py-6">
          <div>
            <label htmlFor={urlId} className="mb-2 block font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">
              Article URL
            </label>
            <input
              id={urlId}
              ref={urlRef}
              type="url"
              inputMode="url"
              autoComplete="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              maxLength={500}
              placeholder="https://…"
              disabled={isPending || isSubmitted}
              className="w-full border border-line bg-paper px-4 py-2.5 font-body text-sm text-ink placeholder:text-ink-faint/70 transition focus:outline-none focus:ring-2 focus:ring-pink disabled:opacity-50"
            />
            <p className="mt-2 font-body text-xs text-ink-faint">
              We’ll pull the outlet name, title, and image straight from the article.
            </p>
          </div>

          {feedback && (
            <p
              role={feedback.type === 'error' ? 'alert' : undefined}
              aria-live="polite"
              className={`font-mono text-[10px] tracking-[0.1em] leading-relaxed ${
                feedback.type === 'error' ? 'text-pink-ink' : 'text-blue-ink'
              }`}
            >
              {feedback.message}
            </p>
          )}

          <div className="flex items-center gap-4 pt-1">
            {!isSubmitted && (
              <button
                type="submit"
                disabled={isPending || !canSubmit}
                style={{ touchAction: 'manipulation' }}
                className="bg-ink px-6 py-3 font-mono text-xs uppercase tracking-widest text-paper transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {isPending ? 'Adding…' : 'Submit for review'}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink-faint transition-colors hover:text-ink"
            >
              {isSubmitted ? 'Close' : 'Cancel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
