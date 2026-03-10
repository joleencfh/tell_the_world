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

export async function signInWithMagicLink(email: string) {
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
    return { error: error.message }
  }

  return { success: true }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
}
