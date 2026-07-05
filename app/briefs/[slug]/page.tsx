import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import BriefView from './BriefView'

// ---------------------------------------------------------------------------
// Types (exported so BriefView can import them)
// ---------------------------------------------------------------------------

export type BriefVisibility = 'public' | 'members_only'
export type BriefSectionType =
  | 'recent_developments'
  | 'sources_basic'
  | 'sources_advanced'
  | 'faq'
export type UserRole = 'creator' | 'expert' | 'organisation' | 'journalist' | 'admin'

export interface BriefSection {
  id: string
  section_type: BriefSectionType
  content: string
  display_order: number
}

export interface Brief {
  id: string
  title: string
  slug: string
  tldr: string
  visibility: BriefVisibility
  brief_sections: BriefSection[]
}

export interface QuoteAuthor {
  id: string
  display_name: string | null
  email: string
  avatar_url: string | null
  role: UserRole
  affiliation: string | null
  org_name: string | null
}

export interface Quote {
  id: string
  title: string
  body: string | null
  url: string | null
  user_id: string
  users: QuoteAuthor
}

export interface QuestionAuthor {
  id: string
  display_name: string | null
  email: string
  avatar_url: string | null
  role?: UserRole | null
  expert_category?: string | null
  creator_platforms?: string[] | null
}

export interface Question {
  id: string
  question_text: string
  answer_text: string | null
  created_at: string
  users: QuestionAuthor
  answered_by?: QuestionAuthor | null
}

export interface CurrentUser {
  id: string
  display_name: string | null
  email: string
  avatar_url: string | null
  role: UserRole
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function BriefPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  // Check auth state (no redirect — logged-out users may view public briefs)
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // All fetches go through the RLS client, so the database enforces
  // visibility: logged-out visitors get brief metadata (title/tldr for the
  // locked preview) but no members-only sections, quotes, or questions
  // (policies in 008 and 013). The lock UI in BriefView is presentation only.

  // Fetch brief + sections + recent quotes in parallel
  const [briefResult, quotesResult] = await Promise.all([
    supabase
      .from('briefs')
      .select(
        'id, title, slug, tldr, visibility, brief_sections(id, section_type, content, display_order)',
      )
      .eq('slug', slug)
      .single(),
    supabase
      .from('content_posts')
      .select(
        'id, title, body, url, user_id, users(id, display_name, email, avatar_url, role, affiliation, org_name)',
      )
      .eq('post_type', 'quote')
      .order('created_at', { ascending: false })
      .limit(4),
  ])

  if (briefResult.error || !briefResult.data) notFound()

  const brief = briefResult.data as Brief
  const quotes = (quotesResult.data ?? []) as unknown as Quote[]

  let questions: Question[] = []
  let currentUser: CurrentUser | null = null

  if (user) {
    const [questionsResult, currentUserResult] = await Promise.all([
      supabase
        .from('questions')
        .select(
          'id, question_text, answer_text, created_at, users(id, display_name, email, avatar_url, role)',
        )
        .eq('brief_id', brief.id)
        .eq('status', 'approved')
        .order('created_at', { ascending: true }),
      supabase
        .from('users')
        .select('id, display_name, email, avatar_url, role')
        .eq('id', user.id)
        .single(),
    ])

    questions = (questionsResult.data ?? []) as unknown as Question[]
    currentUser = (currentUserResult.data ?? null) as CurrentUser | null
  }

  return (
    <BriefView brief={brief} quotes={quotes} questions={questions} currentUser={currentUser} />
  )
}
