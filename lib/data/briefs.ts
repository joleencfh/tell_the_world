import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'
import type { BriefVisibility, BriefSectionType } from '@/lib/types'

// Data-access layer for briefs and brief-related reads. Pages and actions call
// these instead of querying supabase.from(...) inline, so every brief query
// lives in one place. Each function takes the caller's client, so RLS is
// applied when passed the server/browser client and bypassed with the admin one.

type DB = SupabaseClient<Database>

export interface BriefSection {
  id: string
  section_type: BriefSectionType
  title: string | null
  content: string
  // Lexical editorState.toJSON() tree (migration 033) — null when this
  // section hasn't been authored via the rich text editor yet, in which
  // case `content` (plain text) is still the source of truth. Parse with
  // lib/richtext/types.ts's parseRichContent before rendering.
  rich_content: unknown
  content_version: number
  display_order: number
}

export interface BriefTimelineEvent {
  id: string
  event_name: string
  event_date: string
  display_order: number
}

export interface BriefWithSections {
  id: string
  title: string
  slug: string
  subtitle: string | null
  topic_tags: string[]
  // TODO(Part 1 step 4): drop once BriefView.tsx's hero renders topic_tags
  // directly — kept for now so the hero's single-tag read keeps compiling
  // unchanged (docs/design/brief-feature/brief-page-part2-plan.md §2, Part 0a).
  topic_tag: string | null
  pinned_media_post_id: string | null
  last_reviewed_at: string | null
  // Per-brief TL;DR one-liner (Part 3 step 1) — null falls back to
  // SECTION_META.tldr's generic description in BriefView.tsx.
  tldr_teaser: string | null
  visibility: BriefVisibility
  brief_sections: BriefSection[]
  // Part 5 step 2 — rendered as TimelineGraphic after the Explainer's first
  // subsection. Empty on most briefs; only populated where an admin has
  // authored one.
  brief_timeline_events: BriefTimelineEvent[]
}

export interface BriefListItem {
  id: string
  title: string
  slug: string
  // TLDR text — sourced from the tldr-type brief_sections row (briefs.tldr
  // was retired in migration 017), kept flat here for callers.
  tldr: string
  created_at: string
}

export interface RelatedBrief {
  id: string
  title: string
  slug: string
  topic_tags: string[]
  // TODO(Part 1 step 4): drop once related-briefs.tsx renders topic_tags
  // directly — see the matching TODO on BriefWithSections above.
  topic_tag: string | null
  created_at: string
}

export interface UserCorrectionProposal {
  id: string
  contribution_text: string
  status: 'pending' | 'approved' | 'dismissed'
  created_at: string
  briefs: { title: string; slug: string }
}

// Full brief + sections for the brief page. Returns null when the brief does
// not exist. When called with the RLS client, a logged-out visitor receives a
// members-only brief's metadata but no sections (policies 008/013).
export async function getBriefWithSectionsBySlug(
  db: DB,
  slug: string,
): Promise<BriefWithSections | null> {
  const { data, error } = await db
    .from('briefs')
    .select(
      'id, title, slug, subtitle, topic_tags, pinned_media_post_id, last_reviewed_at, tldr_teaser, visibility, brief_sections(id, section_type, title, content, rich_content, content_version, display_order), brief_timeline_events(id, event_name, event_date, display_order)',
    )
    .eq('slug', slug)
    .single()

  if (error || !data) return null
  return { ...data, topic_tag: data.topic_tags[0] ?? null } as BriefWithSections
}

export async function getRecentBriefs(db: DB, limit = 5): Promise<BriefListItem[]> {
  const { data } = await db
    .from('briefs')
    .select('id, title, slug, created_at, brief_sections!inner(content)')
    .eq('brief_sections.section_type', 'tldr')
    .order('created_at', { ascending: false })
    .limit(limit)

  return (data ?? []).map((b) => ({
    id: b.id,
    title: b.title,
    slug: b.slug,
    created_at: b.created_at,
    tldr: b.brief_sections[0]?.content ?? '',
  }))
}

// Related briefs — other briefs sharing at least one of the current brief's
// topic_tags, most recent first, excluding itself. Like the rest of this
// file, visibility is left to RLS on the passed-in client rather than
// filtered here: briefs metadata (title/slug/topic_tags) is world-readable
// (migration 013), so a logged-out visitor sees the same related list as a
// member, same as getRecentBriefs above. An empty topic_tags array means
// "nothing to relate this brief to" — short-circuit before querying rather
// than returning every brief with no tags (they wouldn't share a real topic).
export async function getRelatedBriefs(
  db: DB,
  briefId: string,
  topicTags: string[],
  limit = 3,
): Promise<RelatedBrief[]> {
  if (topicTags.length === 0) return []

  const { data } = await db
    .from('briefs')
    .select('id, title, slug, topic_tags, created_at')
    .overlaps('topic_tags', topicTags)
    .neq('id', briefId)
    .order('created_at', { ascending: false })
    .limit(limit)

  return (data ?? []).map((b) => ({ ...b, topic_tag: b.topic_tags[0] ?? null }))
}

// Correction proposals authored by a user, for their profile. RLS returns
// approved proposals to everyone plus the user's own pending/dismissed ones.
export async function getUserCorrectionProposals(
  db: DB,
  userId: string,
): Promise<UserCorrectionProposal[]> {
  const { data } = await db
    .from('brief_correction_proposals')
    .select('id, contribution_text, status, created_at, briefs(title, slug)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  return (data ?? []) as unknown as UserCorrectionProposal[]
}
