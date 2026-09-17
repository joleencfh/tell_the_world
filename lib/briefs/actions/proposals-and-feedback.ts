'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { sendBriefProposalEmail } from '@/lib/email/send-brief-proposal'

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

// Part 0c: shared "send feedback to moderators" mechanism, reused by five
// later parts (Contribute menu, TL;DR, Explainer ×2, FAQ) rather than
// built five times. Unlike submitCorrectionProposal/submitFaqAnswer/
// submitCta above, this isn't gated to expert/organisation — any signed-in
// member can submit — but login is required (confirmed with the user;
// brief_feedback's insert RLS policy, migration 034, is authenticated-
// only). `section` is a loose, caller-defined key (e.g. 'tldr',
// 'faq:<question>', 'explainer:<section id>', or omitted for brief-level
// feedback) — this action doesn't validate its shape.
export async function submitBriefFeedback(
  briefId: string,
  section: string | null,
  body: string,
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'You must be logged in to send feedback.' }

  const trimmed = body.trim()
  if (!trimmed) return { error: 'Feedback cannot be empty.' }
  if (trimmed.length > 2000) return { error: 'Feedback must be under 2000 characters.' }

  const { error } = await supabase.from('brief_feedback').insert({
    brief_id: briefId,
    section,
    user_id: user.id,
    body: trimmed,
  })

  if (error) return { error: 'Failed to submit feedback. Please try again.' }

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
