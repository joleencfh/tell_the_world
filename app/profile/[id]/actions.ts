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

// ---------------------------------------------------------------------------
// Avatar upload / removal
// ---------------------------------------------------------------------------

const MAX_AVATAR_BYTES = 5 * 1024 * 1024
const ALLOWED_AVATAR_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

export async function uploadAvatar(
  profileId: string,
  formData: FormData,
): Promise<{ error?: string; avatarUrl?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }
  if (user.id !== profileId) return { error: 'Forbidden' }

  const file = formData.get('file')
  if (!(file instanceof File)) return { error: 'No file provided' }

  const ext = ALLOWED_AVATAR_TYPES[file.type]
  if (!ext) return { error: 'Please upload a JPEG, PNG, WebP, or GIF image' }
  if (file.size > MAX_AVATAR_BYTES) return { error: 'Image must be smaller than 5MB' }

  const path = `${profileId}/avatar.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true, contentType: file.type })

  if (uploadError) return { error: uploadError.message }

  const {
    data: { publicUrl },
  } = supabase.storage.from('avatars').getPublicUrl(path)

  // Cache-bust so <img> tags pick up the new image immediately, since the
  // storage path itself doesn't change on upsert.
  const avatarUrl = `${publicUrl}?v=${Date.now()}`

  const { error: updateError } = await supabase
    .from('users')
    .update({ avatar_url: avatarUrl })
    .eq('id', profileId)

  if (updateError) return { error: updateError.message }

  return { avatarUrl }
}

export async function removeAvatar(profileId: string): Promise<{ error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }
  if (user.id !== profileId) return { error: 'Forbidden' }

  // Remove any extension variant that might exist from a prior upload.
  const paths = Object.values(ALLOWED_AVATAR_TYPES).map((ext) => `${profileId}/avatar.${ext}`)
  await supabase.storage.from('avatars').remove(paths)

  const { error } = await supabase.from('users').update({ avatar_url: null }).eq('id', profileId)

  if (error) return { error: error.message }

  return {}
}
