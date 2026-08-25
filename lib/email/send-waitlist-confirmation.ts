import 'server-only'

import { sendEmail } from './send'
import { COLOR, FONT, esc, eyebrow, emailShell } from './brand'

export interface WaitlistConfirmationData {
  full_name: string
  email: string
  wants_early_access: boolean
}

function earlyTesterBlock(): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:${COLOR.paperSunken};border-left:2px solid ${COLOR.pinkInk};margin:0 0 28px;">
        <tr>
          <td style="padding:18px 20px;">
            <p style="margin:0;font-family:${FONT};font-size:14px;line-height:1.7;color:${COLOR.ink};">
              You also said you&rsquo;d like to help test things early. We&rsquo;ll reach out soon to a handful of early testers, thank you for wanting to help us shape it.
            </p>
          </td>
        </tr>
      </table>`
}

export async function sendWaitlistConfirmation(data: WaitlistConfirmationData) {
  const firstName = esc(data.full_name.trim().split(/\s+/)[0] || data.full_name.trim())

  const bodyHtml = `
    ${eyebrow("You're on the list")}
    <p style="margin:0 0 20px;font-family:${FONT};font-size:20px;line-height:1.3;font-weight:700;color:${COLOR.ink};">
      Thanks for joining, ${firstName}.
    </p>
    <p style="margin:0 0 28px;font-family:${FONT};font-size:14px;line-height:1.75;color:${COLOR.inkSoft};">
      We&rsquo;ll email you the moment Tell The World is ready. No spam, and we won&rsquo;t sell your details to anyone else.
    </p>
    ${data.wants_early_access ? earlyTesterBlock() : ''}
    <p style="margin:0;font-family:${FONT};font-size:12px;line-height:1.7;color:${COLOR.inkFaint};border-top:1px solid ${COLOR.line};padding-top:20px;">
      If you didn&rsquo;t ask to join, you can safely ignore this email.
    </p>`

  const result = await sendEmail({
    to: data.email,
    subject: "You're on the Tell The World waitlist",
    html: emailShell({ bodyHtml }),
  })

  if (result.error) {
    throw new Error(`Resend error: ${result.error}`)
  }

  return result
}
