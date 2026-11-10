'use client'

import { useId, useState, useTransition } from 'react'
import Link from 'next/link'
import { submitQuestion, submitCorrectionProposal } from '@/lib/briefs/actions'
import Alert from '@/components/ui/Alert'
import Author from '@/components/ui/Author'
import Button from '@/components/ui/Button'
import Field, { Textarea } from '@/components/ui/Field'
import { VoteButton, type VoterTone } from './qa-votes'
import { AnswerCountIndicator, AnswersList } from './qa-answers'
import { getDisplayName, formatDate } from './helpers'
import type { Question, QuestionAuthor } from '@/lib/data/questions'
import type { QuestionAnswer } from '@/lib/data/question-answers'

// ---------------------------------------------------------------------------
// Author bar: the shared Author block (initial, name, role label,
// affiliation) linking to the profile, with a quiet meta line under it for
// the channel link and the date. The data-qa-author-bar attribute keeps the
// card's click-to-expand zone from firing on it.
// ---------------------------------------------------------------------------

function AuthorBar({ author, date }: { author: QuestionAuthor; date: string }) {
  const name = getDisplayName(author)
  const credential = author.affiliation || author.org_name

  return (
    <div data-qa-author-bar className="space-y-1">
      <Link
        href={`/profile/${author.id}`}
        className="inline-flex min-h-11 items-center rounded-control focus-ring hover:underline"
      >
        <Author
          name={name}
          role={author.role ?? undefined}
          affiliation={credential}
          avatarUrl={author.avatar_url}
          size="sm"
        />
      </Link>
      <p className="flex flex-wrap items-center gap-x-1.5 font-mono text-label uppercase text-umber-soft">
        {author.channel_name && (
          <>
            {author.platform_url ? (
              <a
                href={author.platform_url}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate rounded-tag underline focus-ring hover:text-umber"
              >
                {author.channel_name}
              </a>
            ) : (
              <span className="truncate">{author.channel_name}</span>
            )}
            <span aria-hidden>·</span>
          </>
        )}
        <span className="tabular-nums">{formatDate(date)}</span>
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// +/x toggle: two bars forming a "+" that rotate 45 degrees into an "x" when
// the answers panel is open. The only control that can collapse an open
// card; also works to expand it (a full toggle), unlike the click-anywhere
// zone on the card which is expand-only.
// ---------------------------------------------------------------------------

function ExpandToggle({ isOpen, onToggle, panelId }: { isOpen: boolean; onToggle: () => void; panelId: string }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={isOpen}
      aria-controls={panelId}
      aria-label={isOpen ? 'Collapse answers' : 'Expand answers'}
      style={{ touchAction: 'manipulation' }}
      className="relative -m-2 size-11 shrink-0 cursor-pointer rounded-control hover:bg-bone focus-ring"
    >
      <span
        className={`absolute left-1/2 top-1/2 h-[2px] w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-umber transition-transform duration-200 motion-reduce:transition-none ${
          isOpen ? 'rotate-45' : ''
        }`}
      />
      <span
        className={`absolute left-1/2 top-1/2 h-3.5 w-[2px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-umber transition-transform duration-200 motion-reduce:transition-none ${
          isOpen ? 'rotate-45' : ''
        }`}
      />
    </button>
  )
}

// ---------------------------------------------------------------------------
// Question block (design-system.md 3.5, Q&A thread): a mono "Question"
// label, the Author block, the question text in serif with the +/x toggle
// top-right, then a stats row (vote widget, answer count). A vellum card on
// parchment. A collapsed card is a click-to-expand zone (except the author
// bar, toggle and vote widget) and turns bone on hover.
// ---------------------------------------------------------------------------

function QuestionCard({
  question,
  answers,
  briefSlug,
  canEndorse,
  canSubmitAnswer,
  voterTone,
}: {
  question: Question
  answers: QuestionAnswer[]
  briefSlug: string
  canEndorse: boolean
  canSubmitAnswer: boolean
  voterTone: VoterTone
}) {
  const [isOpen, setIsOpen] = useState(false)
  const panelId = useId()

  function handleCardClick(e: React.MouseEvent<HTMLDivElement>) {
    if (isOpen) return
    const target = e.target as HTMLElement
    if (target.closest('button, a')) return
    if (target.closest('[data-qa-author-bar]')) return
    setIsOpen(true)
  }

  const cardClasses = `space-y-3 rounded-control bg-vellum px-5 py-5 shadow-hairline ${
    isOpen ? '' : 'cursor-pointer transition-colors hover:bg-bone'
  }`

  return (
    <div onClick={handleCardClick} className={cardClasses}>
      <p className="font-mono text-label uppercase text-umber-soft">Question</p>
      <AuthorBar author={question.users} date={question.created_at} />

      <div className="flex items-start gap-3">
        <p className="min-w-0 flex-1 break-words font-serif text-message text-umber [text-wrap:balance]">
          {question.question_text}
        </p>
        <ExpandToggle isOpen={isOpen} onToggle={() => setIsOpen((v) => !v)} panelId={panelId} />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <VoteButton
          target="question"
          id={question.id}
          briefSlug={briefSlug}
          votes={question.questionVotes}
          voterTone={voterTone}
          voterKind="question_votes"
          modalTitle="Voted up by"
        />
        <AnswerCountIndicator count={answers.length} />
      </div>

      <div id={panelId} hidden={!isOpen}>
        {isOpen && (
          <AnswersList
            answers={answers}
            briefSlug={briefSlug}
            questionId={question.id}
            canEndorse={canEndorse}
            canSubmit={canSubmitAnswer}
            voterTone={voterTone}
          />
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Q&A section — BriefView's call site. Empty state instead of rendering
// nothing (§1.4).
// ---------------------------------------------------------------------------

// This section only ever renders for logged-in members (BriefView gates it
// on isLoggedIn), so the empty state doesn't need a visitor branch. It does
// fully branch on canSubmitAnswer (brief-page onboarding pass, 2026-08-28,
// revised same day): an expert/organisation isn't the one asking here, so
// the asker-facing "ask something" copy is the wrong message for them
// entirely, not just missing a footnote.
export function QuestionsList({
  questions,
  answersByQuestion,
  briefSlug,
  canEndorse,
  canSubmitAnswer,
  voterTone,
}: {
  questions: Question[]
  answersByQuestion: Record<string, QuestionAnswer[]>
  briefSlug: string
  canEndorse: boolean
  canSubmitAnswer: boolean
  voterTone: VoterTone
}) {
  if (questions.length === 0) {
    return (
      <p className="mb-6 font-ui text-ui-sm text-umber-soft">
        {canSubmitAnswer
          ? "No questions yet. When creators or journalists ask something, you can answer it here."
          : "Ask something you're curious about. An expert or organisation will answer."}
      </p>
    )
  }

  return (
    <div className="mb-6 space-y-4">
      {questions.map((q) => (
        <QuestionCard
          key={q.id}
          question={q}
          answers={answersByQuestion[q.id] ?? []}
          briefSlug={briefSlug}
          canEndorse={canEndorse}
          canSubmitAnswer={canSubmitAnswer}
          voterTone={voterTone}
        />
      ))}
    </div>
  )
}

export function QuestionForm({ briefId, briefSlug }: { briefId: string; briefSlug: string }) {
  const [text, setText] = useState('')
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{
    type: 'error' | 'success'
    message: string
  } | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFeedback(null)
    startTransition(async () => {
      const result = await submitQuestion(briefId, briefSlug, text)
      if (result.error) {
        setFeedback({ type: 'error', message: result.error })
      } else {
        setText('')
        setFeedback({
          type: 'success',
          message: 'Question submitted for review — it will appear here once approved.',
        })
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Field label="Ask a question" error={feedback?.type === 'error' ? feedback.message : undefined}>
        {(p) => (
          <Textarea
            {...p}
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            maxLength={1000}
            placeholder="Something you're curious about after reading this brief…"
            disabled={isPending}
          />
        )}
      </Field>
      {feedback?.type === 'success' && <Alert tone="success">{feedback.message}</Alert>}
      <Button type="submit" disabled={!text.trim()} pending={isPending} style={{ touchAction: 'manipulation' }}>
        {isPending ? 'Submitting…' : 'Submit Question'}
      </Button>
    </form>
  )
}

// ---------------------------------------------------------------------------
// Question modal — Contribute menu's "Suggest a question" / "Ask a
// question" entry points (brief-page-part2-plan.md §2, Part 2 step 2). A
// modal shell around QuestionForm above, not a separate form. Rendered at
// BriefView's top level like its other modals — see ReviewEndorseModal's
// comment (review-endorse.tsx) for why it can't nest inside the hero's
// Contribute menu.
// ---------------------------------------------------------------------------

export function QuestionModal({
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
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Ask a question"
    >
      <div className="absolute inset-0 bg-ink/60 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-xl overflow-hidden border border-line bg-paper">
        <div className="flex items-start justify-between border-b border-line px-7 pb-5 pt-7">
          <div>
            <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.2em] text-pink">Community Q&amp;A</p>
            <h2 className="font-display text-xl uppercase leading-tight text-ink">Ask a question</h2>
            <p className="mt-1.5 font-body text-xs italic leading-snug text-ink-soft">For: {briefTitle}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ touchAction: 'manipulation' }}
            className="ml-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-paper-raised text-lg leading-none text-ink-soft outline-none transition-colors hover:bg-line hover:text-ink focus-visible:ring-2 focus-visible:ring-pink"
          >
            ×
          </button>
        </div>
        <div className="px-7 py-6">
          <QuestionForm briefId={briefId} briefSlug={briefSlug} />
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Propose correction modal — experts and organisations only. Unrelated to
// Q&A (Part 3's brief_contributions mechanism); left as-is, not part of
// this redesign's scope.
// ---------------------------------------------------------------------------

export function ProposeCorrectionModal({
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
  const [text, setText] = useState('')
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFeedback(null)
    startTransition(async () => {
      const result = await submitCorrectionProposal(briefId, briefSlug, text)
      if (result.error) {
        setFeedback({ type: 'error', message: result.error })
      } else {
        setFeedback({
          type: 'success',
          message: 'Correction submitted for review. Once approved, it will appear on your profile.',
        })
        setText('')
      }
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Propose a correction or addition"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      {/* Panel */}
      <div className="relative w-full max-w-xl bg-paper rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-7 pt-7 pb-5 border-b border-line">
          <div>
            <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-blue-ink mb-1">
              Correction proposal
            </p>
            <h2 className="font-display uppercase text-ink text-xl leading-tight">
              Propose a correction or addition
            </h2>
            <p className="font-body text-xs text-ink-soft mt-1.5 leading-snug">
              For: <em>{briefTitle}</em>
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 w-8 h-8 rounded-full bg-paper-raised hover:bg-line flex items-center justify-center text-ink-soft hover:text-ink transition-all text-lg leading-none ml-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-7 py-6 space-y-4">
          <div>
            <label className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink-faint block mb-2">
              Your correction
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
              maxLength={3000}
              placeholder="Describe what you'd like to correct or add — include any sources or context that would help the admin review your suggestion…"
              disabled={isPending || feedback?.type === 'success'}
              className="w-full bg-paper border border-line rounded-xl px-4 py-3 font-body text-sm text-ink placeholder:text-ink-faint/70 focus:outline-none focus:ring-2 focus:ring-blue resize-none disabled:opacity-50 transition"
            />
            <p className="font-mono text-[9px] text-ink-faint mt-1 text-right">
              {text.length} / 3000
            </p>
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
            {feedback?.type !== 'success' && (
              <button
                type="submit"
                disabled={isPending || !text.trim()}
                style={{ touchAction: 'manipulation' }}
                className="bg-ink px-6 py-3 font-mono text-xs uppercase tracking-widest text-paper transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {isPending ? 'Submitting…' : 'Submit for review'}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="font-mono text-[10px] tracking-[0.15em] uppercase text-ink-soft hover:text-ink transition-colors"
            >
              {feedback?.type === 'success' ? 'Close' : 'Cancel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
