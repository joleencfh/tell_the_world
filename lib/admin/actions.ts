'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { randomUUID } from 'crypto'
import { requireAdmin } from '@/lib/auth/require'
import { getAdminClient } from '@/lib/supabase/admin'
import { sendApprovalEmail } from '@/lib/email/send-approval'
import { sendRejectionEmail } from '@/lib/email/send-rejection'
import { sendBriefProposalApprovedEmail } from '@/lib/email/send-brief-proposal-approved'
import { slugify, uniqueSlug } from './slug'
import * as adminData from '@/lib/data/admin'
import type { PagedResult } from '@/lib/data/admin'
import type { TablesInsert, UserRole, PrimaryPlatform, OrgSize } from '@/lib/types'
import type { Json } from '@/lib/database.types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Application {
  id: string
  full_name: string
  first_name: string | null
  last_name: string | null
  email: string
  desired_role: 'creator' | 'expert' | 'organisation' | 'journalist' | 'comms_specialist' | 'other'
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
  // Cast: application_role and user_role share every value (056), so this
  // is a safe direct mapping; platform and size are mapped to their enums
  // above, but arrive typed as the wider application column types.
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
// Community Q&A answers moderation (brief-page-part2-plan.md §2, Part 7) —
// free-text answers, pending → published via admin approval, same shape as
// FAQ answers moderation above. Unlike brief_faq_answers (which keys off a
// parsed question string), these hang off a real question_id — briefs is
// reached through questions rather than a direct column on this table.
// ---------------------------------------------------------------------------

export interface PendingQuestionAnswer {
  id: string
  body: string
  created_at: string
  question_id: string
  questions: { question_text: string; brief_id: string; briefs: { title: string; slug: string } }
  users: { id: string; display_name: string | null; email: string; role: string }
}

export async function getPendingQuestionAnswers(page = 1): Promise<PagedResult<PendingQuestionAnswer>> {
  await requireAdmin()
  return adminData.getPendingQuestionAnswers(getAdminClient(), page)
}

export async function approveQuestionAnswer(answerId: string): Promise<{ success?: boolean; error?: string }> {
  await requireAdmin()

  const { error } = await getAdminClient()
    .from('question_answers')
    .update({ status: 'published' })
    .eq('id', answerId)

  if (error) return { error: error.message }

  revalidatePath('/admin')
  return { success: true }
}

// No 'dismissed' status exists for this table (only pending/published, see
// migration 043) — dismissal just deletes the row, same as FAQ answers'
// dismissFaqAnswer above.
export async function dismissQuestionAnswer(answerId: string): Promise<{ success?: boolean; error?: string }> {
  await requireAdmin()

  const { error } = await getAdminClient()
    .from('question_answers')
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

// Published CTAs + the reorder control (brief-page-part2-plan.md §2, Part
// 8) — display_order is nullable and only overrides the default
// created_at-descending order when explicitly set, see migration 043.
export interface PublishedCta {
  id: string
  title: string
  display_order: number | null
  created_at: string
  brief_id: string
  briefs: { title: string; slug: string }
}

export async function getPublishedCtasAdmin(page = 1): Promise<PagedResult<PublishedCta>> {
  await requireAdmin()
  return adminData.getPublishedCtasAdmin(getAdminClient(), page)
}

export async function setCtaDisplayOrder(ctaId: string, briefSlug: string, displayOrder: number | null): Promise<{ success?: boolean; error?: string }> {
  await requireAdmin()

  const { error } = await getAdminClient()
    .from('brief_ctas')
    .update({ display_order: displayOrder })
    .eq('id', ctaId)

  if (error) return { error: error.message }

  revalidatePath('/admin')
  revalidatePath(`/briefs/${briefSlug}`)
  return { success: true }
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
// Content post moderation (brief-page-part2-plan.md §2, Part 4, widened by
// the deterministic clarity check — lib/clarity/check.ts) — pending →
// published via admin approval, same shape as CTA moderation above. A row
// lands here from either submitQuote (lib/briefs/actions.ts, brief_id set,
// post_type always 'quote') or createPost (lib/posts/actions.ts, brief_id
// null, any post_type) — a row is 'pending' only when the clarity check
// actually flagged it (or, for submitQuote specifically, unconditionally
// for an admin submitter — a pre-existing quirk unrelated to the check).
// flagged_terms records why, so a reviewer doesn't need the check re-run.
// ---------------------------------------------------------------------------

export interface PendingContentPost {
  id: string
  post_type: string
  title: string
  body: string | null
  topic_tags: string[]
  flagged_terms: Json | null
  created_at: string
  brief_id: string | null
  briefs: { title: string; slug: string } | null
  users: { id: string; display_name: string | null; email: string; role: string }
}

export async function getPendingContentPosts(page = 1): Promise<PagedResult<PendingContentPost>> {
  await requireAdmin()
  return adminData.getPendingContentPosts(getAdminClient(), page)
}

export async function approveQuote(quoteId: string): Promise<{ success?: boolean; error?: string }> {
  await requireAdmin()

  const { error } = await getAdminClient()
    .from('content_posts')
    .update({ status: 'published' })
    .eq('id', quoteId)

  if (error) return { error: error.message }

  revalidatePath('/admin')
  return { success: true }
}

// No 'dismissed' status exists for this table (only pending/published, same
// as brief_ctas) — dismissal just deletes the row.
export async function dismissQuote(quoteId: string): Promise<{ success?: boolean; error?: string }> {
  await requireAdmin()

  const { error } = await getAdminClient()
    .from('content_posts')
    .delete()
    .eq('id', quoteId)

  if (error) return { error: error.message }

  revalidatePath('/admin')
  return { success: true }
}

// ---------------------------------------------------------------------------
// Sourced quotes (attribution to a non-platform-member) — migration
// 052_content_posts_external_quote_attribution.sql. Unlike submitQuote
// (lib/briefs/actions.ts), which always goes into the pending queue above,
// there's no other member to moderate here — an admin-authored quote
// publishes immediately.
// ---------------------------------------------------------------------------

export interface CreateSourcedQuoteInput {
  quoteSource: 'person' | 'document' | 'ai'
  sourceName: string
  sourceDetail: string
  sourceUrl: string
  body: string
  tags: string[]
}

export async function createSourcedQuote(
  briefId: string,
  briefSlug: string,
  input: CreateSourcedQuoteInput,
): Promise<{ error?: string; success?: boolean }> {
  await requireAdmin()

  const trimmedBody = input.body.trim()
  if (!trimmedBody) return { error: 'Quote cannot be empty.' }
  if (trimmedBody.length > 500) return { error: 'Quote must be under 500 characters.' }

  const sourceName = input.sourceName.trim()
  if (!sourceName) return { error: 'Name is required.' }
  if (sourceName.length > 200) return { error: 'Name must be under 200 characters.' }

  const sourceDetail = input.sourceDetail.trim()
  if (sourceDetail.length > 200) return { error: 'Title / detail must be under 200 characters.' }

  const sourceUrl = input.sourceUrl.trim()
  let parsedUrl: URL
  try {
    parsedUrl = new URL(sourceUrl)
  } catch {
    return { error: 'Source link must be a valid URL.' }
  }
  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    return { error: 'Source link must start with http:// or https://.' }
  }

  const cleanTags = [...new Set(input.tags.map((t) => t.trim()).filter(Boolean))].slice(0, 10)

  const { error } = await getAdminClient().from('content_posts').insert({
    user_id: null,
    post_type: 'quote',
    title: trimmedBody,
    brief_id: briefId,
    topic_tags: cleanTags,
    status: 'published',
    quote_source: input.quoteSource,
    source_name: sourceName,
    source_detail: sourceDetail || null,
    url: sourceUrl,
  })

  if (error) return { error: error.message }

  revalidatePath('/admin')
  revalidatePath(`/briefs/${briefSlug}`)
  return { success: true }
}

// ---------------------------------------------------------------------------
// Covered By moderation (two-ink-bold-plan.md Part 7) — url/outlet/title/
// image were extracted server-side from the submitted URL's Open Graph
// tags at submission time (lib/links/link-preview.ts), so there's nothing
// left to edit here beyond approve/dismiss. score is admin-set at approval
// time (no separate UI for it, per the plan) — an optional numeric field
// on the approve action itself.
// ---------------------------------------------------------------------------

export interface PendingCoverage {
  id: string
  url: string
  outlet_name: string
  title: string
  image_url: string | null
  published_date: string | null
  created_at: string
  brief_id: string
  briefs: { title: string; slug: string }
  users: { id: string; display_name: string | null; email: string; role: string }
}

export async function getPendingCoverage(page = 1): Promise<PagedResult<PendingCoverage>> {
  await requireAdmin()
  return adminData.getPendingCoverage(getAdminClient(), page)
}

export async function approveCoverage(coverageId: string, score: number | null): Promise<{ success?: boolean; error?: string }> {
  await requireAdmin()

  const { error } = await getAdminClient()
    .from('brief_coverage')
    .update({ status: 'published', score })
    .eq('id', coverageId)

  if (error) return { error: error.message }

  revalidatePath('/admin')
  return { success: true }
}

// No 'dismissed' status exists for this table (only pending/published,
// same as brief_ctas) — dismissal just deletes the row.
export async function dismissCoverage(coverageId: string): Promise<{ success?: boolean; error?: string }> {
  await requireAdmin()

  const { error } = await getAdminClient()
    .from('brief_coverage')
    .delete()
    .eq('id', coverageId)

  if (error) return { error: error.message }

  revalidatePath('/admin')
  return { success: true }
}

// ---------------------------------------------------------------------------
// Brief feedback moderation (brief-page-part2-plan.md §2, Part 0c) — the
// shared "send feedback to moderators" mechanism's admin queue. Unlike the
// other moderation tables above, there's no approve/publish step here
// (nothing submitted through this channel is ever displayed publicly) —
// just new → reviewed. Submission requires login (migration 034), so
// users is always present, unlike content_usage's nullable user_id.
// ---------------------------------------------------------------------------

export interface PendingBriefFeedback {
  id: string
  body: string
  section: string | null
  status: 'new' | 'reviewed'
  created_at: string
  brief_id: string
  briefs: { title: string; slug: string }
  users: { id: string; display_name: string | null; email: string; role: string }
}

export async function getPendingBriefFeedback(page = 1): Promise<PagedResult<PendingBriefFeedback>> {
  await requireAdmin()
  return adminData.getPendingBriefFeedback(getAdminClient(), page)
}

export async function markBriefFeedbackReviewed(feedbackId: string): Promise<{ success?: boolean; error?: string }> {
  await requireAdmin()

  const { error } = await getAdminClient()
    .from('brief_feedback')
    .update({ status: 'reviewed' })
    .eq('id', feedbackId)

  if (error) return { error: error.message }

  revalidatePath('/admin')
  return { success: true }
}

// ---------------------------------------------------------------------------
// Waitlist signups (docs/design/landing-page/temp-landing-page-plan.md §2,
// Part 1) — silent-launch landing page's "Join Waitlist" form. Read-only
// list, no approve/reject/convert-to-user step in this part.
// ---------------------------------------------------------------------------

export interface WaitlistSignup {
  id: string
  role: UserRole
  email: string
  full_name: string
  affiliation: string | null
  linkedin_or_website_url: string | null
  additional_info: string | null
  wants_early_access: boolean
  created_at: string
}

export async function getWaitlistSignups(page = 1): Promise<PagedResult<WaitlistSignup>> {
  await requireAdmin()
  return adminData.getWaitlistSignups(getAdminClient(), page)
}

// ---------------------------------------------------------------------------
// Analytics — read-only activity feed written by lib/analytics/log.ts
// (login, question/comment/like submissions, brief views). Nothing to
// moderate here, same shape as the reviews feed below.
// ---------------------------------------------------------------------------

export interface AnalyticsEventRow {
  id: string
  event_type: string
  target_type: string | null
  target_id: string | null
  metadata: Json
  created_at: string
  users: { display_name: string | null; email: string } | null
}

export async function getAnalyticsEvents(page = 1): Promise<PagedResult<AnalyticsEventRow>> {
  await requireAdmin()
  return adminData.getRecentAnalyticsEvents(getAdminClient(), page)
}

// ---------------------------------------------------------------------------
// Reviews & endorsements — read-only, unlike every queue above. These
// publish immediately (setReviewStatus in lib/briefs/actions.ts never sets
// a pending status), so there's nothing to approve/dismiss here; this tab
// is purely visibility into who reviewed/endorsed what, and any comment
// left (brief-page-part2-plan.md §2, Part 2 follow-up, 2026-08-22).
// ---------------------------------------------------------------------------

export interface BriefReview {
  id: string
  type: 'review' | 'endorsement'
  body: string | null
  created_at: string
  updated_at: string
  brief_id: string
  briefs: { title: string; slug: string }
  users: { id: string; display_name: string | null; email: string; role: string }
}

export async function getBriefReviews(page = 1): Promise<PagedResult<BriefReview>> {
  await requireAdmin()
  return adminData.getBriefReviews(getAdminClient(), page)
}

// Soft-remove, not a hard delete — 'archived' is an existing status on this
// table (migration 017), already used for a contributor's own self-withdraw
// (lib/briefs/actions.ts). Archiving drops it out of the public reviewer
// count/list (getEndorsementBar filters status = 'published') while keeping
// it in the row's own history — same reasoning as the profile withdrawal
// history this pairs with. briefSlug is only needed to revalidate the
// brief's own page (this table's rows don't cascade a revalidate on their
// own the way /admin's mutations already do via revalidatePath('/admin')).
export async function archiveBriefReview(reviewId: string, briefSlug: string): Promise<{ success?: boolean; error?: string }> {
  await requireAdmin()

  const { error } = await getAdminClient()
    .from('brief_contributions')
    .update({ status: 'archived' })
    .eq('id', reviewId)

  if (error) return { error: error.message }

  revalidatePath('/admin')
  revalidatePath(`/briefs/${briefSlug}`)
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
  status: 'pending' | 'approved' | 'declined'
  // Part 10 (docs/design/brief-feature/brief-page-part2-plan.md §2) —
  // set together by convertProposalToBrief/linkProposalToBrief below.
  published_brief_id: string | null
  minor_changes_flag: boolean
  created_at: string
}

export async function getBriefProposals(page = 1): Promise<PagedResult<BriefProposal>> {
  await requireAdmin()
  return adminData.getBriefProposals(getAdminClient(), page)
}

export async function declineBriefProposal(proposalId: string): Promise<{ success?: boolean; error?: string }> {
  await requireAdmin()

  const { error } = await getAdminClient()
    .from('brief_proposals')
    .update({ status: 'declined' })
    .eq('id', proposalId)

  if (error) return { error: error.message }

  revalidatePath('/admin')
  return { success: true }
}

// ---------------------------------------------------------------------------
// Brief proposals — approve (convert to new brief, or link an existing one)
// ---------------------------------------------------------------------------

// Shared by both paths below: marks the proposal approved + linked, and
// notifies the submitter — the trigger for that email is published_brief_id
// being set, per the Notion Story's scope note (submitter notification is
// part of this story, not a separate one).
async function resolveBriefProposal(
  proposalId: string,
  briefId: string,
  briefSlug: string,
  minorChanges: boolean,
  submitterName: string,
  submitterEmail: string,
  topicTitle: string,
): Promise<{ error?: string }> {
  const { error } = await getAdminClient()
    .from('brief_proposals')
    .update({ status: 'approved', published_brief_id: briefId, minor_changes_flag: minorChanges })
    .eq('id', proposalId)

  if (error) return { error: error.message }

  const siteUrl = await getSiteUrl()
  sendBriefProposalApprovedEmail({
    submitter_name: submitterName,
    submitter_email: submitterEmail,
    topic_title: topicTitle,
    brief_url: `${siteUrl}/briefs/${briefSlug}`,
    minor_changes: minorChanges,
  }).catch((err) => console.error('Brief proposal approval email failed:', err))

  revalidatePath('/admin')
  return {}
}

// "Convert to new brief" — creates a real briefs row pre-filled from the
// proposal (title from topic_title, the seeded Explainer subsection from
// why_it_matters — a starting draft, not final copy), same section scaffold
// createBrief uses, then resolves the proposal and redirects into the admin
// editor so the admin can finish writing it up.
export async function convertProposalToBrief(
  proposalId: string,
  minorChanges: boolean,
): Promise<{ error?: string }> {
  await requireAdmin()
  const admin = getAdminClient()

  const { data: proposal, error: fetchError } = await admin
    .from('brief_proposals')
    .select('topic_title, why_it_matters, submitter_name, submitter_email, status')
    .eq('id', proposalId)
    .single()

  if (fetchError || !proposal) return { error: 'Proposal not found.' }
  if (proposal.status !== 'pending') return { error: 'This proposal has already been resolved.' }

  const briefId = randomUUID()
  const slug = await uniqueSlug(slugify(proposal.topic_title), briefId)

  const { error: briefError } = await admin
    .from('briefs')
    .insert({ id: briefId, title: proposal.topic_title, slug, visibility: 'members_only' })

  if (briefError) return { error: briefError.message }

  // Same scaffold as createBrief (brief-actions.ts) — use_this/featured_news/
  // where_experts_stand are old-IA types, not seeded on new briefs.
  await admin.from('brief_sections').insert([
    { brief_id: briefId, section_type: 'tldr', content: '', display_order: 1 },
    { brief_id: briefId, section_type: 'explainer', content: proposal.why_it_matters, display_order: 2 },
    { brief_id: briefId, section_type: 'going_deeper', content: '', display_order: 3 },
    { brief_id: briefId, section_type: 'faq', content: '', display_order: 4 },
  ])

  const resolved = await resolveBriefProposal(
    proposalId, briefId, slug, minorChanges, proposal.submitter_name, proposal.submitter_email, proposal.topic_title,
  )
  if (resolved.error) return resolved

  redirect(`/admin/briefs/${briefId}`)
}

// "Link to existing brief" — for when the admin already wrote a brief based
// on the proposal separately, rather than starting from its scaffold.
export async function linkProposalToBrief(
  proposalId: string,
  briefId: string,
  minorChanges: boolean,
): Promise<{ success?: boolean; error?: string }> {
  await requireAdmin()
  const admin = getAdminClient()

  const { data: proposal, error: fetchError } = await admin
    .from('brief_proposals')
    .select('topic_title, submitter_name, submitter_email, status')
    .eq('id', proposalId)
    .single()

  if (fetchError || !proposal) return { error: 'Proposal not found.' }
  if (proposal.status !== 'pending') return { error: 'This proposal has already been resolved.' }

  const { data: brief, error: briefFetchError } = await admin
    .from('briefs')
    .select('slug')
    .eq('id', briefId)
    .single()

  if (briefFetchError || !brief) return { error: 'Brief not found.' }

  const resolved = await resolveBriefProposal(
    proposalId, briefId, brief.slug, minorChanges, proposal.submitter_name, proposal.submitter_email, proposal.topic_title,
  )
  if (resolved.error) return resolved

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
