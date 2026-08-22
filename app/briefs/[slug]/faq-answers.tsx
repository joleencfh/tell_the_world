'use client'

import { useEffect, useId, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import Avatar from '@/components/ui/Avatar'
import { submitFaqAnswer } from '@/lib/briefs/actions'
import { getDisplayName, formatDate } from './helpers'
import { parseRichContent } from '@/lib/richtext/types'
import { renderRichText } from '@/lib/richtext/render'
import RichTextEditor from '@/lib/richtext/editor'
import type { FaqAnswer } from '@/lib/data/faq-answers'
import type { FaqMeta } from '@/lib/data/faq-meta'

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
      {(() => {
        const doc = parseRichContent(answer.rich_content)
        const paragraphClassName = () => 'break-words font-body text-[0.88rem] leading-[1.6] text-ink'
        return doc ? (
          renderRichText(doc, { paragraphClassName })
        ) : (
          <p className={paragraphClassName()}>{answer.body}</p>
        )
      })()}
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
  const [richContent, setRichContent] = useState<unknown>(null)
  const [plainText, setPlainText] = useState('')
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null)
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
      const result = await submitFaqAnswer(briefId, briefSlug, question, plainText, richContent)
      if (result.error) {
        setFeedback({ type: 'error', message: result.error })
      } else {
        setRichContent(null)
        setPlainText('')
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
      {feedback?.type !== 'success' && (
        <div id={fieldId}>
          <RichTextEditor
            initialValue={null}
            onChange={(json, text) => { setRichContent(json); setPlainText(text) }}
            placeholder="Share your own answer to this question…"
          />
        </div>
      )}
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
          disabled={isPending || !plainText.trim()}
          style={{ touchAction: 'manipulation' }}
          className="bg-ink px-4 py-2 font-mono text-[10px] uppercase tracking-[0.15em] text-paper transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {isPending ? 'Submitting…' : 'Submit answer'}
        </button>
      )}
    </form>
  )
}

// ---------------------------------------------------------------------------
// Primary-answer triple-dot menu (Part 6 step 1) — "info" (who collaborated
// on/gave feedback on the TTW-authored primary answer, from brief_faq_meta)
// and "give feedback" (Part 0c's shared mechanism). The info panel is a
// local position:absolute dropdown, not a modal — it doesn't need the
// hoisted-to-BriefView treatment ReviewersModal documents (that's specific
// to position:fixed elements escaping an anim-rise ancestor's containing
// block; an absolute panel anchored to its own trigger is unaffected).
// "Give feedback" does need that treatment (it opens the shared
// position:fixed FeedbackModal), so this component only calls the
// onGiveFeedback callback — FAQSection's caller (BriefView.tsx) owns the
// modal's open state and renders it at the top level, same as TL;DR's
// "Suggest changes" button.
// ---------------------------------------------------------------------------

function FaqInfoPanel({ meta, onClose }: { meta: FaqMeta | undefined; onClose: () => void }) {
  const collaborators = meta?.collaborators ?? []
  const feedbackGivers = meta?.feedbackGivers ?? []

  return (
    <div
      role="dialog"
      aria-label="Answer info"
      className="absolute right-0 top-full z-20 mt-1 w-72 border-[1.5px] border-ink bg-paper shadow-[0_10px_28px_rgba(0,0,0,0.14)]"
    >
      <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
        <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-ink-faint">Answer info</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="text-ink-faint hover:text-ink"
        >
          ×
        </button>
      </div>
      <div className="space-y-3 px-4 py-3">
        <p className="font-body text-xs text-ink-soft">Written by Tell The World staff.</p>
        {collaborators.length > 0 && (
          <div>
            <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.1em] text-blue-ink">Collaborators</p>
            <ul className="space-y-0.5">
              {collaborators.map((u) => (
                <li key={u.id}>
                  <Link href={`/profile/${u.id}`} className="font-body text-xs text-ink hover:text-blue transition-colors">
                    {getDisplayName(u)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
        {feedbackGivers.length > 0 && (
          <div>
            <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.1em] text-blue-ink">Feedback from</p>
            <ul className="space-y-0.5">
              {feedbackGivers.map((u) => (
                <li key={u.id}>
                  <Link href={`/profile/${u.id}`} className="font-body text-xs text-ink hover:text-blue transition-colors">
                    {getDisplayName(u)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

export function FaqMetaMenu({
  meta,
  question,
  onGiveFeedback,
  isLoggedIn,
}: {
  meta: FaqMeta | undefined
  question: string
  onGiveFeedback: (question: string) => void
  isLoggedIn: boolean
}) {
  const [open, setOpen] = useState(false)
  const [infoOpen, setInfoOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open && !infoOpen) return
    function handleClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
        setInfoOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open, infoOpen])

  return (
    <div ref={wrapRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="Answer options"
        style={{ touchAction: 'manipulation' }}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm font-mono text-sm text-ink-faint outline-none transition-colors hover:bg-paper-raised hover:text-ink focus-visible:ring-2 focus-visible:ring-blue"
      >
        ⋯
      </button>
      {open && (
        <div className="absolute right-0 top-full z-20 mt-1 min-w-[160px] border-[1.5px] border-ink bg-paper shadow-[0_10px_28px_rgba(0,0,0,0.14)]">
          <button
            type="button"
            onClick={() => { setOpen(false); setInfoOpen(true) }}
            style={{ touchAction: 'manipulation' }}
            className="block w-full border-b border-line px-3 py-2 text-left font-mono text-[0.68rem] uppercase tracking-[0.03em] text-ink hover:bg-paper-raised"
          >
            Info
          </button>
          {isLoggedIn && (
            <button
              type="button"
              onClick={() => { setOpen(false); onGiveFeedback(question) }}
              style={{ touchAction: 'manipulation' }}
              className="block w-full px-3 py-2 text-left font-mono text-[0.68rem] uppercase tracking-[0.03em] text-ink hover:bg-paper-raised"
            >
              Give feedback
            </button>
          )}
        </div>
      )}
      {infoOpen && <FaqInfoPanel meta={meta} onClose={() => setInfoOpen(false)} />}
    </div>
  )
}
