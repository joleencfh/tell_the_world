'use client'

import { useState } from 'react'
import {
  approveQuestion, dismissQuestion,
  approveCorrectionProposal, dismissCorrectionProposal,
  declineBriefProposal, convertProposalToBrief, linkProposalToBrief,
} from '@/lib/admin/actions'
import type { PendingQuestion, PendingCorrectionProposal, BriefProposal } from '@/lib/admin/actions'
import type { BriefOption } from '@/lib/admin/brief-actions'
import Button from '@/components/ui/Button'
import { formatDate, Field, QueueItem } from './admin-shared'

// ---------------------------------------------------------------------------
// Pending question card
// ---------------------------------------------------------------------------

export function QuestionCard({ question }: { question: PendingQuestion }) {
  const [loading, setLoading] = useState<'approving' | 'dismissing' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const submitterName = question.users.display_name || question.users.email.split('@')[0]

  async function handleApprove() {
    setLoading('approving')
    setError(null)
    const result = await approveQuestion(question.id)
    if (result.error) { setError(result.error); setLoading(null) }
  }

  async function handleDismiss() {
    setLoading('dismissing')
    setError(null)
    const result = await dismissQuestion(question.id)
    if (result.error) { setError(result.error); setLoading(null) }
  }

  return (
    <QueueItem
      testId="admin-question-card"
      title={question.briefs.title}
      meta={`${submitterName} · ${formatDate(question.created_at)}`}
      error={error}
      actions={
        <>
          <Button
            variant="primary"
            onClick={handleApprove}
            disabled={loading !== null}
            pending={loading === 'approving'}
          >
            {loading === 'approving' ? 'Approving…' : 'Approve'}
          </Button>
          <Button
            variant="secondary"
            onClick={handleDismiss}
            disabled={loading !== null}
            pending={loading === 'dismissing'}
          >
            {loading === 'dismissing' ? 'Dismissing…' : 'Dismiss'}
          </Button>
        </>
      }
    >
      <p className="font-ui text-ui-sm leading-snug text-umber">{question.question_text}</p>
    </QueueItem>
  )
}

// ---------------------------------------------------------------------------
// Pending correction proposal card
// ---------------------------------------------------------------------------

export function CorrectionProposalCard({ proposal }: { proposal: PendingCorrectionProposal }) {
  const [loading, setLoading] = useState<'approving' | 'dismissing' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const submitterName = proposal.users.display_name || proposal.users.email.split('@')[0]

  async function handleApprove() {
    setLoading('approving')
    setError(null)
    const result = await approveCorrectionProposal(proposal.id)
    if (result.error) { setError(result.error); setLoading(null) }
  }

  async function handleDismiss() {
    setLoading('dismissing')
    setError(null)
    const result = await dismissCorrectionProposal(proposal.id)
    if (result.error) { setError(result.error); setLoading(null) }
  }

  return (
    <QueueItem
      testId="admin-correction-proposal-card"
      title={proposal.briefs.title}
      meta={
        <>
          {submitterName}
          {' · '}
          <span className="capitalize">{proposal.users.role}</span>
          {' · '}
          {formatDate(proposal.created_at)}
        </>
      }
      error={error}
      actions={
        <>
          <Button
            variant="primary"
            onClick={handleApprove}
            disabled={loading !== null}
            pending={loading === 'approving'}
          >
            {loading === 'approving' ? 'Approving…' : 'Approve'}
          </Button>
          <Button
            variant="secondary"
            onClick={handleDismiss}
            disabled={loading !== null}
            pending={loading === 'dismissing'}
          >
            {loading === 'dismissing' ? 'Dismissing…' : 'Dismiss'}
          </Button>
        </>
      }
    >
      <p className="whitespace-pre-wrap font-ui text-ui-sm leading-relaxed text-umber">
        {proposal.contribution_text}
      </p>
    </QueueItem>
  )
}

// ---------------------------------------------------------------------------
// Brief proposal card
// ---------------------------------------------------------------------------

export function BriefProposalCard({ proposal, briefOptions }: { proposal: BriefProposal; briefOptions: BriefOption[] }) {
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [minorChanges, setMinorChanges] = useState(false)
  const [linkBriefId, setLinkBriefId] = useState('')

  async function handleDecline() {
    setLoading(true)
    setError(null)
    const result = await declineBriefProposal(proposal.id)
    if (result.error) { setError(result.error); setLoading(false) }
  }

  async function handleConvert() {
    setLoading(true)
    setError(null)
    // Redirects into the admin editor on success (never resolves here);
    // only returns when the proposal turned out to already be resolved.
    const result = await convertProposalToBrief(proposal.id, minorChanges)
    if (result?.error) { setError(result.error); setLoading(false) }
  }

  async function handleLink() {
    if (!linkBriefId) return
    setLoading(true)
    setError(null)
    const result = await linkProposalToBrief(proposal.id, linkBriefId, minorChanges)
    if (result.error) { setError(result.error); setLoading(false) }
  }

  return (
    <div className="border border-line bg-paper-raised">
      {/* Summary row */}
      <button
        className="w-full text-left px-5 py-4 flex items-center gap-4 hover:bg-paper/60 transition-colors"
        onClick={() => setExpanded(e => !e)}
        aria-expanded={expanded}
      >
        <span
          className="font-mono text-[9px] tracking-[0.15em] text-ink-soft shrink-0 transition-transform duration-150"
          aria-hidden
          style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
        >
          ▶
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-body text-sm font-semibold text-ink truncate mb-0.5">
            {proposal.topic_title}
          </p>
          <p className="font-mono text-[10px] text-ink-soft">
            {proposal.submitter_name} · {proposal.submitter_email}
          </p>
        </div>
        <span className="font-mono text-[9px] text-ink-soft shrink-0 hidden sm:block">
          {formatDate(proposal.created_at)}
        </span>
      </button>

      {/* Expanded body */}
      {expanded && (
        <div className="border-t border-line px-5 pt-4 pb-5 space-y-4">
          {proposal.from_brief_title && (
            <p className="font-mono text-[9px] tracking-[0.15em] uppercase text-ink-soft">
              Submitted from brief: <span className="text-blue-ink">{proposal.from_brief_title}</span>
            </p>
          )}
          <div>
            <p className="font-mono text-[9px] tracking-[0.18em] uppercase text-ink-soft mb-2">
              Why it matters / what it should cover
            </p>
            <p className="font-body text-sm text-ink leading-relaxed whitespace-pre-wrap">
              {proposal.why_it_matters}
            </p>
          </div>
          <Field label="Submitted by" value={`${proposal.submitter_name} (${proposal.submitter_email})`} />

          <label className="flex items-center gap-2 font-mono text-[10px] tracking-[0.1em] uppercase text-ink-soft">
            <input
              type="checkbox"
              checked={minorChanges}
              onChange={(e) => setMinorChanges(e.target.checked)}
              className="h-3.5 w-3.5"
            />
            Not too significant changes from the proposal
          </label>

          {error && <p className="font-mono text-[10px] text-red-600" role="alert">{error}</p>}

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              onClick={handleConvert}
              disabled={loading}
              className="font-mono text-[10px] tracking-[0.18em] uppercase px-5 py-2.5 bg-ink text-paper hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? 'Working…' : 'Convert to new brief'}
            </button>

            <select
              value={linkBriefId}
              onChange={(e) => setLinkBriefId(e.target.value)}
              disabled={loading}
              className="font-mono text-[10px] tracking-[0.1em] border border-line bg-paper px-3 py-2.5 text-ink disabled:opacity-40"
            >
              <option value="">Link to existing brief…</option>
              {briefOptions.map((b) => (
                <option key={b.id} value={b.id}>{b.title}</option>
              ))}
            </select>
            <button
              onClick={handleLink}
              disabled={loading || !linkBriefId}
              className="font-mono text-[10px] tracking-[0.18em] uppercase px-5 py-2.5 border border-line text-ink-soft hover:border-ink hover:text-ink transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Link
            </button>

            <button
              onClick={handleDecline}
              disabled={loading}
              className="font-mono text-[10px] tracking-[0.18em] uppercase px-5 py-2.5 border border-line text-ink-soft hover:border-ink hover:text-ink transition-colors disabled:opacity-40 disabled:cursor-not-allowed ml-auto"
            >
              {loading ? 'Working…' : 'Decline'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
