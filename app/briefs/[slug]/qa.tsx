'use client'

import { useId, useState, useTransition } from 'react'
import Link from 'next/link'
import { submitQuestion, submitCorrectionProposal } from '@/lib/briefs/actions'
import Alert from '@/components/ui/Alert'
import Author from '@/components/ui/Author'
import Button from '@/components/ui/Button'
import Field, { Textarea } from '@/components/ui/Field'
import Modal from '@/components/ui/Modal'
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
    <Modal open onClose={onClose} size="narrow" eyebrow="Community Q&A" title="Ask a question">
      <p className="mb-5 font-ui text-ui-sm text-umber-soft">For: {briefTitle}</p>
      <QuestionForm briefId={briefId} briefSlug={briefSlug} />
    </Modal>
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
    <Modal open onClose={onClose} size="narrow" eyebrow="Correction proposal" title="Propose a correction or addition">
      <p className="mb-5 font-ui text-ui-sm text-umber-soft">
        For: <em>{briefTitle}</em>
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field
          label="Your correction"
          hint={`${text.length} / 3000`}
          error={feedback?.type === 'error' ? feedback.message : undefined}
        >
          {(p) => (
            <Textarea
              {...p}
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
              maxLength={3000}
              placeholder="Describe what you'd like to correct or add — include any sources or context that would help the admin review your suggestion…"
              disabled={isPending || feedback?.type === 'success'}
            />
          )}
        </Field>

        {feedback?.type === 'success' && <Alert tone="success">{feedback.message}</Alert>}

        <div className="flex items-center gap-3 pt-1">
          {feedback?.type !== 'success' && (
            <Button
              type="submit"
              disabled={!text.trim()}
              pending={isPending}
              style={{ touchAction: 'manipulation' }}
            >
              {isPending ? 'Submitting…' : 'Submit for review'}
            </Button>
          )}
          <Button type="button" variant="secondary" onClick={onClose}>
            {feedback?.type === 'success' ? 'Close' : 'Cancel'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
