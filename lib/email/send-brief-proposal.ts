import 'server-only'

import { sendEmail } from './send'

export interface BriefProposalEmailData {
  submitter_name: string
  submitter_email: string
  topic_title: string
  why_it_matters: string
  from_brief_title?: string | null
}

function esc(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export async function sendBriefProposalEmail(data: BriefProposalEmailData) {
  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail) {
    console.error('ADMIN_EMAIL is not set — cannot send brief proposal email')
    return { error: 'Configuration error: ADMIN_EMAIL not set' }
  }

  const contextNote = data.from_brief_title
    ? `<p style="margin:0 0 20px;font-family:Georgia,'Times New Roman',serif;font-size:13px;line-height:1.7;color:#888888;font-style:italic;">
        Submitted from the brief: ${esc(data.from_brief_title)}
      </p>`
    : ''

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#f5f3ee;font-family:Georgia,'Times New Roman',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f5f3ee;padding:48px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:560px;background:#ffffff;border:1px solid #e5e1d8;">

          <!-- Brand header -->
          <tr>
            <td style="padding:28px 40px;border-bottom:1px solid #e5e1d8;">
              <span style="font-family:Georgia,serif;font-size:16px;font-weight:bold;color:#1a1a1a;letter-spacing:-0.01em;">
                Tell <em style="font-style:italic;color:#b45309;">The</em> World
              </span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 36px;">

              <p style="margin:0 0 10px;font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.25em;text-transform:uppercase;color:#888888;">
                New brief proposal
              </p>

              <p style="margin:0 0 24px;font-family:Georgia,'Times New Roman',serif;font-size:18px;line-height:1.5;color:#1a1a1a;font-weight:bold;">
                ${esc(data.topic_title)}
              </p>

              ${contextNote}

              <!-- Why it matters -->
              <p style="margin:0 0 8px;font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#888888;">
                Why it matters / what it should cover
              </p>
              <p style="margin:0 0 28px;font-family:Georgia,'Times New Roman',serif;font-size:14px;line-height:1.8;color:#1a1a1a;white-space:pre-wrap;">
                ${esc(data.why_it_matters)}
              </p>

              <!-- Submitter -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f5f3ee;border:1px solid #e5e1d8;padding:16px 20px;margin-bottom:8px;">
                <tr>
                  <td>
                    <p style="margin:0 0 4px;font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#888888;">Submitted by</p>
                    <p style="margin:0;font-family:Georgia,serif;font-size:14px;color:#1a1a1a;">
                      ${esc(data.submitter_name)} &lt;<a href="mailto:${esc(data.submitter_email)}" style="color:#b45309;">${esc(data.submitter_email)}</a>&gt;
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  return sendEmail({
    to: adminEmail,
    subject: `Brief proposal: ${data.topic_title}`,
    html,
  })
}
