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

export interface MediaPost {
  id: string
  post_type: PostType
  title: string
  body: string | null
  url: string | null
  user_id: string
  created_at: string
  users: QuoteAuthor
}

const MEDIA_SELECT =
  'id, post_type, title, body, url, user_id, created_at, users(id, display_name, email, avatar_url, role, affiliation, org_name)'

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

// Quote-type posts tagged with the brief's topic, for the brief page's
// Quotes section (design doc §2 row 7 — a filtered view of content_posts,
// not hand-curated).
export async function getQuotesByTopicTag(
  db: DB,
  topicTag: string | null,
  limit = 4,
): Promise<Quote[]> {
  if (!topicTag) return []

  const { data } = await db
    .from('content_posts')
    .select(
      'id, title, body, url, user_id, users(id, display_name, email, avatar_url, role, affiliation, org_name)',
    )
    .eq('post_type', 'quote')
    .contains('topic_tags', [topicTag])
    .order('created_at', { ascending: false })
    .limit(limit)

  return (data ?? []) as unknown as Quote[]
}

// Non-quote posts tagged with the brief's topic, for the brief page's Media
// section (design doc §2 row 8), with the author's pinned pick surfaced
// first as "Start here". If the pin exists but isn't tagged into the
// filtered set (e.g. mistagged), it's fetched separately so it never
// silently disappears — the author explicitly chose it.
export async function getMediaSection(
  db: DB,
  topicTag: string | null,
  pinnedPostId: string | null,
  limit = 6,
): Promise<MediaPost[]> {
  if (!topicTag) return []

  const { data } = await db
    .from('content_posts')
    .select(MEDIA_SELECT)
    .neq('post_type', 'quote')
    .contains('topic_tags', [topicTag])
    .order('created_at', { ascending: false })
    .limit(limit)

  const posts = (data ?? []) as unknown as MediaPost[]
  if (!pinnedPostId) return posts

  const pinnedIndex = posts.findIndex((p) => p.id === pinnedPostId)
  if (pinnedIndex === 0) return posts
  if (pinnedIndex > 0) {
    const [pinned] = posts.splice(pinnedIndex, 1)
    return [pinned, ...posts]
  }

  const { data: pinnedData } = await db
    .from('content_posts')
    .select(MEDIA_SELECT)
    .eq('id', pinnedPostId)
    .single()

  if (!pinnedData) return posts
  return [pinnedData as unknown as MediaPost, ...posts].slice(0, limit + 1)
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
