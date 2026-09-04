import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'
import type { Application, PendingQuestion, PendingCorrectionProposal, BriefProposal, PendingFaqAnswer, PendingQuestionAnswer, PendingCta, PublishedCta, PendingCoverage, PendingBriefFeedback, PendingContentPost, BriefReview, WaitlistSignup, AnalyticsEventRow } from '@/lib/admin/actions'
import type { PendingContentiousPoint } from '@/lib/admin/explainer-actions'

// Data-access layer for admin queue reads. See lib/data/briefs.ts for the
// pattern. No auth here — callers (lib/admin/actions.ts) call requireAdmin()
// before reaching these, since the exported actions are public endpoints.

type DB = SupabaseClient<Database>

export const ADMIN_PAGE_SIZE = 40

export interface PagedResult<T> {
  data: T[]
  count: number
}

function range(page: number): [number, number] {
  const from = (page - 1) * ADMIN_PAGE_SIZE
  return [from, from + ADMIN_PAGE_SIZE - 1]
}

export async function getPendingApplications(db: DB, page = 1): Promise<PagedResult<Application>> {
  const { data, error, count } = await db
    .from('applications')
    .select('*', { count: 'exact' })
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .range(...range(page))

  return { data: error ? [] : (data as Application[]) ?? [], count: count ?? 0 }
}

export async function getRecentlyApproved(db: DB, page = 1): Promise<PagedResult<Partial<Application>>> {
  const { data, error, count } = await db
    .from('applications')
    .select('id, full_name, first_name, last_name, email, desired_role, desired_role_other, reviewed_at, created_at', { count: 'exact' })
    .eq('status', 'approved')
    .order('reviewed_at', { ascending: false })
    .range(...range(page))

  return { data: error ? [] : (data as Partial<Application>[]) ?? [], count: count ?? 0 }
}

export async function getPendingQuestions(db: DB, page = 1): Promise<PagedResult<PendingQuestion>> {
  const { data, error, count } = await db
    .from('questions')
    .select('id, question_text, created_at, brief_id, briefs(title, slug), users(display_name, email)', { count: 'exact' })
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .range(...range(page))

  return { data: error ? [] : (data as unknown as PendingQuestion[]) ?? [], count: count ?? 0 }
}

export async function getPendingCorrectionProposals(db: DB, page = 1): Promise<PagedResult<PendingCorrectionProposal>> {
  const { data, error, count } = await db
    .from('brief_correction_proposals')
    .select('id, contribution_text, status, created_at, brief_id, briefs(title, slug), users(id, display_name, email, role)', { count: 'exact' })
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .range(...range(page))

  return { data: error ? [] : (data as unknown as PendingCorrectionProposal[]) ?? [], count: count ?? 0 }
}

export async function getPendingFaqAnswers(db: DB, page = 1): Promise<PagedResult<PendingFaqAnswer>> {
  const { data, error, count } = await db
    .from('brief_faq_answers')
    .select('id, question, body, created_at, brief_id, briefs(title, slug), users(id, display_name, email, role)', { count: 'exact' })
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .range(...range(page))

  return { data: error ? [] : (data as unknown as PendingFaqAnswer[]) ?? [], count: count ?? 0 }
}

// Contentious points moderation — same pending -> published shape as FAQ
// answers above. See lib/admin/explainer-actions.ts (split out of
// lib/admin/actions.ts, which is already at the repo's max-lines budget).
export async function getPendingContentiousPoints(db: DB, page = 1): Promise<PagedResult<PendingContentiousPoint>> {
  const { data, error, count } = await db
    .from('explainer_contentious_points')
    .select('id, subsection_label, body, created_at, brief_id, briefs(title, slug), users(id, display_name, email, role)', { count: 'exact' })
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .range(...range(page))

  return { data: error ? [] : (data as unknown as PendingContentiousPoint[]) ?? [], count: count ?? 0 }
}

// Part 7: Community Q&A answers moderation — question_answers has no
// brief_id of its own (only question_id), so briefs is reached through a
// nested embed off questions rather than a direct join, unlike the other
// pending-queue queries in this file.
export async function getPendingQuestionAnswers(db: DB, page = 1): Promise<PagedResult<PendingQuestionAnswer>> {
  const { data, error, count } = await db
    .from('question_answers')
    .select('id, body, created_at, question_id, questions(question_text, brief_id, briefs(title, slug)), users(id, display_name, email, role)', { count: 'exact' })
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .range(...range(page))

  return { data: error ? [] : (data as unknown as PendingQuestionAnswer[]) ?? [], count: count ?? 0 }
}

export async function getPendingCtas(db: DB, page = 1): Promise<PagedResult<PendingCta>> {
  const { data, error, count } = await db
    .from('brief_ctas')
    .select('id, title, description, link_url, created_at, brief_id, briefs(title, slug), users(id, display_name, email, role)', { count: 'exact' })
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .range(...range(page))

  return { data: error ? [] : (data as unknown as PendingCta[]) ?? [], count: count ?? 0 }
}

// Published CTAs, for the admin reorder control (brief-page-part2-plan.md
// §2, Part 8) — sorted the same way the public carousel is (getPublishedCtas
// in lib/data/ctas.ts) so the list an admin sees is exactly the resulting
// order, across every brief rather than scoped to one.
export async function getPublishedCtasAdmin(db: DB, page = 1): Promise<PagedResult<PublishedCta>> {
  const { data, error, count } = await db
    .from('brief_ctas')
    .select('id, title, display_order, created_at, brief_id, briefs(title, slug)', { count: 'exact' })
    .eq('status', 'published')
    .order('display_order', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })
    .range(...range(page))

  return { data: error ? [] : (data as unknown as PublishedCta[]) ?? [], count: count ?? 0 }
}

// Any pending content_posts row — not just quotes, and not just
// brief-scoped ones. Under the deterministic clarity check
// (lib/clarity/check.ts), a submission only lands here when it was
// actually flagged: brief-attached quotes (submitQuote) and profile posts
// of any post_type (createPost) both feed the same queue now, so this
// selects flagged_terms too (the reason it's here) and post_type/body
// (needed to render a non-quote post generically — see ContentPostCard).
export async function getPendingContentPosts(db: DB, page = 1): Promise<PagedResult<PendingContentPost>> {
  // content_posts has two FK paths to briefs (this row's own brief_id, and
  // briefs.pinned_media_post_id pointing back at a content_posts row) — the
  // bare `briefs(...)` embed PostgREST shorthand every other query in this
  // file uses is ambiguous here and errors (PGRST201), so the join has to
  // name the specific constraint (030_content_posts_brief_id.sql).
  const { data, error, count } = await db
    .from('content_posts')
    .select('id, post_type, title, body, topic_tags, flagged_terms, created_at, brief_id, briefs!content_posts_brief_id_fkey(title, slug), users(id, display_name, email, role)', { count: 'exact' })
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .range(...range(page))

  return { data: error ? [] : (data as unknown as PendingContentPost[]) ?? [], count: count ?? 0 }
}

export async function getPendingCoverage(db: DB, page = 1): Promise<PagedResult<PendingCoverage>> {
  const { data, error, count } = await db
    .from('brief_coverage')
    .select('id, url, outlet_name, title, image_url, published_date, created_at, brief_id, briefs(title, slug), users(id, display_name, email, role)', { count: 'exact' })
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .range(...range(page))

  return { data: error ? [] : (data as unknown as PendingCoverage[]) ?? [], count: count ?? 0 }
}

export async function getPendingBriefFeedback(db: DB, page = 1): Promise<PagedResult<PendingBriefFeedback>> {
  const { data, error, count } = await db
    .from('brief_feedback')
    .select('id, body, section, status, created_at, brief_id, briefs(title, slug), users(id, display_name, email, role)', { count: 'exact' })
    .eq('status', 'new')
    .order('created_at', { ascending: true })
    .range(...range(page))

  return { data: error ? [] : (data as unknown as PendingBriefFeedback[]) ?? [], count: count ?? 0 }
}

// Waitlist signups (docs/design/landing-page/temp-landing-page-plan.md §2,
// Part 1) — read-only list, no approve/reject step. Newest first, unlike
// the moderation queues above (oldest first), since there's no backlog to
// work through in order, just a list to glance at.
export async function getWaitlistSignups(db: DB, page = 1): Promise<PagedResult<WaitlistSignup>> {
  const { data, error, count } = await db
    .from('waitlist_signups')
    .select('id, role, email, full_name, affiliation, linkedin_or_website_url, additional_info, wants_early_access, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(...range(page))

  return { data: error ? [] : (data as WaitlistSignup[]) ?? [], count: count ?? 0 }
}

// Reviews/endorsements publish immediately (no pending state, see
// setReviewStatus in lib/briefs/actions.ts) — this is a read-only activity
// feed, not a moderation queue, so it orders newest-first rather than the
// oldest-first FIFO the pending queues above use.
export async function getBriefReviews(db: DB, page = 1): Promise<PagedResult<BriefReview>> {
  const { data, error, count } = await db
    .from('brief_contributions')
    .select('id, type, body, created_at, updated_at, brief_id, briefs(title, slug), users(id, display_name, email, role)', { count: 'exact' })
    .in('type', ['review', 'endorsement'])
    .eq('status', 'published')
    .order('updated_at', { ascending: false })
    .range(...range(page))

  return { data: error ? [] : (data as unknown as BriefReview[]) ?? [], count: count ?? 0 }
}

export async function getBriefProposals(db: DB, page = 1): Promise<PagedResult<BriefProposal>> {
  const { data, error, count } = await db
    .from('brief_proposals')
    .select('*', { count: 'exact' })
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .range(...range(page))

  return { data: error ? [] : (data as BriefProposal[]) ?? [], count: count ?? 0 }
}

// Basic activity log — everything lib/analytics/log.ts writes, newest
// first. Read-only feed, no moderation state, same shape as getBriefReviews
// above. users is nullable since the FK is ON DELETE SET NULL.
export async function getRecentAnalyticsEvents(db: DB, page = 1): Promise<PagedResult<AnalyticsEventRow>> {
  const { data, error, count } = await db
    .from('analytics_events')
    .select('id, event_type, target_type, target_id, metadata, created_at, users(display_name, email)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(...range(page))

  return { data: error ? [] : (data as unknown as AnalyticsEventRow[]) ?? [], count: count ?? 0 }
}
