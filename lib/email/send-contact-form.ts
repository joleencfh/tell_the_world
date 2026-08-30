import 'server-only'

import { sendEmail } from './send'
import { COLOR, FONT, MONO, esc, nl2br, eyebrow, emailShell } from './brand'

export interface ContactFormEmailData {
  name: string
  email: string
  topic: string
  message: string
}

// Public contact form (app/contact) — no account required. Notifies the
// admin only; there's no confirmation email back to the sender since we
// don't want to promise a response time. Same "admin gets notified" shape
// as send-application-notification.ts, but with reply-to set to the
// sender's address so the admin can just hit reply.
export async function sendContactFormEmail(data: ContactFormEmailData) {
  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail) {
    console.error('ADMIN_EMAIL is not set — cannot send contact form email')
    return { error: 'Configuration error: ADMIN_EMAIL not set' }
  }

  const bodyHtml = `
    ${eyebrow('New contact form submission')}
    <p style="margin:0 0 20px;font-family:${FONT};font-size:18px;line-height:1.4;font-weight:700;color:${COLOR.ink};">
      ${esc(data.topic)}
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:${COLOR.paperRaised};border:1px solid ${COLOR.line};margin-bottom:24px;">
      <tr>
        <td style="padding:16px 20px;">
          <p style="margin:0 0 4px;font-family:${MONO};font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:${COLOR.inkFaint};">From</p>
          <p style="margin:0;font-family:${FONT};font-size:14px;color:${COLOR.ink};">
            ${esc(data.name)} &lt;<a href="mailto:${esc(data.email)}" style="color:${COLOR.blueInk};">${esc(data.email)}</a>&gt;
          </p>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 4px;font-family:${MONO};font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:${COLOR.inkFaint};">
      Message
    </p>
    <p style="margin:0;font-family:${FONT};font-size:14px;line-height:1.75;color:${COLOR.ink};">
      ${nl2br(data.message)}
    </p>`

  return sendEmail({
    to: adminEmail,
    subject: `[Contact form] ${data.topic} from ${data.name}`,
    html: emailShell({ bodyHtml }),
    replyTo: data.email,
  })
}
