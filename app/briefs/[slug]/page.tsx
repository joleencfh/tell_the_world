import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { BriefVisibility, BriefSectionType, UserRole } from '@/lib/types'
import { getBriefWithSectionsBySlug } from '@/lib/data/briefs'
import { getRecentQuotes } from '@/lib/data/posts'
import { getApprovedQuestions } from '@/lib/data/questions'
import { getUserBasic } from '@/lib/data/users'
import BriefView from './BriefView'

// ---------------------------------------------------------------------------
// Types (re-exported so BriefView can import them from here)
// ---------------------------------------------------------------------------

export type { BriefVisibility, BriefSectionType, UserRole }

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

  // All reads go through the RLS client (lib/data), so the database enforces
  // visibility: logged-out visitors get brief metadata (title/tldr for the
  // locked preview) but no members-only sections, quotes, or questions
  // (policies in 008 and 013). The lock UI in BriefView is presentation only.
  const [brief, quotes] = await Promise.all([
    getBriefWithSectionsBySlug(supabase, slug),
    getRecentQuotes(supabase, 4),
  ])

  if (!brief) notFound()

  let questions: Question[] = []
  let currentUser: CurrentUser | null = null

  if (user) {
    const [briefQuestions, viewer] = await Promise.all([
      getApprovedQuestions(supabase, brief.id),
      getUserBasic(supabase, user.id),
    ])
    questions = briefQuestions
    currentUser = viewer
  }

  return (
    <BriefView brief={brief} quotes={quotes} questions={questions} currentUser={currentUser} />
  )
}
