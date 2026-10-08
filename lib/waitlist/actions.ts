'use server'

import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { sendWaitlistConfirmation } from '@/lib/email/send-waitlist-confirmation'
import { sendWaitlistNotificationEmail } from '@/lib/email/send-waitlist-notification'
import type { TablesInsert, UserRole } from '@/lib/types'

// ---------------------------------------------------------------------------
// docs/design/landing-page/plans/temp-landing-page-plan.md §2, Part 2 — the
// silent-launch landing page's "Join Waitlist" form. Mirrors
// lib/applications/actions.ts's honeypot + rate-limit + validation shape,
// including the confirmation-email pattern: send after a successful
// insert, but a failed send doesn't fail the submission — the person is
// already on the list, and a bounced/undeliverable confirmation email
// shouldn't show them an error over something they already got right.
// ---------------------------------------------------------------------------

export interface WaitlistInput {
  role: string
  full_name: string
  email: string
  affiliation: string
  linkedin_or_website_url: string
  additional_info: string
  wants_early_access: boolean
  honeypot: string
}

export interface SubmitWaitlistResult {
  success?: boolean
  emailFailed?: boolean
  error?: string
}

// ---------------------------------------------------------------------------
// Rate limiting — same in-memory per-IP sliding window as
// lib/applications/actions.ts. See that file's comment for the caveats
// (resets per server instance, not shared across serverless instances).
// ---------------------------------------------------------------------------

const WINDOW_MS = 10 * 60 * 1000
const MAX_PER_WINDOW = 3
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

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

// Reuses the existing user_role enum — see plan §0 for why, and
// 056_user_role_comms_specialist_and_other.sql for the two roles added
// specifically so this set (and the modal's ROLE_OPTIONS) could offer them.
const ROLES: ReadonlySet<UserRole> = new Set([
  'creator',
  'expert',
  'organisation',
  'journalist',
  'comms_specialist',
  'other',
])

const MAX_SHORT = 300
const MAX_LONG = 2000

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

// The modal's placeholders show a bare domain ("youtube.com/@…",
// "linkedin.com/in/…") with no scheme, so real users copy that shape
// verbatim. new URL() rejects a scheme-less string outright, which used
// to reject that exact input — normalize it to https:// first.
function normalizeUrl(value: string): string {
  const trimmed = value.trim()
  if (!trimmed || trimmed.includes('://')) return trimmed
  return `https://${trimmed}`
}

function isValidUrl(value: string): boolean {
  if (!value.trim()) return true
  try {
    const url = new URL(normalizeUrl(value))
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function validate(f: WaitlistInput): string | null {
  if (!ROLES.has(f.role as UserRole)) return 'Please select who you are.'
  if (!f.full_name.trim()) return 'Name is required.'
  if (!f.email.trim() || !isValidEmail(f.email.trim())) return 'A valid email address is required.'
  if (!isValidUrl(f.linkedin_or_website_url)) {
    return f.role === 'creator'
      ? 'Please enter a valid channel link (e.g. https://youtube.com/@yourchannel).'
      : 'Please enter a valid LinkedIn or website URL (e.g. https://example.com).'
  }

  // Content creators must name their platform/channel and link it —
  // mirrors the modal's isCreator-gated required fields.
  if (f.role === 'creator') {
    if (!f.affiliation.trim()) return 'Please tell us your platform and channel name.'
    if (!f.linkedin_or_website_url.trim()) return 'Please add a link to your channel.'
  }

  const shortFields = [f.full_name, f.email, f.affiliation, f.linkedin_or_website_url]
  if (shortFields.some((v) => v.length > MAX_SHORT)) return 'One of the fields is too long.'
  if (f.additional_info.length > MAX_LONG) return 'That note is too long.'

  return null
}

// ---------------------------------------------------------------------------
// Submit
// ---------------------------------------------------------------------------

export async function submitWaitlistSignup(form: WaitlistInput): Promise<SubmitWaitlistResult> {
  // Honeypot — bots fill hidden fields, humans don't see them.
  // Pretend it worked so the bot moves on.
  if (form.honeypot) return { success: true }

  const headersList = await headers()
  const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (isRateLimited(ip)) {
    return { error: 'Too many submissions. Please wait a few minutes and try again.' }
  }

  const validationError = validate(form)
  if (validationError) return { error: validationError }

  const payload: TablesInsert<'waitlist_signups'> = {
    role: form.role as UserRole,
    full_name: form.full_name.trim(),
    email: form.email.trim().toLowerCase(),
    wants_early_access: form.wants_early_access,
  }
  if (form.affiliation.trim()) payload.affiliation = form.affiliation.trim()
  if (form.linkedin_or_website_url.trim())
    payload.linkedin_or_website_url = normalizeUrl(form.linkedin_or_website_url)
  if (form.additional_info.trim()) payload.additional_info = form.additional_info.trim()

  // Insert through the RLS client — the anon insert policy (039) is what
  // makes this safe for logged-out visitors.
  const supabase = await createClient()
  const { error } = await supabase.from('waitlist_signups').insert(payload)

  if (error) {
    // Unique index on lower(email) (039) — turn the raw constraint
    // violation into a friendly message instead of leaking the DB error.
    if (error.code === '23505') {
      return { error: "You're already on the waitlist." }
    }
    return { error: error.message }
  }

  // Notify the admin — fire and forget (the waitlist table is the source
  // of truth; a failed notification shouldn't fail the submission).
  sendWaitlistNotificationEmail({
    full_name: payload.full_name,
    email: payload.email,
    role: payload.role,
    affiliation: payload.affiliation ?? undefined,
    linkedin_or_website_url: payload.linkedin_or_website_url ?? undefined,
    wants_early_access: form.wants_early_access,
    additional_info: payload.additional_info ?? undefined,
  }).catch((err) => console.error('Waitlist notification email failed:', err))

  try {
    await sendWaitlistConfirmation({
      full_name: payload.full_name,
      email: payload.email,
      wants_early_access: form.wants_early_access,
    })
  } catch (err) {
    console.error('Waitlist confirmation email failed:', err)
    return { success: true, emailFailed: true }
  }

  return { success: true }
}
