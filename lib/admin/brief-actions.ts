'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { randomUUID } from 'crypto'
import { requireAdmin } from '@/lib/auth/require'
import { getAdminClient } from '@/lib/supabase/admin'
import type { Json } from '@/lib/database.types'
import type { UserRole } from '@/lib/types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Brief {
  id: string
  title: string
  slug: string
  subtitle: string | null
  topic_tags: string[]
  // TODO(Part 1 step 4): drop once EditBriefScreen.tsx edits topic_tags
  // directly — kept so the admin form's single-tag field keeps compiling
  // unchanged (docs/design/brief-feature/brief-page-part2-plan.md §2, Part 0a).
  topic_tag: string | null
  pinned_media_post_id: string | null
  last_reviewed_at: string | null
  tldr_teaser: string | null
  visibility: 'public' | 'members_only'
  created_at: string
  updated_at: string
}

export interface MediaPickerOption {
  id: string
  title: string
  post_type: 'video' | 'article' | 'paper' | 'resource'
}

// For the FAQ-meta editor's collaborator/feedback-giver pickers (Part 6).
export interface UserOption {
  id: string
  display_name: string | null
  role: UserRole
}

// brief_faq_meta row (migration 039) — keyed by (brief_id, question), same
// fragile-but-accepted text match brief_faq_answers already uses. `id` is
// null for a question that doesn't have a row yet (saveBrief upserts by
// question, not id).
export interface FaqMetaRow {
  question: string
  collaboratorUserIds: string[]
  feedbackGiverUserIds: string[]
  richContent: unknown
}

export type BriefSectionType =
  | 'tldr'
  | 'use_this'
  | 'featured_news'
  | 'explainer'
  | 'where_experts_stand'
  | 'going_deeper'
  | 'faq'

export interface BriefSection {
  id: string
  brief_id: string
  section_type: BriefSectionType
  title: string | null
  content: string
  // Lexical editorState.toJSON() tree (migration 033) — see lib/data/briefs.ts's
  // BriefSection.rich_content for the read-side contract. Only explainer
  // sections use this; every other type leaves it null.
  rich_content: unknown
  display_order: number
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

export async function createBrief(): Promise<never> {
  await requireAdmin()

  const slug = `brief-${randomUUID()}`

  const { data: brief, error } = await getAdminClient()
    .from('briefs')
    .insert({ title: 'Untitled', slug, visibility: 'members_only' })
    .select('id')
    .single()

  if (error || !brief) throw new Error(error?.message ?? 'Failed to create brief')

  // use_this/featured_news/where_experts_stand are old-IA section types
  // dropped by the Two-Ink Bold rebuild (two-ink-bold-plan.md §2) — the enum
  // values and their renderers still exist (full removal is Part 10's job),
  // but new briefs must stop being seeded with them per that section's
  // explicit "stop authoring new rows of those types" instruction.
  await getAdminClient().from('brief_sections').insert([
    { brief_id: brief.id, section_type: 'tldr',                 content: '', display_order: 1 },
    { brief_id: brief.id, section_type: 'explainer',             content: '', display_order: 2 },
    { brief_id: brief.id, section_type: 'going_deeper',          content: '', display_order: 3 },
    { brief_id: brief.id, section_type: 'faq',                   content: '', display_order: 4 },
  ])

  redirect(`/admin/briefs/${brief.id}`)
}

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

export async function getBrief(id: string): Promise<{
  brief: Brief | null
  sections: BriefSection[]
  faqMeta: FaqMetaRow[]
  error: string | null
}> {
  await requireAdmin()

  const [briefResult, sectionsResult, faqMetaResult] = await Promise.all([
    getAdminClient().from('briefs').select('*').eq('id', id).single(),
    getAdminClient().from('brief_sections').select('*').eq('brief_id', id).order('display_order'),
    getAdminClient()
      .from('brief_faq_meta')
      .select('question, collaborator_user_ids, feedback_giver_user_ids, answer_rich_content')
      .eq('brief_id', id),
  ])

  if (briefResult.error) return { brief: null, sections: [], faqMeta: [], error: briefResult.error.message }

  const rawBrief = briefResult.data as Brief
  const brief: Brief = { ...rawBrief, topic_tag: rawBrief.topic_tags[0] ?? null }

  return {
    brief,
    sections: (sectionsResult.data ?? []) as BriefSection[],
    faqMeta: (faqMetaResult.data ?? []).map((row) => ({
      question: row.question,
      collaboratorUserIds: row.collaborator_user_ids,
      feedbackGiverUserIds: row.feedback_giver_user_ids,
      richContent: row.answer_rich_content,
    })),
    error: null,
  }
}

// User picker for the FAQ-meta editor's collaborator/feedback-giver fields
// (Part 6) — same shape/purpose as getMediaPickerOptions above.
export async function getUserOptions(): Promise<UserOption[]> {
  await requireAdmin()

  const { data } = await getAdminClient()
    .from('users')
    .select('id, display_name, role')
    .order('display_name', { ascending: true })
    .limit(500)

  return (data ?? []) as UserOption[]
}

// Non-quote posts, for the "pinned media" picker in the brief editor
// (design doc §2 row 8 — the pin must be a media item, not a quote).
export async function getMediaPickerOptions(): Promise<MediaPickerOption[]> {
  await requireAdmin()

  const { data } = await getAdminClient()
    .from('content_posts')
    .select('id, title, post_type')
    .neq('post_type', 'quote')
    .order('created_at', { ascending: false })
    .limit(200)

  return (data ?? []) as MediaPickerOption[]
}

// ---------------------------------------------------------------------------
// Slug helpers
// ---------------------------------------------------------------------------

// Placeholder slugs generated by createBrief look like brief-<uuid>
const PLACEHOLDER_SLUG = /^brief-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

async function uniqueSlug(base: string, briefId: string): Promise<string> {
  const candidate = base || `brief-${briefId.slice(0, 8)}`
  const { data } = await getAdminClient()
    .from('briefs')
    .select('slug')
    .like('slug', `${candidate}%`)
    .neq('id', briefId)

  const taken = new Set((data ?? []).map((r: { slug: string }) => r.slug))
  if (!taken.has(candidate)) return candidate
  for (let i = 2; ; i++) {
    if (!taken.has(`${candidate}-${i}`)) return `${candidate}-${i}`
  }
}

// ---------------------------------------------------------------------------
// Save
// ---------------------------------------------------------------------------

// A null `id` means the row doesn't exist in brief_sections yet (added
// client-side via EditBriefScreen's "Add explainer subsection" button, Part
// 3) — inserted rather than updated. Any pre-existing row whose id isn't in
// this list gets deleted, scoped to section_type='explainer' only: that's
// currently the only type this editor lets the author add/remove, so
// restricting the diff-delete to it guards the other (fixed, one-per-brief)
// section types against being wiped by an unrelated client-state bug.
export async function saveBrief(
  briefId: string,
  data: {
    title: string
    subtitle: string
    topicTag: string
    tldrTeaser: string
    pinnedMediaPostId: string | null
    visibility: 'public' | 'members_only'
    sections: Array<{
      id: string | null
      section_type: BriefSectionType
      title: string | null
      content: string
      rich_content: unknown
      display_order: number
    }>
    faqMeta: FaqMetaRow[]
  }
): Promise<{ success?: boolean; error?: string; sections?: BriefSection[] }> {
  await requireAdmin()

  // saveBrief's public param is still a single topicTag string — the admin
  // form (EditBriefScreen.tsx) isn't updated to a multi-tag input until Part
  // 1 step 4. Written through as a one-element (or empty) topic_tags array
  // so the underlying column stays the source of truth.
  const topicTagTrimmed = data.topicTag.trim()

  const updates: Record<string, unknown> = {
    title: data.title,
    subtitle: data.subtitle.trim() || null,
    topic_tags: topicTagTrimmed ? [topicTagTrimmed] : [],
    tldr_teaser: data.tldrTeaser.trim() || null,
    pinned_media_post_id: data.pinnedMediaPostId,
    visibility: data.visibility,
  }

  // Replace the placeholder slug with a title-derived one on the first save
  // with a real title. Established slugs never change — brief URLs are public.
  const { data: existing } = await getAdminClient()
    .from('briefs')
    .select('slug')
    .eq('id', briefId)
    .single()

  const title = data.title.trim()
  if (existing && PLACEHOLDER_SLUG.test(existing.slug) && title && title !== 'Untitled') {
    updates.slug = await uniqueSlug(slugify(title), briefId)
  }

  const { error: briefError } = await getAdminClient()
    .from('briefs')
    .update(updates)
    .eq('id', briefId)

  if (briefError) return { error: briefError.message }

  const { data: existingSections } = await getAdminClient()
    .from('brief_sections')
    .select('id, section_type')
    .eq('brief_id', briefId)

  const incomingIds = new Set(data.sections.filter((s) => s.id).map((s) => s.id))
  const toDelete = (existingSections ?? []).filter(
    (s) => s.section_type === 'explainer' && !incomingIds.has(s.id),
  )
  if (toDelete.length > 0) {
    const { error } = await getAdminClient()
      .from('brief_sections')
      .delete()
      .in('id', toDelete.map((s) => s.id))
    if (error) return { error: error.message }
  }

  for (const section of data.sections) {
    const titleValue = section.title?.trim() || null
    if (section.id) {
      const { error } = await getAdminClient()
        .from('brief_sections')
        .update({
          content: section.content,
          rich_content: section.rich_content as Json,
          display_order: section.display_order,
          title: titleValue,
        })
        .eq('id', section.id)
      if (error) return { error: error.message }
    } else {
      const { error } = await getAdminClient().from('brief_sections').insert({
        brief_id: briefId,
        section_type: section.section_type,
        title: titleValue,
        content: section.content,
        rich_content: section.rich_content as Json,
        display_order: section.display_order,
      })
      if (error) return { error: error.message }
    }
  }

  // FAQ per-question meta (Part 6, migration 039) — upserted by (brief_id,
  // question), same key brief_faq_answers already matches against. Not
  // diff-deleted when a question disappears/is renamed: same accepted
  // "detaches" fragility as brief_faq_answers, rather than extra bookkeeping
  // to prune orphaned rows that are harmless if left behind.
  if (data.faqMeta.length > 0) {
    const { error } = await getAdminClient()
      .from('brief_faq_meta')
      .upsert(
        data.faqMeta.map((row) => ({
          brief_id: briefId,
          question: row.question,
          collaborator_user_ids: row.collaboratorUserIds,
          feedback_giver_user_ids: row.feedbackGiverUserIds,
          answer_rich_content: row.richContent as Json,
        })),
        { onConflict: 'brief_id,question' },
      )
    if (error) return { error: error.message }
  }

  revalidatePath('/admin')
  revalidatePath(`/admin/briefs/${briefId}`)

  const { data: freshSections } = await getAdminClient()
    .from('brief_sections')
    .select('*')
    .eq('brief_id', briefId)
    .order('display_order')

  return { success: true, sections: (freshSections ?? []) as BriefSection[] }
}

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------

export async function deleteBrief(briefId: string): Promise<never> {
  await requireAdmin()

  await getAdminClient().from('briefs').delete().eq('id', briefId)
  redirect('/admin')
}
