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
import { getApprovedQuestions, type Question, type QuestionAuthor, type VoteSplit } from '@/lib/data/questions'
import { getQuestionAnswers, type QuestionAnswer } from '@/lib/data/question-answers'
import { getUserBasic } from '@/lib/data/users'
import { getPublishedFaqAnswers, type FaqAnswer } from '@/lib/data/faq-answers'
import BriefView from './BriefView'

// ---------------------------------------------------------------------------
// Types (re-exported so BriefView can import them from here)
// ---------------------------------------------------------------------------

export type {
  BriefVisibility,
  BriefSectionType,
  UserRole,
  MediaPost,
  EndorsementBarCounts,
  ContributionStatus,
  FaqAnswer,
  Question,
  QuestionAuthor,
  VoteSplit,
  QuestionAnswer,
}

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
  created_at: string
  users: QuoteAuthor
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

  const [quotes, media, endorsementBar, myReviewStatus, sectionCounts, myExplainerStatuses, faqAnswersMap] = await Promise.all([
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
    getPublishedFaqAnswers(supabase, brief.id),
  ])

  // Converted from a Map to a plain object — Map doesn't round-trip cleanly
  // across the server/client boundary into 'use client' BriefView, matching
  // how ExplainerContributionInfo below is a plain array for the same reason.
  const faqAnswersByQuestion: Record<string, FaqAnswer[]> = Object.fromEntries(faqAnswersMap)

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
  let answersByQuestion: Record<string, QuestionAnswer[]> = {}
  let currentUser: CurrentUser | null = null

  if (user) {
    const [briefQuestions, viewer] = await Promise.all([
      getApprovedQuestions(supabase, brief.id, user.id),
      getUserBasic(supabase, user.id),
    ])
    questions = briefQuestions
    currentUser = viewer
    // Needs the question ids from the fetch above, so this can't join the
    // Promise.all — same dependent-fetch shape as explainerSectionIds.
    const answersMap = await getQuestionAnswers(supabase, questions.map((q) => q.id), user.id)
    answersByQuestion = Object.fromEntries(answersMap)
  }

  return (
    <BriefView
      brief={brief}
      quotes={quotes}
      media={media}
      endorsementBar={endorsementBar}
      questions={questions}
      answersByQuestion={answersByQuestion}
      currentUser={currentUser}
      myReviewStatus={myReviewStatus}
      explainerContributions={explainerContributions}
      faqAnswersByQuestion={faqAnswersByQuestion}
    />
  )
}
