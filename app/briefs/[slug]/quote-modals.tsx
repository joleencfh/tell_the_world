'use client'

import { useId, useRef, useState, useTransition } from 'react'
import { submitQuote } from '@/lib/briefs/actions'
import { createSourcedQuote } from '@/lib/admin/actions'
import { formatDate } from './helpers'
import { LikeButton, CopyButton, QuoteAuthorFooter } from './quotes'
import { EditQuoteModal } from './quote-edit-modal'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import ChoiceChips from '@/components/ui/ChoiceChips'
import Field, { Textarea } from '@/components/ui/Field'
import Tag from '@/components/ui/Tag'
import { useClarityGate } from '@/lib/clarity/useClarityGate'
import { ClarityFlagsPanel } from '@/components/ClarityFlagsPanel'
import {
  TagInput,
  SourcedQuoteFields,
  useSourceOrganizations,
  resolveSourceOrgId,
  type SourcedType,
} from './quote-source-fields'
import type { Quote, QuotePlatform, CurrentUser } from './page'
import type { UserRole } from '@/lib/types'

type AttributeTo = 'myself' | SourcedType

const ATTRIBUTION_OPTIONS: { value: AttributeTo; label: string }[] = [
  { value: 'myself', label: 'Myself' },
  { value: 'person', label: 'Person' },
  { value: 'document', label: 'Document' },
  { value: 'ai', label: 'AI' },
]

// Split out of quotes.tsx (which holds the card/carousel) to keep both
// files under the project's ~500-line convention (CONTRIBUTING.md). The
// name/platform/organization/detail/source-link fields shared with
// EditQuoteModal live in quote-source-fields.tsx for the same reason.

// ---------------------------------------------------------------------------
// Add quote — propose-then-pending form (org/expert/admin), follows
// AddCoverageModal's shell (coverage.tsx). Quote text is required; tags
// default to the brief's own topic_tags (still editable) so a newly added
// quote stays discoverable sitewide via topic-tag matching too, on top of
// the explicit brief_id association submitQuote sets — mirrors "the quote
// stays searchable/showable sitewide" from Part 0a's own migration note.
// ---------------------------------------------------------------------------

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
  const [platform, setPlatform] = useState<QuotePlatform | ''>('')
  const [orgName, setOrgName] = useState('')
  const [orgLogoFile, setOrgLogoFile] = useState<File | null>(null)
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null)
  const bodyRef = useRef<HTMLTextAreaElement>(null)
  const bodyId = useId()

  // Only admins ever see the organization field (it lives inside the
  // isAdmin-only attribution block below), so this fetch is scoped to that.
  const [organizations, setOrganizations] = useSourceOrganizations(isAdmin)

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
      let sourceOrgId: string | null = null

      if (isSourced) {
        const resolved = await resolveSourceOrgId(attributeTo, orgName, orgLogoFile, organizations, (savedOrg) =>
          setOrganizations((prev) => [...prev.filter((o) => o.id !== savedOrg.id), savedOrg]),
        )
        if (resolved.error) {
          setFeedback({ type: 'error', message: resolved.error })
          return
        }
        sourceOrgId = resolved.sourceOrgId
      }

      const result = isSourced
        ? await createSourcedQuote(briefId, briefSlug, {
            quoteSource: attributeTo,
            sourceName,
            sourceDetail,
            sourceUrl,
            sourcePlatform: attributeTo === 'person' ? platform || null : null,
            sourceOrgId,
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
        setPlatform('')
        setOrgName('')
        setOrgLogoFile(null)
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
    <Modal open onClose={onClose} size="narrow" eyebrow="Quotes" title="Add a quote">
      <p className="mb-5 font-ui text-ui-sm text-umber-soft">For: {briefTitle}</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        {isAdmin && (
          <ChoiceChips
            label="Attribute to"
            options={ATTRIBUTION_OPTIONS}
            value={attributeTo}
            onChange={setAttributeTo}
            disabled={isPending || isSubmitted}
            className="grid-cols-2 md:grid-cols-4"
          />
        )}

        {isSourced && (
          <div className="space-y-4 rounded-control border border-window-line bg-bone p-4">
            <SourcedQuoteFields
              idPrefix={bodyId}
              sourceType={attributeTo}
              organizations={organizations}
              disabled={isPending || isSubmitted}
              state={{
                sourceName, setSourceName,
                sourceDetail, setSourceDetail,
                sourceUrl, setSourceUrl,
                platform, setPlatform,
                orgName, setOrgName,
                orgLogoFile, setOrgLogoFile,
              }}
            />
          </div>
        )}

        <Field id={bodyId} label="Quote">
          {(p) => (
            <Textarea
              {...p}
              ref={bodyRef}
              rows={4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={500}
              placeholder="The quote itself…"
              disabled={isPending || isSubmitted}
            />
          )}
        </Field>

        <div>
          <span className="mb-1.5 block font-ui text-caption font-medium text-umber">Tags</span>
          <TagInput tags={tags} onChange={setTags} />
          <p className="mt-1 font-ui text-caption text-umber-soft">
            Pre-filled from this brief&rsquo;s tags — edit as needed.
          </p>
        </div>

        {isGated && <ClarityFlagsPanel flaggedTerms={clarityGate.flaggedTerms} variant="ink" />}

        {feedback && (
          <p
            role={feedback.type === 'error' ? 'alert' : undefined}
            aria-live="polite"
            className={`font-ui text-ui-sm ${feedback.type === 'error' ? 'text-brick' : 'text-moss'}`}
          >
            {feedback.message}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-1">
          {!isSubmitted && (
            <Button type="submit" pending={isPending} disabled={!canSubmit}>
              {isPending
                ? 'Submitting…'
                : isSourced
                  ? 'Publish quote'
                  : needsFlagReview
                    ? 'Review flags'
                    : isGated && clarityGate.status === 'flagged'
                      ? 'Submit anyway'
                      : 'Publish quote'}
            </Button>
          )}
          <Button variant="secondary" onClick={onClose}>
            {isSubmitted ? 'Close' : 'Cancel'}
          </Button>
        </div>
      </form>
    </Modal>
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
  currentUser,
  onClose,
}: {
  quote: Quote
  briefSlug: string
  isLoggedIn: boolean
  // Optional so call sites that never show this modal to a logged-in
  // viewer (there aren't any today, but future ones shouldn't be forced to
  // thread it through) can omit it — no Edit affordance without it.
  currentUser?: CurrentUser | null
  onClose: () => void
}) {
  const [editOpen, setEditOpen] = useState(false)
  const quoteText = quote.body || quote.title
  const wasUpdated = quote.updated_at !== quote.created_at
  const source = quote.url ? formatSourceUrl(quote.url) : null
  const isAdmin = currentUser?.role === 'admin'
  // Only a 'member'-sourced quote has a real owner (user_id is always null
  // for person/document/ai) — admin can edit any quote regardless.
  const canEdit = isAdmin || (!!currentUser && quote.user_id === currentUser.id)

  if (editOpen) {
    return (
      <EditQuoteModal
        quote={quote}
        briefSlug={briefSlug}
        isAdmin={isAdmin}
        onClose={() => setEditOpen(false)}
      />
    )
  }

  return (
    <Modal open onClose={onClose} size="narrow" eyebrow="Quote" title="Quote detail">
      {canEdit && (
        <div className="mb-4">
          <Button variant="secondary" small onClick={() => setEditOpen(true)}>
            Edit
          </Button>
        </div>
      )}
      <div className="flex flex-col gap-6">
        <p className="font-serif text-message text-umber">&ldquo;{quoteText}&rdquo;</p>

        <div className="flex items-center gap-[0.65rem] border-t border-window-line pt-4">
          <QuoteAuthorFooter quote={quote} />
        </div>

        {source && (
          <div>
            <p className="mb-2 font-mono text-label uppercase text-umber-soft">Source</p>
            <a
              href={quote.url!}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-11 items-center gap-2 rounded-control border border-field-line bg-bone px-3.5 py-2.5 font-ui text-ui-sm text-cobalt transition-colors hover:border-umber focus-ring"
            >
              <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0 text-umber-soft" aria-hidden>
                <path d="M6.5 9.5 13 3M13 3H8.5M13 3v4.5" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M11 8.5V12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h3.5" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
              <span className="truncate">
                <span className="text-umber-soft">{source.host}</span>
                {source.rest}
              </span>
            </a>
          </div>
        )}

        {quote.topic_tags.length > 0 && (
          <div>
            <p className="mb-2 font-mono text-label uppercase text-umber-soft">Tags</p>
            <div className="flex flex-wrap gap-1.5">
              {quote.topic_tags.map((tag) => (
                <Tag key={tag}>{tag}</Tag>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 border-t border-window-line pt-4 font-ui text-ui-sm text-umber-soft">
          <div>
            <p className="font-mono text-label uppercase">Added</p>
            <p className="mt-0.5 text-umber">{formatDate(quote.created_at)}</p>
          </div>
          {wasUpdated && (
            <div>
              <p className="font-mono text-label uppercase">Last updated</p>
              <p className="mt-0.5 text-umber">{formatDate(quote.updated_at)}</p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-5 border-t border-window-line pt-4">
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
    </Modal>
  )
}
