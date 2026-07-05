import 'server-only'

import { resend, EMAIL_FROM } from './resend'

interface SendEmailOptions {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  const { data, error } = await resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject,
    html,
  })

  if (error) {
    console.error('Failed to send email:', error)
    return { error: error.message }
  }

  return { id: data?.id }
}
