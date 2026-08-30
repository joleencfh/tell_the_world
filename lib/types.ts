// ---------------------------------------------------------------------------
// Shared domain types — single source of truth for the app.
//
// Backed by lib/database.types.ts, which is generated from the live Postgres
// schema with:
//   bunx supabase gen types typescript --project-id <ref> --schema public > lib/database.types.ts
// (needs SUPABASE_ACCESS_TOKEN). Re-run it after every migration.
//
// The friendly aliases below mean callers never import the verbose generated
// shape (Database['public']['Enums']['user_role'], etc.) directly.
// ---------------------------------------------------------------------------

import type { Database } from './database.types'

// ─── Table row / insert / update helpers ──────────────────────────────────

type PublicSchema = Database['public']

export type Tables<T extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][T]['Row']

export type TablesInsert<T extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][T]['Insert']

export type TablesUpdate<T extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][T]['Update']

type Enums<T extends keyof PublicSchema['Enums']> = PublicSchema['Enums'][T]

// ─── Enums (from the Postgres enum types) ──────────────────────────────────

export type UserRole = Enums<'user_role'>

// Roles the deterministic clarity check (lib/clarity/check.ts) applies to,
// and the same set allowed to submit brief-attached quotes (submitQuote,
// lib/briefs/actions.ts) — lives here (a plain module, not a 'use server'
// action file) so both lib/briefs/actions.ts and lib/posts/actions.ts can
// import it without pulling one 'use server' file's whole export surface
// into the other.
export const CONTRIBUTOR_ROLES: UserRole[] = ['expert', 'organisation']
export type ApplicationRole = Enums<'application_role'>
export type AvailabilityStatus = Enums<'availability_status'>
export type PrimaryPlatform = Enums<'primary_platform'>
export type OrgSize = Enums<'org_size'>
export type BriefVisibility = Enums<'brief_visibility'>
export type BriefSectionType = Enums<'brief_section_type'>
export type ApplicationStatus = Enums<'application_status'>
export type PostType = Enums<'post_type'>
export type MessageStatus = Enums<'message_status'>

// ─── Convenience row aliases for the common tables ─────────────────────────

export type UserRow = Tables<'users'>
export type BriefRow = Tables<'briefs'>
export type BriefSectionRow = Tables<'brief_sections'>
export type ContentPostRow = Tables<'content_posts'>
export type ApplicationRow = Tables<'applications'>
export type QuestionRow = Tables<'questions'>
export type BriefContributionRow = Tables<'brief_contributions'>
export type BriefCorrectionProposalRow = Tables<'brief_correction_proposals'>
export type MessageRow = Tables<'messages'>
export type WaitlistSignupRow = Tables<'waitlist_signups'>
