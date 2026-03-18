'use server'

import { createClient } from '@/lib/supabase/server'
import { sendContactNotification } from '@/lib/email/send-contact-notification'

export interface SendMessagePayload {
  recipient_id: string
  subject: string
  body: string
}

export async function sendMessage(
  payload: SendMessagePayload,
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  if (!payload.subject.trim()) return { error: 'Subject is required' }
  if (!payload.body.trim()) return { error: 'Message is required' }

  if (user.id === payload.recipient_id) return { error: 'You cannot message yourself' }

  // Fetch sender and recipient in parallel
  const [senderResult, recipientResult] = await Promise.all([
    supabase
      .from('users')
      .select('id, display_name, email, role')
      .eq('id', user.id)
      .single(),
    supabase
      .from('users')
      .select('id, display_name, email')
      .eq('id', payload.recipient_id)
      .single(),
  ])

  if (!senderResult.data) return { error: 'Failed to load your profile' }
  if (!recipientResult.data) return { error: 'Recipient not found' }

  const sender = senderResult.data
  const recipient = recipientResult.data

  // Insert message
  const { error: insertError } = await supabase.from('messages').insert({
    sender_id: user.id,
    recipient_id: payload.recipient_id,
    subject: payload.subject.trim(),
    body: payload.body.trim(),
    status: 'pending',
    sender_role: sender.role,
  })

  if (insertError) return { error: 'Failed to send message. Please try again.' }

  // Send email notification — fire and forget (don't block on email failure)
  sendContactNotification({
    recipient_name: recipient.display_name || recipient.email.split('@')[0],
    recipient_email: recipient.email,
    sender_name: sender.display_name || sender.email.split('@')[0],
    sender_role: sender.role,
    subject: payload.subject.trim(),
    message: payload.body.trim(),
  }).catch((err) => console.error('Contact notification email failed:', err))

  return { success: true }
}
