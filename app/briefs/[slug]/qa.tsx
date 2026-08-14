'use client'

import { useId, useState, useTransition } from 'react'
import Link from 'next/link'
import { submitQuestion, submitCorrectionProposal } from '@/lib/briefs/actions'
import Avatar from '@/components/ui/Avatar'
import RoleBadge from '@/components/ui/RoleBadge'
import { VoteButton, type VoterTone } from './qa-votes'
import { AnswerCountIndicator, AnswersList } from './qa-answers'
import { getDisplayName, formatDate } from './helpers'
import type { Question, QuestionAuthor } from '@/lib/data/questions'
import type { QuestionAnswer } from '@/lib/data/question-answers'

// ---------------------------------------------------------------------------
// Thin author bar — the question card's byline, deliberately quiet
// (font-mono, muted color, tiny) so the question text below it reads as
// the headline. avatar + name + role badge + affiliation + date, all on
// one line, separated by "·" (Reddit-card redesign, 2026-08-13).
// ---------------------------------------------------------------------------

function AuthorBar({ author, date }: { author: QuestionAuthor; date: string }) {
  const name = getDisplayName(author)
  const credential = author.affiliation || author.org_name

  return (
    <div data-qa-author-bar className="flex flex-wrap items-center gap-1.5 font-mono text-[9.5px] text-ink-soft">
      <Avatar
        name={name}
        avatarUrl={author.avatar_url}
        palette="colored"
        shape={author.role === 'organisation' ? 'square' : 'circle'}
        size="2xs"
      />
      <Link href={`/profile/${author.id}`} className="font-bold transition-colors hover:text-pink">
        {name}
      </Link>
      {author.role && <RoleBadge role={author.role} variant="outline" />}
      {credential && (
        <>
          <span className="text-ink-faint">·</span>
          <span className="truncate text-ink-faint">{credential}</span>
        </>
      )}
      <span className="text-ink-faint">·</span>
      <span className="text-ink-faint">{formatDate(date)}</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Pink +/× toggle — two bars forming a "+" that rotate 45° into an "×"
// when the answers panel is open. The only control that can collapse an
// open card; also works to expand it (a full toggle), unlike the
// click-anywhere zone below which is expand-only.
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
      className="relative h-5 w-5 shrink-0 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-pink"
    >
      <span
        className={`absolute left-1/2 top-1/2 h-[2px] w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-pink transition-transform duration-200 motion-reduce:transition-none ${
          isOpen ? 'rotate-45' : ''
        }`}
      />
      <span
        className={`absolute left-1/2 top-1/2 h-3.5 w-[2px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-pink transition-transform duration-200 motion-reduce:transition-none ${
          isOpen ? 'rotate-45' : ''
        }`}
      />
    </button>
  )
}

// ---------------------------------------------------------------------------
// Question card — Reddit-feed style (2026-08-13 redesign, replacing the
// earlier LinkedIn-comment layout): thin author bar, then the question
// text as the headline with the pink +/× pinned top-right, then a plain
// stats row (vote widget, answer count). The whole card is a click-to-
// expand zone (except the author bar / toggle / vote widget); hovering a
// collapsed card — and an expanded card permanently — turns it into a
// white, pink-outlined box that bleeds edge-to-edge with the section's
// own bg-paper-sunken wash (cancelling that wrapper's px-6 via -mx-6/px-6
// on this card, per two-ink-bold-plan.md's Part 5 redesign notes).
// ---------------------------------------------------------------------------

function QuestionCard({
  question,
  answers,
  briefSlug,
  canEndorse,
  voterTone,
}: {
  question: Question
  answers: QuestionAnswer[]
  briefSlug: string
  canEndorse: boolean
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

  const cardClasses = `-mx-6 space-y-3 border-t border-line px-6 py-5 outline outline-2 first:border-t-0 ${
    isOpen
      ? 'bg-paper outline-pink'
      : 'cursor-pointer outline-transparent transition-colors hover:bg-paper hover:outline-pink'
  }`

  return (
    <div onClick={handleCardClick} className={cardClasses}>
      <AuthorBar author={question.users} date={question.created_at} />

      <div className="flex items-start gap-3">
        <p className="min-w-0 flex-1 break-words font-display text-xl font-extrabold text-ink [text-wrap:balance]">
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
        {isOpen && <AnswersList answers={answers} briefSlug={briefSlug} canEndorse={canEndorse} voterTone={voterTone} />}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Q&A section — BriefView's call site. Empty state instead of rendering
// nothing (§1.4).
// ---------------------------------------------------------------------------

export function QuestionsList({
  questions,
  answersByQuestion,
  briefSlug,
  canEndorse,
  voterTone,
}: {
  questions: Question[]
  answersByQuestion: Record<string, QuestionAnswer[]>
  briefSlug: string
  canEndorse: boolean
  voterTone: VoterTone
}) {
  if (questions.length === 0) {
    return (
      <p className="font-mono text-xs text-ink-faint mb-6">
        No questions yet — be the first to ask below.
      </p>
    )
  }

  return (
    <div className="mb-6">
      {questions.map((q) => (
        <QuestionCard
          key={q.id}
          question={q}
          answers={answersByQuestion[q.id] ?? []}
          briefSlug={briefSlug}
          canEndorse={canEndorse}
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
      <label className="block font-mono text-[10px] tracking-[0.18em] uppercase text-ink-faint">
        Ask a question
      </label>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        maxLength={1000}
        placeholder="Something you're curious about after reading this brief…"
        disabled={isPending}
        className="w-full resize-none border border-line bg-paper px-4 py-3 font-body text-sm text-ink placeholder:text-ink-faint/70 focus:outline-none focus:ring-2 focus:ring-pink disabled:opacity-50 transition"
      />
      {feedback && (
        <p
          role={feedback.type === 'error' ? 'alert' : undefined}
          className={`font-mono text-[10px] tracking-[0.1em] ${
            feedback.type === 'error' ? 'text-pink-ink' : 'text-blue-ink'
          }`}
        >
          {feedback.message}
        </p>
      )}
      <button
        type="submit"
        disabled={isPending || !text.trim()}
        style={{ touchAction: 'manipulation' }}
        className="bg-ink px-6 py-3 font-mono text-xs uppercase tracking-widest text-paper transition-opacity hover:opacity-90 disabled:opacity-40"
      >
        {isPending ? 'Submitting…' : 'Submit Question'}
      </button>
    </form>
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
