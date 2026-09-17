'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { logEvent } from '@/lib/analytics/log'
import type { UserRole } from '@/lib/types'
import { CONTRIBUTOR_ROLES } from '@/lib/types'

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

  await logEvent({ eventType: 'question_submitted', userId: user.id, targetType: 'brief', targetId: briefId })

  revalidatePath(`/briefs/${briefSlug}`)
  return { success: true }
}

// Part 5: a member's vote on a Community Q&A question — one row per
// (question, user), a true toggle (insert if absent, delete if present —
// migration 025 added the delete RLS policy this needs; a repeat click
// used to upsert-with-ignoreDuplicates, which meant a vote could never be
// undone, reported 2026-08-13). Any logged-in member can vote. Displayed
// split by voter segment (pink creator/journalist vs. blue expert/
// organisation, lib/data/questions.ts's VoteSplit) rather than as two
// separate vote buttons, since a voter's own role already decides which
// bucket their single vote lands in.
export async function voteQuestion(questionId: string, briefSlug: string): Promise<{ error?: string; voted?: boolean }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'You must be logged in to vote.' }

  const { data: existing } = await supabase
    .from('question_votes')
    .select('id')
    .eq('question_id', questionId)
    .eq('user_id', user.id)
    .maybeSingle()

  const { error } = existing
    ? await supabase.from('question_votes').delete().eq('id', existing.id)
    : await supabase.from('question_votes').insert({ question_id: questionId, user_id: user.id })

  if (error) return { error: 'Failed to record your vote. Please try again.' }

  revalidatePath(`/briefs/${briefSlug}`)
  return { voted: !existing }
}

// Part 5 follow-up (2026-08-13): a member's vote on a specific answer —
// "this was helpful", distinct from endorseAnswer below ("an expert
// vouches this is accurate"). Answers are now their own rows
// (question_answers, a flat list, no threading), so this targets an
// answer_id rather than the question. Toggles the same way voteQuestion
// does, above.
export async function voteAnswer(answerId: string, briefSlug: string): Promise<{ error?: string; voted?: boolean }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'You must be logged in to vote.' }

  const { data: existing } = await supabase
    .from('question_answer_votes')
    .select('id')
    .eq('answer_id', answerId)
    .eq('user_id', user.id)
    .maybeSingle()

  const { error } = existing
    ? await supabase.from('question_answer_votes').delete().eq('id', existing.id)
    : await supabase.from('question_answer_votes').insert({ answer_id: answerId, user_id: user.id })

  if (error) return { error: 'Failed to record your vote. Please try again.' }

  revalidatePath(`/briefs/${briefSlug}`)
  return { voted: !existing }
}

// Part 7: an expert/organisation/admin's answer to a Community Q&A
// question — question_answers previously had no submission path at all
// (migration 024's own comment flagged this as deferred). Propose-then-
// pending like submitFaqAnswer above; admin bypasses to immediate publish
// via the service role, same shape as submitCta's admin branch.
export async function submitAnswer(
  briefSlug: string,
  questionId: string,
  body: string,
): Promise<{ error?: string; success?: boolean; published?: boolean }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'You must be logged in to add an answer.' }

  const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()
  const role = userData?.role as UserRole | undefined
  const isContributor = !!role && CONTRIBUTOR_ROLES.includes(role)
  const isAdmin = role === 'admin'
  if (!isContributor && !isAdmin) {
    return { error: 'Only experts, organisations, and admins can add answers.' }
  }

  const trimmed = body.trim()
  if (!trimmed) return { error: 'Answer cannot be empty.' }
  if (trimmed.length > 2000) return { error: 'Answer must be under 2000 characters.' }

  const row = { question_id: questionId, author_user_id: user.id, body: trimmed }

  const { error } = isAdmin
    ? await getAdminClient().from('question_answers').insert({ ...row, status: 'published' })
    : await supabase.from('question_answers').insert({ ...row, status: 'pending' })

  if (error) return { error: 'Failed to submit answer. Please try again.' }

  revalidatePath(`/briefs/${briefSlug}`)
  return { success: true, published: isAdmin }
}

// An expert/organisation's endorsement of a specific answer — role-gated
// (belt-and-suspenders, RLS also enforces this). No "has an answer" check
// needed anymore since an answer_id only ever exists once the answer row
// itself does.
export async function endorseAnswer(answerId: string, briefSlug: string): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'You must be logged in to endorse an answer.' }

  const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (!userData || !CONTRIBUTOR_ROLES.includes(userData.role)) {
    return { error: 'Only experts and organisations can endorse answers.' }
  }

  const { error } = await supabase
    .from('question_answer_endorsements')
    .upsert({ answer_id: answerId, user_id: user.id }, { onConflict: 'answer_id,user_id', ignoreDuplicates: true })

  if (error) return { error: 'Failed to endorse. Please try again.' }

  revalidatePath(`/briefs/${briefSlug}`)
  return { success: true }
}

// ---------------------------------------------------------------------------
// Voter list — the "who voted/endorsed this" modal (requested 2026-08-13).
// Read-only, fetched on demand (only when a viewer opens the modal) rather
// than bundled into the page's initial data, since most viewers never open
// it and a popular question/answer could have a long voter list.
// ---------------------------------------------------------------------------

export interface Voter {
  id: string
  display_name: string | null
  email: string
  avatar_url: string | null
  role: UserRole | null
  affiliation: string | null
  org_name: string | null
}

const VOTER_TABLES = {
  question_votes: { table: 'question_votes', idColumn: 'question_id' },
  answer_votes: { table: 'question_answer_votes', idColumn: 'answer_id' },
  answer_endorsements: { table: 'question_answer_endorsements', idColumn: 'answer_id' },
} as const

export async function getVoters(
  kind: keyof typeof VOTER_TABLES,
  id: string,
): Promise<{ voters: Voter[]; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { voters: [], error: 'You must be logged in to see who voted.' }

  const { table, idColumn } = VOTER_TABLES[kind]
  const { data, error } = await supabase
    .from(table)
    .select(`users(id, display_name, email, avatar_url, role, affiliation, org_name)`)
    .eq(idColumn, id)

  if (error) return { voters: [], error: 'Failed to load voters. Please try again.' }

  return { voters: (data ?? []).map((row) => (row as unknown as { users: Voter }).users).filter(Boolean) }
}
