import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

// Data-access layer for the home dashboard's hero digest (home-dashboard
// Part 2, docs/design/home-dashboard/two-ink-bold-dashboard-plan.md §2,
// Part 2). "Engaged brief" is a proxy for a real follow/bookmark feature
// (explicitly out of scope, see that doc's §0) built from signals that
// already exist: brief_contributions, questions, brief_proposals.

type DB = SupabaseClient<Database>

const WINDOW_DAYS = 7

function windowStartIso(): string {
  return new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString()
}

// Briefs the user counts as "theirs": reviewed/endorsed (mirrors
// getMyContributionStatus's query shape in lib/data/contributions.ts),
// asked a question about, or proposed and had published. No new table.
async function getEngagedBriefIds(db: DB, userId: string): Promise<string[]> {
  const [contributions, questions, proposals] = await Promise.all([
    db
      .from('brief_contributions')
      .select('brief_id')
      .eq('user_id', userId)
      .in('type', ['review', 'endorsement']),
    db.from('questions').select('brief_id').eq('user_id', userId),
    db
      .from('brief_proposals')
      .select('published_brief_id')
      .eq('user_id', userId)
      .not('published_brief_id', 'is', null),
  ])

  const ids = new Set<string>()
  for (const row of contributions.data ?? []) ids.add(row.brief_id)
  for (const row of questions.data ?? []) ids.add(row.brief_id)
  for (const row of proposals.data ?? []) {
    if (row.published_brief_id) ids.add(row.published_brief_id)
  }
  return [...ids]
}

interface UpdatedBriefs {
  titles: string[]
  // Outlet from a real brief_coverage row in the window, for the optional
  // hero flourish — null when there isn't one, never a generic filler.
  outletName: string | null
}

// "Updated" = a brief_sections, brief_coverage, or brief_ctas row on one of
// the engaged briefs, newer than the rolling window (no users.last_seen_at
// to compare against — this approximation is accepted, see the plan doc).
async function getUpdatedBriefs(db: DB, briefIds: string[]): Promise<UpdatedBriefs> {
  if (briefIds.length === 0) return { titles: [], outletName: null }

  const since = windowStartIso()

  const [sectionsRes, coverageRes, ctasRes, briefsRes] = await Promise.all([
    db.from('brief_sections').select('brief_id').in('brief_id', briefIds).gte('updated_at', since),
    db
      .from('brief_coverage')
      .select('brief_id, outlet_name, created_at')
      .in('brief_id', briefIds)
      .eq('status', 'published')
      .gte('created_at', since)
      .order('created_at', { ascending: false }),
    db
      .from('brief_ctas')
      .select('brief_id')
      .in('brief_id', briefIds)
      .eq('status', 'published')
      .gte('created_at', since),
    db.from('briefs').select('id, title').in('id', briefIds),
  ])

  const updatedIds = new Set<string>()
  for (const row of sectionsRes.data ?? []) updatedIds.add(row.brief_id)
  for (const row of coverageRes.data ?? []) updatedIds.add(row.brief_id)
  for (const row of ctasRes.data ?? []) updatedIds.add(row.brief_id)

  const titleById = new Map((briefsRes.data ?? []).map((b) => [b.id, b.title]))
  const titles = [...updatedIds].map((id) => titleById.get(id) ?? '').filter(Boolean)
  const outletName = coverageRes.data?.[0]?.outlet_name ?? null

  return { titles, outletName }
}

// Small template function (not a single hardcoded string) so every count
// gets its own sentence shape: zero updates makes no claim at all, one or
// two name the brief(s), three or more roll up into a count instead of
// listing everything. Exported standalone so it's testable without a DB.
export function composeHeroSubtext(updatedBriefTitles: string[], outletName: string | null): string | null {
  if (updatedBriefTitles.length === 0) return null

  let sentence: string
  if (updatedBriefTitles.length === 1) {
    sentence = `"${updatedBriefTitles[0]}" was updated this week.`
  } else if (updatedBriefTitles.length === 2) {
    sentence = `"${updatedBriefTitles[0]}" and "${updatedBriefTitles[1]}" were updated this week.`
  } else {
    sentence = `${updatedBriefTitles.length} things changed across the briefs you're following since your last visit.`
  }

  if (outletName) {
    sentence += ` A new mention of your beat landed in ${outletName}.`
  }

  return sentence
}

// Personalized hero subtext for a logged-in user, or null when there's
// nothing true to say yet (zero engaged briefs, or engaged briefs with no
// activity in the window) — never fabricate a claim in that case.
export async function getHeroDigest(db: DB, userId: string): Promise<string | null> {
  const engagedBriefIds = await getEngagedBriefIds(db, userId)
  if (engagedBriefIds.length === 0) return null

  const { titles, outletName } = await getUpdatedBriefs(db, engagedBriefIds)
  return composeHeroSubtext(titles, outletName)
}
