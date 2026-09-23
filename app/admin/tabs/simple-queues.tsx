import type { PendingQuestion, PendingCorrectionProposal, PendingFaqAnswer, PendingQuestionAnswer } from '@/lib/admin/actions'
import type { PendingContentiousPoint } from '@/lib/admin/explainer-actions'
import { ADMIN_PAGE_SIZE } from '@/lib/data/admin'
import Pagination from '@/components/ui/Pagination'
import { QuestionCard, CorrectionProposalCard } from '../cards'
import { FaqAnswerCard } from '../faq-answer-card'
import { ContentiousPointCard } from '../contentious-point-card'
import { QuestionAnswerCard } from '../question-answer-card'
import type { TabProps } from './shared'

export function QuestionsTab({
  pendingQuestions,
  pendingQuestionsCount,
  questionsPage,
  buildPageHref,
}: TabProps & { pendingQuestions: PendingQuestion[]; pendingQuestionsCount: number; questionsPage: number }) {
  return (
    <>
      {pendingQuestions.length === 0 ? (
        <p className="font-body text-sm text-ink-soft italic py-8 text-center">
          No pending questions.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {pendingQuestions.map(q => (
            <QuestionCard key={q.id} question={q} />
          ))}
        </div>
      )}
      <Pagination
        page={questionsPage}
        pageSize={ADMIN_PAGE_SIZE}
        total={pendingQuestionsCount}
        buildHref={(p) => buildPageHref('questionsPage', p)}
      />
    </>
  )
}

export function CorrectionProposalsTab({
  pendingCorrectionProposals,
  pendingCorrectionProposalsCount,
  correctionProposalsPage,
  buildPageHref,
}: TabProps & {
  pendingCorrectionProposals: PendingCorrectionProposal[]
  pendingCorrectionProposalsCount: number
  correctionProposalsPage: number
}) {
  return (
    <>
      {pendingCorrectionProposals.length === 0 ? (
        <p className="font-body text-sm text-ink-soft italic py-8 text-center">
          No pending correction proposals.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {pendingCorrectionProposals.map(c => (
            <CorrectionProposalCard key={c.id} proposal={c} />
          ))}
        </div>
      )}
      <Pagination
        page={correctionProposalsPage}
        pageSize={ADMIN_PAGE_SIZE}
        total={pendingCorrectionProposalsCount}
        buildHref={(p) => buildPageHref('correctionProposalsPage', p)}
      />
    </>
  )
}

export function FaqAnswersTab({
  pendingFaqAnswers,
  pendingFaqAnswersCount,
  faqAnswersPage,
  buildPageHref,
}: TabProps & { pendingFaqAnswers: PendingFaqAnswer[]; pendingFaqAnswersCount: number; faqAnswersPage: number }) {
  return (
    <>
      {pendingFaqAnswers.length === 0 ? (
        <p className="font-body text-sm text-ink-soft italic py-8 text-center">
          No pending FAQ answers.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {pendingFaqAnswers.map(a => (
            <FaqAnswerCard key={a.id} answer={a} />
          ))}
        </div>
      )}
      <Pagination
        page={faqAnswersPage}
        pageSize={ADMIN_PAGE_SIZE}
        total={pendingFaqAnswersCount}
        buildHref={(p) => buildPageHref('faqAnswersPage', p)}
      />
    </>
  )
}

// Explainer engagement redesign
export function ContentiousPointsTab({
  pendingContentiousPoints,
  pendingContentiousPointsCount,
  contentiousPointsPage,
  buildPageHref,
}: TabProps & {
  pendingContentiousPoints: PendingContentiousPoint[]
  pendingContentiousPointsCount: number
  contentiousPointsPage: number
}) {
  return (
    <>
      {pendingContentiousPoints.length === 0 ? (
        <p className="font-body text-sm text-ink-soft italic py-8 text-center">
          No pending contentious points.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {pendingContentiousPoints.map(p => (
            <ContentiousPointCard key={p.id} point={p} />
          ))}
        </div>
      )}
      <Pagination
        page={contentiousPointsPage}
        pageSize={ADMIN_PAGE_SIZE}
        total={pendingContentiousPointsCount}
        buildHref={(p) => buildPageHref('contentiousPointsPage', p)}
      />
    </>
  )
}

export function QuestionAnswersTab({
  pendingQuestionAnswers,
  pendingQuestionAnswersCount,
  questionAnswersPage,
  buildPageHref,
}: TabProps & {
  pendingQuestionAnswers: PendingQuestionAnswer[]
  pendingQuestionAnswersCount: number
  questionAnswersPage: number
}) {
  return (
    <>
      {pendingQuestionAnswers.length === 0 ? (
        <p className="font-body text-sm text-ink-soft italic py-8 text-center">
          No pending Q&amp;A answers.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {pendingQuestionAnswers.map(a => (
            <QuestionAnswerCard key={a.id} answer={a} />
          ))}
        </div>
      )}
      <Pagination
        page={questionAnswersPage}
        pageSize={ADMIN_PAGE_SIZE}
        total={pendingQuestionAnswersCount}
        buildHref={(p) => buildPageHref('questionAnswersPage', p)}
      />
    </>
  )
}
