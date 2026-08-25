'use server'

import { createClient } from '@/lib/supabase/server'
import type { AvailabilityStatus, PrimaryPlatform, OrgSize } from './page'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProfileUpdatePayload {
  // Required
  display_name: string
  full_name: string
  // Optional — universal
  bio?: string | null
  website_url?: string | null
  preferred_language?: string | null
  // Optional — creator + journalist
  availability?: AvailabilityStatus | null
  primary_platform?: PrimaryPlatform | null
  platform_url?: string | null
  channel_name?: string | null
  audience_size?: number | null
  content_language?: string | null
  // Optional — journalist only
  publication_name?: string | null
  publication_url?: string | null
  reporting_beat?: string | null
  // Optional — expert
  affiliation?: string | null
  job_title?: string | null
  credibility_url?: string | null
  areas_of_focus?: string[] | null
  // Optional — organisation
  org_name?: string | null
  org_size?: OrgSize | null
  org_mission?: string | null
}

// Fields that must never be written by this action
const PROTECTED_FIELDS = new Set(['id', 'email', 'role', 'created_at', 'updated_at'])

// ---------------------------------------------------------------------------
// Server action
// ---------------------------------------------------------------------------

export async function updateProfile(
  profileId: string,
  formData: ProfileUpdatePayload,
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }
  if (user.id !== profileId) return { error: 'Forbidden' }

  // Strip any protected fields defensively, even though the type already excludes them
  const payload = Object.fromEntries(
    Object.entries(formData).filter(([key]) => !PROTECTED_FIELDS.has(key)),
  )

  const { error } = await supabase.from('users').update(payload).eq('id', profileId)

  if (error) return { error: error.message }

  return {}
}
