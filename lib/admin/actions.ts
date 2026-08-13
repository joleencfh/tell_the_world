'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { requireAdmin } from '@/lib/auth/require'
import { getAdminClient } from '@/lib/supabase/admin'
import { sendApprovalEmail } from '@/lib/email/send-approval'
import { sendRejectionEmail } from '@/lib/email/send-rejection'
import * as adminData from '@/lib/data/admin'
import type { PagedResult } from '@/lib/data/admin'
import type { TablesInsert, UserRole, PrimaryPlatform, OrgSize } from '@/lib/types'

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

export async function getPendingApplications(page = 1): Promise<PagedResult<Application>> {
  await requireAdmin()
  return adminData.getPendingApplications(getAdminClient(), page)
}

export async function getRecentlyApproved(page = 1): Promise<PagedResult<Partial<Application>>> {
  await requireAdmin()
  return adminData.getRecentlyApproved(getAdminClient(), page)
}

// ---------------------------------------------------------------------------
// Approve
// ---------------------------------------------------------------------------

export async function approveApplication(applicationId: string): Promise<{ success?: boolean; error?: string }> {
  await requireAdmin()

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

  // 4. Insert into users table — the service role bypasses RLS.
  // Cast: role/platform/size are validated above (the 'other' role is rejected
  // earlier, platform and size are mapped to their enums), but arrive typed as
  // the wider application column types.
  const newUser: TablesInsert<'users'> = {
    id: userId,
    email: app.email,
    full_name: displayName,
    display_name: displayName,
    bio: app.bio,
    role: app.desired_role as UserRole,
    website_url: app.website_url || null,
    primary_platform: primaryPlatform as PrimaryPlatform | null,
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
    org_size: orgSize as OrgSize | null,
    org_mission: app.org_mission || null,
  }
  const { error: userError } = await getAdminClient().from('users').insert(newUser)

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
// Questions moderation
// ---------------------------------------------------------------------------

export interface PendingQuestion {
  id: string
  question_text: string
  created_at: string
  brief_id: string
  briefs: { title: string; slug: string }
  users: { display_name: string | null; email: string }
}

export async function getPendingQuestions(page = 1): Promise<PagedResult<PendingQuestion>> {
  await requireAdmin()
  return adminData.getPendingQuestions(getAdminClient(), page)
}

export async function approveQuestion(questionId: string): Promise<{ success?: boolean; error?: string }> {
  await requireAdmin()

  const { error } = await getAdminClient()
    .from('questions')
    .update({ status: 'approved' })
    .eq('id', questionId)

  if (error) return { error: error.message }

  revalidatePath('/admin')
  return { success: true }
}

export async function dismissQuestion(questionId: string): Promise<{ success?: boolean; error?: string }> {
  await requireAdmin()

  const { error } = await getAdminClient()
    .from('questions')
    .delete()
    .eq('id', questionId)

  if (error) return { error: error.message }

  revalidatePath('/admin')
  return { success: true }
}

// ---------------------------------------------------------------------------
// Brief correction proposals moderation
// ---------------------------------------------------------------------------

export interface PendingCorrectionProposal {
  id: string
  contribution_text: string
  status: 'pending' | 'approved' | 'dismissed'
  created_at: string
  brief_id: string
  briefs: { title: string; slug: string }
  users: { id: string; display_name: string | null; email: string; role: string }
}

export async function getPendingCorrectionProposals(page = 1): Promise<PagedResult<PendingCorrectionProposal>> {
  await requireAdmin()
  return adminData.getPendingCorrectionProposals(getAdminClient(), page)
}

export async function approveCorrectionProposal(proposalId: string): Promise<{ success?: boolean; error?: string }> {
  await requireAdmin()

  const { error } = await getAdminClient()
    .from('brief_correction_proposals')
    .update({ status: 'approved' })
    .eq('id', proposalId)

  if (error) return { error: error.message }

  revalidatePath('/admin')
  return { success: true }
}

export async function dismissCorrectionProposal(proposalId: string): Promise<{ success?: boolean; error?: string }> {
  await requireAdmin()

  const { error } = await getAdminClient()
    .from('brief_correction_proposals')
    .update({ status: 'dismissed' })
    .eq('id', proposalId)

  if (error) return { error: error.message }

  revalidatePath('/admin')
  return { success: true }
}

// ---------------------------------------------------------------------------
// FAQ answers moderation (two-ink-bold-plan.md Part 4b) — free-text
// answers, so pending → published via admin approval, unlike the binary
// review/endorsement trust signal in lib/briefs/actions.ts's
// setReviewStatus (published immediately, no moderation).
// ---------------------------------------------------------------------------

export interface PendingFaqAnswer {
  id: string
  question: string
  body: string
  created_at: string
  brief_id: string
  briefs: { title: string; slug: string }
  users: { id: string; display_name: string | null; email: string; role: string }
}

export async function getPendingFaqAnswers(page = 1): Promise<PagedResult<PendingFaqAnswer>> {
  await requireAdmin()
  return adminData.getPendingFaqAnswers(getAdminClient(), page)
}

export async function approveFaqAnswer(answerId: string): Promise<{ success?: boolean; error?: string }> {
  await requireAdmin()

  const { error } = await getAdminClient()
    .from('brief_faq_answers')
    .update({ status: 'published' })
    .eq('id', answerId)

  if (error) return { error: error.message }

  revalidatePath('/admin')
  return { success: true }
}

// No 'dismissed' status exists for this table (only pending/published, see
// migration 021) — dismissal just deletes the row, same as questions'
// dismissQuestion above.
export async function dismissFaqAnswer(answerId: string): Promise<{ success?: boolean; error?: string }> {
  await requireAdmin()

  const { error } = await getAdminClient()
    .from('brief_faq_answers')
    .delete()
    .eq('id', answerId)

  if (error) return { error: error.message }

  revalidatePath('/admin')
  return { success: true }
}

// ---------------------------------------------------------------------------
// Calls to action moderation (two-ink-bold-plan.md Part 6) — free-text
// suggestion + a link, so pending → published via admin approval, same
// shape as FAQ answers moderation above.
// ---------------------------------------------------------------------------

export interface PendingCta {
  id: string
  title: string
  description: string | null
  link_url: string
  created_at: string
  brief_id: string
  briefs: { title: string; slug: string }
  users: { id: string; display_name: string | null; email: string; role: string }
}

export async function getPendingCtas(page = 1): Promise<PagedResult<PendingCta>> {
  await requireAdmin()
  return adminData.getPendingCtas(getAdminClient(), page)
}

export async function approveCta(ctaId: string): Promise<{ success?: boolean; error?: string }> {
  await requireAdmin()

  const { error } = await getAdminClient()
    .from('brief_ctas')
    .update({ status: 'published' })
    .eq('id', ctaId)

  if (error) return { error: error.message }

  revalidatePath('/admin')
  return { success: true }
}

// No 'dismissed' status exists for this table (only pending/published, see
// migration 026) — dismissal just deletes the row, same as FAQ answers'
// dismissFaqAnswer above.
export async function dismissCta(ctaId: string): Promise<{ success?: boolean; error?: string }> {
  await requireAdmin()

  const { error } = await getAdminClient()
    .from('brief_ctas')
    .delete()
    .eq('id', ctaId)

  if (error) return { error: error.message }

  revalidatePath('/admin')
  return { success: true }
}

// ---------------------------------------------------------------------------
// Brief proposals
// ---------------------------------------------------------------------------

export interface BriefProposal {
  id: string
  user_id: string | null
  submitter_name: string
  submitter_email: string
  topic_title: string
  why_it_matters: string
  from_brief_title: string | null
  status: 'pending' | 'dismissed'
  created_at: string
}

export async function getBriefProposals(page = 1): Promise<PagedResult<BriefProposal>> {
  await requireAdmin()
  return adminData.getBriefProposals(getAdminClient(), page)
}

export async function dismissBriefProposal(proposalId: string): Promise<{ success?: boolean; error?: string }> {
  await requireAdmin()

  const { error } = await getAdminClient()
    .from('brief_proposals')
    .update({ status: 'dismissed' })
    .eq('id', proposalId)

  if (error) return { error: error.message }

  revalidatePath('/admin')
  return { success: true }
}

// ---------------------------------------------------------------------------
// Reject
// ---------------------------------------------------------------------------

export async function rejectApplication(applicationId: string): Promise<{ success?: boolean; error?: string }> {
  await requireAdmin()

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
