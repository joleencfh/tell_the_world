import 'server-only'

import { sendEmail } from './send'
import { COLOR, FONT, esc, eyebrow, ctaButton, emailShell } from './brand'

export interface ApprovalEmailData {
  first_name: string
  email: string
  magic_link: string | null
  profile_url: string
}

export async function sendApprovalEmail(data: ApprovalEmailData) {
  const firstName = esc(data.first_name)

  const magicLinkSection = data.magic_link
    ? `
      ${ctaButton(data.magic_link, 'Sign in to your account')}
      <p style="margin:0 0 20px;font-family:${FONT};font-size:13px;line-height:1.7;color:${COLOR.inkSoft};">
        This link signs you in automatically and takes you straight to your profile — no password needed.
        It&rsquo;s for one-time use only and expires after 24 hours. If it expires, you can sign in at any time
        from the login page using the same email address.
      </p>`
    : `
      <p style="margin:24px 0;font-family:${FONT};font-size:14px;line-height:1.75;color:${COLOR.ink};">
        You can sign in at any time from the login page using this email address.
      </p>`

  const bodyHtml = `
    ${eyebrow('Application approved')}
    <p style="margin:0 0 20px;font-family:${FONT};font-size:20px;line-height:1.3;font-weight:700;color:${COLOR.ink};">
      Welcome to Tell The World, ${firstName}.
    </p>
    <p style="margin:0 0 20px;font-family:${FONT};font-size:14px;line-height:1.75;color:${COLOR.inkSoft};">
      Your application has been reviewed and approved. We&rsquo;re glad to have you on the platform.
    </p>
    <p style="margin:0 0 20px;font-family:${FONT};font-size:14px;line-height:1.75;color:${COLOR.inkSoft};">
      Your account is ready. Use the button below to sign in and access your profile,
      where you can complete your setup and start exploring the platform.
    </p>
    ${magicLinkSection}
    <p style="margin:24px 0 0;font-family:${FONT};font-size:12px;line-height:1.7;color:${COLOR.inkFaint};border-top:1px solid ${COLOR.line};padding-top:20px;">
      If you have any questions, reply to this email and we&rsquo;ll get back to you.
    </p>`

  return sendEmail({
    to: data.email,
    subject: 'Welcome to Tell The World — your account is ready',
    html: emailShell({ bodyHtml }),
  })
}
