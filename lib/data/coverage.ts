import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

// Data-access layer for brief_coverage reads. See lib/data/ctas.ts for the
// closest existing pattern (two-ink-bold-plan.md Part 6); likeCount/myLike
// follow lib/data/questions.ts's bulk-query-then-aggregate-in-JS shape
// rather than a per-row query.

type DB = SupabaseClient<Database>

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
}

const COVERAGE_SELECT = 'id, url, outlet_name, title, image_url, published_date, score, created_at'

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

  return coverage.map((c) => ({
    ...c,
    likeCount: likeCounts.get(c.id) ?? 0,
    myLike: myLikes.has(c.id),
  }))
}
