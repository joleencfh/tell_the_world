'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { getAdminClient } from '@/lib/supabase/admin'
import { sendApprovalEmail } from '@/lib/email/send-approval'
import { sendRejectionEmail } from '@/lib/email/send-rejection'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Application {
  id: string
  full_name: string
  first_name: string | null
  last_name: string | null
  email: string
  desired_role: 'creator' | 'expert' | 'organisation' | 'journalist' | 'other'
  desired_role_other: string | null
  bio: string
  website_url: string | null
  status: 'pending' | 'approved' | 'rejected'
  admin_notes: string | null
  reviewed_at: string | null
  created_at: string
  // Role-specific
  primary_platform: string | null
  platform_url: string | null
  audience_size: number | null
  content_language: string | null
  publication_name: string | null
  publication_url: string | null
  reporting_beat: string | null
  affiliation: string | null
  job_title: string | null
  credibility_url: string | null
  org_name: string | null
  org_size: string | null
  org_mission: string | null
  // Extended fields
  sample_work_url: string | null
  referral_source: string | null
  additional_info: string | null
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getSiteUrl(): Promise<string> {
  const headersList = await headers()
  const host = headersList.get('host')
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https'
  return `${protocol}://${host}`
}

const PLATFORM_ENUM = new Set(['youtube', 'podcast', 'instagram', 'tiktok', 'other'])
const ORG_SIZE_ENUM = new Set(['small', 'medium', 'large'])

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

export async function getPendingApplications(): Promise<{ data: Application[]; error: string | null }> {
  const { data, error } = await getAdminClient()
    .from('applications')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  return { data: (data as Application[]) ?? [], error: error?.message ?? null }
}

export async function getRecentlyApproved(): Promise<{ data: Partial<Application>[]; error: string | null }> {
  const { data, error } = await getAdminClient()
    .from('applications')
    .select('id, full_name, first_name, last_name, email, desired_role, desired_role_other, reviewed_at, created_at')
    .eq('status', 'approved')
    .order('reviewed_at', { ascending: false })
    .limit(30)

  return { data: (data as Partial<Application>[]) ?? [], error: error?.message ?? null }
}

// ---------------------------------------------------------------------------
// Approve
// ---------------------------------------------------------------------------

export async function approveApplication(applicationId: string): Promise<{ success?: boolean; error?: string }> {
  // 1. Fetch the full application
  const { data: app, error: fetchError } = await getAdminClient()
    .from('applications')
    .select('*')
    .eq('id', applicationId)
    .single()

  if (fetchError || !app) return { error: 'Application not found.' }
  if (app.status !== 'pending') return { error: 'This application is no longer pending.' }
  if (app.desired_role === 'other') {
    return { error: 'Cannot approve an "other" role application from the admin screen. Assign a specific role manually in Supabase first, then approve.' }
  }

  // 2. Create auth user (email already confirmed — we handle the email ourselves)
  const { data: authData, error: authError } = await getAdminClient().auth.admin.createUser({
    email: app.email,
    email_confirm: true,
  })

  if (authError) {
    return { error: `Failed to create account: ${authError.message}` }
  }

  const userId = authData.user.id

  // 3. Map platform/size values to their enum equivalents
  const primaryPlatform = app.primary_platform
    ? (PLATFORM_ENUM.has(app.primary_platform) ? app.primary_platform : 'other')
    : null

  const orgSize = app.org_size && ORG_SIZE_ENUM.has(app.org_size) ? app.org_size : null

  const displayName = app.full_name || [app.first_name, app.last_name].filter(Boolean).join(' ') || app.email

  // 4. Insert into users table — the service role bypasses RLS
  const { error: userError } = await getAdminClient().from('users').insert({
    id: userId,
    email: app.email,
    full_name: displayName,
    display_name: displayName,
    bio: app.bio,
    role: app.desired_role,
    website_url: app.website_url || null,
    primary_platform: primaryPlatform,
    platform_url: app.platform_url || null,
    audience_size: app.audience_size || null,
    content_language: app.content_language || null,
    publication_name: app.publication_name || null,
    publication_url: app.publication_url || null,
    reporting_beat: app.reporting_beat || null,
    affiliation: app.affiliation || null,
    job_title: app.job_title || null,
    credibility_url: app.credibility_url || null,
    org_name: app.org_name || null,
    org_size: orgSize,
    org_mission: app.org_mission || null,
  })

  if (userError) {
    // Roll back: remove the auth user we just created
    await getAdminClient().auth.admin.deleteUser(userId)
    return { error: `Failed to create user profile: ${userError.message}` }
  }

  // 5. Mark the application approved
  await getAdminClient()
    .from('applications')
    .update({ status: 'approved', reviewed_at: new Date().toISOString() })
    .eq('id', applicationId)

  // 6. Generate a magic link that logs the user in and lands them on their profile
  const siteUrl = await getSiteUrl()
  const { data: linkData, error: linkError } = await getAdminClient().auth.admin.generateLink({
    type: 'magiclink',
    email: app.email,
    options: {
      redirectTo: `${siteUrl}/profile/${userId}`,
    },
  })

  if (linkError) {
    console.error('Magic link generation failed:', linkError.message)
  }

  const magicLink = linkData?.properties?.action_link ?? null

  // 7. Send approval email
  await sendApprovalEmail({
    first_name: app.first_name ?? app.full_name,
    email: app.email,
    magic_link: magicLink,
    profile_url: `${siteUrl}/profile/${userId}`,
  })

  revalidatePath('/admin')
  return { success: true }
}

// ---------------------------------------------------------------------------
// Reject
// ---------------------------------------------------------------------------

export async function rejectApplication(applicationId: string): Promise<{ success?: boolean; error?: string }> {
  // 1. Fetch just what we need for the email
  const { data: app, error: fetchError } = await getAdminClient()
    .from('applications')
    .select('first_name, full_name, email, status')
    .eq('id', applicationId)
    .single()

  if (fetchError || !app) return { error: 'Application not found.' }
  if (app.status !== 'pending') return { error: 'This application is no longer pending.' }

  // 2. Update status
  const { error } = await getAdminClient()
    .from('applications')
    .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
    .eq('id', applicationId)

  if (error) return { error: error.message }

  // 3. Send rejection email
  await sendRejectionEmail({
    first_name: app.first_name ?? app.full_name,
    email: app.email,
  })

  revalidatePath('/admin')
  return { success: true }
}
