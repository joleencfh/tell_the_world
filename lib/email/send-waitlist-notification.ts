import 'server-only'

import { sendEmail } from './send'
import { COLOR, FONT, MONO, esc, nl2br, eyebrow, emailShell } from './brand'

export interface WaitlistNotificationData {
  full_name: string
  email: string
  role: string
  affiliation?: string
  linkedin_or_website_url?: string
  wants_early_access: boolean
  additional_info?: string
}

// Matches the modal's ROLE_OPTIONS (components/landing/WaitlistModal.tsx) —
// kept as its own copy rather than a shared import since every email
// template in this directory already keeps its own label map (see
// send-application-confirmation.ts's ROLE_LABELS).
const ROLE_LABELS: Record<string, string> = {
  creator: 'Creator',
  journalist: 'Journalist',
  expert: 'Researcher/Expert',
  organisation: 'Organisation',
  comms_specialist: 'Communications Specialist',
  other: 'Other',
}

function row(label: string, value: string | undefined): string {
  if (!value?.trim()) return ''
  return `
    <tr>
      <td style="padding:10px 20px 10px 0;font-family:${MONO};font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:${COLOR.inkFaint};white-space:nowrap;vertical-align:top;border-bottom:1px solid ${COLOR.line};">${esc(label)}</td>
      <td style="padding:10px 0;font-family:${FONT};font-size:14px;color:${COLOR.ink};line-height:1.7;border-bottom:1px solid ${COLOR.line};">${nl2br(value)}</td>
    </tr>`
}

// Notifies the admin every time someone joins the waitlist — the
// applicant-facing confirmation (send-waitlist-confirmation.ts) is
// separate. Same "admin gets notified" shape as
// send-application-notification.ts: ADMIN_EMAIL env var, guard clause,
// plain HTML, no CTA link.
export async function sendWaitlistNotificationEmail(data: WaitlistNotificationData) {
  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail) {
    console.error('ADMIN_EMAIL is not set — cannot send waitlist notification email')
    return { error: 'Configuration error: ADMIN_EMAIL not set' }
  }

  const roleLabel = ROLE_LABELS[data.role] ?? data.role

  const summaryRows = [
    row('Name', data.full_name),
    row('Email', data.email),
    row('Role', roleLabel),
    row('Early tester?', data.wants_early_access ? 'Yes' : undefined),
    row('Affiliation', data.affiliation),
    row('Link', data.linkedin_or_website_url),
    row('Anything else', data.additional_info),
  ].join('')

  const bodyHtml = `
    ${eyebrow('New waitlist signup')}
    <p style="margin:0 0 24px;font-family:${FONT};font-size:18px;line-height:1.4;font-weight:700;color:${COLOR.ink};">
      ${esc(data.full_name)} &mdash; ${esc(roleLabel)}
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:collapse;">
      ${summaryRows}
    </table>`

  return sendEmail({
    to: adminEmail,
    subject: `New waitlist signup: ${data.full_name} (${roleLabel})`,
    html: emailShell({ bodyHtml }),
  })
}
