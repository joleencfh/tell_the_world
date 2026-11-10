import { Fragment } from 'react'
import Link from 'next/link'
import Button, { buttonClasses } from '@/components/ui/Button'
import LockedPanel from '@/components/ui/LockedPanel'
import Skeleton from '@/components/ui/Skeleton'
import {
  SECTION_ORDER,
  SECTION_META,
  SectionHeader,
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
      <div className="border-t border-rule px-4 py-14 md:px-gutter md:py-section">
        <div className="mx-auto max-w-content">
          {/* Decorative preview of the locked sections; no copy. */}
          <div aria-hidden="true" className="mb-6 space-y-3">
            <Skeleton className="h-7 w-56" />
            {["w-[88%]", "w-[75%]", "w-[92%]", "w-[68%]"].map((w) => (
              <Skeleton key={w} className={`h-3 ${w}`} />
            ))}
          </div>
          <LockedPanel
            title="Members Only"
            action={
              <div className="flex flex-wrap items-center gap-3">
                <Link href="/apply" className={buttonClasses({ variant: 'primary' })}>
                  Apply to Join
                </Link>
                <Link href="/login" className={buttonClasses({ variant: 'ghost' })}>
                  Already a member? Login →
                </Link>
              </div>
            }
          >
            The full brief — sources, context, and expert guidance — is available to approved members of the Tell The World community.
          </LockedPanel>
        </div>
      </div>
    )
  }

  return (
    <>
      {SECTION_ORDER.map((type) => {
        // A section type can have more than one row (e.g. multiple
        // titled Explainer subsections, Part 3) — render every
        // matching row, not just the first, so content isn't silently
        // dropped.
        const sections = sortedSections.filter((s) => s.section_type === type)

        return (
          <Fragment key={type}>
            {sections.length > 0 && (() => {
              const meta = SECTION_META[type]
              return (
                <div id={`section-${type}`} className="scroll-mt-32 border-t border-rule px-4 py-14 md:px-gutter md:py-section">
                  <div className="mx-auto max-w-content anim-rise" style={{ animationDelay: '100ms' }}>
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
                          <Button
                            type="button"
                            variant="secondary"
                            small
                            onClick={() => onSuggestQuestion('faq-question')}
                            style={{ touchAction: 'manipulation' }}
                          >
                            + Suggest question
                          </Button>
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
                          <Button
                            type="button"
                            variant="secondary"
                            small
                            onClick={onExplainerFeedback}
                            style={{ touchAction: 'manipulation' }}
                          >
                            Give feedback
                          </Button>
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
