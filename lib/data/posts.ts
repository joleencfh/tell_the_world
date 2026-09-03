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

// No email: this type also backs the Quotes/Media sections on the brief
// page, which anon visitors can read (019_anon_content_posts_read.sql) —
// anon's column grant on users excludes email, so selecting it here would
// fail for logged-out requests.
export interface QuoteAuthor {
  id: string
  display_name: string | null
  avatar_url: string | null
  role: UserRole
  affiliation: string | null
  org_name: string | null
}

// Discriminates a quote's attribution — a checked text column, not a
// Postgres enum (matches content_posts.status's own convention), so this
// is a hand-written union rather than derived from Database.
export type QuoteSource = 'member' | 'person' | 'document' | 'ai'

// Only meaningful when quote_source is 'person' — which social platform the
// quoted post came from, so the card can show that platform's icon instead
// of the generic person glyph (052's icon set).
export type QuotePlatform = 'x' | 'linkedin'

export interface QuoteOrganization {
  name: string
  logo_url: string
}

export interface Quote {
  id: string
  title: string
  body: string | null
  url: string | null
  user_id: string | null
  quote_source: QuoteSource
  source_name: string | null
  source_detail: string | null
  source_platform: QuotePlatform | null
  created_at: string
  updated_at: string
  topic_tags: string[]
  users: QuoteAuthor | null
  source_organizations: QuoteOrganization | null
  likeCount: number
  myLike: boolean
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
  'id, post_type, title, body, url, user_id, created_at, users(id, display_name, avatar_url, role, affiliation, org_name)'

const QUOTE_SELECT =
  'id, title, body, url, user_id, quote_source, source_name, source_detail, source_platform, created_at, updated_at, topic_tags, users!left(id, display_name, avatar_url, role, affiliation, org_name), source_organizations!left(name, logo_url)'

interface QuoteRow {
  id: string
  title: string
  body: string | null
  url: string | null
  user_id: string | null
  quote_source: QuoteSource
  source_name: string | null
  source_detail: string | null
  source_platform: QuotePlatform | null
  created_at: string
  updated_at: string
  topic_tags: string[]
  users: QuoteAuthor | null
  source_organizations: QuoteOrganization | null
}

// Attaches each row's like count and whether the given viewer has liked it
// (brief-page-part2-plan.md §2, Part 4 step 3) — same bulk-query-then-
// aggregate-in-JS shape as lib/data/coverage.ts's getPublishedCoverage.
// userId is null for a logged-out visitor (myLike always false; likes are
// still readable, migration 038's anon read policy).
async function attachLikes(db: DB, rows: QuoteRow[], userId: string | null): Promise<Quote[]> {
  const ids = rows.map((r) => r.id)
  if (ids.length === 0) return []

  const { data: likes } = await db.from('content_post_likes').select('content_post_id, user_id').in('content_post_id', ids)

  const likeCounts = new Map<string, number>()
  const myLikes = new Set<string>()
  for (const like of (likes ?? []) as { content_post_id: string; user_id: string }[]) {
    likeCounts.set(like.content_post_id, (likeCounts.get(like.content_post_id) ?? 0) + 1)
    if (userId && like.user_id === userId) myLikes.add(like.content_post_id)
  }

  return rows.map((r) => ({
    ...r,
    likeCount: likeCounts.get(r.id) ?? 0,
    myLike: myLikes.has(r.id),
  }))
}

// Recent posts by the given authors (experts/orgs), for the home feed.
// status filter (migration 038) is defense in depth on top of RLS — a
// pending brief-scoped quote submission shouldn't surface here either.
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
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(limit)

  return (data ?? []) as unknown as FeedPost[]
}

// Quote-type posts sharing at least one of the brief's topic_tags, for
// sitewide quote discovery (design doc §2 row 7 — a filtered view of
// content_posts, not hand-curated). Array-overlap match, not equality, since
// both content_posts.topic_tags and briefs.topic_tags are arrays
// (docs/design/brief-feature/brief-page-part2-plan.md §2, Part 0a step 3).
// Stays as the underlying discovery primitive per 0a's own note — Part 4's
// getQuotesForBrief below composes it with an explicit brief_id match
// rather than replacing it.
export async function getQuotesByTopicTag(
  db: DB,
  topicTags: string[],
  limit = 4,
  userId: string | null = null,
): Promise<Quote[]> {
  if (topicTags.length === 0) return []

  const { data } = await db
    .from('content_posts')
    .select(QUOTE_SELECT)
    .eq('post_type', 'quote')
    .eq('status', 'published')
    .overlaps('topic_tags', topicTags)
    .order('created_at', { ascending: false })
    .limit(limit)

  return attachLikes(db, (data ?? []) as unknown as QuoteRow[], userId)
}

// Quotes for a specific brief's Quotes section (Part 4 step 1): quotes
// explicitly attached via content_posts.brief_id (the new "+ Add quote"
// button) come first, topped up with topic-tag matches if there's room —
// the same "quote stays searchable/showable sitewide, brief_id is an
// explicit association on top" shape 0a's migration comment describes.
// Deduplicated in case a quote matches both ways.
export async function getQuotesForBrief(
  db: DB,
  briefId: string,
  topicTags: string[],
  limit = 4,
  userId: string | null = null,
): Promise<Quote[]> {
  const [byBrief, byTag] = await Promise.all([
    db
      .from('content_posts')
      .select(QUOTE_SELECT)
      .eq('post_type', 'quote')
      .eq('status', 'published')
      .eq('brief_id', briefId)
      .order('created_at', { ascending: false })
      .limit(limit),
    getQuotesByTopicTag(db, topicTags, limit, userId),
  ])

  const byBriefRows = attachLikes(db, (byBrief.data ?? []) as unknown as QuoteRow[], userId)
  const seen = new Set<string>()
  const merged: Quote[] = []
  for (const q of [...(await byBriefRows), ...byTag]) {
    if (seen.has(q.id)) continue
    seen.add(q.id)
    merged.push(q)
    if (merged.length === limit) break
  }
  return merged
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
    .eq('status', 'published')
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
    .eq('status', 'published')
    .single()

  if (!pinnedData) return posts
  return [pinnedData as unknown as MediaPost, ...posts].slice(0, limit + 1)
}

// All published posts by a single user, for their profile — status filter
// (migration 038) keeps a not-yet-approved brief-scoped quote submission
// off the submitter's own profile too, same as everywhere else.
export async function getUserPosts(db: DB, userId: string, limit = 20): Promise<ProfilePost[]> {
  const { data } = await db
    .from('content_posts')
    .select('id, user_id, post_type, title, body, url, topic_tags, created_at')
    .eq('user_id', userId)
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(limit)

  return (data ?? []) as ProfilePost[]
}
