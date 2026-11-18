'use client'

import { useState } from 'react'
import { approveApplication, rejectApplication } from '@/lib/admin/actions'
import type { Application } from '@/lib/admin/actions'
import { ROLE_LABELS, REFERRAL_LABELS, RoleBadge, formatDate, Field, LinkField } from './admin-shared'

// ---------------------------------------------------------------------------
// Application card
// ---------------------------------------------------------------------------

export function ApplicationCard({ app }: { app: Application }) {
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState<'approving' | 'rejecting' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

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
      setConfirmingDelete(false)
    }
  }

  return (
    <div className="border border-line bg-paper-raised">
      {/* Summary row — always visible. The name/role/email area toggles the
          expanded body; the delete control on the right is a sibling button
          (not nested inside it) so admins can reject straight from here
          without opening the card. */}
      <div className="flex items-center gap-4 px-5 py-4 hover:bg-paper/60 transition-colors">
        <button
          type="button"
          className="flex-1 min-w-0 flex items-center gap-4 text-left"
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

        {confirmingDelete ? (
          <div className="flex items-center gap-2 shrink-0">
            <span className="font-mono text-[9px] text-ink-soft hidden md:inline">Reject?</span>
            <button
              type="button"
              onClick={handleReject}
              disabled={loading !== null}
              className="font-mono text-[9px] tracking-[0.15em] uppercase px-2.5 py-1.5 bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading === 'rejecting' ? '…' : 'Yes'}
            </button>
            <button
              type="button"
              onClick={() => setConfirmingDelete(false)}
              disabled={loading !== null}
              className="font-mono text-[9px] tracking-[0.15em] uppercase px-2.5 py-1.5 border border-line text-ink-soft hover:border-ink hover:text-ink transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              No
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            aria-label="Reject this application"
            title="Reject application"
            className="shrink-0 font-mono text-sm leading-none text-ink-soft/50 hover:text-red-600 transition-colors px-1.5 py-1"
          >
            ✕
          </button>
        )}
      </div>

      {/* Quick-reject error — surfaced even while collapsed, since the
          control above no longer requires expanding the card first. */}
      {error && !expanded && (
        <p className="px-5 pb-4 font-mono text-[10px] text-red-600" role="alert">{error}</p>
      )}

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

            {/* Communications specialist */}
            {app.desired_role === 'comms_specialist' && (
              <>
                <Field label="Affiliation" value={app.affiliation} />
                <Field label="Job title" value={app.job_title} />
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

          {/* Error */}
          {error && (
            <p className="mb-3 font-mono text-[10px] text-red-600" role="alert">{error}</p>
          )}

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleApprove}
              disabled={loading !== null}
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
