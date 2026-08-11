import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

// Data-access layer for brief_contributions reads. See lib/data/briefs.ts
// for the pattern.

type DB = SupabaseClient<Database>

export type ContributionStatus = 'none' | 'review' | 'endorsement'

// The current viewer's own review/endorsement row for a brief (sectionId
// null) or a specific section (Part 3). Used to render the "Mark as
// reviewed" / "Endorse" control's initial state — see two-ink-bold-plan.md
// §2 "Reusing brief_contributions".
export async function getMyContributionStatus(
  db: DB,
  briefId: string,
  sectionId: string | null,
  userId: string,
): Promise<ContributionStatus> {
  const base = db
    .from('brief_contributions')
    .select('type')
    .eq('brief_id', briefId)
    .eq('user_id', userId)
    .in('type', ['review', 'endorsement'])
    .limit(1)

  const { data } = await (sectionId ? base.eq('section_id', sectionId) : base.is('section_id', null))

  return (data?.[0]?.type as ContributionStatus | undefined) ?? 'none'
}

// The section_version to pin on a new/updated contribution row: a specific
// section's current content_version, or (brief-level) the max across all of
// the brief's sections. Small standalone helper — getEndorsementBarCounts
// below computes the same max inline and is intentionally left untouched
// (§2: it already does the right thing for this scope).
export function getMaxContentVersion(sections: { content_version: number }[]): number {
  return sections.reduce((m, s) => Math.max(m, s.content_version), 1)
}

export interface EndorsementBarCounts {
  reviewedCount: number
  endorsedCount: number
  orgCount: number
}

// Endorsement bar computation (design doc §8): count distinct users with a
// published review or endorsement whose pinned section_version is current,
// split by type — endorsers are not double-counted as reviewers. A user
// can hold current review/endorsement rows on several sections at once
// (§3.3 rule 1 scopes uniqueness per target, not per brief); if any of
// them is an endorsement, that user counts as endorsed.
export async function getEndorsementBarCounts(
  db: DB,
  briefId: string,
  sections: { id: string; content_version: number }[],
): Promise<EndorsementBarCounts> {
  const { data } = await db
    .from('brief_contributions')
    .select('user_id, type, section_id, section_version')
    .eq('brief_id', briefId)
    .eq('status', 'published')
    .in('type', ['review', 'endorsement'])

  const versionBySection = new Map(sections.map((s) => [s.id, s.content_version]))
  const maxVersion = sections.reduce((m, s) => Math.max(m, s.content_version), 1)

  const statusByUser = new Map<string, 'endorsement' | 'review'>()
  for (const row of data ?? []) {
    const currentVersion = row.section_id ? versionBySection.get(row.section_id) : maxVersion
    if (currentVersion === undefined || row.section_version == null) continue
    if (row.section_version < currentVersion) continue // stale — drops out of the count (§4, §6.2)

    if (row.type === 'endorsement') {
      statusByUser.set(row.user_id, 'endorsement')
    } else if (!statusByUser.has(row.user_id)) {
      statusByUser.set(row.user_id, 'review')
    }
  }

  const counted = [...statusByUser.entries()]
  const reviewedCount = counted.filter(([, t]) => t === 'review').length
  const endorsedCount = counted.filter(([, t]) => t === 'endorsement').length

  let orgCount = 0
  const userIds = counted.map(([id]) => id)
  if (userIds.length > 0) {
    const { data: affiliations } = await db
      .from('user_affiliations')
      .select('organisation_id')
      .in('user_id', userIds)
    orgCount = new Set((affiliations ?? []).map((a) => a.organisation_id)).size
  }

  return { reviewedCount, endorsedCount, orgCount }
}
