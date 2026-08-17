'use client'

import { useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { createBrief } from '@/lib/admin/brief-actions'
import type { Application, PendingQuestion, PendingCorrectionProposal, BriefProposal, PendingFaqAnswer, PendingCta, PendingCoverage } from '@/lib/admin/actions'
import { ADMIN_PAGE_SIZE } from '@/lib/data/admin'
import Pagination from '@/components/ui/Pagination'
import Logo from '@/components/ui/Logo'
import { ApplicationCard, QuestionCard, CorrectionProposalCard, BriefProposalCard, ApprovedRow } from './cards'
import { FaqAnswerCard } from './faq-answer-card'
import { CtaCard } from './cta-card'
import { CoverageCard } from './coverage-card'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Tab = 'pending' | 'questions' | 'correctionProposals' | 'faqAnswers' | 'ctas' | 'coverage' | 'proposals' | 'approved'

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
  pendingCtas: PendingCta[]
  pendingCtasCount: number
  ctasPage: number
  pendingCoverage: PendingCoverage[]
  pendingCoverageCount: number
  coveragePage: number
  briefProposals: BriefProposal[]
  briefProposalsCount: number
  proposalsPage: number
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
  pendingCtas,
  pendingCtasCount,
  ctasPage,
  pendingCoverage,
  pendingCoverageCount,
  coveragePage,
  briefProposals,
  briefProposalsCount,
  proposalsPage,
}: Props) {
  const [tab, setTab] = useState<Tab>('pending')
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

          {/* Tabs */}
          <div className="flex gap-0 border-b border-line mb-6">
            <TabButton active={tab === 'pending'} onClick={() => setTab('pending')}>
              Applications
              {pendingCount > 0 && (
                <span className="ml-2 font-mono text-[9px] bg-blue text-white px-1.5 py-0.5">
                  {pendingCount}
                </span>
              )}
            </TabButton>
            <TabButton active={tab === 'questions'} onClick={() => setTab('questions')}>
              Questions
              {pendingQuestionsCount > 0 && (
                <span className="ml-2 font-mono text-[9px] bg-blue text-white px-1.5 py-0.5">
                  {pendingQuestionsCount}
                </span>
              )}
            </TabButton>
            <TabButton active={tab === 'correctionProposals'} onClick={() => setTab('correctionProposals')}>
              Correction proposals
              {pendingCorrectionProposalsCount > 0 && (
                <span className="ml-2 font-mono text-[9px] bg-blue text-white px-1.5 py-0.5">
                  {pendingCorrectionProposalsCount}
                </span>
              )}
            </TabButton>
            <TabButton active={tab === 'faqAnswers'} onClick={() => setTab('faqAnswers')}>
              FAQ answers
              {pendingFaqAnswersCount > 0 && (
                <span className="ml-2 font-mono text-[9px] bg-blue text-white px-1.5 py-0.5">
                  {pendingFaqAnswersCount}
                </span>
              )}
            </TabButton>
            <TabButton active={tab === 'ctas'} onClick={() => setTab('ctas')}>
              Calls to action
              {pendingCtasCount > 0 && (
                <span className="ml-2 font-mono text-[9px] bg-blue text-white px-1.5 py-0.5">
                  {pendingCtasCount}
                </span>
              )}
            </TabButton>
            <TabButton active={tab === 'coverage'} onClick={() => setTab('coverage')}>
              Coverage
              {pendingCoverageCount > 0 && (
                <span className="ml-2 font-mono text-[9px] bg-blue text-white px-1.5 py-0.5">
                  {pendingCoverageCount}
                </span>
              )}
            </TabButton>
            <TabButton active={tab === 'proposals'} onClick={() => setTab('proposals')}>
              Brief proposals
              {briefProposalsCount > 0 && (
                <span className="ml-2 font-mono text-[9px] bg-blue text-white px-1.5 py-0.5">
                  {briefProposalsCount}
                </span>
              )}
            </TabButton>
            <TabButton active={tab === 'approved'} onClick={() => setTab('approved')}>
              Recently approved
            </TabButton>
          </div>

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
                    <BriefProposalCard key={p.id} proposal={p} />
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
