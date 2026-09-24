'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth/require'
import { getAdminClient } from '@/lib/supabase/admin'
import { fetchLinkPreview } from '@/lib/links/link-preview'
import { fetchAndStoreImage } from '@/lib/links/store-image'
import * as adminData from '@/lib/data/admin'
import type { PagedResult } from '@/lib/data/admin'

// ---------------------------------------------------------------------------
// Covered By moderation (two-ink-bold-plan.md Part 7) — url/outlet/title/
// image were extracted server-side from the submitted URL's Open Graph
// tags at submission time (lib/links/link-preview.ts), so there's nothing
// left to edit here beyond approve/dismiss. score is admin-set at approval
// time (no separate UI for it, per the plan) — an optional numeric field
// on the approve action itself.
// ---------------------------------------------------------------------------

export interface PendingCoverage {
  id: string
  url: string
  outlet_name: string
  title: string
  image_url: string | null
  published_date: string | null
  created_at: string
  brief_id: string
  briefs: { title: string; slug: string }
  users: { id: string; display_name: string | null; email: string; role: string }
}

export async function getPendingCoverage(page = 1): Promise<PagedResult<PendingCoverage>> {
  await requireAdmin()
  return adminData.getPendingCoverage(getAdminClient(), page)
}

export async function approveCoverage(coverageId: string, score: number | null): Promise<{ success?: boolean; error?: string }> {
  await requireAdmin()

  const { error } = await getAdminClient()
    .from('brief_coverage')
    .update({ status: 'published', score })
    .eq('id', coverageId)

  if (error) return { error: error.message }

  revalidatePath('/admin')
  return { success: true }
}

// No 'dismissed' status exists for this table (only pending/published,
// same as brief_ctas) — dismissal just deletes the row.
export async function dismissCoverage(coverageId: string): Promise<{ success?: boolean; error?: string }> {
  await requireAdmin()

  const { error } = await getAdminClient()
    .from('brief_coverage')
    .delete()
    .eq('id', coverageId)

  if (error) return { error: error.message }

  revalidatePath('/admin')
  return { success: true }
}

// Re-scrapes a coverage row's article URL for a fresh og:image and re-hosts
// it on Supabase storage, same as submitCoverage does at submission time.
// Exists for rows whose image never got hosted this way in the first place
// — either the scrape/fetch failed silently at submit time (both
// link-preview.ts and store-image.ts never throw, so a bad fetch just
// leaves image_url null or, for rows inserted before the re-hosting fix
// landed, pointing straight at the outlet's own CDN, which the CSP's
// img-src then silently blocks in the browser).
export async function backfillCoverageImage(coverageId: string): Promise<{ success?: boolean; error?: string; imageUrl?: string }> {
  await requireAdmin()
  const admin = getAdminClient()

  const { data: row, error: fetchErr } = await admin
    .from('brief_coverage')
    .select('id, url, submitted_by, briefs(slug)')
    .eq('id', coverageId)
    .single()

  if (fetchErr || !row) return { error: 'Coverage row not found.' }

  const preview = await fetchLinkPreview(row.url)
  if (!preview.imageUrl) return { error: 'No image found on the article page.' }

  const hosted = await fetchAndStoreImage(admin, preview.imageUrl, row.submitted_by ?? 'admin-backfill')
  if (!hosted) return { error: 'Could not fetch or store that image.' }

  const { error: updateErr } = await admin.from('brief_coverage').update({ image_url: hosted }).eq('id', coverageId)
  if (updateErr) return { error: updateErr.message }

  revalidatePath('/admin')
  if (row.briefs?.slug) revalidatePath(`/briefs/${row.briefs.slug}`)
  return { success: true, imageUrl: hosted }
}
