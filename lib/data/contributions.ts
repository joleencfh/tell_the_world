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

// Bulk version of getMyContributionStatus for several sections at once (Part
// 3's per-Explainer-subsection controls) — one query instead of one per
// section.
export async function getMyContributionStatuses(
  db: DB,
  briefId: string,
  sectionIds: string[],
  userId: string,
): Promise<Map<string, ContributionStatus>> {
  if (sectionIds.length === 0) return new Map()

  const { data } = await db
    .from('brief_contributions')
    .select('section_id, type')
    .eq('brief_id', briefId)
    .eq('user_id', userId)
    .in('type', ['review', 'endorsement'])
    .in('section_id', sectionIds)

  const result = new Map<string, ContributionStatus>()
  for (const row of data ?? []) {
    if (row.section_id) result.set(row.section_id, row.type as ContributionStatus)
  }
  return result
}

export interface SectionContributionCounts {
  reviewedCount: number
  endorsedCount: number
}

// Per-section "✓ Reviewed · N" / "★ Endorsed · N" badge counts (Part 3) — a
// section-scoped sibling of getEndorsementBarCounts above, kept separate
// rather than folded into it since that function's per-brief, per-user
// dedup logic doesn't apply here (the unique index already guarantees at
// most one row per (user, section), so every row is a distinct reviewer).
export async function getSectionContributionCounts(
  db: DB,
  briefId: string,
  sections: { id: string; content_version: number }[],
): Promise<Map<string, SectionContributionCounts>> {
  const { data } = await db
    .from('brief_contributions')
    .select('type, section_id, section_version')
    .eq('brief_id', briefId)
    .eq('status', 'published')
    .in('type', ['review', 'endorsement'])
    .not('section_id', 'is', null)

  const versionBySection = new Map(sections.map((s) => [s.id, s.content_version]))
  const result = new Map<string, SectionContributionCounts>()

  for (const row of data ?? []) {
    if (!row.section_id) continue
    const currentVersion = versionBySection.get(row.section_id)
    if (currentVersion === undefined || row.section_version == null) continue
    if (row.section_version < currentVersion) continue // stale — same rule as getEndorsementBarCounts

    const counts = result.get(row.section_id) ?? { reviewedCount: 0, endorsedCount: 0 }
    if (row.type === 'endorsement') counts.endorsedCount += 1
    else counts.reviewedCount += 1
    result.set(row.section_id, counts)
  }

  return result
}

export interface EndorsementBarCounts {
  reviewedCount: number
  endorsedCount: number
  orgCount: number
}

// One reviewer/endorser, for the hero's "Reviewed by" tooltip (Part 1 step
// 2) — role is the reviewer's own account role (expert vs organisation),
// which is what "experts and orgs separately" groups by; unrelated to
// orgCount above (that counts distinct affiliated organisations, not
// organisation-role accounts).
export interface Reviewer {
  userId: string
  displayName: string | null
  avatarUrl: string | null
  role: 'expert' | 'organisation'
  // Credential line shown under an expert's name in the modal (job title +
  // affiliation) — organisation accounts leave both null, their display
  // name already is their full identity.
  jobTitle: string | null
  affiliation: string | null
  // Most recent published review/endorsement timestamp counted toward the
  // bar (a user can hold several current rows across sections; this is the
  // latest of those).
  contributedAt: string
}

export interface EndorsementBarDetail {
  reviewers: Reviewer[]
  endorsers: Reviewer[]
}

interface EndorsementDetailRow {
  user_id: string
  type: 'review' | 'endorsement'
  section_id: string | null
  section_version: number | null
  updated_at: string
  users: {
    display_name: string | null
    avatar_url: string | null
    role: string
    job_title: string | null
    affiliation: string | null
  } | null
}

// Endorsement bar computation (design doc §8) — one query, returning both
// the counts (for the chip labels) and the actual reviewer/endorser
// identities (for the hero chip's hover tooltip and click-through list,
// Part 1 step 2). Counts distinct users with a published review or
// endorsement whose pinned section_version is current, split by type —
// endorsers are not double-counted as reviewers. A user can hold current
// review/endorsement rows on several sections at once (§3.3 rule 1 scopes
// uniqueness per target, not per brief); if any of them is an endorsement,
// that user counts as endorsed.
export async function getEndorsementBar(
  db: DB,
  briefId: string,
  sections: { id: string; content_version: number }[],
): Promise<{ counts: EndorsementBarCounts; detail: EndorsementBarDetail }> {
  const { data } = await db
    .from('brief_contributions')
    .select('user_id, type, section_id, section_version, updated_at, users(display_name, avatar_url, role, job_title, affiliation)')
    .eq('brief_id', briefId)
    .eq('status', 'published')
    .in('type', ['review', 'endorsement'])

  const versionBySection = new Map(sections.map((s) => [s.id, s.content_version]))
  const maxVersion = sections.reduce((m, s) => Math.max(m, s.content_version), 1)

  const byUser = new Map<string, Reviewer & { type: 'review' | 'endorsement' }>()
  for (const row of (data ?? []) as unknown as EndorsementDetailRow[]) {
    const currentVersion = row.section_id ? versionBySection.get(row.section_id) : maxVersion
    if (currentVersion === undefined || row.section_version == null) continue
    if (row.section_version < currentVersion) continue // stale — drops out of the count (§4, §6.2)
    if (!row.users || (row.users.role !== 'expert' && row.users.role !== 'organisation')) continue

    const existing = byUser.get(row.user_id)
    // Endorsement wins over review for the same user (matches the count
    // logic above); newer contributedAt wins between two rows of the same
    // resulting type.
    const shouldReplace =
      !existing ||
      (row.type === 'endorsement' && existing.type !== 'endorsement') ||
      (row.type === existing.type && row.updated_at > existing.contributedAt)
    if (!shouldReplace) continue

    byUser.set(row.user_id, {
      userId: row.user_id,
      displayName: row.users.display_name,
      avatarUrl: row.users.avatar_url,
      role: row.users.role,
      jobTitle: row.users.job_title,
      affiliation: row.users.affiliation,
      contributedAt: row.updated_at,
      type: row.type as 'review' | 'endorsement',
    })
  }

  const all = [...byUser.values()].sort((a, b) => (a.contributedAt < b.contributedAt ? 1 : -1))
  const reviewers = all.filter((r) => r.type === 'review')
  const endorsers = all.filter((r) => r.type === 'endorsement')

  let orgCount = 0
  const userIds = all.map((r) => r.userId)
  if (userIds.length > 0) {
    const { data: affiliations } = await db
      .from('user_affiliations')
      .select('organisation_id')
      .in('user_id', userIds)
    orgCount = new Set((affiliations ?? []).map((a) => a.organisation_id)).size
  }

  return {
    counts: { reviewedCount: reviewers.length, endorsedCount: endorsers.length, orgCount },
    detail: { reviewers, endorsers },
  }
}
