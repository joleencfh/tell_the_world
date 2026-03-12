import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProfileView from './ProfileView'

// ---------------------------------------------------------------------------
// Types (exported so ProfileView can import them)
// ---------------------------------------------------------------------------

export type UserRole = 'creator' | 'expert' | 'organisation' | 'journalist' | 'admin'
export type AvailabilityStatus = 'open' | 'limited' | 'unavailable'

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
  created_at: string
  // creator / journalist
  primary_platform: string | null
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
  org_size: string | null
  org_mission: string | null
}

export interface ProfilePost {
  id: string
  user_id: string
  post_type: string
  title: string
  body: string | null
  url: string | null
  created_at: string
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

  // Fetch profile user's row and their posts in parallel
  const [profileUserResult, postsResult] = await Promise.all([
    supabase
      .from('users')
      .select(
        `id, email, full_name, display_name, bio, avatar_url, role,
         availability, website_url, created_at,
         primary_platform, platform_url, audience_size, content_language,
         publication_name, publication_url, reporting_beat,
         affiliation, job_title, credibility_url, areas_of_focus,
         org_name, org_size, org_mission`
      )
      .eq('id', profileId)
      .single(),
    supabase
      .from('content_posts')
      .select('id, user_id, post_type, title, body, url, created_at')
      .eq('user_id', profileId)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  const profileUser = profileUserResult.data as ProfileUser | null
  const posts = (postsResult.data ?? []) as ProfilePost[]
  const isOwnProfile = user.id === profileId

  return (
    <ProfileView
      profileUser={profileUser}
      posts={posts}
      isOwnProfile={isOwnProfile}
      currentUserId={user.id}
    />
  )
}
