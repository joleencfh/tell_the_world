import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  getPendingApplications,
  getRecentlyApproved,
  getPendingQuestions,
  getPendingCorrectionProposals,
  getPendingFaqAnswers,
  getPendingQuestionAnswers,
  getPendingCtas,
  getPublishedCtasAdmin,
  getPendingContentPosts,
  getPendingCoverage,
  getPendingBriefFeedback,
  getBriefReviews,
  getBriefProposals,
  getWaitlistSignups,
  getAnalyticsEvents,
} from '@/lib/admin/actions'
import { getPendingContentiousPoints } from '@/lib/admin/explainer-actions'
import { getBriefOptions } from '@/lib/admin/brief-actions'
import AdminScreen from './AdminScreen'

function toPage(v: string | string[] | undefined): number {
  const n = typeof v === 'string' ? parseInt(v, 10) : NaN
  return Number.isFinite(n) && n > 0 ? n : 1
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  // Auth check — server-side, before any data is fetched or UI is rendered
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    redirect('/login')
  }

  const raw = await searchParams
  const pendingPage = toPage(raw.pendingPage)
  const questionsPage = toPage(raw.questionsPage)
  const correctionProposalsPage = toPage(raw.correctionProposalsPage)
  const faqAnswersPage = toPage(raw.faqAnswersPage)
  const contentiousPointsPage = toPage(raw.contentiousPointsPage)
  const questionAnswersPage = toPage(raw.questionAnswersPage)
  const ctasPage = toPage(raw.ctasPage)
  const publishedCtasPage = toPage(raw.publishedCtasPage)
  const quotesPage = toPage(raw.quotesPage)
  const coveragePage = toPage(raw.coveragePage)
  const feedbackPage = toPage(raw.feedbackPage)
  const reviewsPage = toPage(raw.reviewsPage)
  const proposalsPage = toPage(raw.proposalsPage)
  const approvedPage = toPage(raw.approvedPage)
  const waitlistPage = toPage(raw.waitlistPage)
  const analyticsPage = toPage(raw.analyticsPage)

  // Fetch data with the service-role client (bypasses RLS)
  const [pendingResult, approvedResult, questionsResult, correctionProposalsResult, faqAnswersResult, contentiousPointsResult, questionAnswersResult, ctasResult, publishedCtasResult, quotesResult, coverageResult, feedbackResult, reviewsResult, proposalsResult, briefOptions, waitlistResult, analyticsResult] = await Promise.all([
    getPendingApplications(pendingPage),
    getRecentlyApproved(approvedPage),
    getPendingQuestions(questionsPage),
    getPendingCorrectionProposals(correctionProposalsPage),
    getPendingFaqAnswers(faqAnswersPage),
    getPendingContentiousPoints(contentiousPointsPage),
    getPendingQuestionAnswers(questionAnswersPage),
    getPendingCtas(ctasPage),
    getPublishedCtasAdmin(publishedCtasPage),
    getPendingContentPosts(quotesPage),
    getPendingCoverage(coveragePage),
    getPendingBriefFeedback(feedbackPage),
    getBriefReviews(reviewsPage),
    getBriefProposals(proposalsPage),
    getBriefOptions(),
    getWaitlistSignups(waitlistPage),
    getAnalyticsEvents(analyticsPage),
  ])

  return (
    <AdminScreen
      adminEmail={user.email!}
      pending={pendingResult.data}
      pendingCount={pendingResult.count}
      pendingPage={pendingPage}
      approved={approvedResult.data}
      approvedCount={approvedResult.count}
      approvedPage={approvedPage}
      pendingQuestions={questionsResult.data}
      pendingQuestionsCount={questionsResult.count}
      questionsPage={questionsPage}
      pendingCorrectionProposals={correctionProposalsResult.data}
      pendingCorrectionProposalsCount={correctionProposalsResult.count}
      correctionProposalsPage={correctionProposalsPage}
      pendingFaqAnswers={faqAnswersResult.data}
      pendingFaqAnswersCount={faqAnswersResult.count}
      faqAnswersPage={faqAnswersPage}
      pendingContentiousPoints={contentiousPointsResult.data}
      pendingContentiousPointsCount={contentiousPointsResult.count}
      contentiousPointsPage={contentiousPointsPage}
      pendingQuestionAnswers={questionAnswersResult.data}
      pendingQuestionAnswersCount={questionAnswersResult.count}
      questionAnswersPage={questionAnswersPage}
      pendingCtas={ctasResult.data}
      pendingCtasCount={ctasResult.count}
      ctasPage={ctasPage}
      publishedCtas={publishedCtasResult.data}
      publishedCtasCount={publishedCtasResult.count}
      publishedCtasPage={publishedCtasPage}
      pendingContentPosts={quotesResult.data}
      pendingContentPostsCount={quotesResult.count}
      quotesPage={quotesPage}
      pendingCoverage={coverageResult.data}
      pendingCoverageCount={coverageResult.count}
      coveragePage={coveragePage}
      pendingBriefFeedback={feedbackResult.data}
      pendingBriefFeedbackCount={feedbackResult.count}
      feedbackPage={feedbackPage}
      briefReviews={reviewsResult.data}
      briefReviewsCount={reviewsResult.count}
      reviewsPage={reviewsPage}
      briefProposals={proposalsResult.data}
      briefProposalsCount={proposalsResult.count}
      proposalsPage={proposalsPage}
      briefOptions={briefOptions}
      waitlistSignups={waitlistResult.data}
      waitlistSignupsCount={waitlistResult.count}
      waitlistPage={waitlistPage}
      analyticsEvents={analyticsResult.data}
      analyticsEventsCount={analyticsResult.count}
      analyticsPage={analyticsPage}
    />
  )
}
