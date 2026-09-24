'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getMaxContentVersion } from '@/lib/data/contributions'
import { CONTRIBUTOR_ROLES } from '@/lib/types'

// Reused brief_contributions self-serve mechanism (design plan §2): a simple
// "Mark as reviewed" / "Endorse" toggle for experts/organisations, brief-level
// (sectionId null, Part 1) or section-level (Part 3). One row per (user,
// target) — the review→endorsement transition upgrades the existing row in
// place rather than inserting a second one, matching the DB's partial unique
// indexes (migration 017).
export async function setReviewStatus(
  briefId: string,
  briefSlug: string,
  sectionId: string | null,
  targetType: 'review' | 'endorsement',
  body?: string | null,
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'You must be logged in to review or endorse briefs.' }

  const trimmedBody = body?.trim() || null
  if (trimmedBody && trimmedBody.length > 500) {
    return { error: 'Comment must be under 500 characters.' }
  }

  const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (!userData || !CONTRIBUTOR_ROLES.includes(userData.role)) {
    return { error: 'Only experts and organisations can review or endorse briefs.' }
  }

  const existingBase = supabase
    .from('brief_contributions')
    .select('id')
    .eq('brief_id', briefId)
    .eq('user_id', user.id)
    .in('type', ['review', 'endorsement'])
    .limit(1)
  const { data: existingRows } = await (sectionId
    ? existingBase.eq('section_id', sectionId)
    : existingBase.is('section_id', null))
  const existing = existingRows?.[0] ?? null

  if (targetType === 'endorsement' && !existing) {
    return { error: 'Mark as reviewed before endorsing.' }
  }

  // Pin the current content_version so a later substantive edit can mark
  // this contribution stale — getEndorsementBarCounts already handles that
  // comparison, untouched by this plan (§2).
  let sectionVersion: number
  if (sectionId) {
    const { data: section } = await supabase
      .from('brief_sections')
      .select('content_version')
      .eq('id', sectionId)
      .single()
    if (!section) return { error: 'Section not found.' }
    sectionVersion = section.content_version
  } else {
    const { data: sections } = await supabase
      .from('brief_sections')
      .select('content_version')
      .eq('brief_id', briefId)
    sectionVersion = getMaxContentVersion(sections ?? [])
  }

  // An untyped comment on the endorsement/review upgrade doesn't overwrite
  // an earlier one — only include body in the update when the caller
  // actually typed something this time.
  const { error } = existing
    ? await supabase
        .from('brief_contributions')
        .update({
          type: targetType,
          section_version: sectionVersion,
          status: 'published',
          ...(trimmedBody ? { body: trimmedBody } : {}),
        })
        .eq('id', existing.id)
    : await supabase.from('brief_contributions').insert({
        brief_id: briefId,
        section_id: sectionId,
        user_id: user.id,
        type: targetType,
        section_version: sectionVersion,
        status: 'published',
        body: trimmedBody,
      })

  if (error) return { error: 'Failed to save. Please try again.' }

  revalidatePath(`/briefs/${briefSlug}`)
  return { success: true }
}

// Self-withdraw — a contributor removing their own review/endorsement,
// triggered from the profile history list (lib/data/contributions.ts's
// getUserReviewHistory). Same 'archived' status admin's archiveBriefReview
// (lib/admin/actions/misc-lists.ts) uses, and the same RLS policy ("Contributors can
// update their own review or endorsement", migration 017) that already
// allows this — the .eq('user_id', ...) below is defense in depth, not the
// actual enforcement. Archiving (not deleting) is what makes this show up
// in the user's own history as "withdrawn" rather than vanishing.
export async function withdrawReview(contributionId: string, briefSlug: string): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'You must be logged in.' }

  const { error } = await supabase
    .from('brief_contributions')
    .update({ status: 'archived' })
    .eq('id', contributionId)
    .eq('user_id', user.id)

  if (error) return { error: 'Failed to withdraw. Please try again.' }

  revalidatePath(`/briefs/${briefSlug}`)
  revalidatePath(`/profile/${user.id}`)
  return { success: true }
}
