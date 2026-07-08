'use client'

import { useState } from 'react'
import { createBrief } from '@/lib/admin/brief-actions'
import type { Application, PendingQuestion, PendingContribution, BriefProposal } from '@/lib/admin/actions'
import { ApplicationCard, QuestionCard, ContributionCard, BriefProposalCard, ApprovedRow } from './cards'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Tab = 'pending' | 'questions' | 'contributions' | 'proposals' | 'approved'

interface Props {
  adminEmail: string
  pending: Application[]
  approved: Partial<Application>[]
  pendingQuestions: PendingQuestion[]
  pendingContributions: PendingContribution[]
  briefProposals: BriefProposal[]
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function AdminScreen({ adminEmail, pending, approved, pendingQuestions, pendingContributions, briefProposals }: Props) {
  const [tab, setTab] = useState<Tab>('pending')

  return (
    <div className="min-h-screen bg-base text-text">
      {/* Header */}
      <header className="border-b border-edge px-6">
        <div className="mx-auto flex max-w-4xl items-center justify-between py-4">
          <div className="flex items-center gap-4">
            <span className="font-serif text-base font-bold tracking-tight text-dark">
              Tell <em className="italic text-live">The</em> World
            </span>
            <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-soft border border-edge px-2 py-0.5">
              Admin
            </span>
          </div>
          <span className="font-mono text-[9px] text-soft hidden sm:block">{adminEmail}</span>
        </div>
      </header>

      <main className="px-6 py-10">
        <div className="mx-auto max-w-4xl">

          {/* Page title */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="font-display uppercase text-[2rem] tracking-tight text-dark leading-none">
              Applications
            </h1>
            <form action={createBrief}>
              <button
                type="submit"
                className="font-mono text-[10px] tracking-[0.18em] uppercase px-5 py-2.5 border border-edge text-soft hover:border-dark hover:text-dark transition-colors"
              >
                + New brief
              </button>
            </form>
          </div>

          {/* Tabs */}
          <div className="flex gap-0 border-b border-edge mb-6">
            <TabButton active={tab === 'pending'} onClick={() => setTab('pending')}>
              Applications
              {pending.length > 0 && (
                <span className="ml-2 font-mono text-[9px] bg-live text-white px-1.5 py-0.5">
                  {pending.length}
                </span>
              )}
            </TabButton>
            <TabButton active={tab === 'questions'} onClick={() => setTab('questions')}>
              Questions
              {pendingQuestions.length > 0 && (
                <span className="ml-2 font-mono text-[9px] bg-live text-white px-1.5 py-0.5">
                  {pendingQuestions.length}
                </span>
              )}
            </TabButton>
            <TabButton active={tab === 'contributions'} onClick={() => setTab('contributions')}>
              Contributions
              {pendingContributions.length > 0 && (
                <span className="ml-2 font-mono text-[9px] bg-live text-white px-1.5 py-0.5">
                  {pendingContributions.length}
                </span>
              )}
            </TabButton>
            <TabButton active={tab === 'proposals'} onClick={() => setTab('proposals')}>
              Brief proposals
              {briefProposals.length > 0 && (
                <span className="ml-2 font-mono text-[9px] bg-live text-white px-1.5 py-0.5">
                  {briefProposals.length}
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
                <p className="font-serif text-sm text-soft italic py-8 text-center">
                  No pending applications.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {pending.map(app => (
                    <ApplicationCard key={app.id} app={app} />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Pending questions tab */}
          {tab === 'questions' && (
            <>
              {pendingQuestions.length === 0 ? (
                <p className="font-serif text-sm text-soft italic py-8 text-center">
                  No pending questions.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {pendingQuestions.map(q => (
                    <QuestionCard key={q.id} question={q} />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Pending contributions tab */}
          {tab === 'contributions' && (
            <>
              {pendingContributions.length === 0 ? (
                <p className="font-serif text-sm text-soft italic py-8 text-center">
                  No pending contributions.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {pendingContributions.map(c => (
                    <ContributionCard key={c.id} contribution={c} />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Brief proposals tab */}
          {tab === 'proposals' && (
            <>
              {briefProposals.length === 0 ? (
                <p className="font-serif text-sm text-soft italic py-8 text-center">
                  No brief proposals yet.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {briefProposals.map(p => (
                    <BriefProposalCard key={p.id} proposal={p} />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Approved tab */}
          {tab === 'approved' && (
            <>
              {approved.length === 0 ? (
                <p className="font-serif text-sm text-soft italic py-8 text-center">
                  No approved users yet.
                </p>
              ) : (
                <div className="bg-card border border-edge px-5 py-1">
                  {approved.map(app => (
                    <ApprovedRow key={app.id} app={app} />
                  ))}
                </div>
              )}
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
          ? 'border-dark text-dark'
          : 'border-transparent text-soft hover:text-text',
      ].join(' ')}
    >
      {children}
    </button>
  )
}
