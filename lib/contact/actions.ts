'use server'

import { headers } from 'next/headers'
import { sendContactFormEmail } from '@/lib/email/send-contact-form'

// ---------------------------------------------------------------------------
// Public contact form — no account required, used for privacy/GDPR requests
// and general enquiries (app/contact). No DB table: this just relays to the
// admin inbox by email (see lib/email/send-contact-form.ts), same as the
// application/brief-proposal notification emails elsewhere in lib/email/.
// ---------------------------------------------------------------------------

export interface ContactInput {
  name: string
  email: string
  topic: string
  message: string
  honeypot: string
}

export interface ContactResult {
  success?: boolean
  error?: string
}

const TOPICS = new Set(['privacy', 'general', 'press', 'partnership', 'other'])

const TOPIC_LABELS: Record<string, string> = {
  privacy: 'Privacy / data request',
  general: 'General enquiry',
  press: 'Press',
  partnership: 'Partnership',
  other: 'Other',
}

// Same in-memory sliding-window limiter as lib/applications/actions.ts —
// see that file's comment for the tradeoffs.
const WINDOW_MS = 10 * 60 * 1000
const MAX_PER_WINDOW = 5
const recentSubmissions = new Map<string, number[]>()

function isRateLimited(key: string): boolean {
  const now = Date.now()
  const recent = (recentSubmissions.get(key) ?? []).filter((t) => now - t < WINDOW_MS)
  if (recent.length >= MAX_PER_WINDOW) {
    recentSubmissions.set(key, recent)
    return true
  }
  recent.push(now)
  recentSubmissions.set(key, recent)
  return false
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

const MAX_SHORT = 200
const MAX_MESSAGE = 5000

export async function submitContactForm(form: ContactInput): Promise<ContactResult> {
  // Honeypot — bots fill hidden fields, humans don't see them. Pretend it worked.
  if (form.honeypot) return { success: true }

  const headersList = await headers()
  const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (isRateLimited(ip)) {
    return { error: 'Too many submissions. Please wait a few minutes and try again.' }
  }

  const name = form.name.trim()
  const email = form.email.trim().toLowerCase()
  const message = form.message.trim()

  if (!name) return { error: 'Name is required.' }
  if (name.length > MAX_SHORT) return { error: 'Name is too long.' }
  if (!email || !isValidEmail(email)) return { error: 'A valid email address is required.' }
  if (!TOPICS.has(form.topic)) return { error: 'Please select a topic.' }
  if (!message) return { error: 'Message is required.' }
  if (message.length > MAX_MESSAGE) return { error: 'Message is too long.' }

  const result = await sendContactFormEmail({
    name,
    email,
    topic: TOPIC_LABELS[form.topic],
    message,
  })

  if (result.error) {
    return { error: 'Something went wrong sending your message. Please try again.' }
  }

  return { success: true }
}
