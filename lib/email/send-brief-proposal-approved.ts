import 'server-only'

import { sendEmail } from './send'
import { COLOR, FONT, esc, eyebrow, ctaButton, emailShell } from './brand'

export interface BriefProposalApprovedEmailData {
  submitter_name: string
  submitter_email: string
  topic_title: string
  brief_url: string
  // Admin-set on approval (Part 10 step 2) — only changes this email's
  // wording, nothing else reads it.
  minor_changes: boolean
}

export async function sendBriefProposalApprovedEmail(data: BriefProposalApprovedEmailData) {
  const firstName = esc(data.submitter_name.split(' ')[0] || data.submitter_name)

  const changesNote = data.minor_changes
    ? 'We kept your original framing largely intact.'
    : 'Our editorial team shaped it along the way, so the final brief may look a little different from your original pitch.'

  const bodyHtml = `
    ${eyebrow('Brief proposal accepted')}
    <p style="margin:0 0 20px;font-family:${FONT};font-size:20px;line-height:1.3;font-weight:700;color:${COLOR.ink};">
      Your proposal is becoming a brief, ${firstName}.
    </p>
    <p style="margin:0 0 20px;font-family:${FONT};font-size:14px;line-height:1.75;color:${COLOR.inkSoft};">
      &ldquo;${esc(data.topic_title)}&rdquo; has been accepted, and we&rsquo;re turning it into a Tell The World brief.
      ${changesNote} You&rsquo;ll be credited as a contributor.
    </p>
    ${ctaButton(data.brief_url, 'View the brief')}
    <p style="margin:24px 0 0;font-family:${FONT};font-size:12px;line-height:1.7;color:${COLOR.inkFaint};border-top:1px solid ${COLOR.line};padding-top:20px;">
      If you have any questions, reply to this email and we&rsquo;ll get back to you.
    </p>`

  return sendEmail({
    to: data.submitter_email,
    subject: `Your brief proposal was accepted: ${data.topic_title}`,
    html: emailShell({ bodyHtml }),
  })
}
