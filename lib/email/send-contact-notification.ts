import 'server-only'

import { sendEmail } from './send'
import { COLOR, FONT, MONO, esc, nl2br, eyebrow, emailShell } from './brand'

export interface ContactNotificationData {
  recipient_name: string
  recipient_email: string
  sender_name: string
  sender_role: string
  subject: string
  message: string
}

function roleLabel(role: string): string {
  const labels: Record<string, string> = {
    creator: 'Creator',
    journalist: 'Journalist',
    expert: 'Expert',
    organisation: 'Organisation',
    admin: 'Admin',
  }
  return labels[role] ?? role
}

export async function sendContactNotification(data: ContactNotificationData) {
  const bodyHtml = `
    ${eyebrow('New contact request')}
    <p style="margin:0 0 20px;font-family:${FONT};font-size:15px;line-height:1.75;color:${COLOR.ink};">
      Hi ${esc(data.recipient_name)},
    </p>
    <p style="margin:0 0 20px;font-family:${FONT};font-size:14px;line-height:1.75;color:${COLOR.inkSoft};">
      You&rsquo;ve received a contact request on Tell The World from
      <strong style="color:${COLOR.ink};">${esc(data.sender_name)}</strong> (${esc(roleLabel(data.sender_role))}).
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:${COLOR.paperRaised};border:1px solid ${COLOR.line};margin-bottom:24px;">
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0 0 4px;font-family:${MONO};font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:${COLOR.inkFaint};">Subject</p>
          <p style="margin:0 0 16px;font-family:${FONT};font-size:15px;font-weight:700;color:${COLOR.ink};">${esc(data.subject)}</p>
          <p style="margin:0 0 4px;font-family:${MONO};font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:${COLOR.inkFaint};">Message</p>
          <p style="margin:0;font-family:${FONT};font-size:14px;line-height:1.75;color:${COLOR.ink};">${nl2br(data.message)}</p>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 20px;font-family:${FONT};font-size:14px;line-height:1.75;color:${COLOR.inkSoft};">
      Log in to Tell The World to view this person&rsquo;s full profile and decide whether to respond.
    </p>
    <p style="margin:24px 0 0;font-family:${FONT};font-size:12px;line-height:1.7;color:${COLOR.inkFaint};border-top:1px solid ${COLOR.line};padding-top:20px;">
      You received this because someone sent you a contact request on Tell The World.
      If you didn&rsquo;t expect this, you can ignore it.
    </p>`

  return sendEmail({
    to: data.recipient_email,
    subject: `Message from ${data.sender_name} on Tell The World: ${data.subject}`,
    html: emailShell({ bodyHtml }),
  })
}
