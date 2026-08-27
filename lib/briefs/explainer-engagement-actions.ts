'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getExplainerUsefulLikers as getExplainerUsefulLikersData } from '@/lib/data/explainer-engagement'
import type { EngagementAuthor } from '@/lib/data/explainer-engagement'

// Server actions backing the Explainer section's engagement mechanisms —
// split out of lib/briefs/actions.ts (already at the repo's max-lines
// budget) rather than grown further. Design ref: docs/design/brief-feature/
// brief-page-part2-plan.md Part 5 step 6, superseded by the Explainer
// Engagement Options design pass (2026-08-26) — see supabase/
// 047_explainer_engagement.sql for the schema these write to.

// Local to this file, same "not shared across modules" shape as
// lib/briefs/actions.ts's own CONTRIBUTOR_ROLES constant. Admin is included
// in both — unlike lib/briefs/actions.ts's CONTRIBUTOR_ROLES (which stays
// expert/organisation-only for the controls it gates elsewhere), every
// Explainer engagement mechanism is meant to be usable by admin too
// (confirmed with the user 2026-08-26) — see migration
// 048_explainer_engagement_admin.sql for the matching RLS widening.
const CONTRIBUTOR_ROLES = ['expert', 'organisation', 'admin']
const USEFULNESS_VOTER_ROLES = ['creator', 'journalist', 'admin']

// ---------------------------------------------------------------------------
// Contentious points — expert/organisation, submitted pending admin
// approval (free text, so it follows the propose/moderate pattern used
// elsewhere, e.g. submitFaqAnswer — not a binary trust signal like
// setReviewStatus). subsectionLabel is an optional denormalized snapshot
// of whichever subsection title the author picked in the flag modal (see
// the migration's own comment for why this isn't a foreign key).
// ---------------------------------------------------------------------------

export async function submitContentiousPoint(
  briefId: string,
  briefSlug: string,
  body: string,
  subsectionLabel: string | null,
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'You must be logged in to flag a contentious point.' }

  const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (!userData || !CONTRIBUTOR_ROLES.includes(userData.role)) {
    return { error: 'Only experts and organisations can flag a contentious point.' }
  }

  const trimmed = body.trim()
  if (!trimmed) return { error: 'Your take cannot be empty.' }
  if (trimmed.length > 1000) return { error: 'Your take must be under 1000 characters.' }

  const { error } = await supabase.from('explainer_contentious_points').insert({
    brief_id: briefId,
    author_user_id: user.id,
    subsection_label: subsectionLabel,
    body: trimmed,
  })

  if (error) return { error: 'Failed to submit. Please try again.' }

  revalidatePath(`/briefs/${briefSlug}`)
  return { success: true }
}

// A member's like on a contentious point itself — any logged-in member,
// true toggle, same shape as submitExplainerCommentLike below (migration
// 051 gave points their own likes table, parity added 2026-08-27 after
// comments/replies already had it).
export async function submitContentiousPointLike(
  pointId: string,
  briefSlug: string,
): Promise<{ error?: string; liked?: boolean }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'You must be logged in to like this.' }

  const { data: existing } = await supabase
    .from('explainer_contentious_point_likes')
    .select('id')
    .eq('contentious_point_id', pointId)
    .eq('user_id', user.id)
    .maybeSingle()

  const { error } = existing
    ? await supabase.from('explainer_contentious_point_likes').delete().eq('id', existing.id)
    : await supabase.from('explainer_contentious_point_likes').insert({ contentious_point_id: pointId, user_id: user.id })

  if (error) return { error: 'Failed to record your like. Please try again.' }

  revalidatePath(`/briefs/${briefSlug}`)
  return { liked: !existing }
}

// ---------------------------------------------------------------------------
// Comments — any logged-in member, immediate publish, section-level (not
// per subsection), same shape as submitCoverageComment. parentCommentId/
// contentiousPointId (migration 050) make this row a reply instead of a
// root comment — never both. Flat, one level: the caller is responsible
// for passing a root's own id as parentCommentId even when replying to one
// of its replies (see the migration's own comment for the flattening
// rule) — this action doesn't re-derive or validate that.
// ---------------------------------------------------------------------------

export async function submitExplainerComment(
  briefId: string,
  briefSlug: string,
  body: string,
  parentCommentId?: string | null,
  contentiousPointId?: string | null,
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'You must be logged in to comment.' }

  const trimmed = body.trim()
  if (!trimmed) return { error: 'Comment cannot be empty.' }
  if (trimmed.length > 1000) return { error: 'Comment must be under 1000 characters.' }

  const { error } = await supabase.from('explainer_comments').insert({
    brief_id: briefId,
    user_id: user.id,
    body: trimmed,
    parent_comment_id: parentCommentId ?? null,
    contentious_point_id: contentiousPointId ?? null,
  })

  if (error) return { error: 'Failed to post your comment. Please try again.' }

  revalidatePath(`/briefs/${briefSlug}`)
  return { success: true }
}

// A member's like on a comment or reply — any logged-in member, true
// toggle, same shape as likeCoverage/likeQuote in lib/briefs/actions.ts.
export async function submitExplainerCommentLike(
  commentId: string,
  briefSlug: string,
): Promise<{ error?: string; liked?: boolean }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'You must be logged in to like this.' }

  const { data: existing } = await supabase
    .from('explainer_comment_likes')
    .select('id')
    .eq('comment_id', commentId)
    .eq('user_id', user.id)
    .maybeSingle()

  const { error } = existing
    ? await supabase.from('explainer_comment_likes').delete().eq('id', existing.id)
    : await supabase.from('explainer_comment_likes').insert({ comment_id: commentId, user_id: user.id })

  if (error) return { error: 'Failed to record your like. Please try again.' }

  revalidatePath(`/briefs/${briefSlug}`)
  return { liked: !existing }
}

// ---------------------------------------------------------------------------
// Usefulness — creator/journalist/admin only, one row per (brief, user), a
// plain like (migration 049 dropped the two-directional is_useful column —
// "only vote in case of usefulness," confirmed with the user 2026-08-26).
// True toggle, same shape as likeCoverage/likeQuote in lib/briefs/actions.ts:
// insert if absent, delete if present.
// ---------------------------------------------------------------------------

export async function submitExplainerUsefulVote(
  briefId: string,
  briefSlug: string,
): Promise<{ error?: string; liked?: boolean }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'You must be logged in to vote.' }

  const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (!userData || !USEFULNESS_VOTER_ROLES.includes(userData.role)) {
    return { error: 'Only creators, journalists, and admin can vote on usefulness.' }
  }

  const { data: existing } = await supabase
    .from('explainer_useful_votes')
    .select('id')
    .eq('brief_id', briefId)
    .eq('user_id', user.id)
    .maybeSingle()

  const { error } = existing
    ? await supabase.from('explainer_useful_votes').delete().eq('id', existing.id)
    : await supabase.from('explainer_useful_votes').insert({ brief_id: briefId, user_id: user.id })

  if (error) return { error: 'Failed to record your vote. Please try again.' }

  revalidatePath(`/briefs/${briefSlug}`)
  return { liked: !existing }
}

// The "found this useful" modal's list, fetched on open (not part of the
// page's initial load) — mirrors getCoverageDetail in lib/briefs/actions.ts.
// No login/role check: viewing who liked something is informational.
export async function getExplainerUsefulLikers(briefId: string): Promise<EngagementAuthor[]> {
  const supabase = await createClient()
  return getExplainerUsefulLikersData(supabase, briefId)
}
