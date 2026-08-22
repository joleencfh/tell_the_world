import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  getPendingApplications,
  getRecentlyApproved,
  getPendingQuestions,
  getPendingCorrectionProposals,
  getPendingFaqAnswers,
  getPendingCtas,
  getPendingQuotes,
  getPendingCoverage,
  getPendingBriefFeedback,
  getBriefProposals,
} from '@/lib/admin/actions'
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
  const ctasPage = toPage(raw.ctasPage)
  const quotesPage = toPage(raw.quotesPage)
  const coveragePage = toPage(raw.coveragePage)
  const feedbackPage = toPage(raw.feedbackPage)
  const proposalsPage = toPage(raw.proposalsPage)
  const approvedPage = toPage(raw.approvedPage)

  // Fetch data with the service-role client (bypasses RLS)
  const [pendingResult, approvedResult, questionsResult, correctionProposalsResult, faqAnswersResult, ctasResult, quotesResult, coverageResult, feedbackResult, proposalsResult] = await Promise.all([
    getPendingApplications(pendingPage),
    getRecentlyApproved(approvedPage),
    getPendingQuestions(questionsPage),
    getPendingCorrectionProposals(correctionProposalsPage),
    getPendingFaqAnswers(faqAnswersPage),
    getPendingCtas(ctasPage),
    getPendingQuotes(quotesPage),
    getPendingCoverage(coveragePage),
    getPendingBriefFeedback(feedbackPage),
    getBriefProposals(proposalsPage),
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
      pendingCtas={ctasResult.data}
      pendingCtasCount={ctasResult.count}
      ctasPage={ctasPage}
      pendingQuotes={quotesResult.data}
      pendingQuotesCount={quotesResult.count}
      quotesPage={quotesPage}
      pendingCoverage={coverageResult.data}
      pendingCoverageCount={coverageResult.count}
      coveragePage={coveragePage}
      pendingBriefFeedback={feedbackResult.data}
      pendingBriefFeedbackCount={feedbackResult.count}
      feedbackPage={feedbackPage}
      briefProposals={proposalsResult.data}
      briefProposalsCount={proposalsResult.count}
      proposalsPage={proposalsPage}
    />
  )
}
