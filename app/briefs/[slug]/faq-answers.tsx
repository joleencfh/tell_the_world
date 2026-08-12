'use client'

import { useId, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import Avatar from '@/components/ui/Avatar'
import { submitFaqAnswer } from '@/lib/briefs/actions'
import { getDisplayName, formatDate } from './helpers'
import type { FaqAnswer } from '@/lib/data/faq-answers'

// ---------------------------------------------------------------------------
// Answer card — matches the reference artifact's .answer-card: blue-left-
// border card, avatar + name/role/date meta, answer text. Split out of
// section-content.tsx (which FAQBlock still lives in) to keep that file
// under the project's ~500-line convention (CONTRIBUTING.md).
// ---------------------------------------------------------------------------

function AnswerCard({ answer }: { answer: FaqAnswer }) {
  const name = getDisplayName(answer.users)
  const credential = answer.users.affiliation || answer.users.org_name
  const isOrg = answer.users.role === 'organisation'

  return (
    <div className="border border-line border-l-[3px] border-l-blue bg-paper-raised p-4">
      <div className="mb-2 flex items-center gap-2.5">
        <Avatar
          name={name}
          avatarUrl={answer.users.avatar_url}
          palette="blue"
          shape={isOrg ? 'square' : 'circle'}
          size="xs"
        />
        <div className="min-w-0 flex-1">
          <Link
            href={`/profile/${answer.users.id}`}
            className="block truncate font-display text-[0.82rem] font-extrabold text-ink hover:text-blue transition-colors"
          >
            {name}
          </Link>
          <p className="truncate font-mono text-[0.6rem] text-ink-faint">
            {credential && `${credential} · `}
            {formatDate(answer.created_at)}
          </p>
        </div>
      </div>
      <p className="break-words font-body text-[0.88rem] leading-[1.6] text-ink">{answer.body}</p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// "More answers (N)" toggle — independent of the parent accordion item's
// own open/closed state (two-ink-bold-plan.md Part 4b): it lives inside the
// parent panel's conditionally-mounted content, so collapsing the parent
// unmounts it (hiding it) and re-opening the parent always remounts it
// closed (never auto-opens it) — both required behaviors fall out of that
// for free, no extra state-sync code needed.
// ---------------------------------------------------------------------------

export function MoreAnswersToggle({ answers }: { answers: FaqAnswer[] }) {
  const [open, setOpen] = useState(false)
  const panelId = useId()

  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
        className="inline-flex items-center gap-1.5 rounded-sm font-mono text-[0.68rem] uppercase tracking-[0.08em] text-blue-ink outline-none focus-visible:ring-2 focus-visible:ring-blue"
      >
        More answers ({answers.length})
        <span
          aria-hidden
          className={`transition-transform duration-200 motion-reduce:transition-none ${open ? 'rotate-180' : ''}`}
        >
          ▾
        </span>
      </button>
      <div id={panelId} role="region" hidden={!open} className="mt-3 grid gap-[0.7rem]">
        {open && answers.map((answer) => <AnswerCard key={answer.id} answer={answer} />)}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// "Add an answer" — expert/organisation only, propose-then-pending pattern
// (ProposeCorrectionModal's shape, §1.4 forms checklist). Question text is
// submitted verbatim from the parent FAQBlock, not user-editable — it's the
// match key against brief_faq_answers.question.
// ---------------------------------------------------------------------------

export function AddAnswerForm({
  briefId,
  briefSlug,
  question,
}: {
  briefId: string
  briefSlug: string
  question: string
}) {
  const [open, setOpen] = useState(false)
  const [body, setBody] = useState('')
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fieldId = useId()

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{ touchAction: 'manipulation' }}
        className="inline-block rounded-sm font-mono text-[0.68rem] uppercase tracking-[0.08em] text-blue-ink underline decoration-dotted underline-offset-2 outline-none focus-visible:ring-2 focus-visible:ring-blue"
      >
        + Add an answer
      </button>
    )
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFeedback(null)
    startTransition(async () => {
      const result = await submitFaqAnswer(briefId, briefSlug, question, body)
      if (result.error) {
        setFeedback({ type: 'error', message: result.error })
        textareaRef.current?.focus()
      } else {
        setBody('')
        setFeedback({
          type: 'success',
          message: 'Answer submitted for review — it will appear here once approved.',
        })
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 border-t border-line pt-4">
      <label htmlFor={fieldId} className="block font-mono text-[10px] tracking-[0.18em] uppercase text-ink-faint">
        Add your answer
      </label>
      <textarea
        id={fieldId}
        ref={textareaRef}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={4}
        maxLength={2000}
        placeholder="Share your own answer to this question…"
        disabled={isPending || feedback?.type === 'success'}
        className="w-full resize-none border border-line bg-paper px-3 py-2.5 font-body text-sm text-ink placeholder:text-ink-faint/70 focus:outline-none focus:ring-2 focus:ring-blue disabled:opacity-50"
      />
      {feedback && (
        <p
          role={feedback.type === 'error' ? 'alert' : undefined}
          className={`font-mono text-[10px] ${feedback.type === 'error' ? 'text-pink-ink' : 'text-blue-ink'}`}
        >
          {feedback.message}
        </p>
      )}
      {feedback?.type !== 'success' && (
        <button
          type="submit"
          disabled={isPending || !body.trim()}
          style={{ touchAction: 'manipulation' }}
          className="bg-ink px-4 py-2 font-mono text-[10px] uppercase tracking-[0.15em] text-paper transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {isPending ? 'Submitting…' : 'Submit answer'}
        </button>
      )}
    </form>
  )
}
