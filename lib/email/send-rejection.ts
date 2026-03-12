'use server'

import { sendEmail } from './send'

export interface RejectionEmailData {
  first_name: string
  email: string
}

function esc(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export async function sendRejectionEmail(data: RejectionEmailData) {
  const firstName = esc(data.first_name)

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
                Your application
              </p>

              <p style="margin:0 0 24px;font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.8;color:#1a1a1a;">
                Hi ${firstName},
              </p>

              <p style="margin:0 0 20px;font-family:Georgia,'Times New Roman',serif;font-size:14px;line-height:1.8;color:#555555;">
                Thank you for applying to Tell The World. We have reviewed your application carefully
                and are not able to offer you a place at this time.
              </p>

              <p style="margin:0 0 20px;font-family:Georgia,'Times New Roman',serif;font-size:14px;line-height:1.8;color:#555555;">
                Our decisions reflect where we are in building the platform and the specific mix of
                members we are looking for right now. This is not a judgement of your work or credentials.
              </p>

              <p style="margin:0 0 20px;font-family:Georgia,'Times New Roman',serif;font-size:14px;line-height:1.8;color:#555555;">
                If you believe this decision was made in error, or if your situation has changed in a
                way that may be relevant, feel free to reply to this email.
              </p>

              <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:14px;line-height:1.8;color:#555555;">
                Thank you again for your interest in the platform.
              </p>

              <p style="margin:24px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:13px;line-height:1.7;color:#aaaaaa;border-top:1px solid #e5e1d8;padding-top:24px;">
                The Tell The World team
              </p>

            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  return sendEmail({
    to: data.email,
    subject: 'Your Tell The World application',
    html,
  })
}
