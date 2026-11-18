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
import Checkbox from '@/components/ui/Checkbox'
import { Select } from '@/components/ui/Field'
import { Icon } from '@/components/ui/icons'
import { formatDate, Field, QueueItem, AdminActions, AdminError } from './admin-shared'

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
    <div className="border border-rule bg-vellum" data-testid="admin-brief-proposal-card">
      {/* Summary row */}
      <button
        type="button"
        className="flex min-h-11 w-full items-center gap-3 px-4 py-2 text-left transition-colors hover:bg-bone focus-ring"
        onClick={() => setExpanded(e => !e)}
        aria-expanded={expanded}
      >
        <Icon
          name="chevron-right"
          className="shrink-0 text-umber-soft transition-transform duration-150"
          style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate font-ui text-ui-sm font-semibold text-umber">
            {proposal.topic_title}
          </p>
          <p className="truncate font-ui text-ui-sm text-umber-soft">
            {proposal.submitter_name} · {proposal.submitter_email}
          </p>
        </div>
        <span className="hidden shrink-0 font-ui text-ui-sm text-umber-soft sm:block">
          {formatDate(proposal.created_at)}
        </span>
      </button>

      {/* Expanded body */}
      {expanded && (
        <div className="space-y-4 border-t border-rule px-5 pb-5 pt-4">
          {proposal.from_brief_title && (
            <p className="font-ui text-ui-sm text-umber-soft">
              Submitted from brief: <span className="font-semibold text-cobalt">{proposal.from_brief_title}</span>
            </p>
          )}
          <div>
            <div className="grid grid-cols-1 gap-1 border-b border-rule py-2.5 sm:grid-cols-[160px_1fr] sm:gap-3">
              <span className="pt-0.5 font-mono text-label uppercase text-umber-soft">Why it matters / what it should cover</span>
              <p className="whitespace-pre-wrap break-words font-ui text-ui-sm leading-relaxed text-umber">
                {proposal.why_it_matters}
              </p>
            </div>
            <Field label="Submitted by" value={`${proposal.submitter_name} (${proposal.submitter_email})`} />
          </div>

          <Checkbox
            checked={minorChanges}
            onChange={(e) => setMinorChanges(e.target.checked)}
            label="Not too significant changes from the proposal"
          />

          <AdminError message={error} />

          <AdminActions className="items-center">
            <Button
              variant="primary"
              onClick={handleConvert}
              disabled={loading}
              pending={loading}
            >
              {loading ? 'Working…' : 'Convert to new brief'}
            </Button>

            <div className="min-w-56">
              <Select
                value={linkBriefId}
                onChange={(e) => setLinkBriefId(e.target.value)}
                disabled={loading}
                aria-label="Link to existing brief"
              >
                <option value="">Link to existing brief…</option>
                {briefOptions.map((b) => (
                  <option key={b.id} value={b.id}>{b.title}</option>
                ))}
              </Select>
            </div>
            <Button
              variant="secondary"
              onClick={handleLink}
              disabled={loading || !linkBriefId}
            >
              Link
            </Button>

            <Button
              variant="secondary"
              onClick={handleDecline}
              disabled={loading}
              className="sm:ml-auto"
            >
              {loading ? 'Working…' : 'Decline'}
            </Button>
          </AdminActions>
        </div>
      )}
    </div>
  )
}
