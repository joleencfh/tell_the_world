'use client'

import { useRef, useState, useTransition } from 'react'
import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
import Field, { Select, Textarea } from '@/components/ui/Field'
import Modal from '@/components/ui/Modal'
import { submitBriefFeedback } from '@/lib/briefs/actions'

// ---------------------------------------------------------------------------
// Send feedback to moderators — Part 0c's shared mechanism (design plan §2).
// Five later parts (Contribute menu, TL;DR, Explainer ×2, FAQ) each import
// this same modal rather than building their own, passing only which
// brief/section it's about via `context`. Modal-form-then-pending-
// confirmation shape, following SuggestCtaModal's pattern (ctas.tsx) —
// restyled isn't needed here since this was built after the Two-Ink Bold
// migration, so it already uses the current tokens.
//
// Login is required (brief_feedback's insert RLS, migration 034, is
// authenticated-only) but there's no role gate beyond that — any signed-in
// member can submit. submitBriefFeedback returns a clear error if the
// caller is logged out; individual call sites may additionally restrict
// *when the trigger button is shown* (e.g. TL;DR's is org/expert/admin
// only per Part 3), but the modal itself doesn't enforce that beyond what
// the server action already checks.
// ---------------------------------------------------------------------------

export interface FeedbackContext {
  briefId: string
  briefTitle: string
  /** Loose, caller-defined key — e.g. 'tldr', 'faq:<question>',
   *  'explainer'. Omit for brief-level feedback. */
  section?: string
  /** Human-readable label shown in the modal, e.g. "TL;DR" or the FAQ
   *  question text. Falls back to the brief title alone when omitted. */
  sectionLabel?: string
}

// A subsection the "which part is this about?" dropdown can point at
// (Explainer's own feedback trigger only — TL;DR/FAQ callers simply don't
// pass `subsections`). Selecting one appends its id to context.section
// ('explainer:<id>') and its title to the label shown once submitted,
// rather than requiring a specific subsection up front — same optional,
// denormalized-at-write-time tagging shape as a contentious point's own
// subsectionLabel (see explainer-engagement.tsx).
export interface FeedbackSubsectionOption {
  id: string
  title: string
}

export function FeedbackModal({
  context,
  subsections,
  onClose,
}: {
  context: FeedbackContext
  subsections?: FeedbackSubsectionOption[]
  onClose: () => void
}) {
  const [body, setBody] = useState('')
  const [subsectionId, setSubsectionId] = useState('')
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null)
  const bodyRef = useRef<HTMLTextAreaElement>(null)

  const isSubmitted = feedback?.type === 'success'
  const canSubmit = body.trim().length > 0
  const selectedSubsection = subsections?.find((s) => s.id === subsectionId)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFeedback(null)
    const section = selectedSubsection ? `${context.section}:${selectedSubsection.id}` : (context.section ?? null)
    startTransition(async () => {
      const result = await submitBriefFeedback(context.briefId, section, body)
      if (result.error) {
        setFeedback({ type: 'error', message: result.error })
        bodyRef.current?.focus()
      } else {
        setBody('')
        setFeedback({ type: 'success', message: 'Thanks — your feedback has been sent to our moderators.' })
      }
    })
  }

  return (
    <Modal open onClose={onClose} size="narrow" eyebrow="Feedback" title="Send feedback">
      <p className="mb-1 font-ui text-ui-sm font-medium text-umber">Feedback to the editorial team</p>
      <p className="mb-5 font-ui text-ui-sm text-umber-soft">
        For: {selectedSubsection ? `${selectedSubsection.title} (${context.sectionLabel}) — ` : context.sectionLabel ? `${context.sectionLabel} — ` : ''}
        {context.briefTitle}
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Alert tone="info">
          Use this for a correction to a specific line or subsection, a factual concern, something you noticed
          that doesn&rsquo;t belong in public discussion, or just a general thought.{' '}
          <strong className="font-medium">If it doesn&rsquo;t fit a category, that&rsquo;s fine — tell us anyway.</strong>
        </Alert>

        {subsections && subsections.length > 0 && (
          <Field label="Which part is this about?" optional>
            {(p) => (
              <Select
                {...p}
                value={subsectionId}
                onChange={(e) => setSubsectionId(e.target.value)}
                disabled={isPending || isSubmitted}
              >
                <option value="">General — not about one subsection</option>
                {subsections.map((s) => (
                  <option key={s.id} value={s.id}>{s.title}</option>
                ))}
              </Select>
            )}
          </Field>
        )}

        <Field label="Your message" error={feedback?.type === 'error' ? feedback.message : undefined}>
          {(p) => (
            <Textarea
              {...p}
              ref={bodyRef}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              maxLength={2000}
              placeholder="What should we know or fix?"
              disabled={isPending || isSubmitted}
              className="resize-none"
            />
          )}
        </Field>

        {feedback?.type === 'success' && <Alert tone="success">{feedback.message}</Alert>}

        <div className="flex items-center gap-3 pt-1">
          {!isSubmitted && (
            <Button type="submit" disabled={!canSubmit} pending={isPending} style={{ touchAction: 'manipulation' }}>
              {isPending ? 'Sending…' : 'Send feedback'}
            </Button>
          )}
          <Button type="button" variant="secondary" onClick={onClose}>
            {isSubmitted ? 'Close' : 'Cancel'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
