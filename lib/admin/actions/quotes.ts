'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth/require'
import { getAdminClient } from '@/lib/supabase/admin'
import * as adminData from '@/lib/data/admin'
import type { PagedResult } from '@/lib/data/admin'
import type { Json } from '@/lib/database.types'

// ---------------------------------------------------------------------------
// Content post moderation (brief-page-part2-plan.md §2, Part 4, widened by
// the deterministic clarity check — lib/clarity/check.ts) — pending →
// published via admin approval, same shape as CTA moderation above. A row
// lands here from either submitQuote (lib/briefs/actions/quotes.ts, brief_id set,
// post_type always 'quote') or createPost (lib/posts/actions.ts, brief_id
// null, any post_type) — a row is 'pending' only when the clarity check
// actually flagged it (or, for submitQuote specifically, unconditionally
// for an admin submitter — a pre-existing quirk unrelated to the check).
// flagged_terms records why, so a reviewer doesn't need the check re-run.
// ---------------------------------------------------------------------------

export interface PendingContentPost {
  id: string
  post_type: string
  title: string
  body: string | null
  topic_tags: string[]
  flagged_terms: Json | null
  created_at: string
  brief_id: string | null
  briefs: { title: string; slug: string } | null
  users: { id: string; display_name: string | null; email: string; role: string }
}

export async function getPendingContentPosts(page = 1): Promise<PagedResult<PendingContentPost>> {
  await requireAdmin()
  return adminData.getPendingContentPosts(getAdminClient(), page)
}

export async function approveQuote(quoteId: string): Promise<{ success?: boolean; error?: string }> {
  await requireAdmin()

  const { error } = await getAdminClient()
    .from('content_posts')
    .update({ status: 'published' })
    .eq('id', quoteId)

  if (error) return { error: error.message }

  revalidatePath('/admin')
  return { success: true }
}

// No 'dismissed' status exists for this table (only pending/published, same
// as brief_ctas) — dismissal just deletes the row.
export async function dismissQuote(quoteId: string): Promise<{ success?: boolean; error?: string }> {
  await requireAdmin()

  const { error } = await getAdminClient()
    .from('content_posts')
    .delete()
    .eq('id', quoteId)

  if (error) return { error: error.message }

  revalidatePath('/admin')
  return { success: true }
}

// ---------------------------------------------------------------------------
// Sourced quotes (attribution to a non-platform-member) — migration
// 052_content_posts_external_quote_attribution.sql. Unlike submitQuote
// (lib/briefs/actions/quotes.ts), which always goes into the pending queue above,
// there's no other member to moderate here — an admin-authored quote
// publishes immediately.
// ---------------------------------------------------------------------------

export interface CreateSourcedQuoteInput {
  quoteSource: 'person' | 'document' | 'ai'
  sourceName: string
  sourceDetail: string
  sourceUrl: string
  // 'person' only — which social platform the quoted post came from, so the
  // card shows that platform's icon instead of the generic person glyph.
  sourcePlatform?: 'x' | 'linkedin' | null
  // 'document'/'ai' only — links to a reusable source_organizations logo.
  sourceOrgId?: string | null
  body: string
  tags: string[]
}

// Shared validation for create/update — both need the same body/name/detail/
// url checks, only the write (insert vs. update) differs.
function validateSourcedQuoteInput(
  input: Pick<CreateSourcedQuoteInput, 'body' | 'sourceName' | 'sourceDetail' | 'sourceUrl' | 'tags'>,
): { error: string } | { trimmedBody: string; sourceName: string; sourceDetail: string; sourceUrl: string; cleanTags: string[] } {
  const trimmedBody = input.body.trim()
  if (!trimmedBody) return { error: 'Quote cannot be empty.' }
  if (trimmedBody.length > 500) return { error: 'Quote must be under 500 characters.' }

  const sourceName = input.sourceName.trim()
  if (!sourceName) return { error: 'Name is required.' }
  if (sourceName.length > 200) return { error: 'Name must be under 200 characters.' }

  const sourceDetail = input.sourceDetail.trim()
  if (sourceDetail.length > 200) return { error: 'Title / detail must be under 200 characters.' }

  const sourceUrl = input.sourceUrl.trim()
  let parsedUrl: URL
  try {
    parsedUrl = new URL(sourceUrl)
  } catch {
    return { error: 'Source link must be a valid URL.' }
  }
  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    return { error: 'Source link must start with http:// or https://.' }
  }

  const cleanTags = [...new Set(input.tags.map((t) => t.trim()).filter(Boolean))].slice(0, 10)

  return { trimmedBody, sourceName, sourceDetail, sourceUrl, cleanTags }
}

export async function createSourcedQuote(
  briefId: string,
  briefSlug: string,
  input: CreateSourcedQuoteInput,
): Promise<{ error?: string; success?: boolean }> {
  await requireAdmin()

  const validated = validateSourcedQuoteInput(input)
  if ('error' in validated) return validated
  const { trimmedBody, sourceName, sourceDetail, sourceUrl, cleanTags } = validated

  const { error } = await getAdminClient().from('content_posts').insert({
    user_id: null,
    post_type: 'quote',
    title: trimmedBody,
    brief_id: briefId,
    topic_tags: cleanTags,
    status: 'published',
    quote_source: input.quoteSource,
    source_name: sourceName,
    source_detail: sourceDetail || null,
    url: sourceUrl,
    source_platform: input.quoteSource === 'person' ? input.sourcePlatform ?? null : null,
    source_org_id: input.quoteSource === 'document' || input.quoteSource === 'ai' ? input.sourceOrgId ?? null : null,
  })

  if (error) return { error: error.message }

  revalidatePath('/admin')
  revalidatePath(`/briefs/${briefSlug}`)
  return { success: true }
}

// Full edit of an existing non-member-sourced quote (person/document/ai) —
// admin-only, any quote on the platform. Deliberately doesn't allow
// switching to/from 'member': that would mean reassigning user_id and
// re-satisfying 052's attribution check constraint from the other side,
// a materially different (and riskier) operation than editing the fields
// of an already-non-member quote. Member-authored quotes are edited via
// updateMemberQuoteAdmin (body/tags only — see its own comment) instead.
export async function updateSourcedQuote(
  quoteId: string,
  briefSlug: string,
  input: CreateSourcedQuoteInput,
): Promise<{ error?: string; success?: boolean }> {
  await requireAdmin()

  const validated = validateSourcedQuoteInput(input)
  if ('error' in validated) return validated
  const { trimmedBody, sourceName, sourceDetail, sourceUrl, cleanTags } = validated

  const admin = getAdminClient()
  const { data: existing } = await admin.from('content_posts').select('quote_source').eq('id', quoteId).single()
  if (!existing) return { error: 'Quote not found.' }
  if (existing.quote_source === 'member') {
    return { error: 'This quote is attributed to a platform member and can’t be edited here.' }
  }

  const { error } = await admin
    .from('content_posts')
    .update({
      title: trimmedBody,
      topic_tags: cleanTags,
      quote_source: input.quoteSource,
      source_name: sourceName,
      source_detail: sourceDetail || null,
      url: sourceUrl,
      source_platform: input.quoteSource === 'person' ? input.sourcePlatform ?? null : null,
      source_org_id: input.quoteSource === 'document' || input.quoteSource === 'ai' ? input.sourceOrgId ?? null : null,
    })
    .eq('id', quoteId)

  if (error) return { error: error.message }

  revalidatePath('/admin')
  revalidatePath(`/briefs/${briefSlug}`)
  return { success: true }
}

// Admin editing a member-authored quote — body/tags only, same field set
// updateOwnQuote (lib/briefs/actions/quotes.ts) offers the quote's own author,
// since a 'member' quote has no source_name/detail/url/platform/org to
// edit (always null for this quote_source). Bypasses the clarity gate and
// ownership check that path applies to itself — admin moderation doesn't
// need either.
export async function updateMemberQuoteAdmin(
  quoteId: string,
  briefSlug: string,
  body: string,
  tags: string[],
): Promise<{ error?: string; success?: boolean }> {
  await requireAdmin()

  const trimmedBody = body.trim()
  if (!trimmedBody) return { error: 'Quote cannot be empty.' }
  if (trimmedBody.length > 500) return { error: 'Quote must be under 500 characters.' }

  const cleanTags = [...new Set(tags.map((t) => t.trim()).filter(Boolean))].slice(0, 10)

  const { error } = await getAdminClient()
    .from('content_posts')
    .update({ title: trimmedBody, topic_tags: cleanTags })
    .eq('id', quoteId)

  if (error) return { error: error.message }

  revalidatePath('/admin')
  revalidatePath(`/briefs/${briefSlug}`)
  return { success: true }
}

// ---------------------------------------------------------------------------
// Source organization logos — reusable per-company icon for document/ai-
// sourced quotes (e.g. every quote attributed to "OpenAI" reuses the same
// uploaded logo instead of re-uploading it per quote). Mirrors
// app/profile/[id]/actions.ts's uploadAvatar, but admin-only and keyed by
// organization name rather than by user id.
// ---------------------------------------------------------------------------

export interface SourceOrganizationOption {
  id: string
  name: string
  logo_url: string
}

export async function getSourceOrganizations(): Promise<SourceOrganizationOption[]> {
  await requireAdmin()

  const { data } = await getAdminClient()
    .from('source_organizations')
    .select('id, name, logo_url')
    .order('name')

  return data ?? []
}

const MAX_LOGO_BYTES = 2 * 1024 * 1024
const ALLOWED_LOGO_TYPES: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
}

// Upserts by name (case-insensitive, via source_organizations.name_key) —
// uploading a logo for a name that already has one replaces it, so admins
// can fix a bad logo without a separate delete step.
export async function uploadSourceOrganizationLogo(
  name: string,
  formData: FormData,
): Promise<{ error?: string; organization?: SourceOrganizationOption }> {
  await requireAdmin()

  const trimmedName = name.trim()
  if (!trimmedName) return { error: 'Organization name is required.' }
  if (trimmedName.length > 200) return { error: 'Organization name must be under 200 characters.' }

  const file = formData.get('file')
  if (!(file instanceof File)) return { error: 'No file provided.' }

  const ext = ALLOWED_LOGO_TYPES[file.type]
  if (!ext) return { error: 'Please upload a PNG, JPEG, WebP, or SVG image.' }
  if (file.size > MAX_LOGO_BYTES) return { error: 'Logo must be smaller than 2MB.' }

  const admin = getAdminClient()
  const nameKey = trimmedName.toLowerCase()
  const path = `${nameKey.replace(/[^a-z0-9]+/g, '-')}-${Date.now()}.${ext}`

  const { error: uploadError } = await admin.storage
    .from('source-logos')
    .upload(path, file, { contentType: file.type })

  if (uploadError) return { error: uploadError.message }

  const {
    data: { publicUrl },
  } = admin.storage.from('source-logos').getPublicUrl(path)

  const { data: existing } = await admin
    .from('source_organizations')
    .select('id')
    .eq('name_key', nameKey)
    .maybeSingle()

  const { data, error } = existing
    ? await admin
        .from('source_organizations')
        .update({ name: trimmedName, logo_url: publicUrl })
        .eq('id', existing.id)
        .select('id, name, logo_url')
        .single()
    : await admin
        .from('source_organizations')
        .insert({ name: trimmedName, logo_url: publicUrl })
        .select('id, name, logo_url')
        .single()

  if (error) return { error: error.message }
  return { organization: data }
}
