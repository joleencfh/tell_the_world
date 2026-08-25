'use client'

import { useId, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import Avatar from '@/components/ui/Avatar'
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
// Answerer identity — avatar + name + affiliation + date. No role badge
// here (2026-08-13 Reddit-card redesign) — the asker keeps theirs in the
// question's author bar, but an answer is identified by who said it, not
// what they are.
// ---------------------------------------------------------------------------

function AuthorRow({ author, date }: { author: QuestionAuthor; date: string }) {
  const name = getDisplayName(author)
  const credential = author.affiliation || author.org_name

  return (
    <div className="flex min-w-0 items-center gap-2">
      <Avatar
        name={name}
        avatarUrl={author.avatar_url}
        palette="blue"
        shape={author.role === 'organisation' ? 'square' : 'circle'}
        size="xs"
      />
      <div className="min-w-0 flex-1">
        <Link
          href={`/profile/${author.id}`}
          className="block truncate font-display text-[0.85rem] font-extrabold text-ink transition-colors hover:text-blue"
        >
          {name}
        </Link>
        <p className="truncate font-mono text-[9px] text-ink-faint mt-0.5">
          {author.channel_name && (
            <>
              {author.platform_url ? (
                <a
                  href={author.platform_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue transition-colors"
                >
                  {author.channel_name}
                </a>
              ) : (
                author.channel_name
              )}
              {' · '}
            </>
          )}
          {credential && `${credential} · `}
          {formatDate(date)}
        </p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Answer card — answerer first, then the answer body, then its own vote
// ("this was helpful", any member) and endorse ("this is accurate",
// expert/org only) controls underneath. Blue wash background pairs with
// the blue left border, matching the Quotes section's own blue wash.
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
    <div className="space-y-2.5 border-l-[3px] border-blue bg-paper-sunken-blue px-4 py-3.5">
      <AuthorRow author={answer.users} date={answer.created_at} />
      <p className="break-words font-body text-[0.96rem] leading-[1.68] text-ink">{answer.body}</p>
      <div className="flex flex-wrap items-center gap-4 pt-0.5">
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
            <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.06em] text-blue-ink">
              ★ Endorsed
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
// question card's own pink +/× control, so this is purely informational.
// ---------------------------------------------------------------------------

export function AnswerCountIndicator({ count }: { count: number }) {
  const tooltipId = useId()

  return (
    <span className="group/comment relative inline-flex items-center gap-1.5 font-mono text-[11px] tabular-nums text-ink-soft">
      <svg viewBox="0 0 14 12" strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round" className="h-3.5 w-3.5 fill-none stroke-pink" aria-hidden>
        <path d="M1.5 1.5h11a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H5.3L2.3 12v-2.5h-.8a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1Z" />
      </svg>
      <span aria-describedby={tooltipId}>{count}</span>
      <span
        id={tooltipId}
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 hidden -translate-x-1/2 whitespace-nowrap border border-ink bg-ink px-2 py-1 font-mono text-[10px] text-paper group-hover/comment:block"
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

// ---------------------------------------------------------------------------
// The actual list, rendered by qa.tsx's QuestionCard inside the
// collapsible panel the pink +/× toggle controls.
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
        <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-faint">No answers yet.</p>
      ) : (
        answers.map((a) => (
          <AnswerCard key={a.id} answer={a} briefSlug={briefSlug} canEndorse={canEndorse} voterTone={voterTone} />
        ))
      )}
      {canSubmit && <AddAnswerForm briefSlug={briefSlug} questionId={questionId} />}
    </div>
  )
}
