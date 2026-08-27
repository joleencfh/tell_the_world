import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'
import type { UserRole } from '@/lib/types'

// Data-access layer for the Explainer section's engagement mechanisms
// (contentious points, open comments, usefulness vote) — see lib/data/
// briefs.ts for the pattern. Schema: supabase/047_explainer_engagement.sql.
// Design ref: docs/design/brief-feature/brief-page-part2-plan.md Part 5
// step 6, superseded by the Explainer Engagement Options design pass
// (2026-08-26) — all three live once at the end of the whole Explainer
// section, not per subsection.

type DB = SupabaseClient<Database>

// No email — same anon-column-grant reasoning as FaqAnswerAuthor.
export interface EngagementAuthor {
  id: string
  display_name: string | null
  avatar_url: string | null
  role: UserRole
  job_title: string | null
  affiliation: string | null
  org_name: string | null
}

// ---------------------------------------------------------------------------
// Contentious points — expert/organisation, moderated (pending -> published)
// ---------------------------------------------------------------------------

export interface ContentiousPoint {
  id: string
  subsection_label: string | null
  body: string
  created_at: string
  users: EngagementAuthor
  likeCount: number
  myLike: boolean
}

const CONTENTIOUS_POINT_SELECT =
  'id, subsection_label, body, created_at, users(id, display_name, avatar_url, role, job_title, affiliation, org_name)'

// Likes merged in the same second-query shape getExplainerComments uses
// below — migration 051 gave contentious points parity with comments/
// replies (2026-08-27).
export async function getPublishedContentiousPoints(db: DB, briefId: string, userId: string | null): Promise<ContentiousPoint[]> {
  const { data: rows } = await db
    .from('explainer_contentious_points')
    .select(CONTENTIOUS_POINT_SELECT)
    .eq('brief_id', briefId)
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  const points = (rows ?? []) as unknown as Omit<ContentiousPoint, 'likeCount' | 'myLike'>[]
  if (points.length === 0) return []

  const pointIds = points.map((p) => p.id)
  const [{ data: likeRows }, { data: myLikedRows }] = await Promise.all([
    db.from('explainer_contentious_point_likes').select('contentious_point_id').in('contentious_point_id', pointIds),
    userId
      ? db.from('explainer_contentious_point_likes').select('contentious_point_id').eq('user_id', userId).in('contentious_point_id', pointIds)
      : Promise.resolve({ data: [] as { contentious_point_id: string }[] }),
  ])

  const countByPoint = new Map<string, number>()
  for (const row of likeRows ?? []) {
    countByPoint.set(row.contentious_point_id, (countByPoint.get(row.contentious_point_id) ?? 0) + 1)
  }
  const myLikedSet = new Set((myLikedRows ?? []).map((r) => r.contentious_point_id))

  return points.map((p) => ({
    ...p,
    likeCount: countByPoint.get(p.id) ?? 0,
    myLike: myLikedSet.has(p.id),
  }))
}

// ---------------------------------------------------------------------------
// Comments — any logged-in member, immediate publish. Flat, one level of
// replies (migration 050): a row is a root Explainer comment when both
// parent_comment_id and contentious_point_id are null, a reply to a
// comment when parent_comment_id is set, or a reply to a contentious point
// when contentious_point_id is set — never both. Every row, root or reply,
// carries a like count (LinkedIn-style, confirmed with the user 2026-08-27).
// ---------------------------------------------------------------------------

export interface ExplainerComment {
  id: string
  body: string
  created_at: string
  parent_comment_id: string | null
  contentious_point_id: string | null
  users: EngagementAuthor
  likeCount: number
  myLike: boolean
}

const EXPLAINER_COMMENT_SELECT =
  'id, body, created_at, parent_comment_id, contentious_point_id, users(id, display_name, avatar_url, role, job_title, affiliation, org_name)'

export async function getExplainerComments(db: DB, briefId: string, userId: string | null): Promise<ExplainerComment[]> {
  const { data: rows } = await db
    .from('explainer_comments')
    .select(EXPLAINER_COMMENT_SELECT)
    .eq('brief_id', briefId)
    .order('created_at', { ascending: true })

  const comments = (rows ?? []) as unknown as Omit<ExplainerComment, 'likeCount' | 'myLike'>[]
  if (comments.length === 0) return []

  const commentIds = comments.map((c) => c.id)
  const [{ data: likeRows }, { data: myLikedRows }] = await Promise.all([
    db.from('explainer_comment_likes').select('comment_id').in('comment_id', commentIds),
    userId
      ? db.from('explainer_comment_likes').select('comment_id').eq('user_id', userId).in('comment_id', commentIds)
      : Promise.resolve({ data: [] as { comment_id: string }[] }),
  ])

  const countByComment = new Map<string, number>()
  for (const row of likeRows ?? []) {
    countByComment.set(row.comment_id, (countByComment.get(row.comment_id) ?? 0) + 1)
  }
  const myLikedSet = new Set((myLikedRows ?? []).map((r) => r.comment_id))

  return comments.map((c) => ({
    ...c,
    likeCount: countByComment.get(c.id) ?? 0,
    myLike: myLikedSet.has(c.id),
  }))
}

// ---------------------------------------------------------------------------
// Usefulness — creator/journalist/admin, a plain like: one row per (brief,
// user), presence means "found this useful" (migration 049 dropped the
// two-directional is_useful column — see that migration's own comment for
// why).
// ---------------------------------------------------------------------------

export interface ExplainerUsefulness {
  count: number
  liked: boolean
}

export async function getExplainerUsefulness(
  db: DB,
  briefId: string,
  userId: string | null,
): Promise<ExplainerUsefulness> {
  const [countResult, myResult] = await Promise.all([
    db.from('explainer_useful_votes').select('id', { count: 'exact', head: true }).eq('brief_id', briefId),
    userId
      ? db.from('explainer_useful_votes').select('id').eq('brief_id', briefId).eq('user_id', userId).maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  return {
    count: countResult.count ?? 0,
    liked: !!myResult.data,
  }
}

// The "found this useful" modal's list — fetched on demand when the count
// is clicked (mirrors getCoverageDetail's likers fetch), not bundled into
// the page's initial load.
export async function getExplainerUsefulLikers(db: DB, briefId: string): Promise<EngagementAuthor[]> {
  const { data } = await db
    .from('explainer_useful_votes')
    .select('users(id, display_name, avatar_url, role, job_title, affiliation, org_name)')
    .eq('brief_id', briefId)
    .order('created_at', { ascending: false })

  return (data ?? []).map((row) => (row as unknown as { users: EngagementAuthor }).users).filter(Boolean)
}
