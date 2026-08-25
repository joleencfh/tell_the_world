import 'server-only'

import { sendEmail } from './send'
import { COLOR, FONT, esc, eyebrow, emailShell } from './brand'

export interface RejectionEmailData {
  first_name: string
  email: string
}

export async function sendRejectionEmail(data: RejectionEmailData) {
  const firstName = esc(data.first_name)

  const bodyHtml = `
    ${eyebrow('Your application')}
    <p style="margin:0 0 20px;font-family:${FONT};font-size:15px;line-height:1.75;color:${COLOR.ink};">
      Hi ${firstName},
    </p>
    <p style="margin:0 0 20px;font-family:${FONT};font-size:14px;line-height:1.75;color:${COLOR.inkSoft};">
      Thank you for applying to Tell The World. We&rsquo;ve reviewed your application carefully
      and aren&rsquo;t able to offer you a place at this time.
    </p>
    <p style="margin:0 0 20px;font-family:${FONT};font-size:14px;line-height:1.75;color:${COLOR.inkSoft};">
      Our decisions reflect where we are in building the platform and the specific mix of
      members we&rsquo;re looking for right now. This isn&rsquo;t a judgement of your work or credentials.
    </p>
    <p style="margin:0 0 20px;font-family:${FONT};font-size:14px;line-height:1.75;color:${COLOR.inkSoft};">
      If you believe this decision was made in error, or your situation has changed in a
      way that may be relevant, feel free to reply to this email.
    </p>
    <p style="margin:0;font-family:${FONT};font-size:14px;line-height:1.75;color:${COLOR.inkSoft};">
      Thank you again for your interest in the platform.
    </p>
    <p style="margin:24px 0 0;font-family:${FONT};font-size:12px;line-height:1.7;color:${COLOR.inkFaint};border-top:1px solid ${COLOR.line};padding-top:20px;">
      The Tell The World team
    </p>`

  return sendEmail({
    to: data.email,
    subject: 'Your Tell The World application',
    html: emailShell({ bodyHtml }),
  })
}
