import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { BriefVisibility, BriefSectionType, UserRole } from '@/lib/types'
import { getBriefWithSectionsBySlug } from '@/lib/data/briefs'
import { getQuotesByTopicTag, getMediaSection, type MediaPost } from '@/lib/data/posts'
import {
  getEndorsementBarCounts,
  getMyContributionStatus,
  getMyContributionStatuses,
  getSectionContributionCounts,
  type EndorsementBarCounts,
  type ContributionStatus,
} from '@/lib/data/contributions'
import { getApprovedQuestions } from '@/lib/data/questions'
import { getUserBasic } from '@/lib/data/users'
import BriefView from './BriefView'

// ---------------------------------------------------------------------------
// Types (re-exported so BriefView can import them from here)
// ---------------------------------------------------------------------------

export type { BriefVisibility, BriefSectionType, UserRole, MediaPost, EndorsementBarCounts, ContributionStatus }

export interface BriefSection {
  id: string
  section_type: BriefSectionType
  title: string | null
  content: string
  content_version: number
  display_order: number
}

// Per-Explainer-subsection reviewed/endorsed state (Part 3) — a plain array
// of plain objects rather than a Map, since this crosses the server/client
// boundary into BriefView ('use client').
export interface ExplainerContributionInfo {
  sectionId: string
  status: ContributionStatus
  reviewedCount: number
  endorsedCount: number
}

export interface Brief {
  id: string
  title: string
  slug: string
  subtitle: string | null
  topic_tag: string | null
  pinned_media_post_id: string | null
  last_reviewed_at: string | null
  visibility: BriefVisibility
  brief_sections: BriefSection[]
}

// No email — see the comment on lib/data/posts.ts's QuoteAuthor.
export interface QuoteAuthor {
  id: string
  display_name: string | null
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
  const brief = await getBriefWithSectionsBySlug(supabase, slug)
  if (!brief) notFound()

  const explainerSectionIds = brief.brief_sections
    .filter((s) => s.section_type === 'explainer')
    .map((s) => s.id)

  const [quotes, media, endorsementBar, myReviewStatus, sectionCounts, myExplainerStatuses] = await Promise.all([
    getQuotesByTopicTag(supabase, brief.topic_tag, 4),
    getMediaSection(supabase, brief.topic_tag, brief.pinned_media_post_id, 6),
    getEndorsementBarCounts(supabase, brief.id, brief.brief_sections),
    user
      ? getMyContributionStatus(supabase, brief.id, null, user.id)
      : Promise.resolve<ContributionStatus>('none'),
    getSectionContributionCounts(supabase, brief.id, brief.brief_sections),
    user
      ? getMyContributionStatuses(supabase, brief.id, explainerSectionIds, user.id)
      : Promise.resolve(new Map<string, ContributionStatus>()),
  ])

  const explainerContributions: ExplainerContributionInfo[] = explainerSectionIds.map((sectionId) => {
    const counts = sectionCounts.get(sectionId)
    return {
      sectionId,
      status: myExplainerStatuses.get(sectionId) ?? 'none',
      reviewedCount: counts?.reviewedCount ?? 0,
      endorsedCount: counts?.endorsedCount ?? 0,
    }
  })

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
    <BriefView
      brief={brief}
      quotes={quotes}
      media={media}
      endorsementBar={endorsementBar}
      questions={questions}
      currentUser={currentUser}
      myReviewStatus={myReviewStatus}
      explainerContributions={explainerContributions}
    />
  )
}
