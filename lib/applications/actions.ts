'use server'

import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { sendApplicationConfirmation } from '@/lib/email/send-application-confirmation'

// ---------------------------------------------------------------------------
// Input type — mirrors the FormValues shape in app/apply/page.tsx.
// All values arrive as strings; the action re-validates everything because
// server actions are publicly reachable endpoints and the client-side
// validation in the form is UX only.
// ---------------------------------------------------------------------------

export interface ApplicationInput {
  first_name: string
  last_name: string
  email: string
  desired_role: string
  bio: string
  website_url: string
  primary_platform: string
  platform_url: string
  audience_size: string
  content_language: string
  publication_name: string
  publication_url: string
  reporting_beat: string
  affiliation: string
  job_title: string
  credibility_url: string
  org_name: string
  org_size: string
  sample_work_url: string
  referral_source: string
  referral_source_other: string
  additional_info: string
  desired_role_other: string
  primary_platform_other: string
  honeypot: string
}

export interface SubmitResult {
  success?: boolean
  error?: string
  // The application row was saved but the confirmation email failed
  emailFailed?: boolean
}

// ---------------------------------------------------------------------------
// Rate limiting — in-memory sliding window keyed by client IP.
//
// Best effort: state is per server instance, so it resets on redeploy and is
// not shared across serverless instances. Good enough to stop naive scripted
// abuse; move to a shared store (e.g. Upstash Ratelimit) or a platform
// firewall rule when traffic justifies it.
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

const ROLES = new Set(['creator', 'expert', 'organisation', 'journalist', 'other'])

// Generous ceilings — these exist to stop abuse, not to constrain real users.
// The form enforces its own, tighter UX-level rules.
const MAX_SHORT = 300
const MAX_LONG = 5000

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function isValidUrl(value: string): boolean {
  if (!value.trim()) return true
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function validate(f: ApplicationInput): string | null {
  if (!f.first_name.trim() || !f.last_name.trim()) return 'Name is required.'
  if (!f.email.trim() || !isValidEmail(f.email.trim())) return 'A valid email address is required.'
  if (!ROLES.has(f.desired_role)) return 'Please select a role.'
  if (!f.bio.trim()) return 'Bio is required.'
  if (f.desired_role === 'other' && !f.desired_role_other.trim())
    return 'Please describe your role.'

  if (f.desired_role === 'creator') {
    if (!f.primary_platform) return 'Primary platform is required.'
    if (!f.platform_url.trim() || !isValidUrl(f.platform_url))
      return 'A valid channel / profile URL is required.'
  }
  if (f.desired_role === 'journalist' && !f.publication_name.trim())
    return 'Publication name is required.'
  if (f.desired_role === 'expert') {
    if (!f.affiliation.trim()) return 'Affiliation is required.'
    if (!f.job_title.trim()) return 'Job title is required.'
  }
  if (f.desired_role === 'organisation' && !f.org_name.trim())
    return 'Organisation name is required.'

  for (const url of [f.website_url, f.publication_url, f.credibility_url, f.sample_work_url]) {
    if (!isValidUrl(url)) return 'Please enter valid URLs (e.g. https://example.com).'
  }

  const shortFields = [
    f.first_name, f.last_name, f.email, f.desired_role_other, f.primary_platform_other,
    f.publication_name, f.reporting_beat, f.affiliation, f.job_title, f.org_name,
    f.content_language, f.referral_source, f.referral_source_other,
  ]
  if (shortFields.some((v) => v.length > MAX_SHORT)) return 'One of the fields is too long.'
  if (f.bio.length > MAX_LONG || f.additional_info.length > MAX_LONG)
    return 'Bio or additional info is too long.'

  return null
}

// ---------------------------------------------------------------------------
// Submit
// ---------------------------------------------------------------------------

export async function submitApplication(form: ApplicationInput): Promise<SubmitResult> {
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

  const email = form.email.trim().toLowerCase()

  // One pending application per email — also stops repeat-submit spam
  const { data: existing } = await getAdminClient()
    .from('applications')
    .select('id')
    .eq('email', email)
    .eq('status', 'pending')
    .limit(1)

  if (existing && existing.length > 0) {
    return { error: 'An application for this email address is already under review.' }
  }

  const role = form.desired_role

  const payload: Record<string, unknown> = {
    first_name: form.first_name.trim(),
    last_name: form.last_name.trim(),
    // Keep full_name populated for admin convenience / existing queries
    full_name: `${form.first_name.trim()} ${form.last_name.trim()}`,
    email,
    desired_role: form.desired_role,
    bio: form.bio.trim(),
    status: 'pending',
  }

  if (form.website_url.trim()) payload.website_url = form.website_url.trim()

  // "Other" role: store the description in its own column
  if (form.desired_role_other.trim())
    payload.desired_role_other = form.desired_role_other.trim()

  // referral_source: if "other" was chosen, store the typed value instead
  if (form.referral_source) {
    payload.referral_source =
      form.referral_source === 'other' && form.referral_source_other.trim()
        ? form.referral_source_other.trim()
        : form.referral_source
  }

  if (form.additional_info.trim()) payload.additional_info = form.additional_info.trim()
  if (form.sample_work_url.trim()) payload.sample_work_url = form.sample_work_url.trim()

  if (role === 'creator') {
    // If "other" platform was chosen, store the typed value instead
    if (form.primary_platform) {
      payload.primary_platform =
        form.primary_platform === 'other' && form.primary_platform_other.trim()
          ? form.primary_platform_other.trim()
          : form.primary_platform
    }
    if (form.platform_url.trim()) payload.platform_url = form.platform_url.trim()
    if (form.audience_size.trim()) {
      const n = parseInt(form.audience_size, 10)
      if (!isNaN(n)) payload.audience_size = n
    }
    if (form.content_language.trim()) payload.content_language = form.content_language.trim()
  }

  if (role === 'journalist') {
    if (form.publication_name.trim()) payload.publication_name = form.publication_name.trim()
    if (form.publication_url.trim()) payload.publication_url = form.publication_url.trim()
    if (form.reporting_beat.trim()) payload.reporting_beat = form.reporting_beat.trim()
    if (form.content_language.trim()) payload.content_language = form.content_language.trim()
  }

  if (role === 'expert') {
    if (form.affiliation.trim()) payload.affiliation = form.affiliation.trim()
    if (form.job_title.trim()) payload.job_title = form.job_title.trim()
    if (form.credibility_url.trim()) payload.credibility_url = form.credibility_url.trim()
  }

  if (role === 'organisation') {
    if (form.org_name.trim()) payload.org_name = form.org_name.trim()
    if (form.org_size) payload.org_size = form.org_size
    // Bio doubles as mission for orgs — mirror it into org_mission for admin queries
    payload.org_mission = form.bio.trim()
  }

  // Insert through the RLS client — the anon insert policy (003) only allows
  // status 'pending', so this path cannot create pre-approved rows.
  const supabase = await createClient()
  const { error: insertError } = await supabase.from('applications').insert(payload)

  if (insertError) return { error: insertError.message }

  try {
    await sendApplicationConfirmation({
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      email,
      desired_role: form.desired_role,
      desired_role_other: form.desired_role_other.trim() || undefined,
      bio: form.bio.trim(),
      website_url: form.website_url.trim() || undefined,
      primary_platform: form.primary_platform || undefined,
      primary_platform_other: form.primary_platform_other.trim() || undefined,
      platform_url: form.platform_url.trim() || undefined,
      audience_size: form.audience_size.trim() || undefined,
      content_language: form.content_language.trim() || undefined,
      publication_name: form.publication_name.trim() || undefined,
      publication_url: form.publication_url.trim() || undefined,
      reporting_beat: form.reporting_beat.trim() || undefined,
      affiliation: form.affiliation.trim() || undefined,
      job_title: form.job_title.trim() || undefined,
      credibility_url: form.credibility_url.trim() || undefined,
      org_name: form.org_name.trim() || undefined,
      org_size: form.org_size || undefined,
      sample_work_url: form.sample_work_url.trim() || undefined,
      referral_source: form.referral_source || undefined,
      referral_source_other: form.referral_source_other.trim() || undefined,
      additional_info: form.additional_info.trim() || undefined,
    })
  } catch (err) {
    console.error('Confirmation email failed:', err)
    return { success: true, emailFailed: true }
  }

  return { success: true }
}
