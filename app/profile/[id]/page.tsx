import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProfileView from './ProfileView'

// ---------------------------------------------------------------------------
// Types (exported so ProfileView can import them)
// ---------------------------------------------------------------------------

export type UserRole = 'creator' | 'expert' | 'organisation' | 'journalist' | 'admin'
export type AvailabilityStatus = 'open' | 'limited' | 'unavailable'

export type PrimaryPlatform = 'youtube' | 'podcast' | 'instagram' | 'tiktok' | 'other'
export type OrgSize = 'small' | 'medium' | 'large'

export interface ProfileUser {
  id: string
  email: string
  full_name: string
  display_name: string
  bio: string | null
  avatar_url: string | null
  role: UserRole
  availability: AvailabilityStatus
  website_url: string | null
  preferred_language: string | null
  created_at: string
  // creator / journalist
  primary_platform: PrimaryPlatform | null
  platform_url: string | null
  audience_size: number | null
  content_language: string | null
  publication_name: string | null
  publication_url: string | null
  reporting_beat: string | null
  // expert
  affiliation: string | null
  job_title: string | null
  credibility_url: string | null
  areas_of_focus: string[] | null
  // organisation
  org_name: string | null
  org_size: OrgSize | null
  org_mission: string | null
}

export interface ProfilePost {
  id: string
  user_id: string
  post_type: string
  title: string
  body: string | null
  url: string | null
  topic_tags: string[]
  created_at: string
}

export interface ProfileContribution {
  id: string
  contribution_text: string
  status: 'pending' | 'approved' | 'dismissed'
  created_at: string
  briefs: { title: string; slug: string }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: profileId } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch profile user's row, their posts, contributions, and current user's own info in parallel
  const [profileUserResult, postsResult, contributionsResult, currentUserResult] = await Promise.all([
    supabase
      .from('users')
      .select(
        `id, email, full_name, display_name, bio, avatar_url, role,
         availability, website_url, preferred_language, created_at,
         primary_platform, platform_url, audience_size, content_language,
         publication_name, publication_url, reporting_beat,
         affiliation, job_title, credibility_url, areas_of_focus,
         org_name, org_size, org_mission`
      )
      .eq('id', profileId)
      .single(),
    supabase
      .from('content_posts')
      .select('id, user_id, post_type, title, body, url, topic_tags, created_at')
      .eq('user_id', profileId)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('brief_contributions')
      .select('id, contribution_text, status, created_at, briefs(title, slug)')
      .eq('user_id', profileId)
      .order('created_at', { ascending: false }),
    supabase
      .from('users')
      .select('id, display_name, email, role')
      .eq('id', user.id)
      .single(),
  ])

  const profileUser = profileUserResult.data as ProfileUser | null
  const posts = (postsResult.data ?? []) as ProfilePost[]
  // RLS returns: approved contributions for everyone, plus own pending/dismissed when viewing own profile.
  // Filter out dismissed — they shouldn't appear on the profile.
  const contributions = ((contributionsResult.data ?? []) as unknown as ProfileContribution[])
    .filter(c => c.status !== 'dismissed')
  const isOwnProfile = user.id === profileId
  const currentUser = (currentUserResult.data ?? null) as {
    id: string
    display_name: string | null
    email: string
    role: UserRole
  } | null

  return (
    <ProfileView
      profileUser={profileUser}
      posts={posts}
      contributions={contributions}
      isOwnProfile={isOwnProfile}
      currentUserId={user.id}
      currentUser={currentUser}
    />
  )
}
