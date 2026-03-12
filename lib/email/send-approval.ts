'use server'

import { sendEmail } from './send'

export interface ApprovalEmailData {
  first_name: string
  email: string
  magic_link: string | null
  profile_url: string
}

function esc(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export async function sendApprovalEmail(data: ApprovalEmailData) {
  const firstName = esc(data.first_name)

  const magicLinkSection = data.magic_link
    ? `
      <!-- Magic link -->
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:32px 0;">
        <tr>
          <td align="center">
            <a href="${esc(data.magic_link)}"
               style="display:inline-block;padding:14px 32px;background:#C8810A;color:#ffffff;font-family:'Courier New',monospace;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;text-decoration:none;">
              Sign in to your account
            </a>
          </td>
        </tr>
      </table>
      <p style="margin:0 0 20px;font-family:Georgia,'Times New Roman',serif;font-size:13px;line-height:1.7;color:#555555;">
        This link signs you in automatically and takes you straight to your profile — no password needed.
        It is for one-time use only and expires after 24 hours. If it expires, you can sign in at any time
        from the login page using the same email address.
      </p>`
    : `
      <p style="margin:24px 0;font-family:Georgia,'Times New Roman',serif;font-size:14px;line-height:1.8;color:#1a1a1a;">
        You can sign in at any time from the login page using this email address.
      </p>`

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
                Application approved
              </p>

              <p style="margin:0 0 24px;font-family:Georgia,'Times New Roman',serif;font-size:18px;line-height:1.5;color:#1a1a1a;font-weight:bold;">
                Welcome to Tell The World, ${firstName}.
              </p>

              <p style="margin:0 0 20px;font-family:Georgia,'Times New Roman',serif;font-size:14px;line-height:1.8;color:#555555;">
                Your application has been reviewed and approved. We are glad to have you on the platform.
              </p>

              <p style="margin:0 0 20px;font-family:Georgia,'Times New Roman',serif;font-size:14px;line-height:1.8;color:#555555;">
                Your account is ready. Use the button below to sign in and access your profile,
                where you can complete your setup and start exploring the platform.
              </p>

              ${magicLinkSection}

              <p style="margin:24px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:13px;line-height:1.7;color:#aaaaaa;border-top:1px solid #e5e1d8;padding-top:24px;">
                If you have any questions, reply to this email and we will get back to you.
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
    subject: 'Welcome to Tell The World — your account is ready',
    html,
  })
}
