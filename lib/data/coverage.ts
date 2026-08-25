import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'
import type { UserRole } from '@/lib/types'

// Data-access layer for brief_coverage reads. See lib/data/ctas.ts for the
// closest existing pattern (two-ink-bold-plan.md Part 6); likeCount/myLike
// follow lib/data/questions.ts's bulk-query-then-aggregate-in-JS shape
// rather than a per-row query.

type DB = SupabaseClient<Database>

// Deliberately omits email, unlike lib/briefs/actions.ts's Voter (that
// type is only ever used behind a login check) — Covered By is visible to
// logged-out visitors on public briefs, and anon's column-level GRANT on
// users (migration 020/037) doesn't include email. Selecting it anyway
// fails the embed with a silent "permission denied for table users" that
// drops the whole coverage row (inner-join semantics) — the exact bug
// 020's own header comment already describes fixing for content_posts'
// author join; lib/data/posts.ts's author select is the matching pattern.
export interface CoverageAuthor {
  id: string
  display_name: string | null
  avatar_url: string | null
  role: UserRole | null
  affiliation: string | null
  org_name: string | null
}

const AUTHOR_SELECT = 'id, display_name, avatar_url, role, affiliation, org_name'

export interface Coverage {
  id: string
  url: string
  outlet_name: string
  title: string
  image_url: string | null
  published_date: string | null
  score: number | null
  created_at: string
  likeCount: number
  myLike: boolean
  // Part 9: the submitting TTW user, cheap to add — brief_coverage.
  // submitted_by has recorded this since migration 028, it was just never
  // selected/joined/displayed anywhere until the click-through modal needed
  // it. Explicit fkey name (submitted_by, not the default user_id PostgREST
  // guesses from) — same reason lib/data/question-answers.ts needs one for
  // author_user_id.
  submittingUser: CoverageAuthor | null
}

interface CoverageRow {
  id: string
  url: string
  outlet_name: string
  title: string
  image_url: string | null
  published_date: string | null
  score: number | null
  created_at: string
  users: CoverageAuthor | null
}

const COVERAGE_SELECT = `id, url, outlet_name, title, image_url, published_date, score, created_at, users!brief_coverage_submitted_by_fkey(${AUTHOR_SELECT})`

// Published coverage for a brief, most recent first (same "what's new"
// framing as getPublishedCtas, not an evergreen reference list) — plus
// each row's like count and whether the current viewer has liked it.
// userId is null for a logged-out visitor (myLike always false; likes are
// still readable — see migration 028's anon read policy).
export async function getPublishedCoverage(db: DB, briefId: string, userId: string | null): Promise<Coverage[]> {
  const { data: rows } = await db
    .from('brief_coverage')
    .select(COVERAGE_SELECT)
    .eq('brief_id', briefId)
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  const coverage = (rows ?? []) as unknown as CoverageRow[]
  const coverageIds = coverage.map((c) => c.id)
  if (coverageIds.length === 0) return []

  const { data: likes } = await db.from('brief_coverage_likes').select('coverage_id, user_id').in('coverage_id', coverageIds)

  const likeCounts = new Map<string, number>()
  const myLikes = new Set<string>()
  for (const like of (likes ?? []) as { coverage_id: string; user_id: string }[]) {
    likeCounts.set(like.coverage_id, (likeCounts.get(like.coverage_id) ?? 0) + 1)
    if (userId && like.user_id === userId) myLikes.add(like.coverage_id)
  }

  return coverage.map(({ users, ...c }) => ({
    ...c,
    likeCount: likeCounts.get(c.id) ?? 0,
    myLike: myLikes.has(c.id),
    submittingUser: users,
  }))
}

// ---------------------------------------------------------------------------
// Click-through modal data (Part 9) — fetched on demand only when a viewer
// opens a coverage card, not bundled into the page's initial load (mirrors
// lib/briefs/actions.ts's getVoters). Unlike getVoters, neither of these
// requires a logged-in caller: Covered By is visible to logged-out visitors
// on public briefs, so its comments and likers are too (same anon-read RLS
// shape as brief_coverage_likes/028).
// ---------------------------------------------------------------------------

export interface CoverageComment {
  id: string
  body: string
  created_at: string
  author: CoverageAuthor
  upCount: number
  downCount: number
  myVote: 'up' | 'down' | null
}

interface CommentRow {
  id: string
  body: string
  created_at: string
  users: CoverageAuthor
}

export async function getCoverageComments(db: DB, coverageId: string, userId: string | null): Promise<CoverageComment[]> {
  const { data: rows } = await db
    .from('brief_coverage_comments')
    .select(`id, body, created_at, users(${AUTHOR_SELECT})`)
    .eq('coverage_id', coverageId)
    .order('created_at', { ascending: true })

  const comments = (rows ?? []) as unknown as CommentRow[]
  const commentIds = comments.map((c) => c.id)
  if (commentIds.length === 0) return []

  const { data: votes } = await db
    .from('brief_coverage_comment_votes')
    .select('comment_id, user_id, direction')
    .in('comment_id', commentIds)

  const tallies = new Map<string, { up: number; down: number; myVote: 'up' | 'down' | null }>()
  for (const v of (votes ?? []) as { comment_id: string; user_id: string; direction: 'up' | 'down' }[]) {
    const t = tallies.get(v.comment_id) ?? { up: 0, down: 0, myVote: null }
    if (v.direction === 'up') t.up += 1
    else t.down += 1
    if (userId && v.user_id === userId) t.myVote = v.direction
    tallies.set(v.comment_id, t)
  }

  return comments.map((c) => {
    const t = tallies.get(c.id) ?? { up: 0, down: 0, myVote: null }
    return { id: c.id, body: c.body, created_at: c.created_at, author: c.users, upCount: t.up, downCount: t.down, myVote: t.myVote }
  })
}

export async function getCoverageLikers(db: DB, coverageId: string): Promise<CoverageAuthor[]> {
  const { data } = await db.from('brief_coverage_likes').select(`users(${AUTHOR_SELECT})`).eq('coverage_id', coverageId)
  return (data ?? []).map((row) => (row as unknown as { users: CoverageAuthor }).users).filter(Boolean)
}
