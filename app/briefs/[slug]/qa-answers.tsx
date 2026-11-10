'use client'

import { useId, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import Author from '@/components/ui/Author'
import Button from '@/components/ui/Button'
import Field, { Textarea } from '@/components/ui/Field'
import Alert from '@/components/ui/Alert'
import { submitAnswer } from '@/lib/briefs/actions'
import { VoteButton, EndorseButton, VoteCountBadge, type VoterTone } from './qa-votes'
import { getDisplayName, formatDate } from './helpers'
import type { QuestionAuthor } from '@/lib/data/questions'
import type { QuestionAnswer } from '@/lib/data/question-answers'

// Answer list for a Community Q&A question — a flat list, no threading or
// replies on an answer (two-ink-bold-plan.md Part 5 follow-up, requested
// 2026-08-13). Leaf file (imports from qa-votes.tsx and helpers.ts only,
// never from qa.tsx) so qa.tsx can import from here without a cycle —
// mirrors faq-answers.tsx's relationship to faq.tsx.

// ---------------------------------------------------------------------------
// Answerer identity: the shared Author block (initial, name, role label,
// affiliation) linking to the profile, with a quiet meta line for the
// channel link and the date.
// ---------------------------------------------------------------------------

function AuthorRow({ author, date }: { author: QuestionAuthor; date: string }) {
  const name = getDisplayName(author)
  const credential = author.affiliation || author.org_name

  return (
    <div className="min-w-0 space-y-1">
      <Link
        href={`/profile/${author.id}`}
        className="inline-flex min-h-11 max-w-full items-center rounded-control focus-ring hover:underline"
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
                className="rounded-tag underline focus-ring hover:text-umber"
              >
                {author.channel_name}
              </a>
            ) : (
              <span>{author.channel_name}</span>
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
// Answer block (design-system.md 3.5, Q&A thread): indented 32px (16px on
// mobile) on card-cobalt with a hairline, labelled "Answer", the answerer,
// the answer in serif, then a hairline and the helpful-vote and endorse
// controls ("Endorsed · n" in cobalt mono).
// ---------------------------------------------------------------------------

function AnswerCard({
  answer,
  briefSlug,
  canEndorse,
  voterTone,
}: {
  answer: QuestionAnswer
  briefSlug: string
  canEndorse: boolean
  voterTone: VoterTone
}) {
  return (
    <div className="ml-4 space-y-3 rounded-control bg-card-cobalt px-4 py-4 shadow-hairline md:ml-8 md:px-5">
      <p className="font-mono text-label uppercase text-umber-soft">Answer</p>
      <AuthorRow author={answer.users} date={answer.created_at} />
      <p className="break-words font-serif text-message text-umber">{answer.body}</p>
      <div className="flex flex-wrap items-center gap-4 border-t border-rule pt-3">
        <VoteButton
          target="answer"
          id={answer.id}
          briefSlug={briefSlug}
          votes={answer.votes}
          voterTone={voterTone}
          voterKind="answer_votes"
          modalTitle="Found this helpful"
          size="sm"
        />
        {canEndorse ? (
          <EndorseButton answerId={answer.id} briefSlug={briefSlug} endorsedCount={answer.endorsedCount} myEndorsement={answer.myEndorsement} />
        ) : (
          answer.endorsedCount > 0 && (
            <span className="inline-flex items-center gap-1.5 font-mono text-label uppercase tabular-nums text-cobalt">
              Endorsed ·
              <VoteCountBadge
                votes={{ pinkCount: 0, blueCount: answer.endorsedCount, myVote: false }}
                kind="answer_endorsements"
                id={answer.id}
                modalTitle="Endorsed by"
              />
            </span>
          )
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Bare, non-interactive answer-count indicator for the question card's
// stats row — an empty speech-bubble outline + number, hover-only tooltip.
// Replaces the old AnswersToggleButton: expand/collapse is now the
// question card's own +/× control, so this is purely informational.
// ---------------------------------------------------------------------------

export function AnswerCountIndicator({ count }: { count: number }) {
  const tooltipId = useId()

  return (
    <span className="group/comment relative inline-flex items-center gap-1.5 font-mono text-label tabular-nums text-umber-soft">
      <svg viewBox="0 0 14 12" strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round" className="h-3.5 w-3.5 fill-none stroke-umber-soft" aria-hidden>
        <path d="M1.5 1.5h11a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H5.3L2.3 12v-2.5h-.8a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1Z" />
      </svg>
      <span aria-describedby={tooltipId}>{count}</span>
      <span
        id={tooltipId}
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 hidden -translate-x-1/2 whitespace-nowrap rounded-control bg-vellum px-2 py-1 font-ui text-label text-umber shadow-menu group-hover/comment:block"
      >
        {count} answer{count === 1 ? '' : 's'}
      </span>
    </span>
  )
}

// ---------------------------------------------------------------------------
// "Add an answer" — expert/organisation/admin, propose-then-pending pattern
// (faq-answers.tsx's AddAnswerForm is the pattern this mirrors). Admin's
// submission publishes immediately instead of queuing (see submitAnswer's
// own comment in lib/briefs/actions.ts), but the form itself doesn't need
// to know that beyond showing the right confirmation message.
// ---------------------------------------------------------------------------

function AddAnswerForm({ briefSlug, questionId }: { briefSlug: string; questionId: string }) {
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
      const result = await submitAnswer(briefSlug, questionId, body)
      if (result.error) {
        setFeedback({ type: 'error', message: result.error })
        textareaRef.current?.focus()
      } else {
        setBody('')
        setFeedback({
          type: 'success',
          message: result.published
            ? 'Answer published.'
            : 'Answer submitted for review — it will appear here once approved.',
        })
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 border-t border-rule pt-4">
      <Field
        id={fieldId}
        label="Add your answer"
        error={feedback?.type === 'error' ? feedback.message : undefined}
      >
        {(p) => (
          <Textarea
            {...p}
            ref={textareaRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            maxLength={2000}
            placeholder="Share your own answer to this question…"
            disabled={isPending || feedback?.type === 'success'}
          />
        )}
      </Field>
      {feedback?.type === 'success' && <Alert tone="success">{feedback.message}</Alert>}
      {feedback?.type !== 'success' && (
        <Button type="submit" disabled={!body.trim()} pending={isPending} style={{ touchAction: 'manipulation' }}>
          {isPending ? 'Submitting…' : 'Submit answer'}
        </Button>
      )}
    </form>
  )
}

// ---------------------------------------------------------------------------
// The actual list, rendered by qa.tsx's QuestionCard inside the
// collapsible panel the +/× toggle controls.
// ---------------------------------------------------------------------------

export function AnswersList({
  answers,
  briefSlug,
  questionId,
  canEndorse,
  canSubmit,
  voterTone,
}: {
  answers: QuestionAnswer[]
  briefSlug: string
  questionId: string
  canEndorse: boolean
  canSubmit: boolean
  voterTone: VoterTone
}) {
  return (
    <div className="space-y-3 pt-1">
      {answers.length === 0 ? (
        <p className="ml-4 font-ui text-ui-sm text-umber-soft md:ml-8">No answers yet.</p>
      ) : (
        answers.map((a) => (
          <AnswerCard key={a.id} answer={a} briefSlug={briefSlug} canEndorse={canEndorse} voterTone={voterTone} />
        ))
      )}
      {canSubmit && <AddAnswerForm briefSlug={briefSlug} questionId={questionId} />}
    </div>
  )
}
