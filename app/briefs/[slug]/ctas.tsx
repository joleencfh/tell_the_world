'use client'

import { useId, useRef, useState, useTransition } from 'react'
import { submitCta } from '@/lib/briefs/actions'
import Avatar from '@/components/ui/Avatar'
import { Carousel } from '@/components/ui/Carousel'
import { getDisplayName, formatDate } from './helpers'
import type { Cta } from '@/lib/data/ctas'

// ---------------------------------------------------------------------------
// CTA card — matches the reference artifact's .cta-card layout: 300px,
// byline row (avatar + name) above the title, footer row (date + link)
// below a border-top divider. Blue accent throughout, not pink — deviates
// from the artifact and the plan doc's §2 table (both use pink) because
// only experts/organisations can ever author a CTA (the insert RLS in
// migration 026 restricts it), and §1.1's own semantic mapping says blue
// is "expert/org verification," pink is "creator/journalist engagement" —
// pink was the wrong color for who's actually contributing here (feedback
// 2026-08-13; the plan doc's §2 table was updated to match). Avatar is
// "blue" palette, not the generic "colored" rotation — same reasoning as
// QuoteCard/AnswerCard. A null author is a Tell The World editorial CTA —
// the artifact shows that case as its own byline ("TTW", ink-colored)
// rather than omitting the byline row, so every card gets one.
//
// On hover the card nudges up-left against a hard, unblurred shadow — a
// flat "sticker pop" (offset shadow, zero blur, solid color) rather than a
// soft/glowing shadow, which read as "faded" against this site's flat,
// two-ink graphic style (a blurred tinted shadow was tried first and
// rejected for exactly that reason). The lift needs reserved space on two
// edges: this card is the direct child of the shared Carousel.Track, which
// sets overflow-x:auto — per the CSS overflow spec, setting only one axis
// to non-visible forces the other axis to `auto` too, so any translateY
// that pokes above the track's un-padded top edge gets silently clipped
// (this is what ate the top border on hover). Every card gets a top
// reserve (pt-1) since every card can lift and none of them have another
// row above to borrow slack from. Only the *first* card needs a left
// reserve (first:pl-1) — every other card already has the track's own
// gap-4 as slack to its left, but the first card sits flush against the
// track's scroll-start boundary with nothing to spare. Both fixes live
// locally here rather than on the shared Carousel.Track, since no other
// carousel (Quotes, Related Briefs) lifts on hover and doesn't need either
// reserve.
//
// The link is a bare arrow (no circular button chrome) that thickens/
// grows/nudges right on hover — raw `blue` is fine here (not `blue-ink`)
// since it's an aria-hidden icon graphic, not text, so §1.1's text-
// contrast rule doesn't apply (and raw blue clears AA at any size anyway,
// per §1.1). The arrow alone isn't a sufficient accessible name, so the
// button-label text (e.g. "Read"/"Watch"/"Download") moves to aria-label
// instead of being dropped.
// ---------------------------------------------------------------------------

const EDITORIAL_NAME = 'Tell The World'

function CtaCard({ cta }: { cta: Cta }) {
  const author = cta.users
  const authorName = author ? getDisplayName(author) : EDITORIAL_NAME
  const isOrg = author?.role === 'organisation'

  return (
    <div className="w-[300px] shrink-0 snap-start pt-1 first:pl-1">
      <div className="flex h-full flex-col gap-3 border border-line border-t-[3px] border-t-blue bg-paper p-5 transition-all duration-150 motion-reduce:transition-none hover:-translate-x-0.5 hover:-translate-y-0.5 hover:border-blue hover:shadow-[4px_4px_0_0_var(--color-blue)]">
        <div className="flex items-center gap-[0.55rem]">
          {author ? (
            <Avatar
              name={authorName}
              avatarUrl={author.avatar_url}
              palette="blue"
              shape={isOrg ? 'square' : 'circle'}
              size="2xs"
            />
          ) : (
            <div
              aria-hidden
              className="flex h-[22px] w-[22px] shrink-0 select-none items-center justify-center rounded-full bg-ink text-[0.55rem] font-bold text-paper"
            >
              TTW
            </div>
          )}
          <span className="truncate font-mono text-[0.65rem] font-semibold uppercase tracking-[0.03em] text-ink-soft">
            {authorName}
          </span>
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <h3 className="break-words font-display text-[1.08rem] font-extrabold leading-[1.3] text-ink line-clamp-2">
            {cta.title}
          </h3>
          {cta.description && (
            <p className="break-words font-body text-[0.86rem] leading-[1.55] text-ink-soft line-clamp-4">
              {cta.description}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-line pt-[0.7rem]">
          <span className="truncate font-mono text-[0.6rem] text-ink-faint">{formatDate(cta.created_at)}</span>
          <a
            href={cta.link_url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={cta.link_label}
            style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
            className="group/link flex h-8 w-8 shrink-0 items-center justify-center rounded-sm text-blue-ink outline-none transition-colors hover:text-blue focus-visible:ring-2 focus-visible:ring-blue"
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
  )
}

// ---------------------------------------------------------------------------
// CTA carousel — explicit empty state rather than an empty carousel shell
// (§1.4): with zero published CTAs there's nothing to scroll through, and
// the fade/prev/next affordances would just be decorative noise.
// ---------------------------------------------------------------------------

export function CtaCarousel({ ctas }: { ctas: Cta[] }) {
  if (ctas.length === 0) {
    return <p className="font-mono text-xs text-ink-faint">No calls to action yet.</p>
  }

  return (
    <Carousel.Provider>
      <Carousel.PrevButton />
      <Carousel.NextButton />
      <Carousel.Track fadeColor="var(--color-paper)" ariaLabel="Calls to action">
        {ctas.map((cta) => (
          <CtaCard key={cta.id} cta={cta} />
        ))}
      </Carousel.Track>
    </Carousel.Provider>
  )
}

// ---------------------------------------------------------------------------
// Suggest a call to action — expert/organisation only, propose-then-pending
// pattern (ProposeCorrectionModal's modal-form-then-pending-row shape, §1.4
// forms checklist), restyled with the current Two-Ink Bold tokens rather
// than ProposeCorrectionModal's own (that component still carries the
// retired base/dark/edge/live/serif tokens from before Part 0 — not copied
// here, see two-ink-bold-plan.md §3 Part 6's "confirm it still does" note).
// ---------------------------------------------------------------------------

const LINK_LABEL_SUGGESTIONS = ['Read', 'Watch', 'Download']

export function SuggestCtaModal({
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
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [linkLabel, setLinkLabel] = useState('Read')
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null)
  const titleRef = useRef<HTMLInputElement>(null)
  const titleId = useId()
  const descId = useId()
  const linkUrlId = useId()
  const linkLabelId = useId()

  const isSubmitted = feedback?.type === 'success'
  const canSubmit = title.trim() && linkUrl.trim() && linkLabel.trim()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFeedback(null)
    startTransition(async () => {
      const result = await submitCta(briefId, briefSlug, title, description, linkUrl, linkLabel)
      if (result.error) {
        setFeedback({ type: 'error', message: result.error })
        titleRef.current?.focus()
      } else {
        setTitle('')
        setDescription('')
        setLinkUrl('')
        setLinkLabel('Read')
        setFeedback({
          type: 'success',
          message: 'Call to action submitted for review — it will appear here once approved.',
        })
      }
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Suggest a call to action"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-ink/60 backdrop-blur-sm" onClick={onClose} aria-hidden />

      {/* Panel */}
      <div className="relative w-full max-w-xl overflow-hidden border border-line bg-paper">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-line px-7 pb-5 pt-7">
          <div>
            <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.2em] text-blue-ink">
              Call to action
            </p>
            <h2 className="font-display text-xl uppercase leading-tight text-ink">
              Suggest a call to action
            </h2>
            <p className="mt-1.5 font-body text-xs italic leading-snug text-ink-soft">
              For: {briefTitle}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ touchAction: 'manipulation' }}
            className="ml-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-paper-raised text-lg leading-none text-ink-soft outline-none transition-colors hover:bg-line hover:text-ink focus-visible:ring-2 focus-visible:ring-blue"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="space-y-4 px-7 py-6">
          <div>
            <label htmlFor={titleId} className="mb-2 block font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">
              Title
            </label>
            <input
              id={titleId}
              ref={titleRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              placeholder="e.g. Watch our explainer video"
              disabled={isPending || isSubmitted}
              className="w-full border border-line bg-paper px-4 py-2.5 font-body text-sm text-ink placeholder:text-ink-faint/70 transition focus:outline-none focus:ring-2 focus:ring-blue disabled:opacity-50"
            />
          </div>

          <div>
            <label htmlFor={descId} className="mb-2 block font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">
              Description (optional)
            </label>
            <textarea
              id={descId}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={600}
              placeholder="What should readers expect if they click through?"
              disabled={isPending || isSubmitted}
              className="w-full resize-none border border-line bg-paper px-4 py-2.5 font-body text-sm text-ink placeholder:text-ink-faint/70 transition focus:outline-none focus:ring-2 focus:ring-blue disabled:opacity-50"
            />
          </div>

          <div className="grid grid-cols-[1fr_140px] gap-3">
            <div>
              <label htmlFor={linkUrlId} className="mb-2 block font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">
                Link URL
              </label>
              <input
                id={linkUrlId}
                type="url"
                inputMode="url"
                autoComplete="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                maxLength={500}
                placeholder="https://…"
                disabled={isPending || isSubmitted}
                className="w-full border border-line bg-paper px-4 py-2.5 font-body text-sm text-ink placeholder:text-ink-faint/70 transition focus:outline-none focus:ring-2 focus:ring-blue disabled:opacity-50"
              />
            </div>
            <div>
              <label htmlFor={linkLabelId} className="mb-2 block font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">
                Button text
              </label>
              <input
                id={linkLabelId}
                type="text"
                list={`${linkLabelId}-options`}
                value={linkLabel}
                onChange={(e) => setLinkLabel(e.target.value)}
                maxLength={30}
                disabled={isPending || isSubmitted}
                className="w-full border border-line bg-paper px-4 py-2.5 font-body text-sm text-ink placeholder:text-ink-faint/70 transition focus:outline-none focus:ring-2 focus:ring-blue disabled:opacity-50"
              />
              <datalist id={`${linkLabelId}-options`}>
                {LINK_LABEL_SUGGESTIONS.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>
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
                {isPending ? 'Submitting…' : 'Submit for review'}
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
