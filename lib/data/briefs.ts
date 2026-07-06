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
  content: string
  display_order: number
}

export interface BriefWithSections {
  id: string
  title: string
  slug: string
  tldr: string
  visibility: BriefVisibility
  brief_sections: BriefSection[]
}

export interface BriefListItem {
  id: string
  title: string
  slug: string
  tldr: string
  created_at: string
}

export interface UserContribution {
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
      'id, title, slug, tldr, visibility, brief_sections(id, section_type, content, display_order)',
    )
    .eq('slug', slug)
    .single()

  if (error || !data) return null
  return data as BriefWithSections
}

export async function getRecentBriefs(db: DB, limit = 5): Promise<BriefListItem[]> {
  const { data } = await db
    .from('briefs')
    .select('id, title, slug, tldr, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)

  return (data ?? []) as BriefListItem[]
}

// Contributions authored by a user, for their profile. RLS returns approved
// contributions to everyone plus the user's own pending/dismissed ones.
export async function getUserContributions(
  db: DB,
  userId: string,
): Promise<UserContribution[]> {
  const { data } = await db
    .from('brief_contributions')
    .select('id, contribution_text, status, created_at, briefs(title, slug)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  return (data ?? []) as unknown as UserContribution[]
}
