'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { sendBriefProposalEmail } from '@/lib/email/send-brief-proposal'

export async function submitContribution(
  briefId: string,
  briefSlug: string,
  contributionText: string,
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'You must be logged in to submit a contribution.' }

  // Verify role server-side (belt-and-suspenders — RLS also enforces this)
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!userData || !['expert', 'organisation'].includes(userData.role)) {
    return { error: 'Only experts and organisations can propose contributions.' }
  }

  const trimmed = contributionText.trim()
  if (!trimmed) return { error: 'Contribution cannot be empty.' }
  if (trimmed.length > 3000) return { error: 'Contribution must be under 3000 characters.' }

  const { error } = await supabase
    .from('brief_contributions')
    .insert({ brief_id: briefId, user_id: user.id, contribution_text: trimmed })

  if (error) return { error: 'Failed to submit contribution. Please try again.' }

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
