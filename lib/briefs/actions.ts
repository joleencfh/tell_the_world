'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { sendBriefProposalEmail } from '@/lib/email/send-brief-proposal'
import { getMaxContentVersion } from '@/lib/data/contributions'

const CONTRIBUTOR_ROLES = ['expert', 'organisation']

export async function submitCorrectionProposal(
  briefId: string,
  briefSlug: string,
  proposalText: string,
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'You must be logged in to submit a correction.' }

  // Verify role server-side (belt-and-suspenders — RLS also enforces this)
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!userData || !['expert', 'organisation'].includes(userData.role)) {
    return { error: 'Only experts and organisations can propose corrections.' }
  }

  const trimmed = proposalText.trim()
  if (!trimmed) return { error: 'Correction cannot be empty.' }
  if (trimmed.length > 3000) return { error: 'Correction must be under 3000 characters.' }

  const { error } = await supabase
    .from('brief_correction_proposals')
    .insert({ brief_id: briefId, user_id: user.id, contribution_text: trimmed })

  if (error) return { error: 'Failed to submit correction. Please try again.' }

  revalidatePath(`/briefs/${briefSlug}`)
  return { success: true }
}

export async function submitQuestion(
  briefId: string,
  briefSlug: string,
  questionText: string,
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'You must be logged in to submit a question.' }

  const trimmed = questionText.trim()
  if (!trimmed) return { error: 'Question cannot be empty.' }
  if (trimmed.length > 1000) return { error: 'Question must be under 1000 characters.' }

  const { error } = await supabase
    .from('questions')
    .insert({ brief_id: briefId, user_id: user.id, question_text: trimmed })

  if (error) return { error: 'Failed to submit question. Please try again.' }

  revalidatePath(`/briefs/${briefSlug}`)
  return { success: true }
}

// Part 4b: an expert/organisation's additional answer to an existing FAQ
// item, submitted pending admin approval (unlike setReviewStatus below —
// this is free text, not a binary trust signal, so it follows the
// propose/moderate pattern instead of publishing immediately).
export async function submitFaqAnswer(
  briefId: string,
  briefSlug: string,
  question: string,
  body: string,
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'You must be logged in to add an answer.' }

  const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (!userData || !CONTRIBUTOR_ROLES.includes(userData.role)) {
    return { error: 'Only experts and organisations can add FAQ answers.' }
  }

  const trimmed = body.trim()
  if (!trimmed) return { error: 'Answer cannot be empty.' }
  if (trimmed.length > 2000) return { error: 'Answer must be under 2000 characters.' }

  const { error } = await supabase.from('brief_faq_answers').insert({
    brief_id: briefId,
    question,
    author_user_id: user.id,
    body: trimmed,
    status: 'pending',
  })

  if (error) return { error: 'Failed to submit answer. Please try again.' }

  revalidatePath(`/briefs/${briefSlug}`)
  return { success: true }
}

export async function proposeBrief(
  topicTitle: string,
  whyItMatters: string,
  fromBriefTitle?: string | null,
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'You must be logged in to propose a brief.' }

  const { data: userData } = await supabase
    .from('users')
    .select('display_name, email')
    .eq('id', user.id)
    .single()

  if (!userData) return { error: 'Failed to load your profile.' }

  const title = topicTitle.trim()
  const why = whyItMatters.trim()
  if (!title) return { error: 'Topic title is required.' }
  if (!why) return { error: 'Please explain why this topic matters.' }

  const submitterName = userData.display_name || userData.email.split('@')[0]

  // Persist to DB so the admin can see all proposals in the admin panel
  const { error: insertError } = await supabase.from('brief_proposals').insert({
    user_id: user.id,
    submitter_name: submitterName,
    submitter_email: userData.email,
    topic_title: title,
    why_it_matters: why,
    from_brief_title: fromBriefTitle ?? null,
  })

  if (insertError) return { error: 'Failed to submit proposal. Please try again.' }

  // Also email the admin — fire and forget (DB record is the source of truth)
  sendBriefProposalEmail({
    submitter_name: submitterName,
    submitter_email: userData.email,
    topic_title: title,
    why_it_matters: why,
    from_brief_title: fromBriefTitle ?? null,
  }).catch((err) => console.error('Brief proposal email failed:', err))

  return { success: true }
}

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
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'You must be logged in to review or endorse briefs.' }

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

  const { error } = existing
    ? await supabase
        .from('brief_contributions')
        .update({ type: targetType, section_version: sectionVersion, status: 'published' })
        .eq('id', existing.id)
    : await supabase.from('brief_contributions').insert({
        brief_id: briefId,
        section_id: sectionId,
        user_id: user.id,
        type: targetType,
        section_version: sectionVersion,
        status: 'published',
      })

  if (error) return { error: 'Failed to save. Please try again.' }

  revalidatePath(`/briefs/${briefSlug}`)
  return { success: true }
}
