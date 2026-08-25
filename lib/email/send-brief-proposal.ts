import 'server-only'

import { sendEmail } from './send'
import { COLOR, FONT, MONO, esc, nl2br, eyebrow, emailShell } from './brand'

export interface BriefProposalEmailData {
  submitter_name: string
  submitter_email: string
  topic_title: string
  why_it_matters: string
  from_brief_title?: string | null
}

export async function sendBriefProposalEmail(data: BriefProposalEmailData) {
  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail) {
    console.error('ADMIN_EMAIL is not set — cannot send brief proposal email')
    return { error: 'Configuration error: ADMIN_EMAIL not set' }
  }

  const contextNote = data.from_brief_title
    ? `<p style="margin:0 0 20px;font-family:${FONT};font-size:13px;line-height:1.7;color:${COLOR.inkFaint};font-style:italic;">
        Submitted from the brief: ${esc(data.from_brief_title)}
      </p>`
    : ''

  const bodyHtml = `
    ${eyebrow('New brief proposal')}
    <p style="margin:0 0 20px;font-family:${FONT};font-size:18px;line-height:1.4;font-weight:700;color:${COLOR.ink};">
      ${esc(data.topic_title)}
    </p>
    ${contextNote}
    <p style="margin:0 0 8px;font-family:${MONO};font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:${COLOR.inkFaint};">
      Why it matters / what it should cover
    </p>
    <p style="margin:0 0 24px;font-family:${FONT};font-size:14px;line-height:1.75;color:${COLOR.ink};">
      ${nl2br(data.why_it_matters)}
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:${COLOR.paperRaised};border:1px solid ${COLOR.line};margin-bottom:8px;">
      <tr>
        <td style="padding:16px 20px;">
          <p style="margin:0 0 4px;font-family:${MONO};font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:${COLOR.inkFaint};">Submitted by</p>
          <p style="margin:0;font-family:${FONT};font-size:14px;color:${COLOR.ink};">
            ${esc(data.submitter_name)} &lt;<a href="mailto:${esc(data.submitter_email)}" style="color:${COLOR.blueInk};">${esc(data.submitter_email)}</a>&gt;
          </p>
        </td>
      </tr>
    </table>`

  return sendEmail({
    to: adminEmail,
    subject: `Brief proposal: ${data.topic_title}`,
    html: emailShell({ bodyHtml }),
  })
}
