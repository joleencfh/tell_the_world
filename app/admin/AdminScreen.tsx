'use client'

import { useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { createBrief } from '@/lib/admin/brief-actions'
import type { BriefOption } from '@/lib/admin/brief-actions'
import type { Application, PendingQuestion, PendingCorrectionProposal, BriefProposal, PendingFaqAnswer, PendingQuestionAnswer, PendingCta, PublishedCta, PendingCoverage, PendingBriefFeedback, PendingContentPost, BriefReview, WaitlistSignup, AnalyticsEventRow } from '@/lib/admin/actions'
import type { PendingContentiousPoint } from '@/lib/admin/explainer-actions'
import Logo from '@/components/ui/Logo'
import SignOutButton from '@/components/ui/SignOutButton'
import { TabButton } from './tab-button'
import { PendingApplicationsTab, ApprovedTab } from './tabs/applications'
import {
  QuestionsTab,
  CorrectionProposalsTab,
  FaqAnswersTab,
  ContentiousPointsTab,
  QuestionAnswersTab,
} from './tabs/simple-queues'
import { CtasTab } from './tabs/ctas'
import { QuotesTab, CoverageTab, FeedbackTab } from './tabs/content'
import { ReviewsTab, ProposalsTab, WaitlistTab, AnalyticsTab } from './tabs/misc'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Tab = 'pending' | 'questions' | 'correctionProposals' | 'faqAnswers' | 'contentiousPoints' | 'questionAnswers' | 'ctas' | 'quotes' | 'coverage' | 'feedback' | 'reviews' | 'proposals' | 'approved' | 'waitlist' | 'analytics'

interface Props {
  adminEmail: string
  pending: Application[]
  pendingCount: number
  pendingPage: number
  approved: Partial<Application>[]
  approvedCount: number
  approvedPage: number
  pendingQuestions: PendingQuestion[]
  pendingQuestionsCount: number
  questionsPage: number
  pendingCorrectionProposals: PendingCorrectionProposal[]
  pendingCorrectionProposalsCount: number
  correctionProposalsPage: number
  pendingFaqAnswers: PendingFaqAnswer[]
  pendingFaqAnswersCount: number
  faqAnswersPage: number
  pendingContentiousPoints: PendingContentiousPoint[]
  pendingContentiousPointsCount: number
  contentiousPointsPage: number
  pendingQuestionAnswers: PendingQuestionAnswer[]
  pendingQuestionAnswersCount: number
  questionAnswersPage: number
  pendingCtas: PendingCta[]
  pendingCtasCount: number
  ctasPage: number
  publishedCtas: PublishedCta[]
  publishedCtasCount: number
  publishedCtasPage: number
  pendingContentPosts: PendingContentPost[]
  pendingContentPostsCount: number
  quotesPage: number
  pendingCoverage: PendingCoverage[]
  pendingCoverageCount: number
  coveragePage: number
  pendingBriefFeedback: PendingBriefFeedback[]
  pendingBriefFeedbackCount: number
  feedbackPage: number
  briefReviews: BriefReview[]
  briefReviewsCount: number
  reviewsPage: number
  briefProposals: BriefProposal[]
  briefProposalsCount: number
  proposalsPage: number
  briefOptions: BriefOption[]
  waitlistSignups: WaitlistSignup[]
  waitlistSignupsCount: number
  waitlistPage: number
  analyticsEvents: AnalyticsEventRow[]
  analyticsEventsCount: number
  analyticsPage: number
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function AdminScreen({
  adminEmail,
  pending,
  pendingCount,
  pendingPage,
  approved,
  approvedCount,
  approvedPage,
  pendingQuestions,
  pendingQuestionsCount,
  questionsPage,
  pendingCorrectionProposals,
  pendingCorrectionProposalsCount,
  correctionProposalsPage,
  pendingFaqAnswers,
  pendingFaqAnswersCount,
  faqAnswersPage,
  pendingContentiousPoints,
  pendingContentiousPointsCount,
  contentiousPointsPage,
  pendingQuestionAnswers,
  pendingQuestionAnswersCount,
  questionAnswersPage,
  pendingCtas,
  pendingCtasCount,
  ctasPage,
  publishedCtas,
  publishedCtasCount,
  publishedCtasPage,
  pendingContentPosts,
  pendingContentPostsCount,
  quotesPage,
  pendingCoverage,
  pendingCoverageCount,
  coveragePage,
  pendingBriefFeedback,
  pendingBriefFeedbackCount,
  feedbackPage,
  briefReviews,
  briefReviewsCount,
  reviewsPage,
  briefProposals,
  briefProposalsCount,
  proposalsPage,
  briefOptions,
  waitlistSignups,
  waitlistSignupsCount,
  waitlistPage,
  analyticsEvents,
  analyticsEventsCount,
  analyticsPage,
}: Props) {
  const [tab, setTab] = useState<Tab>('pending')
  // The tab row outgrew a single line — split into fixed-size pages rather
  // than wrapping or scrolling, toggled by the ‹ › control next to it.
  // Independent of `tab` itself: paging just changes which button row is
  // visible, it doesn't change the active tab or its content below.
  const [tabPage, setTabPage] = useState(0)
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Preserves every other tab's page param when paginating within one tab.
  function buildPageHref(paramName: string, page: number): string {
    const p = new URLSearchParams(searchParams.toString())
    p.set(paramName, String(page))
    return `${pathname}?${p.toString()}`
  }

  const tabDefs: { key: Tab; label: string; count?: number }[] = [
    { key: 'pending', label: 'Applications', count: pendingCount },
    { key: 'questions', label: 'Questions', count: pendingQuestionsCount },
    { key: 'correctionProposals', label: 'Correction proposals', count: pendingCorrectionProposalsCount },
    { key: 'faqAnswers', label: 'FAQ answers', count: pendingFaqAnswersCount },
    { key: 'contentiousPoints', label: 'Contentious points', count: pendingContentiousPointsCount },
    { key: 'questionAnswers', label: 'Q&A answers', count: pendingQuestionAnswersCount },
    { key: 'ctas', label: 'Calls to action', count: pendingCtasCount },
    { key: 'quotes', label: 'Contributor submissions', count: pendingContentPostsCount },
    { key: 'coverage', label: 'Coverage', count: pendingCoverageCount },
    { key: 'feedback', label: 'Feedback', count: pendingBriefFeedbackCount },
    { key: 'reviews', label: 'Reviews & endorsements', count: briefReviewsCount },
    { key: 'proposals', label: 'Brief proposals', count: briefProposalsCount },
    { key: 'waitlist', label: 'Waitlist', count: waitlistSignupsCount },
    { key: 'approved', label: 'Recently approved' },
    { key: 'analytics', label: 'Analytics' },
  ]
  const TAB_PAGE_SIZE = 6
  const tabPages: (typeof tabDefs)[] = []
  for (let i = 0; i < tabDefs.length; i += TAB_PAGE_SIZE) tabPages.push(tabDefs.slice(i, i + TAB_PAGE_SIZE))
  const activeTabLabel = tabDefs.find((t) => t.key === tab)?.label ?? 'Applications'

  return (
    <div className="min-h-screen bg-paper text-ink">
      {/* Header */}
      <header className="border-b-2 border-ink px-6">
        <div className="mx-auto flex max-w-4xl items-center justify-between py-4">
          <div className="flex items-center gap-4">
            <Logo href="/admin" />
            <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-ink-soft border border-line px-2 py-0.5">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-mono text-[9px] text-ink-soft hidden sm:block">{adminEmail}</span>
            <SignOutButton className="font-mono text-[9px] tracking-[0.2em] uppercase text-ink-soft hover:text-ink transition-colors" />
          </div>
        </div>
      </header>

      <main className="px-6 py-10">
        <div className="mx-auto max-w-4xl">

          {/* Page title */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="font-display uppercase text-[2rem] tracking-tight text-ink leading-none">
              {activeTabLabel}
            </h1>
            <form action={createBrief}>
              <button
                type="submit"
                className="font-mono text-[10px] tracking-[0.18em] uppercase px-5 py-2.5 border border-line text-ink-soft hover:border-ink hover:text-ink transition-colors"
              >
                + New brief
              </button>
            </form>
          </div>

          {/* Tabs — 15 of them now, split across fixed-size pages (see
              tabPage's own comment above) rather than one overcrowded row. */}
          <div className="flex items-center justify-between gap-4 border-b border-line mb-6">
            <div className="flex gap-0">
              {tabPages[tabPage].map((t) => (
                <TabButton key={t.key} active={tab === t.key} onClick={() => setTab(t.key)}>
                  {t.label}
                  {!!t.count && t.count > 0 && (
                    <span className="ml-2 font-mono text-[9px] bg-blue text-white px-1.5 py-0.5">{t.count}</span>
                  )}
                </TabButton>
              ))}
            </div>
            <div className="flex items-center gap-2 pb-2 shrink-0">
              <button
                type="button"
                onClick={() => setTabPage((p) => Math.max(0, p - 1))}
                disabled={tabPage === 0}
                aria-label="Previous tabs"
                className="font-mono text-xs text-ink-soft hover:text-ink disabled:opacity-30 disabled:cursor-default"
              >
                ‹
              </button>
              <span className="font-mono text-[9px] text-ink-faint tabular-nums">{tabPage + 1}/{tabPages.length}</span>
              <button
                type="button"
                onClick={() => setTabPage((p) => Math.min(tabPages.length - 1, p + 1))}
                disabled={tabPage === tabPages.length - 1}
                aria-label="More tabs"
                className="font-mono text-xs text-ink-soft hover:text-ink disabled:opacity-30 disabled:cursor-default"
              >
                ›
              </button>
            </div>
          </div>

          {tab === 'pending' && (
            <PendingApplicationsTab pending={pending} pendingCount={pendingCount} pendingPage={pendingPage} buildPageHref={buildPageHref} />
          )}

          {tab === 'questions' && (
            <QuestionsTab
              pendingQuestions={pendingQuestions}
              pendingQuestionsCount={pendingQuestionsCount}
              questionsPage={questionsPage}
              buildPageHref={buildPageHref}
            />
          )}

          {tab === 'correctionProposals' && (
            <CorrectionProposalsTab
              pendingCorrectionProposals={pendingCorrectionProposals}
              pendingCorrectionProposalsCount={pendingCorrectionProposalsCount}
              correctionProposalsPage={correctionProposalsPage}
              buildPageHref={buildPageHref}
            />
          )}

          {tab === 'faqAnswers' && (
            <FaqAnswersTab
              pendingFaqAnswers={pendingFaqAnswers}
              pendingFaqAnswersCount={pendingFaqAnswersCount}
              faqAnswersPage={faqAnswersPage}
              buildPageHref={buildPageHref}
            />
          )}

          {tab === 'contentiousPoints' && (
            <ContentiousPointsTab
              pendingContentiousPoints={pendingContentiousPoints}
              pendingContentiousPointsCount={pendingContentiousPointsCount}
              contentiousPointsPage={contentiousPointsPage}
              buildPageHref={buildPageHref}
            />
          )}

          {tab === 'questionAnswers' && (
            <QuestionAnswersTab
              pendingQuestionAnswers={pendingQuestionAnswers}
              pendingQuestionAnswersCount={pendingQuestionAnswersCount}
              questionAnswersPage={questionAnswersPage}
              buildPageHref={buildPageHref}
            />
          )}

          {tab === 'ctas' && (
            <CtasTab
              pendingCtas={pendingCtas}
              pendingCtasCount={pendingCtasCount}
              ctasPage={ctasPage}
              publishedCtas={publishedCtas}
              publishedCtasCount={publishedCtasCount}
              publishedCtasPage={publishedCtasPage}
              buildPageHref={buildPageHref}
            />
          )}

          {tab === 'quotes' && (
            <QuotesTab
              pendingContentPosts={pendingContentPosts}
              pendingContentPostsCount={pendingContentPostsCount}
              quotesPage={quotesPage}
              buildPageHref={buildPageHref}
            />
          )}

          {tab === 'coverage' && (
            <CoverageTab
              pendingCoverage={pendingCoverage}
              pendingCoverageCount={pendingCoverageCount}
              coveragePage={coveragePage}
              buildPageHref={buildPageHref}
            />
          )}

          {tab === 'feedback' && (
            <FeedbackTab
              pendingBriefFeedback={pendingBriefFeedback}
              pendingBriefFeedbackCount={pendingBriefFeedbackCount}
              feedbackPage={feedbackPage}
              buildPageHref={buildPageHref}
            />
          )}

          {tab === 'reviews' && (
            <ReviewsTab briefReviews={briefReviews} briefReviewsCount={briefReviewsCount} reviewsPage={reviewsPage} buildPageHref={buildPageHref} />
          )}

          {tab === 'proposals' && (
            <ProposalsTab
              briefProposals={briefProposals}
              briefProposalsCount={briefProposalsCount}
              proposalsPage={proposalsPage}
              briefOptions={briefOptions}
              buildPageHref={buildPageHref}
            />
          )}

          {tab === 'waitlist' && (
            <WaitlistTab
              waitlistSignups={waitlistSignups}
              waitlistSignupsCount={waitlistSignupsCount}
              waitlistPage={waitlistPage}
              buildPageHref={buildPageHref}
            />
          )}

          {tab === 'approved' && (
            <ApprovedTab approved={approved} approvedCount={approvedCount} approvedPage={approvedPage} buildPageHref={buildPageHref} />
          )}

          {tab === 'analytics' && (
            <AnalyticsTab
              analyticsEvents={analyticsEvents}
              analyticsEventsCount={analyticsEventsCount}
              analyticsPage={analyticsPage}
              buildPageHref={buildPageHref}
            />
          )}

        </div>
      </main>
    </div>
  )
}
