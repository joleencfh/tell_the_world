'use client'

import { useState } from 'react'
import {
  approveApplication, rejectApplication,
  approveQuestion, dismissQuestion,
  approveCorrectionProposal, dismissCorrectionProposal,
  declineBriefProposal, convertProposalToBrief, linkProposalToBrief,
} from '@/lib/admin/actions'
import type { Application, PendingQuestion, PendingCorrectionProposal, BriefProposal } from '@/lib/admin/actions'
import type { BriefOption } from '@/lib/admin/brief-actions'

// ---------------------------------------------------------------------------
// Role badges
// ---------------------------------------------------------------------------

const ROLE_LABELS: Record<string, string> = {
  creator:      'Creator',
  journalist:   'Journalist',
  expert:       'Expert',
  organisation: 'Organisation',
  other:        'Other',
}

const ROLE_COLORS: Record<string, string> = {
  creator:      'bg-amber-100 text-amber-800',
  journalist:   'bg-blue-100 text-blue-800',
  expert:       'bg-green-100 text-green-800',
  organisation: 'bg-purple-100 text-purple-800',
  other:        'bg-gray-100 text-gray-600',
}

function RoleBadge({ role }: { role: string }) {
  const colors = ROLE_COLORS[role] ?? 'bg-gray-100 text-gray-600'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 font-mono text-[9px] tracking-[0.18em] uppercase ${colors}`}>
      {ROLE_LABELS[role] ?? role}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Field display helpers
// ---------------------------------------------------------------------------

const REFERRAL_LABELS: Record<string, string> = {
  search_engine:      'Search engine',
  social_media:       'Social media',
  word_of_mouth:      'Word of mouth / colleague',
  newsletter_podcast: 'Newsletter or podcast',
  linkedin:           'LinkedIn',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (!value && value !== 0) return null
  return (
    <div className="grid grid-cols-[160px_1fr] gap-3 py-2.5 border-b border-line last:border-0">
      <span className="font-mono text-[9px] tracking-[0.18em] uppercase text-ink-soft pt-0.5">{label}</span>
      <span className="font-body text-sm text-ink leading-relaxed break-words">{String(value)}</span>
    </div>
  )
}

function LinkField({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div className="grid grid-cols-[160px_1fr] gap-3 py-2.5 border-b border-line last:border-0">
      <span className="font-mono text-[9px] tracking-[0.18em] uppercase text-ink-soft pt-0.5">{label}</span>
      <a
        href={value}
        target="_blank"
        rel="noopener noreferrer"
        className="font-body text-sm text-blue-ink hover:underline break-all"
      >
        {value}
      </a>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Application card
// ---------------------------------------------------------------------------

export function ApplicationCard({ app }: { app: Application }) {
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState<'approving' | 'rejecting' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const isOther = app.desired_role === 'other'
  const displayName = app.full_name || [app.first_name, app.last_name].filter(Boolean).join(' ') || app.email

  async function handleApprove() {
    setLoading('approving')
    setError(null)
    const result = await approveApplication(app.id)
    if (result.error) {
      setError(result.error)
      setLoading(null)
    }
    // On success, revalidatePath in the server action causes the page to re-render
    // with the approved application removed from the list. No need to clear loading here.
  }

  async function handleReject() {
    setLoading('rejecting')
    setError(null)
    const result = await rejectApplication(app.id)
    if (result.error) {
      setError(result.error)
      setLoading(null)
    }
  }

  return (
    <div className="border border-line bg-paper-raised">
      {/* Summary row — always visible */}
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
          <div className="flex flex-wrap items-center gap-2.5 mb-0.5">
            <span className="font-body text-sm font-semibold text-ink truncate">{displayName}</span>
            <RoleBadge role={app.desired_role} />
          </div>
          <span className="font-mono text-[10px] text-ink-soft">{app.email}</span>
        </div>

        <span className="font-mono text-[9px] text-ink-soft shrink-0 hidden sm:block">
          {formatDate(app.created_at)}
        </span>
      </button>

      {/* Expanded body */}
      {expanded && (
        <div className="border-t border-line px-5 pt-4 pb-5">

          {/* All submitted fields */}
          <div className="mb-5">
            <Field label="Name" value={displayName} />
            <Field label="Email" value={app.email} />
            <Field label="Role" value={
              app.desired_role === 'other' && app.desired_role_other
                ? `Other — ${app.desired_role_other}`
                : ROLE_LABELS[app.desired_role] ?? app.desired_role
            } />
            <Field label="Bio" value={app.bio} />
            <LinkField label="Website" value={app.website_url} />
            <span className="block font-mono text-[9px] text-ink-soft mt-2 mb-1 pl-0">Submitted {formatDate(app.created_at)}</span>

            {/* Creator / Journalist */}
            {(app.desired_role === 'creator' || app.desired_role === 'journalist') && (
              <>
                <Field label="Platform" value={app.primary_platform} />
                <LinkField label="Profile URL" value={app.platform_url} />
                <Field label="Audience size" value={app.audience_size} />
                <Field label="Language" value={app.content_language} />
              </>
            )}

            {/* Journalist-only */}
            {app.desired_role === 'journalist' && (
              <>
                <Field label="Publication" value={app.publication_name} />
                <LinkField label="Publication URL" value={app.publication_url} />
                <Field label="Reporting beat" value={app.reporting_beat} />
              </>
            )}

            {/* Expert */}
            {app.desired_role === 'expert' && (
              <>
                <Field label="Affiliation" value={app.affiliation} />
                <Field label="Job title" value={app.job_title} />
                <LinkField label="Credibility link" value={app.credibility_url} />
              </>
            )}

            {/* Organisation */}
            {app.desired_role === 'organisation' && (
              <>
                <Field label="Org name" value={app.org_name} />
                <Field label="Org size" value={app.org_size} />
                <Field label="Mission" value={app.org_mission} />
              </>
            )}

            {/* Universal optional */}
            <LinkField label="Work sample" value={app.sample_work_url} />
            <Field
              label="How they found us"
              value={REFERRAL_LABELS[app.referral_source ?? ''] ?? app.referral_source}
            />
            <Field label="Additional info" value={app.additional_info} />
          </div>

          {/* Warning for "other" role */}
          {isOther && (
            <div className="mb-4 px-4 py-3 border border-amber-300 bg-amber-50 font-body text-xs text-amber-800 leading-relaxed">
              This applicant selected &ldquo;other&rdquo; as their role. To approve, assign a specific role
              directly in the Supabase dashboard, then return here to approve.
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="mb-3 font-mono text-[10px] text-red-600" role="alert">{error}</p>
          )}

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleApprove}
              disabled={loading !== null || isOther}
              className="font-mono text-[10px] tracking-[0.18em] uppercase px-5 py-2.5 bg-ink text-paper hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading === 'approving' ? 'Approving…' : 'Approve'}
            </button>
            <button
              onClick={handleReject}
              disabled={loading !== null}
              className="font-mono text-[10px] tracking-[0.18em] uppercase px-5 py-2.5 border border-line text-ink-soft hover:border-ink hover:text-ink transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading === 'rejecting' ? 'Rejecting…' : 'Reject'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

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
    <div className="border border-line bg-paper-raised px-5 py-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-0.5">
          <p className="font-mono text-[9px] tracking-[0.18em] uppercase text-blue-ink">
            {question.briefs.title}
          </p>
          <p className="font-mono text-[9px] text-ink-soft">
            {submitterName} · {formatDate(question.created_at)}
          </p>
        </div>
      </div>
      <p className="font-body text-sm text-ink leading-snug">{question.question_text}</p>
      {error && <p className="font-mono text-[10px] text-red-600">{error}</p>}
      <div className="flex gap-3">
        <button
          onClick={handleApprove}
          disabled={loading !== null}
          className="font-mono text-[10px] tracking-[0.18em] uppercase px-5 py-2.5 bg-ink text-paper hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading === 'approving' ? 'Approving…' : 'Approve'}
        </button>
        <button
          onClick={handleDismiss}
          disabled={loading !== null}
          className="font-mono text-[10px] tracking-[0.18em] uppercase px-5 py-2.5 border border-line text-ink-soft hover:border-ink hover:text-ink transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading === 'dismissing' ? 'Dismissing…' : 'Dismiss'}
        </button>
      </div>
    </div>
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
    <div className="border border-line bg-paper-raised px-5 py-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-0.5">
          <p className="font-mono text-[9px] tracking-[0.18em] uppercase text-blue-ink">
            {proposal.briefs.title}
          </p>
          <p className="font-mono text-[9px] text-ink-soft">
            {submitterName}
            {' · '}
            <span className="capitalize">{proposal.users.role}</span>
            {' · '}
            {formatDate(proposal.created_at)}
          </p>
        </div>
      </div>
      <p className="font-body text-sm text-ink leading-relaxed whitespace-pre-wrap">
        {proposal.contribution_text}
      </p>
      {error && <p className="font-mono text-[10px] text-red-600">{error}</p>}
      <div className="flex gap-3">
        <button
          onClick={handleApprove}
          disabled={loading !== null}
          className="font-mono text-[10px] tracking-[0.18em] uppercase px-5 py-2.5 bg-ink text-paper hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading === 'approving' ? 'Approving…' : 'Approve'}
        </button>
        <button
          onClick={handleDismiss}
          disabled={loading !== null}
          className="font-mono text-[10px] tracking-[0.18em] uppercase px-5 py-2.5 border border-line text-ink-soft hover:border-ink hover:text-ink transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading === 'dismissing' ? 'Dismissing…' : 'Dismiss'}
        </button>
      </div>
    </div>
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

// ---------------------------------------------------------------------------
// Recently approved row
// ---------------------------------------------------------------------------

export function ApprovedRow({ app }: { app: Partial<Application> }) {
  const displayName = app.full_name || [app.first_name, app.last_name].filter(Boolean).join(' ') || app.email
  return (
    <div className="flex flex-wrap items-center gap-3 py-3 border-b border-line last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-0.5">
          <span className="font-body text-sm text-ink">{displayName}</span>
          {app.desired_role && <RoleBadge role={app.desired_role} />}
        </div>
        <span className="font-mono text-[10px] text-ink-soft">{app.email}</span>
      </div>
      {app.reviewed_at && (
        <span className="font-mono text-[9px] text-ink-soft shrink-0">
          Approved {formatDate(app.reviewed_at)}
        </span>
      )}
    </div>
  )
}
