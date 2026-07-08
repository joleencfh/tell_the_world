import type { SupabaseClient } from '@supabase/supabase-js'

// ---------------------------------------------------------------------------
// Search params
// ---------------------------------------------------------------------------

export type SearchParams = {
  q?: string           // keyword
  role?: string        // 'creator' | 'expert' | 'organisation' | 'journalist'
  language?: string    // matches users.content_language
  topic?: string       // single topic string
  availability?: string // 'open' | 'limited' | 'unavailable'
  upage?: string        // users list page (1-indexed)
  qpage?: string        // quotes list page (1-indexed)
}

export const DIRECTORY_PAGE_SIZE = 50

export interface PagedResult<T> {
  data: T[]
  count: number
}

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

export type UserResult = {
  id: string
  display_name: string | null
  bio: string | null
  avatar_url: string | null
  role: 'creator' | 'expert' | 'organisation' | 'journalist' | 'admin'
  availability: 'open' | 'limited' | 'unavailable' | null
  affiliation: string | null
  org_name: string | null
  primary_platform: string | null
  areas_of_focus: string[] | null
  content_language: string | null
}

export type QuoteAuthor = {
  id: string
  display_name: string | null
  avatar_url: string | null
  role: 'creator' | 'expert' | 'organisation' | 'journalist' | 'admin'
  affiliation: string | null
  org_name: string | null
}

export type QuoteResult = {
  id: string
  body: string | null
  topic_tags: string[] | null
  created_at: string
  users: QuoteAuthor
}

// ---------------------------------------------------------------------------
// Sanitization
// ---------------------------------------------------------------------------

// PostgREST .or() filters are comma/paren-delimited expression strings, so a
// search term containing those characters could alter the filter shape
// (filter injection). Strip the structural characters before interpolating.
// Applied to single .ilike() filters too, for consistency.
function sanitizeSearchTerm(raw: string): string {
  return raw
    .replace(/[,()"'\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function searchUsers(
  supabase: SupabaseClient,
  params: SearchParams,
  page = 1,
): Promise<PagedResult<UserResult>> {
  let query = supabase
    .from('users')
    .select(
      'id, display_name, bio, avatar_url, role, availability, affiliation, org_name, primary_platform, areas_of_focus, content_language',
      { count: 'exact' },
    )
    // Never expose admin accounts in the directory
    .neq('role', 'admin')

  if (params.q) {
    const q = sanitizeSearchTerm(params.q)
    if (q) {
      query = query.or(
        `display_name.ilike.%${q}%,bio.ilike.%${q}%,affiliation.ilike.%${q}%,org_name.ilike.%${q}%`,
      )
    }
  }

  if (params.role) {
    query = query.eq('role', params.role)
  }

  if (params.language) {
    query = query.eq('content_language', params.language)
  }

  if (params.availability) {
    query = query.eq('availability', params.availability)
  }

  if (params.topic) {
    query = query.contains('areas_of_focus', [params.topic])
  }

  const from = (page - 1) * DIRECTORY_PAGE_SIZE
  const { data, error, count } = await query
    .order('display_name', { ascending: true })
    .range(from, from + DIRECTORY_PAGE_SIZE - 1)

  if (error) {
    console.error('searchUsers error:', error.message)
    return { data: [], count: 0 }
  }

  return { data: (data ?? []) as UserResult[], count: count ?? 0 }
}

export async function searchQuotes(
  supabase: SupabaseClient,
  params: SearchParams,
  page = 1,
): Promise<PagedResult<QuoteResult>> {
  let query = supabase
    .from('content_posts')
    .select('id, body, topic_tags, created_at, users(id, display_name, avatar_url, role, affiliation, org_name)', { count: 'exact' })
    .eq('post_type', 'quote')

  if (params.q) {
    const q = sanitizeSearchTerm(params.q)
    if (q) {
      query = query.ilike('body', `%${q}%`)
    }
  }

  if (params.topic) {
    query = query.contains('topic_tags', [params.topic])
  }

  // TODO: language filter for quotes — not possible with simple .eq() via join in v1
  // Upgrade path: filter after fetch, or use a DB view that denormalises content_language onto quotes

  const from = (page - 1) * DIRECTORY_PAGE_SIZE
  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, from + DIRECTORY_PAGE_SIZE - 1)

  if (error) {
    console.error('searchQuotes error:', error.message)
    return { data: [], count: 0 }
  }

  return { data: (data ?? []) as unknown as QuoteResult[], count: count ?? 0 }
}
