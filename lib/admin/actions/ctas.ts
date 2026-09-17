'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth/require'
import { getAdminClient } from '@/lib/supabase/admin'
import * as adminData from '@/lib/data/admin'
import type { PagedResult } from '@/lib/data/admin'

// ---------------------------------------------------------------------------
// Calls to action moderation (two-ink-bold-plan.md Part 6) — free-text
// suggestion + a link, so pending → published via admin approval, same
// shape as FAQ answers moderation above.
// ---------------------------------------------------------------------------

export interface PendingCta {
  id: string
  title: string
  description: string | null
  link_url: string
  created_at: string
  brief_id: string
  briefs: { title: string; slug: string }
  users: { id: string; display_name: string | null; email: string; role: string }
}

export async function getPendingCtas(page = 1): Promise<PagedResult<PendingCta>> {
  await requireAdmin()
  return adminData.getPendingCtas(getAdminClient(), page)
}

// Published CTAs + the reorder control (brief-page-part2-plan.md §2, Part
// 8) — display_order is nullable and only overrides the default
// created_at-descending order when explicitly set, see migration 043.
export interface PublishedCta {
  id: string
  title: string
  display_order: number | null
  created_at: string
  brief_id: string
  briefs: { title: string; slug: string }
}

export async function getPublishedCtasAdmin(page = 1): Promise<PagedResult<PublishedCta>> {
  await requireAdmin()
  return adminData.getPublishedCtasAdmin(getAdminClient(), page)
}

export async function setCtaDisplayOrder(ctaId: string, briefSlug: string, displayOrder: number | null): Promise<{ success?: boolean; error?: string }> {
  await requireAdmin()

  const { error } = await getAdminClient()
    .from('brief_ctas')
    .update({ display_order: displayOrder })
    .eq('id', ctaId)

  if (error) return { error: error.message }

  revalidatePath('/admin')
  revalidatePath(`/briefs/${briefSlug}`)
  return { success: true }
}

export async function approveCta(ctaId: string): Promise<{ success?: boolean; error?: string }> {
  await requireAdmin()

  const { error } = await getAdminClient()
    .from('brief_ctas')
    .update({ status: 'published' })
    .eq('id', ctaId)

  if (error) return { error: error.message }

  revalidatePath('/admin')
  return { success: true }
}

// No 'dismissed' status exists for this table (only pending/published, see
// migration 026) — dismissal just deletes the row, same as FAQ answers'
// dismissFaqAnswer above.
export async function dismissCta(ctaId: string): Promise<{ success?: boolean; error?: string }> {
  await requireAdmin()

  const { error } = await getAdminClient()
    .from('brief_ctas')
    .delete()
    .eq('id', ctaId)

  if (error) return { error: error.message }

  revalidatePath('/admin')
  return { success: true }
}
