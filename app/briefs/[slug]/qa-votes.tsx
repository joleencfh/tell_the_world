'use client'

import { useEffect, useId, useState, useTransition } from 'react'
import Link from 'next/link'
import Avatar from '@/components/ui/Avatar'
import RoleBadge from '@/components/ui/RoleBadge'
import { voteQuestion, voteAnswer, endorseAnswer, getVoters } from '@/lib/briefs/actions'
import type { Voter } from '@/lib/briefs/actions'
import type { VoteSplit } from '@/lib/data/questions'
import { getDisplayName } from './helpers'

// Shared vote/endorse UI for Community Q&A (two-ink-bold-plan.md Part 5
// follow-up, requested 2026-08-13) — split out of qa.tsx/qa-answers.tsx so
// both the question card and the answer cards can use the same widgets
// without a circular import between those two files (mirrors how
// faq-answers.tsx is a leaf faq.tsx depends on, not the reverse).

export type VoterKind = 'question_votes' | 'answer_votes' | 'answer_endorsements'
// A voter's own role decides which bucket their vote lands in — see
// lib/data/questions.ts's VoteSplit and BriefView.tsx's voterTone.
export type VoterTone = 'pink' | 'blue' | null

// ---------------------------------------------------------------------------
// Voter list modal — "who voted/endorsed this" (LinkedIn-reactions style).
// Fetched on demand only when opened, not bundled into the page load —
// most viewers never open it, and a popular item could have a long list.
// ---------------------------------------------------------------------------

function VoterModal({ kind, id, title, onClose }: { kind: VoterKind; id: string; title: string; onClose: () => void }) {
  const [voters, setVoters] = useState<Voter[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getVoters(kind, id).then((result) => {
      if (cancelled) return
      if (result.error) setError(result.error)
      else setVoters(result.voters)
    })
    return () => {
      cancelled = true
    }
  }, [kind, id])

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-ink/50" onClick={onClose} aria-hidden />
      <div className="relative flex max-h-[75vh] w-full max-w-sm flex-col border border-line-strong bg-paper">
        <div className="flex shrink-0 items-center justify-between border-b border-line px-5 py-3.5">
          <h2 className="font-display text-sm font-extrabold text-ink">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ touchAction: 'manipulation' }}
            className="flex h-7 w-7 cursor-pointer items-center justify-center text-ink-faint outline-none transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-ink"
          >
            ×
          </button>
        </div>
        <div className="overflow-y-auto p-2">
          {error && (
            <p role="alert" className="p-2 font-mono text-[10px] text-pink-ink">
              {error}
            </p>
          )}
          {!voters && !error && <p className="p-2 font-mono text-[10px] text-ink-faint">Loading…</p>}
          {voters?.length === 0 && <p className="p-2 font-mono text-[10px] text-ink-faint">No one yet.</p>}
          {voters?.map((voter, i) => {
            const name = getDisplayName(voter)
            const credential = voter.affiliation || voter.org_name
            return (
              <Link
                key={`${voter.id}-${i}`}
                href={`/profile/${voter.id}`}
                className="flex items-center gap-2.5 px-2 py-2 transition-colors hover:bg-paper-raised"
              >
                <Avatar name={name} avatarUrl={voter.avatar_url} palette="colored" size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="truncate font-display text-[0.82rem] font-extrabold text-ink">{name}</span>
                    {voter.role && <RoleBadge role={voter.role} variant="outline" />}
                  </div>
                  {credential && <p className="truncate font-mono text-[9px] text-ink-faint">{credential}</p>}
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Vote count — hover (or focus) reveals the pink/blue breakdown as a
// tooltip; click opens the full voter-list modal. Renders nothing at zero
// (don't render empty-state clutter). Exported so a read-only, non-expert
// view of an answer's endorsement count can reuse it without the
// clickable Endorse button attached.
// ---------------------------------------------------------------------------

export function VoteCountBadge({ votes, kind, id, modalTitle }: { votes: VoteSplit; kind: VoterKind; id: string; modalTitle: string }) {
  const [modalOpen, setModalOpen] = useState(false)
  const tooltipId = useId()
  const total = votes.pinkCount + votes.blueCount
  if (total === 0) return null

  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        aria-describedby={tooltipId}
        style={{ touchAction: 'manipulation' }}
        className="cursor-pointer font-mono text-[11px] tabular-nums text-ink-soft outline-none transition-colors hover:font-bold hover:text-ink focus-visible:ring-2 focus-visible:ring-ink"
      >
        {total}
      </button>
      <span
        id={tooltipId}
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 hidden w-max max-w-[220px] -translate-x-1/2 whitespace-normal border border-ink bg-ink px-2.5 py-1.5 font-mono text-[10px] leading-snug text-paper group-hover:block group-focus-within:block"
      >
        {votes.pinkCount > 0 && (
          <span className="block text-pink">
            {votes.pinkCount} creator/journalist{votes.pinkCount === 1 ? '' : 's'}
          </span>
        )}
        {votes.blueCount > 0 && (
          <span className="block text-blue">
            {votes.blueCount} expert/organisation{votes.blueCount === 1 ? '' : 's'}
          </span>
        )}
      </span>
      {modalOpen && <VoterModal kind={kind} id={id} title={modalTitle} onClose={() => setModalOpen(false)} />}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Vote button — a single "this was helpful" vote (any logged-in member),
// for a question or an answer. A true toggle: casting it again removes it
// (voteQuestion/voteAnswer flip the row server-side — see
// lib/briefs/actions.ts, fixed 2026-08-13 after the button got stuck "on"
// permanently). Reddit-style: a bare triangle (always pink — the
// voter-tone coloring this used to have was walked back in the 2026-08-13
// redesign) plus an independent count next to it that opens the
// voter-list modal. voterTone still decides which bucket (pink/blue) the
// optimistic count moves in/out of — that's a data concern, unrelated to
// the icon's own color.
// ---------------------------------------------------------------------------

export function VoteButton({
  target,
  id,
  briefSlug,
  votes,
  voterTone,
  voterKind,
  modalTitle,
  size = 'md',
}: {
  target: 'question' | 'answer'
  id: string
  briefSlug: string
  votes: VoteSplit
  voterTone: VoterTone
  voterKind: VoterKind
  modalTitle: string
  size?: 'md' | 'sm'
}) {
  const [pinkCount, setPinkCount] = useState(votes.pinkCount)
  const [blueCount, setBlueCount] = useState(votes.blueCount)
  const [myVote, setMyVote] = useState(votes.myVote)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const tooltipId = useId()

  function vote() {
    setError(null)
    startTransition(async () => {
      const result = target === 'question' ? await voteQuestion(id, briefSlug) : await voteAnswer(id, briefSlug)
      if (result.error) {
        setError(result.error)
        return
      }
      const nowVoted = result.voted ?? false
      setMyVote(nowVoted)
      const delta = nowVoted ? 1 : -1
      if (voterTone === 'pink') setPinkCount((c) => Math.max(0, c + delta))
      else if (voterTone === 'blue') setBlueCount((c) => Math.max(0, c + delta))
    })
  }

  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'

  return (
    <div className="flex items-center gap-1" aria-live="polite">
      <button
        type="button"
        onClick={vote}
        disabled={isPending}
        aria-label={myVote ? 'Remove your upvote' : 'Upvote'}
        aria-describedby={tooltipId}
        style={{ touchAction: 'manipulation' }}
        className="group/vote relative flex cursor-pointer items-center justify-center rounded-sm p-1 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-pink disabled:cursor-default"
      >
        <svg
          viewBox="0 0 12 11"
          strokeWidth="1.3"
          strokeLinejoin="round"
          className={`${iconSize} stroke-pink transition-colors ${
            myVote ? 'fill-pink' : 'fill-none group-hover/vote:fill-pink'
          }`}
        >
          <path d="M6 0.8 L11.2 10 L0.8 10 Z" />
        </svg>
        <span
          id={tooltipId}
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 hidden -translate-x-1/2 whitespace-nowrap border border-ink bg-ink px-2 py-1 font-mono text-[10px] text-paper group-hover/vote:block group-focus-within/vote:block"
        >
          {myVote ? 'Remove upvote' : 'Upvote'}
        </span>
      </button>
      <VoteCountBadge votes={{ pinkCount, blueCount, myVote }} kind={voterKind} id={id} modalTitle={modalTitle} />
      {error && (
        <span role="alert" className="font-mono text-[10px] text-pink-ink">
          {error}
        </span>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Endorse button — expert/org only, "this answer is accurate" (distinct
// from VoteButton's "this was helpful", open to any member). Only ever
// rendered for a viewer who can actually endorse; a read-only viewer sees
// VoteCountBadge directly instead (qa-answers.tsx).
// ---------------------------------------------------------------------------

export function EndorseButton({
  answerId,
  briefSlug,
  endorsedCount,
  myEndorsement,
}: {
  answerId: string
  briefSlug: string
  endorsedCount: number
  myEndorsement: boolean
}) {
  const [count, setCount] = useState(endorsedCount)
  const [endorsed, setEndorsed] = useState(myEndorsement)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function endorse() {
    setError(null)
    startTransition(async () => {
      const result = await endorseAnswer(answerId, briefSlug)
      if (result.error) {
        setError(result.error)
      } else {
        setEndorsed(true)
        setCount((c) => c + 1)
      }
    })
  }

  return (
    <div className="flex items-center gap-1.5" aria-live="polite">
      <button
        type="button"
        onClick={endorse}
        disabled={isPending || endorsed}
        style={{ touchAction: 'manipulation' }}
        className={`inline-flex cursor-pointer items-center gap-1 border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.06em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue disabled:cursor-default ${
          endorsed ? 'border-blue bg-blue-soft text-blue-ink' : 'border-line-strong text-ink-soft hover:border-blue hover:text-blue-ink'
        }`}
      >
        {endorsed ? '★ Endorsed' : isPending ? 'Endorsing…' : '★ Endorse'}
      </button>
      <VoteCountBadge votes={{ pinkCount: 0, blueCount: count, myVote: endorsed }} kind="answer_endorsements" id={answerId} modalTitle="Endorsed by" />
      {error && (
        <span role="alert" className="font-mono text-[10px] text-pink-ink">
          {error}
        </span>
      )}
    </div>
  )
}
