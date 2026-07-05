import 'server-only'

import { sendEmail } from './send'

export interface ContactNotificationData {
  recipient_name: string
  recipient_email: string
  sender_name: string
  sender_role: string
  subject: string
  message: string
}

function esc(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
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
                New contact request
              </p>

              <p style="margin:0 0 20px;font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.8;color:#1a1a1a;">
                Hi ${esc(data.recipient_name)},
              </p>

              <p style="margin:0 0 20px;font-family:Georgia,'Times New Roman',serif;font-size:14px;line-height:1.8;color:#555555;">
                You have received a contact request on Tell The World from
                <strong>${esc(data.sender_name)}</strong> (${esc(roleLabel(data.sender_role))}).
              </p>

              <!-- Message card -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f5f3ee;border:1px solid #e5e1d8;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 4px;font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#888888;">Subject</p>
                    <p style="margin:0 0 16px;font-family:Georgia,serif;font-size:15px;font-weight:bold;color:#1a1a1a;">${esc(data.subject)}</p>
                    <p style="margin:0 0 4px;font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#888888;">Message</p>
                    <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:14px;line-height:1.8;color:#1a1a1a;white-space:pre-wrap;">${esc(data.message)}</p>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 20px;font-family:Georgia,'Times New Roman',serif;font-size:14px;line-height:1.8;color:#555555;">
                Log in to Tell The World to view this person's full profile and decide whether to respond.
              </p>

              <p style="margin:24px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:13px;line-height:1.7;color:#aaaaaa;border-top:1px solid #e5e1d8;padding-top:24px;">
                You received this because someone sent you a contact request on Tell The World.
                If you did not expect this, you can ignore it.
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
    to: data.recipient_email,
    subject: `Message from ${data.sender_name} on Tell The World: ${data.subject}`,
    html,
  })
}
