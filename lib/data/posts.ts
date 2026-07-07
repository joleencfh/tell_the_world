import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'
import type { UserRole, PostType } from '@/lib/types'

// Data-access layer for content_posts reads. See lib/data/briefs.ts for the pattern.

type DB = SupabaseClient<Database>

export interface PostAuthor {
  display_name: string | null
  email: string
  role: UserRole
  avatar_url: string | null
}

export interface FeedPost {
  id: string
  user_id: string
  post_type: PostType
  title: string
  body: string | null
  url: string | null
  created_at: string
  users: PostAuthor
}

export interface QuoteAuthor {
  id: string
  display_name: string | null
  email: string
  avatar_url: string | null
  role: UserRole
  affiliation: string | null
  org_name: string | null
}

export interface Quote {
  id: string
  title: string
  body: string | null
  url: string | null
  user_id: string
  users: QuoteAuthor
}

export interface ProfilePost {
  id: string
  user_id: string
  post_type: PostType
  title: string
  body: string | null
  url: string | null
  topic_tags: string[]
  created_at: string
}

// Recent posts by the given authors (experts/orgs), for the home feed.
export async function getPostsByAuthors(
  db: DB,
  authorIds: string[],
  limit = 10,
): Promise<FeedPost[]> {
  if (authorIds.length === 0) return []

  const { data } = await db
    .from('content_posts')
    .select(
      'id, user_id, post_type, title, body, url, created_at, users(display_name, email, role, avatar_url)',
    )
    .in('user_id', authorIds)
    .order('created_at', { ascending: false })
    .limit(limit)

  return (data ?? []) as unknown as FeedPost[]
}

// Most recent quote-type posts, for the brief page's "expert voices" band.
export async function getRecentQuotes(db: DB, limit = 4): Promise<Quote[]> {
  const { data } = await db
    .from('content_posts')
    .select(
      'id, title, body, url, user_id, users(id, display_name, email, avatar_url, role, affiliation, org_name)',
    )
    .eq('post_type', 'quote')
    .order('created_at', { ascending: false })
    .limit(limit)

  return (data ?? []) as unknown as Quote[]
}

// All posts by a single user, for their profile.
export async function getUserPosts(db: DB, userId: string, limit = 20): Promise<ProfilePost[]> {
  const { data } = await db
    .from('content_posts')
    .select('id, user_id, post_type, title, body, url, topic_tags, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  return (data ?? []) as ProfilePost[]
}
