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
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import ChoiceChips from '@/components/ui/ChoiceChips'
import Field, { Textarea } from '@/components/ui/Field'
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
    <Modal open onClose={onClose} size="narrow" eyebrow="Quotes" title="Edit quote">
      <form onSubmit={handleSubmit} className="space-y-4">
        {!isMemberQuote && (
          <>
            {isAdmin && (
              <ChoiceChips
                label="Attribute to"
                options={SOURCE_TYPE_OPTIONS}
                value={sourceType}
                onChange={setSourceType}
                disabled={isPending || isSubmitted}
                className="grid-cols-3"
              />
            )}

            <div className="space-y-4 rounded-control border border-window-line bg-bone p-4">
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

        <Field id={bodyId} label="Quote">
          {(p) => (
            <Textarea
              {...p}
              ref={bodyRef}
              rows={4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={500}
              disabled={isPending || isSubmitted}
            />
          )}
        </Field>

        <div>
          <span className="mb-1.5 block font-ui text-caption font-medium text-umber">Tags</span>
          <TagInput tags={tags} onChange={setTags} />
        </div>

        {isOwnerEdit && <ClarityFlagsPanel flaggedTerms={clarityGate.flaggedTerms} variant="ink" />}

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
                ? 'Saving…'
                : needsFlagReview
                  ? 'Review flags'
                  : isOwnerEdit && clarityGate.status === 'flagged'
                    ? 'Save anyway'
                    : 'Save changes'}
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
