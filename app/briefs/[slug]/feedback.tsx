'use client'

import { useId, useRef, useState, useTransition } from 'react'
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
  const bodyId = useId()
  const subsectionFieldId = useId()

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
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Send feedback"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-ink/60 backdrop-blur-sm" onClick={onClose} aria-hidden />

      {/* Panel */}
      <div className="relative w-full max-w-xl overflow-hidden border border-line bg-paper">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-line px-7 pb-5 pt-7">
          <div>
            <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.2em] text-blue-ink">
              Feedback
            </p>
            <h2 className="font-display text-xl uppercase leading-tight text-ink">
              Feedback to the editorial team
            </h2>
            <p className="mt-1.5 font-body text-xs italic leading-snug text-ink-soft">
              For: {selectedSubsection ? `${selectedSubsection.title} (${context.sectionLabel}) — ` : context.sectionLabel ? `${context.sectionLabel} — ` : ''}
              {context.briefTitle}
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
          <p className="border-l-2 border-line bg-paper-raised px-3 py-2.5 font-body text-xs leading-relaxed text-ink-soft">
            Use this for a correction to a specific line or subsection, a factual concern, something you noticed
            that doesn&rsquo;t belong in public discussion, or just a general thought.{' '}
            <strong className="font-semibold text-ink">If it doesn&rsquo;t fit a category, that&rsquo;s fine — tell us anyway.</strong>
          </p>

          {subsections && subsections.length > 0 && (
            <div>
              <label htmlFor={subsectionFieldId} className="mb-2 block font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">
                Which part is this about? (optional)
              </label>
              <select
                id={subsectionFieldId}
                value={subsectionId}
                onChange={(e) => setSubsectionId(e.target.value)}
                disabled={isPending || isSubmitted}
                className="w-full border border-line bg-paper px-4 py-2.5 font-body text-sm text-ink transition focus:outline-none focus:ring-2 focus:ring-blue disabled:opacity-50"
              >
                <option value="">General — not about one subsection</option>
                {subsections.map((s) => (
                  <option key={s.id} value={s.id}>{s.title}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label htmlFor={bodyId} className="mb-2 block font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">
              Your message
            </label>
            <textarea
              id={bodyId}
              ref={bodyRef}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              maxLength={2000}
              placeholder="What should we know or fix?"
              disabled={isPending || isSubmitted}
              className="w-full resize-none border border-line bg-paper px-4 py-2.5 font-body text-sm text-ink placeholder:text-ink-faint/70 transition focus:outline-none focus:ring-2 focus:ring-blue disabled:opacity-50"
            />
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
                {isPending ? 'Sending…' : 'Send feedback'}
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
