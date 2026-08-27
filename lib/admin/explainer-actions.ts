'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth/require'
import { getAdminClient } from '@/lib/supabase/admin'
import * as adminData from '@/lib/data/admin'
import type { PagedResult } from '@/lib/data/admin'

// Contentious points moderation — split out of lib/admin/actions.ts
// (already at the repo's max-lines budget) rather than grown further, same
// "free text, pending -> published via admin approval" shape as FAQ
// answers moderation in that file. See supabase/047_explainer_engagement.sql.

export interface PendingContentiousPoint {
  id: string
  subsection_label: string | null
  body: string
  created_at: string
  brief_id: string
  briefs: { title: string; slug: string }
  users: { id: string; display_name: string | null; email: string; role: string }
}

export async function getPendingContentiousPoints(page = 1): Promise<PagedResult<PendingContentiousPoint>> {
  await requireAdmin()
  return adminData.getPendingContentiousPoints(getAdminClient(), page)
}

export async function approveContentiousPoint(id: string): Promise<{ success?: boolean; error?: string }> {
  await requireAdmin()

  const { error } = await getAdminClient()
    .from('explainer_contentious_points')
    .update({ status: 'published' })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/admin')
  return { success: true }
}

// No 'dismissed' status exists for this table (only pending/published, same
// shape as brief_faq_answers) — dismissal just deletes the row.
export async function dismissContentiousPoint(id: string): Promise<{ success?: boolean; error?: string }> {
  await requireAdmin()

  const { error } = await getAdminClient()
    .from('explainer_contentious_points')
    .delete()
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/admin')
  return { success: true }
}
