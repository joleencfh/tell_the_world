import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'
import type { Application, PendingQuestion, PendingCorrectionProposal, BriefProposal, PendingFaqAnswer } from '@/lib/admin/actions'

// Data-access layer for admin queue reads. See lib/data/briefs.ts for the
// pattern. No auth here — callers (lib/admin/actions.ts) call requireAdmin()
// before reaching these, since the exported actions are public endpoints.

type DB = SupabaseClient<Database>

export const ADMIN_PAGE_SIZE = 20

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

export async function getBriefProposals(db: DB, page = 1): Promise<PagedResult<BriefProposal>> {
  const { data, error, count } = await db
    .from('brief_proposals')
    .select('*', { count: 'exact' })
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .range(...range(page))

  return { data: error ? [] : (data as BriefProposal[]) ?? [], count: count ?? 0 }
}
