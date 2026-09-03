'use client'

import { useId, useRef, useState, useTransition } from 'react'
import { updateOwnQuote } from '@/lib/briefs/actions'
import { updateSourcedQuote, updateMemberQuoteAdmin } from '@/lib/admin/actions'
import { useClarityGate } from '@/lib/clarity/useClarityGate'
import { ClarityFlagsPanel } from '@/components/ClarityFlagsPanel'
import {
  TagInput,
  SourcedQuoteFields,
  useSourceOrganizations,
  resolveSourceOrgId,
  type SourcedType,
} from './quote-source-fields'
import type { Quote, QuotePlatform } from './page'

// Full edit of an existing quote, opened from QuoteDetailModal's Edit button
// (shown to the quote's own author, or any admin). Mirrors AddQuoteModal's
// shell but there's no "attribute to myself vs. someone else" choice here —
// a quote's identity (member-authored vs. person/document/ai) is fixed at
// creation; only admin can re-pick among the three non-member types (see
// updateSourcedQuote's own comment on why member<->non-member conversion
// isn't offered). A member quote's own author edits only body/tags — the
// only fields that quote_source has.
const SOURCE_TYPE_OPTIONS: { value: SourcedType; label: string }[] = [
  { value: 'person', label: 'Person' },
  { value: 'document', label: 'Document' },
  { value: 'ai', label: 'AI' },
]

export function EditQuoteModal({
  quote,
  briefSlug,
  isAdmin,
  onClose,
}: {
  quote: Quote
  briefSlug: string
  isAdmin: boolean
  onClose: () => void
}) {
  const isMemberQuote = quote.quote_source === 'member'

  const [sourceType, setSourceType] = useState<SourcedType>(
    quote.quote_source === 'member' ? 'person' : quote.quote_source,
  )
  const [body, setBody] = useState(quote.body || quote.title)
  const [tags, setTags] = useState<string[]>(quote.topic_tags)
  const [sourceName, setSourceName] = useState(quote.source_name ?? '')
  const [sourceDetail, setSourceDetail] = useState(quote.source_detail ?? '')
  const [sourceUrl, setSourceUrl] = useState(quote.url ?? '')
  const [platform, setPlatform] = useState<QuotePlatform | ''>(quote.source_platform ?? '')
  const [orgName, setOrgName] = useState(quote.source_organizations?.name ?? '')
  const [orgLogoFile, setOrgLogoFile] = useState<File | null>(null)
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null)
  const bodyRef = useRef<HTMLTextAreaElement>(null)
  const bodyId = useId()

  // Only fetched for admin editing a non-member quote — a member quote's
  // editor (owner or admin) never sees the organization field.
  const [organizations, setOrganizations] = useSourceOrganizations(isAdmin && !isMemberQuote)

  const isSubmitted = feedback?.type === 'success'
  const canSubmit = body.trim().length > 0 && (isMemberQuote || (sourceName.trim().length > 0 && sourceUrl.trim().length > 0))

  // Only the owner's own edit re-runs the clarity gate, matching
  // updateOwnQuote's own server-side re-check — admin edits (of a member
  // quote or otherwise) bypass it, same as admin's create-time bypass.
  const isOwnerEdit = isMemberQuote && !isAdmin
  const clarityGate = useClarityGate(body, isOwnerEdit)
  const needsFlagReview = isOwnerEdit && clarityGate.status === 'flagged' && !clarityGate.confirmedAnyway

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFeedback(null)

    if (needsFlagReview) {
      clarityGate.confirmAnyway()
      return
    }

    startTransition(async () => {
      let result: { error?: string; success?: boolean; status?: 'published' | 'pending' }

      if (isMemberQuote) {
        result = isAdmin
          ? await updateMemberQuoteAdmin(quote.id, briefSlug, body, tags)
          : await updateOwnQuote(quote.id, briefSlug, body, tags)
      } else {
        const resolved = await resolveSourceOrgId(sourceType, orgName, orgLogoFile, organizations, (savedOrg) =>
          setOrganizations((prev) => [...prev.filter((o) => o.id !== savedOrg.id), savedOrg]),
        )
        if (resolved.error) {
          setFeedback({ type: 'error', message: resolved.error })
          return
        }
        result = await updateSourcedQuote(quote.id, briefSlug, {
          quoteSource: sourceType,
          sourceName,
          sourceDetail,
          sourceUrl,
          sourcePlatform: sourceType === 'person' ? platform || null : null,
          sourceOrgId: resolved.sourceOrgId,
          body,
          tags,
        })
      }

      if (result.error) {
        setFeedback({ type: 'error', message: result.error })
        bodyRef.current?.focus()
      } else {
        setFeedback({
          type: 'success',
          message:
            result.status === 'pending'
              ? 'Quote updated — resubmitted for review since it was flagged.'
              : 'Quote updated.',
        })
      }
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Edit quote"
    >
      <div className="absolute inset-0 bg-ink/60 backdrop-blur-sm" onClick={onClose} aria-hidden />

      <div className="relative flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden border border-line bg-paper">
        <div className="flex shrink-0 items-start justify-between border-b border-line px-7 pb-5 pt-7">
          <div>
            <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.2em] text-blue-ink">Quotes</p>
            <h2 className="font-display text-xl uppercase leading-tight text-ink">Edit quote</h2>
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
          {!isMemberQuote && (
            <>
              {isAdmin && (
                <div>
                  <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">
                    Attribute to
                  </label>
                  <div className="grid grid-cols-3 border border-line-strong">
                    {SOURCE_TYPE_OPTIONS.map((opt, i) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setSourceType(opt.value)}
                        disabled={isPending || isSubmitted}
                        className={`px-2 py-2.5 font-mono text-[10px] uppercase tracking-[0.03em] transition-colors disabled:opacity-50 ${
                          i > 0 ? 'border-l border-line-strong' : ''
                        } ${sourceType === opt.value ? 'bg-ink text-paper' : 'bg-paper text-ink-soft hover:bg-paper-raised'}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-4 border-l-[3px] border-blue bg-paper-sunken-blue p-4">
                <SourcedQuoteFields
                  idPrefix={bodyId}
                  sourceType={sourceType}
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
            </>
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
              disabled={isPending || isSubmitted}
              className="w-full border border-line bg-paper px-4 py-2.5 font-body text-sm text-ink placeholder:text-ink-faint/70 transition focus:outline-none focus:ring-2 focus:ring-blue disabled:opacity-50"
            />
          </div>

          <div>
            <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">
              Tags
            </label>
            <TagInput tags={tags} onChange={setTags} />
          </div>

          {isOwnerEdit && <ClarityFlagsPanel flaggedTerms={clarityGate.flaggedTerms} variant="ink" />}

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
                  ? 'Saving…'
                  : needsFlagReview
                    ? 'Review flags'
                    : isOwnerEdit && clarityGate.status === 'flagged'
                      ? 'Save anyway'
                      : 'Save changes'}
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
