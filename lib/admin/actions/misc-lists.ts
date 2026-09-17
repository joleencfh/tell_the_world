'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth/require'
import { getAdminClient } from '@/lib/supabase/admin'
import * as adminData from '@/lib/data/admin'
import type { PagedResult } from '@/lib/data/admin'
import type { UserRole } from '@/lib/types'
import type { Json } from '@/lib/database.types'

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
