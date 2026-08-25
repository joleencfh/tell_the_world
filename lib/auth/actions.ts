'use server'

import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

async function getOrigin() {
  const headersList = await headers()
  const host = headersList.get('host')
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https'
  return `${protocol}://${host}`
}

export async function signInWithGoogle() {
  const supabase = await createClient()
  const origin = await getOrigin()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  })

  if (error || !data.url) {
    return { error: error?.message ?? 'Failed to initiate Google sign in' }
  }

  return { url: data.url }
}

export async function signInWithLinkedIn() {
  const supabase = await createClient()
  const origin = await getOrigin()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'linkedin_oidc',
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  })

  if (error || !data.url) {
    return { error: error?.message ?? 'Failed to initiate LinkedIn sign in' }
  }

  return { url: data.url }
}

// Bot protection — same in-memory per-IP sliding window as
// lib/applications/actions.ts / lib/waitlist/actions.ts (see those files'
// comments for the caveats: resets per server instance, not shared across
// serverless instances). Magic link is the only sign-in path that sends an
// email and lets someone probe which addresses are approved members, so
// it's the one that needs this — OAuth just redirects to Google/LinkedIn's
// own login, which has its own bot protection.
const WINDOW_MS = 10 * 60 * 1000
const MAX_PER_WINDOW = 5
const recentMagicLinkRequests = new Map<string, number[]>()

function isRateLimited(key: string): boolean {
  const now = Date.now()
  const recent = (recentMagicLinkRequests.get(key) ?? []).filter((t) => now - t < WINDOW_MS)
  if (recent.length >= MAX_PER_WINDOW) {
    recentMagicLinkRequests.set(key, recent)
    return true
  }
  recent.push(now)
  recentMagicLinkRequests.set(key, recent)
  return false
}

export async function signInWithMagicLink(email: string, honeypot?: string) {
  // Honeypot — bots fill hidden fields, humans don't see them. Pretend it
  // worked so the bot moves on, same pattern as the waitlist/application forms.
  if (honeypot) return { success: true }

  const headersList = await headers()
  const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (isRateLimited(ip)) {
    return { error: 'Too many attempts. Please wait a few minutes and try again.' }
  }

  const supabase = await createClient()
  const origin = await getOrigin()

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      shouldCreateUser: false, // Only existing approved users can sign in
    },
  })

  if (error) {
    // shouldCreateUser: false makes Supabase reject an email with no
    // existing Auth identity with this specific code, rather than silently
    // no-oping — surface it as the same "not approved" signal the OAuth
    // callback uses, instead of leaking Supabase's internal error text.
    if (error.code === 'otp_disabled') {
      return { notApproved: true }
    }
    return { error: error.message }
  }

  return { success: true }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
}
