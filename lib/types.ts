// ---------------------------------------------------------------------------
// Shared domain types — single source of truth for the enums used across the
// app. These mirror the Postgres enums defined in supabase/001_initial_schema.sql.
//
// Until a Supabase access token is available, these are hand-maintained. Once
// `supabase gen types typescript` can run (needs SUPABASE_ACCESS_TOKEN), the
// generated Database types can back these aliases, e.g.
//   export type UserRole = Database['public']['Enums']['user_role']
// so the database stays the single source of truth. Keeping the friendly
// aliases here means callers never import the verbose generated shape directly.
// ---------------------------------------------------------------------------

export type UserRole = 'creator' | 'expert' | 'organisation' | 'journalist' | 'admin'

// Roles a person can apply for (admin is assigned, never requested)
export type ApplicationRole = 'creator' | 'expert' | 'organisation' | 'journalist'

export type AvailabilityStatus = 'open' | 'limited' | 'unavailable'

export type PrimaryPlatform = 'youtube' | 'podcast' | 'instagram' | 'tiktok' | 'other'

export type OrgSize = 'small' | 'medium' | 'large'

export type BriefVisibility = 'public' | 'members_only'

export type BriefSectionType =
  | 'recent_developments'
  | 'sources_basic'
  | 'sources_advanced'
  | 'faq'

export type ApplicationStatus = 'pending' | 'approved' | 'rejected'

export type PostType = 'video' | 'article' | 'paper' | 'quote' | 'resource'

export type MessageStatus = 'pending' | 'accepted' | 'declined'
