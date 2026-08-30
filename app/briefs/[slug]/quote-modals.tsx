'use client'

import { useId, useRef, useState, useTransition } from 'react'
import { submitQuote } from '@/lib/briefs/actions'
import { createSourcedQuote } from '@/lib/admin/actions'
import { formatDate } from './helpers'
import { LikeButton, CopyButton, QuoteAuthorFooter } from './quotes'
import { useClarityGate } from '@/lib/clarity/useClarityGate'
import { ClarityFlagsPanel } from '@/components/ClarityFlagsPanel'
import type { Quote } from './page'
import type { UserRole } from '@/lib/types'

type AttributeTo = 'myself' | 'person' | 'document' | 'ai'

const ATTRIBUTION_OPTIONS: { value: AttributeTo; label: string }[] = [
  { value: 'myself', label: 'Myself' },
  { value: 'person', label: 'Person' },
  { value: 'document', label: 'Document' },
  { value: 'ai', label: 'AI' },
]

const DETAIL_FIELD_LABEL: Record<Exclude<AttributeTo, 'myself'>, string> = {
  person: 'Title / affiliation',
  document: 'Publisher / year',
  ai: 'Provider',
}

// Split out of quotes.tsx (which holds the card/carousel) to keep both
// files under the project's ~500-line convention (CONTRIBUTING.md).

// ---------------------------------------------------------------------------
// Add quote — propose-then-pending form (org/expert/admin), follows
// AddCoverageModal's shell (coverage.tsx). Quote text is required; tags
// default to the brief's own topic_tags (still editable) so a newly added
// quote stays discoverable sitewide via topic-tag matching too, on top of
// the explicit brief_id association submitQuote sets — mirrors "the quote
// stays searchable/showable sitewide" from Part 0a's own migration note.
// ---------------------------------------------------------------------------

function TagInput({ tags, onChange }: { tags: string[]; onChange: (tags: string[]) => void }) {
  const [draft, setDraft] = useState('')

  function addTag(raw: string) {
    const tag = raw.trim()
    if (tag && !tags.includes(tag)) onChange([...tags, tag])
    setDraft('')
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(draft)
    } else if (e.key === 'Backspace' && draft === '' && tags.length > 0) {
      onChange(tags.slice(0, -1))
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 border border-line bg-paper px-3 py-2 focus-within:ring-2 focus-within:ring-blue">
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 border border-line-strong bg-paper-raised px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.04em] text-ink"
        >
          {tag}
          <button
            type="button"
            onClick={() => onChange(tags.filter((t) => t !== tag))}
            className="leading-none text-ink-faint hover:text-ink"
            aria-label={`Remove ${tag}`}
          >
            ×
          </button>
        </span>
      ))}
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => { if (draft.trim()) addTag(draft) }}
        placeholder={tags.length === 0 ? 'Type a tag and press Enter' : ''}
        className="min-w-[100px] flex-1 bg-transparent font-body text-sm text-ink outline-none placeholder:text-ink-faint/70"
      />
    </div>
  )
}

export function AddQuoteModal({
  briefId,
  briefSlug,
  briefTitle,
  defaultTags,
  isAdmin,
  userRole,
  onClose,
}: {
  briefId: string
  briefSlug: string
  briefTitle: string
  defaultTags: string[]
  isAdmin: boolean
  userRole: UserRole
  onClose: () => void
}) {
  const [attributeTo, setAttributeTo] = useState<AttributeTo>('myself')
  const [body, setBody] = useState('')
  const [tags, setTags] = useState<string[]>(defaultTags)
  const [sourceName, setSourceName] = useState('')
  const [sourceDetail, setSourceDetail] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null)
  const bodyRef = useRef<HTMLTextAreaElement>(null)
  const bodyId = useId()

  const isSourced = attributeTo !== 'myself'
  const isSubmitted = feedback?.type === 'success'
  const canSubmit = body.trim().length > 0 && (!isSourced || (sourceName.trim().length > 0 && sourceUrl.trim().length > 0))

  // Clarity check only applies to the non-sourced (submitQuote) path, and
  // only for expert/organisation — admin's own submitQuote path keeps its
  // pre-existing unconditional pending status regardless (see
  // lib/briefs/actions.ts), so gating the fix-it loop for admin here would
  // just be friction with no effect on the outcome.
  const isGated = !isSourced && (userRole === 'expert' || userRole === 'organisation')
  const clarityGate = useClarityGate(body, isGated)
  const needsFlagReview = isGated && clarityGate.status === 'flagged' && !clarityGate.confirmedAnyway

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFeedback(null)

    // First submit attempt while flagged: show the flags instead of
    // publishing/queuing anything yet.
    if (needsFlagReview) {
      clarityGate.confirmAnyway()
      return
    }

    startTransition(async () => {
      const result = isSourced
        ? await createSourcedQuote(briefId, briefSlug, {
            quoteSource: attributeTo,
            sourceName,
            sourceDetail,
            sourceUrl,
            body,
            tags,
          })
        : await submitQuote(briefId, briefSlug, body, tags)

      if (result.error) {
        setFeedback({ type: 'error', message: result.error })
        bodyRef.current?.focus()
      } else {
        setBody('')
        setSourceName('')
        setSourceDetail('')
        setSourceUrl('')
        setFeedback({
          type: 'success',
          message: isSourced
            ? 'Quote published.'
            : 'status' in result && result.status === 'pending'
              ? 'Quote submitted for review — it will appear here once approved.'
              : 'Quote published.',
        })
      }
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Add a quote"
    >
      <div className="absolute inset-0 bg-ink/60 backdrop-blur-sm" onClick={onClose} aria-hidden />

      <div className="relative flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden border border-line bg-paper">
        <div className="flex shrink-0 items-start justify-between border-b border-line px-7 pb-5 pt-7">
          <div>
            <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.2em] text-blue-ink">Quotes</p>
            <h2 className="font-display text-xl uppercase leading-tight text-ink">Add a quote</h2>
            <p className="mt-1.5 font-body text-xs italic leading-snug text-ink-soft">For: {briefTitle}</p>
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

        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto px-7 py-6">
          {isAdmin && (
            <div>
              <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">
                Attribute to
              </label>
              <div className="grid grid-cols-4 border border-line-strong">
                {ATTRIBUTION_OPTIONS.map((opt, i) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setAttributeTo(opt.value)}
                    disabled={isPending || isSubmitted}
                    className={`px-2 py-2.5 font-mono text-[10px] uppercase tracking-[0.03em] transition-colors disabled:opacity-50 ${
                      i > 0 ? 'border-l border-line-strong' : ''
                    } ${attributeTo === opt.value ? 'bg-ink text-paper' : 'bg-paper text-ink-soft hover:bg-paper-raised'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {isSourced && (
            <div className="space-y-4 border-l-[3px] border-blue bg-paper-sunken-blue p-4">
              <div>
                <label htmlFor={`${bodyId}-name`} className="mb-2 block font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">
                  Name
                </label>
                <input
                  id={`${bodyId}-name`}
                  type="text"
                  value={sourceName}
                  onChange={(e) => setSourceName(e.target.value)}
                  maxLength={200}
                  placeholder={attributeTo === 'document' ? 'Document title…' : attributeTo === 'ai' ? 'Model name…' : 'Full name…'}
                  disabled={isPending || isSubmitted}
                  className="w-full border border-line bg-paper px-4 py-2.5 font-body text-sm text-ink placeholder:text-ink-faint/70 transition focus:outline-none focus:ring-2 focus:ring-blue disabled:opacity-50"
                />
              </div>
              <div>
                <label htmlFor={`${bodyId}-detail`} className="mb-2 block font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">
                  {DETAIL_FIELD_LABEL[attributeTo]} <span className="normal-case tracking-normal text-ink-faint/70">(optional)</span>
                </label>
                <input
                  id={`${bodyId}-detail`}
                  type="text"
                  value={sourceDetail}
                  onChange={(e) => setSourceDetail(e.target.value)}
                  maxLength={200}
                  disabled={isPending || isSubmitted}
                  className="w-full border border-line bg-paper px-4 py-2.5 font-body text-sm text-ink placeholder:text-ink-faint/70 transition focus:outline-none focus:ring-2 focus:ring-blue disabled:opacity-50"
                />
              </div>
              <div>
                <label htmlFor={`${bodyId}-url`} className="mb-2 block font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">
                  Source link
                </label>
                <input
                  id={`${bodyId}-url`}
                  type="url"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  placeholder="https://…"
                  disabled={isPending || isSubmitted}
                  className="w-full border border-line bg-paper px-4 py-2.5 font-body text-sm text-ink placeholder:text-ink-faint/70 transition focus:outline-none focus:ring-2 focus:ring-blue disabled:opacity-50"
                />
                <p className="mt-2 font-body text-xs text-ink-faint">
                  Required — this is what the reader taps to verify the quote.
                </p>
              </div>
            </div>
          )}

          <div>
            <label htmlFor={bodyId} className="mb-2 block font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">
              Quote
            </label>
            <textarea
              id={bodyId}
              ref={bodyRef}
              rows={4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={500}
              placeholder="The quote itself…"
              disabled={isPending || isSubmitted}
              className="w-full border border-line bg-paper px-4 py-2.5 font-body text-sm text-ink placeholder:text-ink-faint/70 transition focus:outline-none focus:ring-2 focus:ring-blue disabled:opacity-50"
            />
          </div>

          <div>
            <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">
              Tags
            </label>
            <TagInput tags={tags} onChange={setTags} />
            <p className="mt-2 font-body text-xs text-ink-faint">
              Pre-filled from this brief&rsquo;s tags — edit as needed.
            </p>
          </div>

          {isGated && <ClarityFlagsPanel flaggedTerms={clarityGate.flaggedTerms} variant="ink" />}

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
                {isPending
                  ? 'Submitting…'
                  : isSourced
                    ? 'Publish quote'
                    : needsFlagReview
                      ? 'Review flags'
                      : isGated && clarityGate.status === 'flagged'
                        ? 'Submit anyway'
                        : 'Publish quote'}
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

// ---------------------------------------------------------------------------
// Quote detail — opened by clicking a QuoteCard. Shows created/updated
// dates, tags (not rendered on the card itself), a like button, and a copy
// button. No "used by" section — explicitly out of scope (Part 4 step 2).
// ---------------------------------------------------------------------------

// Display-only split of a source url into hostname + path, so the Source
// row reads like "ipcc.ch /report/ar6/syr/" instead of a long raw string.
function formatSourceUrl(url: string): { host: string; rest: string } {
  try {
    const parsed = new URL(url)
    return { host: parsed.hostname, rest: parsed.pathname + parsed.search }
  } catch {
    return { host: url, rest: '' }
  }
}

export function QuoteDetailModal({
  quote,
  briefSlug,
  isLoggedIn,
  onClose,
}: {
  quote: Quote
  briefSlug: string
  isLoggedIn: boolean
  onClose: () => void
}) {
  const quoteText = quote.body || quote.title
  const wasUpdated = quote.updated_at !== quote.created_at
  const source = quote.url ? formatSourceUrl(quote.url) : null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Quote detail"
    >
      <div className="absolute inset-0 bg-ink/60 backdrop-blur-sm" onClick={onClose} aria-hidden />

      <div className="relative w-full max-w-lg overflow-hidden border-[1.5px] border-ink bg-paper">
        <div className="flex items-start justify-between border-b-[1.5px] border-ink px-7 pb-5 pt-7">
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-blue-ink">Quote</p>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ touchAction: 'manipulation' }}
            className="ml-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-paper-raised text-lg leading-none text-ink-soft outline-none transition-colors hover:bg-line hover:text-ink focus-visible:ring-2 focus-visible:ring-blue"
          >
            ×
          </button>
        </div>

        <div className="flex flex-col gap-6 px-7 py-6">
          <p className="font-body text-lg font-normal leading-[1.5] text-ink">&ldquo;{quoteText}&rdquo;</p>

          <div className="flex items-center gap-[0.65rem] border-t border-line pt-4">
            <QuoteAuthorFooter quote={quote} />
          </div>

          {source && (
            <div>
              <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.18em] text-ink-faint">Source</p>
              <a
                href={quote.url!}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 border border-line-strong bg-paper-raised px-3.5 py-2.5 font-mono text-xs text-blue-ink transition-colors hover:border-blue"
              >
                <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0 text-ink-faint" aria-hidden>
                  <path d="M6.5 9.5 13 3M13 3H8.5M13 3v4.5" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M11 8.5V12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h3.5" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
                <span className="truncate">
                  <span className="text-ink-faint">{source.host}</span>
                  {source.rest}
                </span>
              </a>
            </div>
          )}

          {quote.topic_tags.length > 0 && (
            <div>
              <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.18em] text-ink-faint">Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {quote.topic_tags.map((tag) => (
                  <span key={tag} className="border border-line px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.04em] text-ink-soft">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 border-t border-line pt-4 font-mono text-[10px] text-ink-faint">
            <div>
              <p className="uppercase tracking-[0.12em]">Added</p>
              <p className="mt-0.5 text-ink-soft">{formatDate(quote.created_at)}</p>
            </div>
            {wasUpdated && (
              <div>
                <p className="uppercase tracking-[0.12em]">Last updated</p>
                <p className="mt-0.5 text-ink-soft">{formatDate(quote.updated_at)}</p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-5 border-t border-line pt-4">
            <LikeButton
              quoteId={quote.id}
              briefSlug={briefSlug}
              initialCount={quote.likeCount}
              initialLiked={quote.myLike}
              isLoggedIn={isLoggedIn}
            />
            <CopyButton text={quoteText} quoteId={quote.id} />
          </div>
        </div>
      </div>
    </div>
  )
}
