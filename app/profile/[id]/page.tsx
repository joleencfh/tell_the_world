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

// ---------------------------------------------------------------------------
// Mock profiles — for design preview without real users
// ---------------------------------------------------------------------------

const MOCK_PROFILES: Record<string, ProfileUser> = {
  'mock-expert': {
    id: 'mock-expert',
    email: 'sarah.chen@alignment-research.org',
    full_name: 'Dr. Sarah Chen',
    display_name: 'Dr. Sarah Chen',
    bio: 'I study the theoretical foundations of AI alignment, with a focus on goal misgeneralisation and inner alignment failures. Previously at DeepMind Safety; now independent. I believe the alignment problem is tractable but that we are not currently on track to solve it before it matters.',
    avatar_url: null,
    role: 'expert',
    availability: 'limited',
    website_url: 'https://example.com/sarahchen',
    preferred_language: 'English',
    created_at: '2025-09-12T08:00:00Z',
    primary_platform: null,
    platform_url: null,
    audience_size: null,
    content_language: null,
    publication_name: null,
    publication_url: null,
    reporting_beat: null,
    affiliation: 'Independent Researcher',
    job_title: 'AI Safety Researcher',
    credibility_url: 'https://example.com/sarahchen/publications',
    areas_of_focus: ['Goal misgeneralisation', 'Inner alignment', 'Interpretability', 'AI governance'],
    org_name: null,
    org_size: null,
    org_mission: null,
  },
  'mock-creator': {
    id: 'mock-creator',
    email: 'priya@thealignmentchannel.com',
    full_name: 'Priya Sharma',
    display_name: 'Priya Sharma',
    bio: "I make videos about economics, tech, and how systems shape our lives. Recently I've been going deep on AI — not just the hype, but the parts that actually matter and that most people aren't talking about. Trying to bring that same lens I use for economics to what's happening with AI development.",
    avatar_url: '/mock-avatars/priya.png.png',
    role: 'creator',
    availability: 'open',
    website_url: 'https://example.com/priya',
    preferred_language: 'English',
    created_at: '2025-10-03T14:30:00Z',
    primary_platform: 'youtube',
    platform_url: 'https://youtube.com/@example',
    audience_size: 280000,
    content_language: 'English',
    publication_name: null,
    publication_url: null,
    reporting_beat: null,
    affiliation: null,
    job_title: null,
    credibility_url: null,
    areas_of_focus: null,
    org_name: null,
    org_size: null,
    org_mission: null,
  },
}

const MOCK_POSTS: Record<string, ProfilePost[]> = {
  'mock-expert': [
    {
      id: 'mp-1',
      user_id: 'mock-expert',
      post_type: 'paper',
      title: 'On the Difficulty of Specifying Human Values to Optimising Systems',
      body: 'We argue that the core difficulty in AI alignment is not technical but conceptual — we do not have a sufficiently precise account of what we want AI systems to do.',
      url: 'https://example.com',
      created_at: '2025-11-20T10:00:00Z',
    },
    {
      id: 'mp-2',
      user_id: 'mock-expert',
      post_type: 'article',
      title: 'Inner Alignment Failures Are More Common Than We Think',
      body: 'A review of recent empirical findings suggesting that mesa-optimisers arise more readily than the theoretical literature has assumed.',
      url: 'https://example.com',
      created_at: '2025-10-05T09:00:00Z',
    },
  ],
  'mock-creator': [
    {
      id: 'mp-3',
      user_id: 'mock-creator',
      post_type: 'video',
      title: 'The AI race nobody is talking about (and why it worries me)',
      body: 'I spent three months reading everything I could find on how AI labs actually operate. This is what changed my mind about where things are heading — told through the lens of competitive dynamics I usually apply to markets.',
      url: 'https://example.com',
      created_at: '2025-12-01T16:00:00Z',
    },
    {
      id: 'mp-4',
      user_id: 'mock-creator',
      post_type: 'video',
      title: 'What economists get wrong about AI risk',
      body: 'Most economic models of AI treat it like any other productivity tool. I think that framing misses something important — here\'s what I wish more people in my field were asking.',
      url: 'https://example.com',
      created_at: '2025-11-10T12:00:00Z',
    },
  ],
}

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

  // Serve mock profiles without hitting the DB for the profile itself —
  // the viewer's own row is still fetched so the contact modal works
  if (profileId in MOCK_PROFILES) {
    const { data: mockViewer } = await supabase
      .from('users')
      .select('id, display_name, email, role')
      .eq('id', user.id)
      .single()

    return (
      <ProfileView
        profileUser={MOCK_PROFILES[profileId]}
        posts={MOCK_POSTS[profileId] ?? []}
        contributions={[]}
        isOwnProfile={false}
        currentUserId={user.id}
        currentUser={(mockViewer ?? null) as {
          id: string
          display_name: string | null
          email: string
          role: UserRole
        } | null}
      />
    )
  }

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
