'use client'

import { useEffect, useId, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import Author from '@/components/ui/Author'
import Button from '@/components/ui/Button'
import Alert from '@/components/ui/Alert'
import { submitFaqAnswer } from '@/lib/briefs/actions'
import { getDisplayName, formatDate } from './helpers'
import { parseRichContent } from '@/lib/richtext/types'
import { renderRichText } from '@/lib/richtext/render'
import RichTextEditor from '@/lib/richtext/editor'
import type { FaqAnswer } from '@/lib/data/faq-answers'
import type { FaqMeta } from '@/lib/data/faq-meta'

// ---------------------------------------------------------------------------
// Answer card — the same answer surface as the Q&A thread (card-cobalt with a
// hairline): Author block, date line, answer text in serif. Split out of
// section-content.tsx (which FAQBlock still lives in) to keep that file
// under the project's ~500-line convention (CONTRIBUTING.md).
// ---------------------------------------------------------------------------

function AnswerCard({ answer }: { answer: FaqAnswer }) {
  const name = getDisplayName(answer.users)
  const credential = answer.users.affiliation || answer.users.org_name

  return (
    <div className="space-y-3 rounded-control bg-card-cobalt px-4 py-4 shadow-hairline">
      <div className="min-w-0 space-y-1">
        <Link
          href={`/profile/${answer.users.id}`}
          className="inline-flex min-h-11 max-w-full items-center rounded-control focus-ring hover:underline"
        >
          <Author
            name={name}
            role={answer.users.role ?? undefined}
            affiliation={credential}
            avatarUrl={answer.users.avatar_url}
            size="sm"
          />
        </Link>
        <p className="font-mono text-label uppercase tabular-nums text-umber-soft">
          {formatDate(answer.created_at)}
        </p>
      </div>
      {(() => {
        const doc = parseRichContent(answer.rich_content)
        const paragraphClassName = () => 'break-words font-serif text-message text-umber'
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
        className="inline-flex min-h-11 items-center gap-1.5 rounded-control font-mono text-label uppercase text-cobalt focus-ring hover:text-cobalt-deep"
      >
        More answers ({answers.length})
        <span
          aria-hidden
          className={`transition-transform duration-200 motion-reduce:transition-none ${open ? 'rotate-180' : ''}`}
        >
          ▾
        </span>
      </button>
      <div id={panelId} role="region" hidden={!open} className="mt-3 grid gap-3">
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
        className="inline-flex min-h-11 items-center rounded-control font-mono text-label uppercase text-cobalt underline underline-offset-2 focus-ring hover:text-cobalt-deep"
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
    <form onSubmit={handleSubmit} className="space-y-3 border-t border-rule pt-4">
      <label htmlFor={fieldId} className="block font-mono text-label uppercase text-umber-soft">
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
      {feedback?.type === 'error' && <Alert tone="danger">{feedback.message}</Alert>}
      {feedback?.type === 'success' && <Alert tone="success">{feedback.message}</Alert>}
      {feedback?.type !== 'success' && (
        <Button
          type="submit"
          disabled={!plainText.trim()}
          pending={isPending}
          style={{ touchAction: 'manipulation' }}
        >
          {isPending ? 'Submitting…' : 'Submit answer'}
        </Button>
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

const PANEL_LINK =
  'inline-flex min-h-11 items-center rounded-control font-ui text-caption text-umber transition-colors focus-ring hover:text-cobalt'

function FaqInfoPanel({ meta, onClose }: { meta: FaqMeta | undefined; onClose: () => void }) {
  const collaborators = meta?.collaborators ?? []
  const feedbackGivers = meta?.feedbackGivers ?? []

  return (
    <div
      role="dialog"
      aria-label="Answer info"
      className="absolute right-0 top-full z-20 mt-1 w-72 rounded-control border border-rule bg-vellum shadow-menu"
    >
      <div className="flex items-center justify-between border-b border-rule py-1 pl-4 pr-1">
        <span className="font-mono text-label uppercase text-umber-soft">Answer info</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="inline-flex size-11 items-center justify-center rounded-control text-umber-soft focus-ring hover:bg-bone hover:text-umber"
        >
          ×
        </button>
      </div>
      <div className="space-y-3 px-4 py-3">
        <p className="font-ui text-caption text-umber-soft">Written by Tell The World staff.</p>
        {collaborators.length > 0 && (
          <div>
            <p className="mb-1 font-mono text-label uppercase text-cobalt">Collaborators</p>
            <ul>
              {collaborators.map((u) => (
                <li key={u.id}>
                  <Link href={`/profile/${u.id}`} className={PANEL_LINK}>
                    {getDisplayName(u)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
        {feedbackGivers.length > 0 && (
          <div>
            <p className="mb-1 font-mono text-label uppercase text-cobalt">Feedback from</p>
            <ul>
              {feedbackGivers.map((u) => (
                <li key={u.id}>
                  <Link href={`/profile/${u.id}`} className={PANEL_LINK}>
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
        className="flex size-11 shrink-0 items-center justify-center rounded-control font-mono text-ui text-umber-soft transition-colors focus-ring hover:bg-bone hover:text-umber"
      >
        ⋯
      </button>
      {open && (
        <div className="absolute right-0 top-full z-20 mt-1 min-w-[160px] overflow-hidden rounded-control border border-rule bg-vellum shadow-menu">
          <button
            type="button"
            onClick={() => { setOpen(false); setInfoOpen(true) }}
            style={{ touchAction: 'manipulation' }}
            className="block min-h-11 w-full border-b border-rule px-3 py-2 text-left font-mono text-label uppercase text-umber focus-ring hover:bg-bone"
          >
            Info
          </button>
          {isLoggedIn && (
            <button
              type="button"
              onClick={() => { setOpen(false); onGiveFeedback(question) }}
              style={{ touchAction: 'manipulation' }}
              className="block min-h-11 w-full px-3 py-2 text-left font-mono text-label uppercase text-umber focus-ring hover:bg-bone"
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
