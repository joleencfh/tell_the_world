import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { BriefVisibility, BriefSectionType, UserRole } from '@/lib/types'
import { getBriefWithSectionsBySlug, getRelatedBriefs, getBriefContributors, type RelatedBrief, type BriefTimelineEvent, type BriefContributor } from '@/lib/data/briefs'
import { getQuotesForBrief, getMediaSection, type MediaPost } from '@/lib/data/posts'
import {
  getEndorsementBar,
  getMyContributionStatus,
  type EndorsementBarCounts,
  type EndorsementBarDetail,
  type ContributionStatus,
} from '@/lib/data/contributions'
import {
  getPublishedContentiousPoints,
  getExplainerComments,
  getExplainerUsefulness,
  type ContentiousPoint,
  type ExplainerComment,
  type ExplainerUsefulness,
} from '@/lib/data/explainer-engagement'
import { getApprovedQuestions, type Question, type QuestionAuthor, type VoteSplit } from '@/lib/data/questions'
import { getQuestionAnswers, type QuestionAnswer } from '@/lib/data/question-answers'
import { getUserBasic } from '@/lib/data/users'
import { getPublishedFaqAnswers, type FaqAnswer } from '@/lib/data/faq-answers'
import { getFaqMeta, type FaqMeta } from '@/lib/data/faq-meta'
import { getPublishedCtas, type Cta } from '@/lib/data/ctas'
import { getPublishedCoverage, type Coverage } from '@/lib/data/coverage'
import { logBriefView } from '@/lib/analytics/log'
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
  EndorsementBarDetail,
  ContributionStatus,
  FaqAnswer,
  FaqMeta,
  Cta,
  Coverage,
  RelatedBrief,
  Question,
  QuestionAuthor,
  VoteSplit,
  QuestionAnswer,
  BriefTimelineEvent,
  BriefContributor,
  ContentiousPoint,
  ExplainerComment,
  ExplainerUsefulness,
}

export interface BriefSection {
  id: string
  section_type: BriefSectionType
  title: string | null
  content: string
  rich_content: unknown
  content_version: number
  display_order: number
}

export interface Brief {
  id: string
  title: string
  slug: string
  subtitle: string | null
  topic_tags: string[]
  // TODO(Part 1 step 4): drop once BriefView.tsx's hero renders topic_tags
  // directly — see the matching TODO on lib/data/briefs.ts's BriefWithSections.
  topic_tag: string | null
  pinned_media_post_id: string | null
  last_reviewed_at: string | null
  tldr_teaser: string | null
  explainer_title: string | null
  visibility: BriefVisibility
  brief_sections: BriefSection[]
  brief_timeline_events: BriefTimelineEvent[]
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

export type QuoteSource = 'member' | 'person' | 'document' | 'ai'
export type QuotePlatform = 'x' | 'linkedin'

export interface QuoteOrganization {
  name: string
  logo_url: string
}

export interface Quote {
  id: string
  title: string
  body: string | null
  url: string | null
  user_id: string | null
  quote_source: QuoteSource
  source_name: string | null
  source_detail: string | null
  source_platform: QuotePlatform | null
  created_at: string
  updated_at: string
  topic_tags: string[]
  users: QuoteAuthor | null
  source_organizations: QuoteOrganization | null
  likeCount: number
  myLike: boolean
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

  // Logged-in views only for now — deduped to one row per user per brief
  // per day. Anonymous view tracking would need a stable per-visitor
  // session id, which a Server Component can't set (no cookie writes
  // outside Server Actions/Route Handlers) — a fair follow-up once this
  // foundation is in, not needed for the initial "who's doing what" cut.
  if (user) {
    await logBriefView(user.id, brief.id)
  }

  const [quotes, media, endorsementBar, myReviewStatus, contentiousPoints, explainerComments, explainerUsefulness, faqAnswersMap, faqMetaMap, ctas, coverage, relatedBriefs, contributors] = await Promise.all([
    getQuotesForBrief(supabase, brief.id, brief.topic_tags, 4, user?.id ?? null),
    getMediaSection(supabase, brief.topic_tag, brief.pinned_media_post_id, 6),
    getEndorsementBar(supabase, brief.id, brief.brief_sections),
    user
      ? getMyContributionStatus(supabase, brief.id, null, user.id)
      : Promise.resolve<ContributionStatus>('none'),
    getPublishedContentiousPoints(supabase, brief.id, user?.id ?? null),
    getExplainerComments(supabase, brief.id, user?.id ?? null),
    getExplainerUsefulness(supabase, brief.id, user?.id ?? null),
    getPublishedFaqAnswers(supabase, brief.id),
    getFaqMeta(supabase, brief.id),
    getPublishedCtas(supabase, brief.id),
    getPublishedCoverage(supabase, brief.id, user?.id ?? null),
    getRelatedBriefs(supabase, brief.id, brief.topic_tags, 3),
    getBriefContributors(supabase, brief.id),
  ])

  // Converted from a Map to a plain object — Map doesn't round-trip cleanly
  // across the server/client boundary into 'use client' BriefView.
  const faqAnswersByQuestion: Record<string, FaqAnswer[]> = Object.fromEntries(faqAnswersMap)
  const faqMetaByQuestion: Record<string, FaqMeta> = Object.fromEntries(faqMetaMap)

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
      endorsementBar={endorsementBar.counts}
      endorsementDetail={endorsementBar.detail}
      questions={questions}
      answersByQuestion={answersByQuestion}
      currentUser={currentUser}
      myReviewStatus={myReviewStatus}
      contentiousPoints={contentiousPoints}
      explainerComments={explainerComments}
      explainerUsefulness={explainerUsefulness}
      faqAnswersByQuestion={faqAnswersByQuestion}
      faqMetaByQuestion={faqMetaByQuestion}
      ctas={ctas}
      coverage={coverage}
      relatedBriefs={relatedBriefs}
      contributors={contributors}
    />
  )
}
