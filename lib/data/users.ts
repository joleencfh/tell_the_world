import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'
import type { UserRow, UserRole } from '@/lib/types'

// Data-access layer for user reads. See lib/data/briefs.ts for the pattern.

type DB = SupabaseClient<Database>

// The columns shared by the "who am I / who is this" lookups across pages.
export interface UserBasic {
  id: string
  email: string
  full_name: string
  display_name: string
  role: UserRole
  avatar_url: string | null
}

export interface RecentUser {
  id: string
  display_name: string
  email: string
  role: UserRole
  avatar_url: string | null
  created_at: string
}

const BASIC_COLUMNS = 'id, email, full_name, display_name, role, avatar_url'

// Current/other user's basic identity. Callers that need fewer fields (e.g. the
// profile page's viewer) can use a subset of the returned shape.
export async function getUserBasic(db: DB, id: string): Promise<UserBasic | null> {
  const { data } = await db.from('users').select(BASIC_COLUMNS).eq('id', id).single()
  return (data as UserBasic | null) ?? null
}

// Full profile row for the profile page.
export async function getFullProfile(db: DB, id: string): Promise<UserRow | null> {
  const { data } = await db
    .from('users')
    .select(
      `id, email, full_name, display_name, bio, avatar_url, role,
       availability, website_url, preferred_language, created_at,
       primary_platform, platform_url, audience_size, content_language,
       publication_name, publication_url, reporting_beat,
       affiliation, job_title, credibility_url, areas_of_focus,
       org_name, org_size, org_mission`,
    )
    .eq('id', id)
    .single()

  return (data as UserRow | null) ?? null
}

// Recently joined members (excluding the given user), for the home dashboard.
export async function getRecentUsers(
  db: DB,
  excludeId: string,
  limit = 8,
): Promise<RecentUser[]> {
  const { data } = await db
    .from('users')
    .select('id, display_name, email, role, avatar_url, created_at')
    .neq('id', excludeId)
    .order('created_at', { ascending: false })
    .limit(limit)

  return (data ?? []) as RecentUser[]
}

// IDs of all experts and organisations — used to scope the home post feed.
export async function getExpertOrgIds(db: DB): Promise<string[]> {
  const { data } = await db.from('users').select('id').in('role', ['expert', 'organisation'])
  return (data ?? []).map((u) => u.id)
}
