'use client'

import { useEffect, useId, useState, useTransition } from 'react'
import Link from 'next/link'
import Avatar from '@/components/ui/Avatar'
import Modal from '@/components/ui/Modal'
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
    <Modal open onClose={onClose} size="narrow" title={title}>
      <div className="-mx-2 max-h-[60vh] overflow-y-auto">
        {error && (
          <p role="alert" className="p-2 font-ui text-caption text-brick">
            {error}
          </p>
        )}
        {!voters && !error && <p className="p-2 font-ui text-caption text-umber-soft">Loading…</p>}
        {voters?.length === 0 && <p className="p-2 font-ui text-caption text-umber-soft">No one yet.</p>}
        {voters?.map((voter, i) => {
          const name = getDisplayName(voter)
          const credential = voter.affiliation || voter.org_name
          return (
            <Link
              key={`${voter.id}-${i}`}
              href={`/profile/${voter.id}`}
              className="flex min-h-11 items-center gap-2.5 rounded-control px-2 py-2 transition-colors hover:bg-bone focus-ring"
            >
              <Avatar name={name} avatarUrl={voter.avatar_url} palette="colored" size="sm" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="truncate font-ui text-ui-sm font-medium text-umber">{name}</span>
                  {voter.role && <RoleBadge role={voter.role} variant="outline" />}
                </div>
                {credential && <p className="truncate font-ui text-caption text-umber-soft">{credential}</p>}
              </div>
            </Link>
          )
        })}
      </div>
    </Modal>
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
        className="group/count inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-control focus-ring"
      >
        <span className="rounded-tag bg-bone px-1.5 py-0.5 font-mono text-label tabular-nums text-umber-soft transition-colors group-hover/count:text-umber">
          {total}
        </span>
      </button>
      <span
        id={tooltipId}
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 hidden w-max max-w-[220px] -translate-x-1/2 whitespace-normal rounded-control bg-vellum px-2.5 py-1.5 font-ui text-caption leading-snug text-umber shadow-menu group-hover:block group-focus-within:block"
      >
        {votes.pinkCount > 0 && (
          <span className="block text-umber-soft">
            {votes.pinkCount} creator/journalist{votes.pinkCount === 1 ? '' : 's'}
          </span>
        )}
        {votes.blueCount > 0 && (
          <span className="block text-cobalt">
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
  const [stroke, fill, hoverFill] =
    voterTone === 'blue'
      ? ['stroke-cobalt', 'fill-cobalt', 'group-hover/vote:fill-cobalt-wash']
      : ['stroke-umber', 'fill-umber', 'group-hover/vote:fill-bone']

  return (
    <div className="flex items-center" aria-live="polite">
      <button
        type="button"
        onClick={vote}
        disabled={isPending}
        aria-label={myVote ? 'Remove your upvote' : 'Upvote'}
        aria-describedby={tooltipId}
        style={{ touchAction: 'manipulation' }}
        className="group/vote relative flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-control transition-colors focus-ring disabled:cursor-default"
      >
        <svg
          viewBox="0 0 12 11"
          strokeWidth="1.3"
          strokeLinejoin="round"
          className={`${iconSize} ${stroke} transition-colors ${myVote ? fill : `fill-none ${hoverFill}`}`}
        >
          <path d="M6 0.8 L11.2 10 L0.8 10 Z" />
        </svg>
        <span
          id={tooltipId}
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 hidden -translate-x-1/2 whitespace-nowrap rounded-control bg-vellum px-2 py-1 font-ui text-caption text-umber shadow-menu group-hover/vote:block group-focus-within/vote:block"
        >
          {myVote ? 'Remove upvote' : 'Upvote'}
        </span>
      </button>
      <VoteCountBadge votes={{ pinkCount, blueCount, myVote }} kind={voterKind} id={id} modalTitle={modalTitle} />
      {error && (
        <span role="alert" className="font-ui text-caption text-brick">
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
    <div className="flex items-center" aria-live="polite">
      <button
        type="button"
        onClick={endorse}
        disabled={isPending || endorsed}
        style={{ touchAction: 'manipulation' }}
        className={`inline-flex min-h-11 cursor-pointer items-center gap-1 rounded-control border px-3 font-mono text-label uppercase transition-colors focus-ring disabled:cursor-default ${
          endorsed ? 'border-cobalt bg-cobalt-wash text-cobalt' : 'border-field-line text-umber-soft hover:border-cobalt hover:text-cobalt'
        }`}
      >
        {endorsed ? '★ Endorsed' : isPending ? 'Endorsing…' : '★ Endorse'}
      </button>
      <VoteCountBadge votes={{ pinkCount: 0, blueCount: count, myVote: endorsed }} kind="answer_endorsements" id={answerId} modalTitle="Endorsed by" />
      {error && (
        <span role="alert" className="font-ui text-caption text-brick">
          {error}
        </span>
      )}
    </div>
  )
}
