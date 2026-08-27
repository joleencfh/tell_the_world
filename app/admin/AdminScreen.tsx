'use client'

import { useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { createBrief } from '@/lib/admin/brief-actions'
import type { BriefOption } from '@/lib/admin/brief-actions'
import type { Application, PendingQuestion, PendingCorrectionProposal, BriefProposal, PendingFaqAnswer, PendingQuestionAnswer, PendingCta, PublishedCta, PendingCoverage, PendingBriefFeedback, PendingQuote, BriefReview, WaitlistSignup } from '@/lib/admin/actions'
import type { PendingContentiousPoint } from '@/lib/admin/explainer-actions'
import { ADMIN_PAGE_SIZE } from '@/lib/data/admin'
import Pagination from '@/components/ui/Pagination'
import Logo from '@/components/ui/Logo'
import { ApplicationCard, QuestionCard, CorrectionProposalCard, BriefProposalCard, ApprovedRow } from './cards'
import { FaqAnswerCard } from './faq-answer-card'
import { ContentiousPointCard } from './contentious-point-card'
import { QuestionAnswerCard } from './question-answer-card'
import { CtaCard, PublishedCtaCard } from './cta-card'
import { QuoteCard } from './quote-card'
import { CoverageCard } from './coverage-card'
import { FeedbackCard } from './feedback-card'
import { ReviewCard } from './review-card'
import { WaitlistCard } from './waitlist-card'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Tab = 'pending' | 'questions' | 'correctionProposals' | 'faqAnswers' | 'contentiousPoints' | 'questionAnswers' | 'ctas' | 'quotes' | 'coverage' | 'feedback' | 'reviews' | 'proposals' | 'approved' | 'waitlist'

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
  pendingQuotes: PendingQuote[]
  pendingQuotesCount: number
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
  pendingQuotes,
  pendingQuotesCount,
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
}: Props) {
  const [tab, setTab] = useState<Tab>('pending')
  // The tab row outgrew a single line (10 tabs) — split across two pages
  // rather than wrapping or scrolling, toggled by the ‹ › control next to
  // it. Independent of `tab` itself: paging just changes which button row
  // is visible, it doesn't change the active tab or its content below.
  const [tabPage, setTabPage] = useState<0 | 1>(0)
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Preserves every other tab's page param when paginating within one tab.
  function buildPageHref(paramName: string, page: number): string {
    const p = new URLSearchParams(searchParams.toString())
    p.set(paramName, String(page))
    return `${pathname}?${p.toString()}`
  }

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
          <span className="font-mono text-[9px] text-ink-soft hidden sm:block">{adminEmail}</span>
        </div>
      </header>

      <main className="px-6 py-10">
        <div className="mx-auto max-w-4xl">

          {/* Page title */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="font-display uppercase text-[2rem] tracking-tight text-ink leading-none">
              Applications
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

          {/* Tabs — 12 of them now, split across two pages (see tabPage's
              own comment above) rather than one overcrowded row. */}
          {(() => {
            const tabDefs: { key: Tab; label: string; count?: number }[] = [
              { key: 'pending', label: 'Applications', count: pendingCount },
              { key: 'questions', label: 'Questions', count: pendingQuestionsCount },
              { key: 'correctionProposals', label: 'Correction proposals', count: pendingCorrectionProposalsCount },
              { key: 'faqAnswers', label: 'FAQ answers', count: pendingFaqAnswersCount },
              { key: 'contentiousPoints', label: 'Contentious points', count: pendingContentiousPointsCount },
              { key: 'questionAnswers', label: 'Q&A answers', count: pendingQuestionAnswersCount },
              { key: 'ctas', label: 'Calls to action', count: pendingCtasCount },
              { key: 'quotes', label: 'Quotes', count: pendingQuotesCount },
              { key: 'coverage', label: 'Coverage', count: pendingCoverageCount },
              { key: 'feedback', label: 'Feedback', count: pendingBriefFeedbackCount },
              { key: 'reviews', label: 'Reviews & endorsements', count: briefReviewsCount },
              { key: 'proposals', label: 'Brief proposals', count: briefProposalsCount },
              { key: 'waitlist', label: 'Waitlist', count: waitlistSignupsCount },
              { key: 'approved', label: 'Recently approved' },
            ]
            const tabPages = [tabDefs.slice(0, 6), tabDefs.slice(6)]

            return (
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
                    onClick={() => setTabPage(0)}
                    disabled={tabPage === 0}
                    aria-label="Previous tabs"
                    className="font-mono text-xs text-ink-soft hover:text-ink disabled:opacity-30 disabled:cursor-default"
                  >
                    ‹
                  </button>
                  <span className="font-mono text-[9px] text-ink-faint tabular-nums">{tabPage + 1}/2</span>
                  <button
                    type="button"
                    onClick={() => setTabPage(1)}
                    disabled={tabPage === 1}
                    aria-label="More tabs"
                    className="font-mono text-xs text-ink-soft hover:text-ink disabled:opacity-30 disabled:cursor-default"
                  >
                    ›
                  </button>
                </div>
              </div>
            )
          })()}

          {/* Pending applications tab */}
          {tab === 'pending' && (
            <>
              {pending.length === 0 ? (
                <p className="font-body text-sm text-ink-soft italic py-8 text-center">
                  No pending applications.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {pending.map(app => (
                    <ApplicationCard key={app.id} app={app} />
                  ))}
                </div>
              )}
              <Pagination
                page={pendingPage}
                pageSize={ADMIN_PAGE_SIZE}
                total={pendingCount}
                buildHref={(p) => buildPageHref('pendingPage', p)}
              />
            </>
          )}

          {/* Pending questions tab */}
          {tab === 'questions' && (
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
          )}

          {/* Pending correction proposals tab */}
          {tab === 'correctionProposals' && (
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
          )}

          {/* Pending FAQ answers tab */}
          {tab === 'faqAnswers' && (
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
          )}

          {/* Pending contentious points tab (Explainer engagement redesign) */}
          {tab === 'contentiousPoints' && (
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
          )}

          {/* Pending Q&A answers tab */}
          {tab === 'questionAnswers' && (
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
          )}

          {/* Pending calls to action tab */}
          {tab === 'ctas' && (
            <>
              {pendingCtas.length === 0 ? (
                <p className="font-body text-sm text-ink-soft italic py-8 text-center">
                  No pending calls to action.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {pendingCtas.map(c => (
                    <CtaCard key={c.id} cta={c} />
                  ))}
                </div>
              )}
              <Pagination
                page={ctasPage}
                pageSize={ADMIN_PAGE_SIZE}
                total={pendingCtasCount}
                buildHref={(p) => buildPageHref('ctasPage', p)}
              />

              {/* Published CTAs — reorder/pin control (brief-page-part2-plan.md
                  §2, Part 8). Separate from the pending queue above: these are
                  already live, this section is about which order they appear
                  in, not moderation. */}
              <div className="mt-8 pt-6 border-t border-line">
                <h2 className="mb-1 font-mono text-[10px] tracking-[0.18em] uppercase text-ink-soft">
                  Published — reorder
                </h2>
                <p className="mb-4 font-body text-xs text-ink-soft/70">
                  Default order is newest first. Set a lower number to promote a CTA earlier in its brief&apos;s
                  carousel; clear the field to return it to the default.
                </p>
                {publishedCtas.length === 0 ? (
                  <p className="font-body text-sm text-ink-soft italic py-8 text-center">
                    No published calls to action.
                  </p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {publishedCtas.map(c => (
                      <PublishedCtaCard key={c.id} cta={c} />
                    ))}
                  </div>
                )}
                <Pagination
                  page={publishedCtasPage}
                  pageSize={ADMIN_PAGE_SIZE}
                  total={publishedCtasCount}
                  buildHref={(p) => buildPageHref('publishedCtasPage', p)}
                />
              </div>
            </>
          )}

          {/* Pending quotes tab */}
          {tab === 'quotes' && (
            <>
              {pendingQuotes.length === 0 ? (
                <p className="font-body text-sm text-ink-soft italic py-8 text-center">
                  No pending quotes.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {pendingQuotes.map(q => (
                    <QuoteCard key={q.id} quote={q} />
                  ))}
                </div>
              )}
              <Pagination
                page={quotesPage}
                pageSize={ADMIN_PAGE_SIZE}
                total={pendingQuotesCount}
                buildHref={(p) => buildPageHref('quotesPage', p)}
              />
            </>
          )}

          {/* Pending coverage tab */}
          {tab === 'coverage' && (
            <>
              {pendingCoverage.length === 0 ? (
                <p className="font-body text-sm text-ink-soft italic py-8 text-center">
                  No pending coverage.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {pendingCoverage.map(c => (
                    <CoverageCard key={c.id} coverage={c} />
                  ))}
                </div>
              )}
              <Pagination
                page={coveragePage}
                pageSize={ADMIN_PAGE_SIZE}
                total={pendingCoverageCount}
                buildHref={(p) => buildPageHref('coveragePage', p)}
              />
            </>
          )}

          {/* Brief feedback tab */}
          {tab === 'feedback' && (
            <>
              {pendingBriefFeedback.length === 0 ? (
                <p className="font-body text-sm text-ink-soft italic py-8 text-center">
                  No new feedback.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {pendingBriefFeedback.map(f => (
                    <FeedbackCard key={f.id} feedback={f} />
                  ))}
                </div>
              )}
              <Pagination
                page={feedbackPage}
                pageSize={ADMIN_PAGE_SIZE}
                total={pendingBriefFeedbackCount}
                buildHref={(p) => buildPageHref('feedbackPage', p)}
              />
            </>
          )}

          {/* Reviews & endorsements tab — read-only, no pending state */}
          {tab === 'reviews' && (
            <>
              {briefReviews.length === 0 ? (
                <p className="font-body text-sm text-ink-soft italic py-8 text-center">
                  No reviews or endorsements yet.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {briefReviews.map(r => (
                    <ReviewCard key={r.id} review={r} />
                  ))}
                </div>
              )}
              <Pagination
                page={reviewsPage}
                pageSize={ADMIN_PAGE_SIZE}
                total={briefReviewsCount}
                buildHref={(p) => buildPageHref('reviewsPage', p)}
              />
            </>
          )}

          {/* Brief proposals tab */}
          {tab === 'proposals' && (
            <>
              {briefProposals.length === 0 ? (
                <p className="font-body text-sm text-ink-soft italic py-8 text-center">
                  No brief proposals yet.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {briefProposals.map(p => (
                    <BriefProposalCard key={p.id} proposal={p} briefOptions={briefOptions} />
                  ))}
                </div>
              )}
              <Pagination
                page={proposalsPage}
                pageSize={ADMIN_PAGE_SIZE}
                total={briefProposalsCount}
                buildHref={(p) => buildPageHref('proposalsPage', p)}
              />
            </>
          )}

          {/* Waitlist tab — read-only, no approve/reject state */}
          {tab === 'waitlist' && (
            <>
              {waitlistSignups.length === 0 ? (
                <p className="font-body text-sm text-ink-soft italic py-8 text-center">
                  No waitlist signups yet.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {waitlistSignups.map(w => (
                    <WaitlistCard key={w.id} signup={w} />
                  ))}
                </div>
              )}
              <Pagination
                page={waitlistPage}
                pageSize={ADMIN_PAGE_SIZE}
                total={waitlistSignupsCount}
                buildHref={(p) => buildPageHref('waitlistPage', p)}
              />
            </>
          )}

          {/* Approved tab */}
          {tab === 'approved' && (
            <>
              {approved.length === 0 ? (
                <p className="font-body text-sm text-ink-soft italic py-8 text-center">
                  No approved users yet.
                </p>
              ) : (
                <div className="bg-paper-raised border border-line px-5 py-1">
                  {approved.map(app => (
                    <ApprovedRow key={app.id} app={app} />
                  ))}
                </div>
              )}
              <Pagination
                page={approvedPage}
                pageSize={ADMIN_PAGE_SIZE}
                total={approvedCount}
                buildHref={(p) => buildPageHref('approvedPage', p)}
              />
            </>
          )}

        </div>
      </main>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tab button primitive
// ---------------------------------------------------------------------------

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'flex items-center px-4 py-2.5 font-mono text-[10px] tracking-[0.18em] uppercase border-b-2 -mb-px transition-colors',
        active
          ? 'border-ink text-ink'
          : 'border-transparent text-ink-soft hover:text-ink',
      ].join(' ')}
    >
      {children}
    </button>
  )
}
