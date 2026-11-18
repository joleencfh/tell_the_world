'use client'

import { useState } from 'react'
import { approveApplication, rejectApplication } from '@/lib/admin/actions'
import type { Application } from '@/lib/admin/actions'
import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { Icon } from '@/components/ui/icons'
import RoleLabel from '@/components/ui/RoleLabel'
import StatusChip from '@/components/ui/StatusChip'
import type { UserRole } from '@/lib/types'
import { ROLE_LABELS, REFERRAL_LABELS, formatDate, Field, LinkField } from './admin-shared'

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
    <div className="border border-rule bg-vellum">
      {/* Summary row, always visible. The name/role/email area toggles the
          expanded body; the reject control on the right is a sibling button
          (not nested inside it) so admins can reject straight from here
          without opening the card. */}
      <div className="flex items-center gap-3 px-4 py-2 transition-colors hover:bg-bone">
        <button
          type="button"
          className="flex min-h-11 min-w-0 flex-1 items-center gap-3 text-left focus-ring"
          onClick={() => setExpanded(e => !e)}
          aria-expanded={expanded}
        >
          <Icon
            name="chevron-right"
            className="shrink-0 text-umber-soft transition-transform duration-150"
            style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
          />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="truncate font-ui text-ui-sm font-semibold text-umber">{displayName}</span>
              <RoleLabel role={app.desired_role as UserRole} />
            </div>
            <span className="font-ui text-ui-sm text-umber-soft">{app.email}</span>
          </div>

          <span className="hidden shrink-0 font-ui text-ui-sm text-umber-soft sm:block">
            {formatDate(app.created_at)}
          </span>
        </button>

        <StatusChip status="pending" className="hidden shrink-0 md:inline-flex" />

        <Button
          variant="ghost"
          icon
          onClick={() => setConfirmingDelete(true)}
          aria-label="Reject this application"
          title="Reject application"
        >
          <Icon name="x" />
        </Button>
      </div>

      <ConfirmDialog
        open={confirmingDelete}
        title={`Reject ${displayName}?`}
        confirmLabel="Reject application"
        tone="danger"
        pending={loading === 'rejecting'}
        onConfirm={handleReject}
        onCancel={() => setConfirmingDelete(false)}
      >
        This application is removed from the pending list.
      </ConfirmDialog>

      {/* Quick-reject error, surfaced even while collapsed, since the
          control above does not require expanding the card first. */}
      {error && !expanded && (
        <div className="px-4 pb-4">
          <Alert tone="danger">{error}</Alert>
        </div>
      )}

      {/* Expanded body */}
      {expanded && (
        <div className="border-t border-rule px-5 pb-5 pt-4">

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
            <span className="mb-1 mt-2 block pl-0 font-ui text-ui-sm text-umber-soft">Submitted {formatDate(app.created_at)}</span>

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
          {error && <Alert tone="danger" className="mb-3">{error}</Alert>}

          {/* Action buttons. The Reject here acts immediately, as before; the
              quick reject in the summary row asks first. */}
          <div className="flex flex-wrap gap-3">
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
              onClick={handleReject}
              disabled={loading !== null}
              pending={loading === 'rejecting'}
            >
              {loading === 'rejecting' ? 'Rejecting…' : 'Reject'}
            </Button>
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
    <div className="flex min-h-11 flex-wrap items-center gap-3 border-b border-rule py-3 last:border-0">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-ui text-ui-sm font-semibold text-umber">{displayName}</span>
          {app.desired_role && <RoleLabel role={app.desired_role as UserRole} />}
        </div>
        <span className="font-ui text-ui-sm text-umber-soft">{app.email}</span>
      </div>
      {app.reviewed_at && (
        <span className="shrink-0 font-ui text-ui-sm text-umber-soft">
          Approved {formatDate(app.reviewed_at)}
        </span>
      )}
    </div>
  )
}
