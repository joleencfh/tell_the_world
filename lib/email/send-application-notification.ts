import 'server-only'

import { sendEmail } from './send'
import { COLOR, FONT, MONO, esc, nl2br, eyebrow, emailShell } from './brand'

export interface ApplicationNotificationEmailData {
  full_name: string
  email: string
  desired_role: string
  desired_role_other?: string
  bio: string
}

// Notifies the admin every time someone submits an application — the
// applicant-facing confirmation (send-application-confirmation.ts) is
// separate. Same "admin gets notified" shape as send-brief-proposal.ts:
// ADMIN_EMAIL env var, guard clause, plain HTML, no CTA link.
export async function sendApplicationNotificationEmail(data: ApplicationNotificationEmailData) {
  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail) {
    console.error('ADMIN_EMAIL is not set — cannot send application notification email')
    return { error: 'Configuration error: ADMIN_EMAIL not set' }
  }

  const roleLabel =
    data.desired_role === 'other' && data.desired_role_other ? data.desired_role_other : data.desired_role

  const bodyHtml = `
    ${eyebrow('New application')}
    <p style="margin:0 0 20px;font-family:${FONT};font-size:18px;line-height:1.4;font-weight:700;color:${COLOR.ink};">
      ${esc(data.full_name)} &mdash; ${esc(roleLabel)}
    </p>
    <p style="margin:0 0 8px;font-family:${MONO};font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:${COLOR.inkFaint};">
      Bio
    </p>
    <p style="margin:0 0 24px;font-family:${FONT};font-size:14px;line-height:1.75;color:${COLOR.ink};">
      ${nl2br(data.bio)}
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:${COLOR.paperRaised};border:1px solid ${COLOR.line};margin-bottom:8px;">
      <tr>
        <td style="padding:16px 20px;">
          <p style="margin:0 0 4px;font-family:${MONO};font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:${COLOR.inkFaint};">Applicant</p>
          <p style="margin:0;font-family:${FONT};font-size:14px;color:${COLOR.ink};">
            ${esc(data.full_name)} &lt;<a href="mailto:${esc(data.email)}" style="color:${COLOR.blueInk};">${esc(data.email)}</a>&gt;
          </p>
        </td>
      </tr>
    </table>`

  return sendEmail({
    to: adminEmail,
    subject: `New application: ${data.full_name} (${roleLabel})`,
    html: emailShell({ bodyHtml }),
  })
}
