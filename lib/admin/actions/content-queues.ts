'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth/require'
import { getAdminClient } from '@/lib/supabase/admin'
import * as adminData from '@/lib/data/admin'
import type { PagedResult } from '@/lib/data/admin'

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
// review/endorsement trust signal in lib/briefs/actions/reviews.ts's
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
