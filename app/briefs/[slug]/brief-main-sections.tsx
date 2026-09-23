import { Fragment } from 'react'
import Link from 'next/link'
import {
  SECTION_ORDER,
  SECTION_META,
  SECTION_BG,
  SectionHeader,
  LockedPlaceholder,
} from './section-content'
import type { ContributeModalKind } from './contribute'
import { ExplainerSections } from './explainer'
import { FAQSection } from './faq'
import type {
  Brief,
  BriefSection,
  CurrentUser,
  ContentiousPoint,
  ExplainerComment,
  ExplainerUsefulness,
  FaqAnswer,
} from './page'
import type { EngagementAuthor } from '@/lib/data/explainer-engagement'
import type { FaqMeta } from '@/lib/data/faq-meta'

// ---------------------------------------------------------------------------
// Sections or lock — the brief's Explainer/FAQ content when visible, or a
// locked-placeholder preview + Members Only CTA on a members_only brief for
// a logged-out visitor.
// ---------------------------------------------------------------------------

export function BriefMainSections({
  showSections,
  sortedSections,
  goingDeeperSections,
  brief,
  currentUser,
  isLoggedIn,
  canContribute,
  onSuggestQuestion,
  onExplainerFeedback,
  contentiousPoints,
  explainerComments,
  explainerUsefulness,
  engagementAuthor,
  canFlagContentious,
  canVoteUseful,
  onFlagContentious,
  onShowUsefulLikers,
  faqAnswersByQuestion,
  faqMetaByQuestion,
  onFaqGiveFeedback,
}: {
  showSections: boolean
  sortedSections: BriefSection[]
  goingDeeperSections: BriefSection[]
  brief: Brief
  currentUser: CurrentUser | null
  isLoggedIn: boolean
  canContribute: boolean
  onSuggestQuestion: (kind: ContributeModalKind) => void
  onExplainerFeedback: () => void
  contentiousPoints: ContentiousPoint[]
  explainerComments: ExplainerComment[]
  explainerUsefulness: ExplainerUsefulness
  engagementAuthor: EngagementAuthor | null
  canFlagContentious: boolean
  canVoteUseful: boolean
  onFlagContentious: () => void
  onShowUsefulLikers: () => void
  faqAnswersByQuestion: Record<string, FaqAnswer[]>
  faqMetaByQuestion: Record<string, FaqMeta>
  onFaqGiveFeedback: (question: string) => void
}) {
  if (!showSections) {
    return (
      <div className="px-6 py-14">
        <div className="mx-auto max-w-4xl space-y-2">
          {SECTION_ORDER.map((type) => (
            <LockedPlaceholder key={type} />
          ))}
        </div>
        {/* Members-only CTA */}
        <div className="mx-auto max-w-4xl mt-6">
          <div className="bg-coverage-bg rounded-2xl p-10 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-coverage-fg/5 mb-5">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-pink">
                <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="font-display uppercase text-coverage-fg text-2xl mb-3">Members Only</p>
            <p className="font-body text-sm text-coverage-fg/50 mb-8 leading-relaxed max-w-sm mx-auto">
              The full brief — sources, context, and expert guidance — is available to approved members of the Tell The World community.
            </p>
            <div className="flex items-center justify-center gap-6 flex-wrap">
              <Link href="/apply" className="font-display uppercase tracking-widest text-xs bg-pink-ink text-white px-8 py-3 hover:opacity-90 transition-opacity">
                Apply to Join
              </Link>
              <Link href="/login" className="font-mono text-[9px] tracking-[0.15em] uppercase text-coverage-fg/40 hover:text-coverage-fg/80 transition-colors">
                Already a member? Login →
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {SECTION_ORDER.map((type, i) => {
        // A section type can have more than one row (e.g. multiple
        // titled Explainer subsections, Part 3) — render every
        // matching row, not just the first, so content isn't silently
        // dropped.
        const sections = sortedSections.filter((s) => s.section_type === type)

        return (
          <Fragment key={type}>
            {sections.length > 0 && (() => {
              const meta = SECTION_META[type]
              const bgClass = SECTION_BG[i] ?? 'bg-paper'
              return (
                <div id={`section-${type}`} className={`${bgClass} scroll-mt-20 border-t-4 border-t-blue border-b border-b-line px-6 py-16`}>
                  <div className="mx-auto max-w-4xl anim-rise" style={{ animationDelay: '100ms' }}>
                    <SectionHeader
                      num={meta.num}
                      label={meta.label}
                      description={meta.description}
                      numTone={type === 'faq' ? 'blue' : 'ink'}
                      action={
                        type === 'faq' && (canContribute || currentUser?.role === 'admin') ? (
                          // Opens the shared feedback mechanism (Part 0c)
                          // rather than a role-gated submission, so —
                          // unlike canContribute's other gated controls —
                          // it's safe to also preview for admin.
                          <button
                            type="button" onClick={() => onSuggestQuestion('faq-question')} style={{ touchAction: 'manipulation' }}
                            className="border-[1.5px] border-ink bg-paper px-4 py-2 font-mono text-[0.68rem] uppercase tracking-[0.06em] text-ink transition-colors hover:border-blue hover:text-blue"
                          >
                            + Suggest question
                          </button>
                        ) : type === 'explainer' && isLoggedIn ? (
                          // Renamed from "Suggest changes" and opened to
                          // every logged-in role (Explainer Engagement
                          // Options design pass, 2026-08-26) — this is
                          // now the Explainer's only feedback trigger
                          // (the old bottom-of-section "Give feedback on
                          // this section" link is gone; the public
                          // contentious-point/comment mechanisms in
                          // ExplainerEngagement below replace what that
                          // link's open-to-everyone reach used to cover).
                          <button
                            type="button"
                            onClick={onExplainerFeedback}
                            style={{ touchAction: 'manipulation' }}
                            className="border-[1.5px] border-blue bg-paper px-4 py-2 font-mono text-[0.68rem] uppercase tracking-[0.06em] text-blue-ink outline-none transition-colors hover:bg-blue hover:text-white focus-visible:ring-2 focus-visible:ring-blue"
                          >
                            Give feedback
                          </button>
                        ) : undefined
                      }
                    />
                    {type === 'explainer' ? (
                      <ExplainerSections
                        explainerTitle={brief.explainer_title}
                        sections={sections}
                        sourceSections={goingDeeperSections}
                        timelineEvents={brief.brief_timeline_events}
                        briefId={brief.id}
                        briefSlug={brief.slug}
                        contentiousPoints={contentiousPoints}
                        comments={explainerComments}
                        usefulness={explainerUsefulness}
                        currentUser={engagementAuthor}
                        canFlagContentious={canFlagContentious}
                        canVoteUseful={canVoteUseful}
                        onFlagContentious={onFlagContentious}
                        onShowUsefulLikers={onShowUsefulLikers}
                      />
                    ) : (
                      <FAQSection
                        sections={sections}
                        briefId={brief.id}
                        briefSlug={brief.slug}
                        canSubmit={canContribute || currentUser?.role === 'admin'}
                        answersByQuestion={faqAnswersByQuestion}
                        faqMetaByQuestion={faqMetaByQuestion}
                        onGiveFeedback={onFaqGiveFeedback}
                        isLoggedIn={isLoggedIn}
                      />
                    )}
                  </div>
                </div>
              )
            })()}
          </Fragment>
        )
      })}
    </>
  )
}
