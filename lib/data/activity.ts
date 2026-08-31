import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

// Data-access layer for the home dashboard's This Week feed (home-dashboard
// Part 1 step 2, docs/design/home-dashboard/two-ink-bold-dashboard-plan.md
// §2, Part 1). No single table shape fits a mixed brief/quote/coverage
// river — analytics_events (053) was checked and rejected (service-role-only
// user-behavior log, not a content-publish log). This queries briefs,
// content_posts, and brief_coverage directly and merges in application code,
// same "small queries + in-memory merge" shape lib/data/posts.ts's
// getQuotesForBrief already uses for a two-source merge.

type DB = SupabaseClient<Database>

const WINDOW_DAYS = 7

// A brand-new brief's updated_at lands within milliseconds of created_at
// (same insert, same now()) — this threshold is how "meaningfully updated"
// is told apart from that same-insert tick, so a just-created brief shows
// once as brief_new, not twice as both brief_new and brief_updated.
const MEANINGFUL_UPDATE_GAP_MS = 60_000

export type ActivityItem =
  | { kind: 'brief_new'; id: string; title: string; slug: string; created_at: string }
  | { kind: 'brief_updated'; id: string; title: string; slug: string; created_at: string }
  | { kind: 'quote'; id: string; title: string; body: string | null; slug: string | null; created_at: string }
  | { kind: 'external'; id: string; title: string; url: string; created_at: string }
  | { kind: 'coverage'; id: string; title: string; url: string; outletName: string; imageUrl: string | null; created_at: string }

interface BriefWindowRow {
  id: string
  title: string
  slug: string
  created_at: string
  updated_at: string
}

interface PostWindowRow {
  id: string
  title: string
  body: string | null
  url: string | null
  created_at: string
  briefs: { slug: string } | null
}

interface CoverageWindowRow {
  id: string
  title: string
  url: string
  outlet_name: string
  image_url: string | null
  created_at: string
}

function windowStartIso(): string {
  return new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString()
}

// This week's activity river: new/updated briefs, published quotes/external
// posts, and published coverage, all within the trailing 7-day window,
// merged by created_at descending and capped to `limit`. Rows come back as
// a discriminated union so Part 4's UI can render each row type directly
// rather than re-deriving what it is from raw fields.
export async function getThisWeekActivity(db: DB, limit = 8): Promise<ActivityItem[]> {
  const since = windowStartIso()
  const sinceMs = new Date(since).getTime()

  const [briefsRes, postsRes, coverageRes] = await Promise.all([
    db
      .from('briefs')
      .select('id, title, slug, created_at, updated_at')
      .or(`created_at.gte.${since},updated_at.gte.${since}`),
    db
      .from('content_posts')
      .select('id, title, body, url, created_at, briefs!content_posts_brief_id_fkey(slug)')
      .eq('status', 'published')
      .gte('created_at', since),
    db
      .from('brief_coverage')
      .select('id, title, url, outlet_name, image_url, created_at')
      .eq('status', 'published')
      .gte('created_at', since),
  ])

  const items: ActivityItem[] = []

  for (const b of (briefsRes.data ?? []) as BriefWindowRow[]) {
    const createdMs = new Date(b.created_at).getTime()
    const updatedMs = new Date(b.updated_at).getTime()
    const meaningfullyUpdated = updatedMs - createdMs > MEANINGFUL_UPDATE_GAP_MS

    if (meaningfullyUpdated && updatedMs >= sinceMs) {
      items.push({ kind: 'brief_updated', id: b.id, title: b.title, slug: b.slug, created_at: b.updated_at })
    } else if (createdMs >= sinceMs) {
      items.push({ kind: 'brief_new', id: b.id, title: b.title, slug: b.slug, created_at: b.created_at })
    }
  }

  for (const p of (postsRes.data ?? []) as unknown as PostWindowRow[]) {
    if (p.url) {
      items.push({ kind: 'external', id: p.id, title: p.title, url: p.url, created_at: p.created_at })
    } else {
      items.push({ kind: 'quote', id: p.id, title: p.title, body: p.body, slug: p.briefs?.slug ?? null, created_at: p.created_at })
    }
  }

  for (const c of (coverageRes.data ?? []) as CoverageWindowRow[]) {
    items.push({
      kind: 'coverage',
      id: c.id,
      title: c.title,
      url: c.url,
      outletName: c.outlet_name,
      imageUrl: c.image_url,
      created_at: c.created_at,
    })
  }

  items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  return items.slice(0, limit)
}
