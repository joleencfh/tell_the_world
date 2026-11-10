'use client'

import { useState } from 'react'
import AppHeader from '@/components/ui/AppHeader'
import Button from '@/components/ui/Button'
import Footer from '@/components/ui/Footer'
import { SECTION_META, SectionHeader, TLDRList } from './section-content'
import { QuotesCarousel } from './quotes'
import type { ContributeModalKind } from './contribute'
import { BriefModals } from './brief-modals'
import { SectionNav, buildNavSections } from './section-nav'
import { computeReadTimeMinutes } from './helpers'
import { BriefHero } from './brief-hero'
import { BriefMainSections } from './brief-main-sections'
import { QaSection, CtaSection, CoverageSection, RelatedBriefsSection, FooterActions } from './brief-secondary-sections'
import type {
  Brief,
  CurrentUser,
  Question,
  QuestionAnswer,
  Quote,
  MediaPost,
  EndorsementBarCounts,
  EndorsementBarDetail,
  ContributionStatus,
  FaqAnswer,
  Cta,
  Coverage,
  RelatedBrief,
  BriefContributor,
  ContentiousPoint,
  ExplainerComment,
  ExplainerUsefulness,
} from './page'
import type { EngagementAuthor } from '@/lib/data/explainer-engagement'
import type { FaqMeta } from '@/lib/data/faq-meta'

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface BriefViewProps {
  brief: Brief
  quotes: Quote[]
  media: MediaPost[]
  endorsementBar: EndorsementBarCounts
  endorsementDetail: EndorsementBarDetail
  questions: Question[]
  answersByQuestion: Record<string, QuestionAnswer[]>
  currentUser: CurrentUser | null
  myReviewStatus: ContributionStatus
  contentiousPoints: ContentiousPoint[]
  explainerComments: ExplainerComment[]
  explainerUsefulness: ExplainerUsefulness
  faqAnswersByQuestion: Record<string, FaqAnswer[]>
  faqMetaByQuestion: Record<string, FaqMeta>
  ctas: Cta[]
  coverage: Coverage[]
  relatedBriefs: RelatedBrief[]
  contributors: BriefContributor[]
}

// `media` stays in BriefViewProps (page.tsx still fetches and passes it —
// dropping Media from the page was a deliberate call, but the data query
// itself is out of scope for this change) but isn't destructured here since
// nothing renders it anymore.
export default function BriefView({ brief, quotes, endorsementBar, endorsementDetail, questions, answersByQuestion, currentUser, myReviewStatus, contentiousPoints, explainerComments, explainerUsefulness, faqAnswersByQuestion, faqMetaByQuestion, ctas, coverage, relatedBriefs, contributors }: BriefViewProps) {
  const isLoggedIn = !!currentUser
  const showSections = isLoggedIn || brief.visibility === 'public'
  const canContribute = currentUser?.role === 'expert' || currentUser?.role === 'organisation'
  // CTA-specific: admin also gets the "+ New CTA" trigger, as a preview/
  // convenience path (2026-08-13) so they don't need a separate expert/org
  // test account just to see the flow — submitCta routes an admin
  // submission through a different, immediate-publish branch (see its own
  // comment in lib/briefs/actions.ts). Deliberately not folded into the
  // broader canContribute above, which also gates review/endorse controls,
  // correction proposals, and FAQ answers — those still reject admin
  // server-side (CONTRIBUTOR_ROLES doesn't include it), so widening
  // canContribute itself would just show more buttons that error on click.
  const canSuggestCta = canContribute || currentUser?.role === 'admin'
  // Quotes: "+ Add quote" visible to the same org/expert/admin group as
  // "+ New CTA" above (submitQuote in lib/briefs/actions.ts accepts admin
  // the same way, no service-role bypass needed — see that action's own
  // comment).
  const canAddQuote = canContribute || currentUser?.role === 'admin'
  // "Add an answer": same org/expert/admin group as CTAs/quotes above.
  const canSubmitAnswer = canContribute || currentUser?.role === 'admin'
  // A voter's own role decides which color their Community Q&A vote lands
  // in (qa.tsx's VoteControl) — expert/org votes count blue, creator/
  // journalist votes count pink, anything else (just 'admin' today) counts
  // toward neither displayed bucket.
  const voterTone =
    currentUser?.role === 'expert' || currentUser?.role === 'organisation'
      ? 'blue'
      : currentUser?.role === 'creator' || currentUser?.role === 'journalist'
        ? 'pink'
        : null
  // Explainer engagement (Explainer Engagement Options design pass,
  // 2026-08-26): flagging a contentious point is expert/organisation, and
  // the usefulness vote is creator/journalist — but unlike canContribute's
  // other gated controls, admin is included in *both* here (confirmed with
  // the user 2026-08-26; RLS widened to match in migration
  // 048_explainer_engagement_admin.sql), so admin can preview every
  // Explainer engagement mechanism without needing a second test account.
  // engagementAuthor reshapes CurrentUser into the fuller EngagementAuthor
  // shape ExplainerEngagement needs for its comment form's optimistic local
  // append (job_title/affiliation/org_name aren't on CurrentUser, so
  // they're left null — a real page load fills them in).
  const canFlagContentious = canContribute || currentUser?.role === 'admin'
  const canVoteUseful = currentUser?.role === 'creator' || currentUser?.role === 'journalist' || currentUser?.role === 'admin'
  const engagementAuthor: EngagementAuthor | null = currentUser
    ? {
        id: currentUser.id,
        display_name: currentUser.display_name,
        avatar_url: currentUser.avatar_url,
        role: currentUser.role,
        job_title: null,
        affiliation: null,
        org_name: null,
      }
    : null
  const [proposeCorrectionOpen, setProposeCorrectionOpen] = useState(false)
  const [proposeBriefOpen, setProposeBriefOpen] = useState(false)
  const [suggestCtaOpen, setSuggestCtaOpen] = useState(false)
  const [addCoverageOpen, setAddCoverageOpen] = useState(false)
  const [tldrFeedbackOpen, setTldrFeedbackOpen] = useState(false)
  const [explainerFeedbackOpen, setExplainerFeedbackOpen] = useState(false)
  // Both hoisted to this top level (not managed inside ExplainerSections/
  // ExplainerEngagement) for the same reason every other modal on this page
  // is: the Explainer section's own wrapper carries `anim-rise`, and a
  // completed anim-rise transform makes its element a containing block for
  // `position: fixed` descendants — see ReviewersModal's comment in
  // section-content.tsx for the full explanation. Rendered via BriefModals.
  const [flagContentiousOpen, setFlagContentiousOpen] = useState(false)
  const [usefulLikersOpen, setUsefulLikersOpen] = useState(false)
  // FAQ's "give feedback" (Part 6 step 1) needs to carry which question it's
  // about, unlike TL;DR/Explainer's single fixed trigger above — one
  // FeedbackModal instance here, its context built from whichever question
  // set this.
  const [faqFeedbackQuestion, setFaqFeedbackQuestion] = useState<string | null>(null)
  const [reviewersModalOpen, setReviewersModalOpen] = useState(false)
  const [addQuoteOpen, setAddQuoteOpen] = useState(false)
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null)
  const [selectedCoverage, setSelectedCoverage] = useState<Coverage | null>(null)
  const [activeContributeModal, setActiveContributeModal] = useState<ContributeModalKind | null>(null)
  const sortedSections = [...brief.brief_sections].sort(
    (a, b) => a.display_order - b.display_order,
  )
  const tldrSection = sortedSections.find((s) => s.section_type === 'tldr')
  const tldr = tldrSection?.content ?? ''
  const tldrRichContent = tldrSection?.rich_content ?? null
  const readTimeMinutes = computeReadTimeMinutes(sortedSections)
  // orgCount (distinct affiliated orgs among reviewers) is still computed by
  // getEndorsementBar but not currently rendered anywhere — the combined
  // "Reviewed (N)" button dropped the expert/org breakdown (2026-08-20).
  const { reviewedCount, endorsedCount } = endorsementBar
  // going_deeper's own top-level section is retired — its Sources rendering
  // now folds into Explainer as its final subsection (two-ink-bold-plan.md
  // §3 Part 3 step 5).
  const goingDeeperSections = sortedSections.filter((s) => s.section_type === 'going_deeper')
  // For the "Give feedback" modal's optional "which part is this about?"
  // dropdown (feedback.tsx) — same subsection list ExplainerSections itself
  // derives for the contentious-point flag modal.
  const explainerSubsectionOptions = sortedSections
    .filter((s) => s.section_type === 'explainer' && s.title)
    .map((s) => ({ id: s.id, title: s.title! }))

  // Section nav (Part 11) — see section-nav.tsx's buildNavSections for the
  // per-section visibility logic.
  const navSections = buildNavSections({
    tldr,
    showSections,
    hasQuotes: quotes.length > 0 || canAddQuote,
    isLoggedIn,
    sortedSections,
    hasRelated: relatedBriefs.length > 0,
  })

  return (
    <div className="min-h-screen bg-parchment font-ui text-umber">

      {/* ── Nav ──────────────────────────────────────────────────────── */}
      <AppHeader
        user={
          currentUser
            ? { id: currentUser.id, name: currentUser.display_name ?? '', avatarUrl: currentUser.avatar_url, role: currentUser.role }
            : null
        }
      />

      <main>

        <BriefHero
          brief={brief}
          currentUser={currentUser}
          canContribute={canContribute}
          myReviewStatus={myReviewStatus}
          reviewedCount={reviewedCount}
          endorsedCount={endorsedCount}
          readTimeMinutes={readTimeMinutes}
          contributors={contributors}
          onOpenModal={setActiveContributeModal}
          onSuggestCta={() => setSuggestCtaOpen(true)}
          onAddCoverage={() => setAddCoverageOpen(true)}
          onOpenReviewers={() => setReviewersModalOpen(true)}
        />

        <SectionNav sections={navSections} />

        {/* ── TL;DR─────────────────────────────────────────────────────── */}
        {tldr.trim() && (
          <div id="section-tldr" className="scroll-mt-26 md:scroll-mt-28 border-t border-rule px-4 py-14 md:px-gutter md:py-section">
            <div className="mx-auto max-w-content anim-rise" style={{ animationDelay: '0ms' }}>
              <SectionHeader
                num={SECTION_META.tldr.num}
                label={SECTION_META.tldr.label}
                description={brief.tldr_teaser || SECTION_META.tldr.description}
                action={
                  canContribute || currentUser?.role === 'admin' ? (
                    <Button
                      type="button"
                      variant="secondary"
                      small
                      onClick={() => setTldrFeedbackOpen(true)}
                      style={{ touchAction: 'manipulation' }}
                    >
                      Suggest changes
                    </Button>
                  ) : undefined
                }
              />
              <TLDRList content={tldr} richContent={tldrRichContent} />
            </div>
          </div>
        )}

        {/* ── Quotes — auto section, query-driven off the brief's topic_tag
            (two-ink-bold-plan.md §2 row 2). Rendered as its own explicit
            block rather than threaded through the SECTION_ORDER loop below,
            same pattern as CTA/Covered By/Related Briefs further down. ─── */}
        {showSections && (quotes.length > 0 || canAddQuote) && (
          <div id="section-quotes" className="scroll-mt-26 md:scroll-mt-28 border-t border-rule px-4 py-14 md:px-gutter md:py-section">
            <div className="mx-auto max-w-content anim-rise" style={{ animationDelay: '0ms' }}>
              <QuotesCarousel quotes={quotes} briefSlug={brief.slug} isLoggedIn={isLoggedIn} canAddQuote={canAddQuote} onAddQuote={() => setAddQuoteOpen(true)} onOpenQuote={setSelectedQuote} />
            </div>
          </div>
        )}

        <BriefMainSections
          showSections={showSections}
          sortedSections={sortedSections}
          goingDeeperSections={goingDeeperSections}
          brief={brief}
          currentUser={currentUser}
          isLoggedIn={isLoggedIn}
          canContribute={canContribute}
          onSuggestQuestion={setActiveContributeModal}
          onExplainerFeedback={() => setExplainerFeedbackOpen(true)}
          contentiousPoints={contentiousPoints}
          explainerComments={explainerComments}
          explainerUsefulness={explainerUsefulness}
          engagementAuthor={engagementAuthor}
          canFlagContentious={canFlagContentious}
          canVoteUseful={canVoteUseful}
          onFlagContentious={() => setFlagContentiousOpen(true)}
          onShowUsefulLikers={() => setUsefulLikersOpen(true)}
          faqAnswersByQuestion={faqAnswersByQuestion}
          faqMetaByQuestion={faqMetaByQuestion}
          onFaqGiveFeedback={setFaqFeedbackQuestion}
        />

        {/* ── Q&A — members only ───────────────────────────────────────── */}
        {isLoggedIn && (
          <QaSection
            briefId={brief.id}
            briefSlug={brief.slug}
            questions={questions}
            answersByQuestion={answersByQuestion}
            canContribute={canContribute}
            canSubmitAnswer={canSubmitAnswer}
            voterTone={voterTone}
          />
        )}

        {/* ── Calls to Action ──────────────────────────────────────────── */}
        {showSections && (
          <CtaSection ctas={ctas} canSuggestCta={canSuggestCta} onSuggestCta={() => setSuggestCtaOpen(true)} />
        )}

        {/* ── Covered By ────────────────────────────────────────────────── */}
        {showSections && (
          <CoverageSection
            coverage={coverage}
            briefSlug={brief.slug}
            isLoggedIn={isLoggedIn}
            onAddCoverage={() => setAddCoverageOpen(true)}
            onOpenCoverage={setSelectedCoverage}
          />
        )}

        {/* ── Related Briefs — see brief-secondary-sections.tsx's own
            comment for why this is skipped entirely when empty. ────────── */}
        {showSections && relatedBriefs.length > 0 && (
          <RelatedBriefsSection relatedBriefs={relatedBriefs} />
        )}

        {/* ── Footer actions — logged-in members ───────────────────────── */}
        {isLoggedIn && (
          <FooterActions
            canContribute={canContribute}
            onProposeCorrection={() => setProposeCorrectionOpen(true)}
            onProposeBrief={() => setProposeBriefOpen(true)}
          />
        )}

        {/* ── Every top-level modal — extracted to brief-modals.tsx to keep
            this file under the repo's max-lines budget (CONTRIBUTING.md).
            Rendered here (not nested in any anim-rise-wrapped section
            above) so position:fixed modals aren't trapped as a containing
            block by a completed anim-rise transform — see ReviewersModal's
            own comment in section-content.tsx. ─────────────────────────── */}
        <BriefModals
          brief={brief}
          currentUser={currentUser}
          isLoggedIn={isLoggedIn}
          myReviewStatus={myReviewStatus}
          endorsementDetail={endorsementDetail}
          proposeCorrectionOpen={proposeCorrectionOpen}
          onCloseProposeCorrection={() => setProposeCorrectionOpen(false)}
          proposeBriefOpen={proposeBriefOpen}
          onCloseProposeBrief={() => setProposeBriefOpen(false)}
          suggestCtaOpen={suggestCtaOpen}
          onCloseSuggestCta={() => setSuggestCtaOpen(false)}
          addCoverageOpen={addCoverageOpen}
          onCloseAddCoverage={() => setAddCoverageOpen(false)}
          tldrFeedbackOpen={tldrFeedbackOpen}
          onCloseTldrFeedback={() => setTldrFeedbackOpen(false)}
          explainerFeedbackOpen={explainerFeedbackOpen}
          onCloseExplainerFeedback={() => setExplainerFeedbackOpen(false)}
          explainerSubsectionOptions={explainerSubsectionOptions}
          flagContentiousOpen={flagContentiousOpen}
          onCloseFlagContentious={() => setFlagContentiousOpen(false)}
          usefulLikersOpen={usefulLikersOpen}
          onCloseUsefulLikers={() => setUsefulLikersOpen(false)}
          faqFeedbackQuestion={faqFeedbackQuestion}
          onCloseFaqFeedback={() => setFaqFeedbackQuestion(null)}
          addQuoteOpen={addQuoteOpen}
          onCloseAddQuote={() => setAddQuoteOpen(false)}
          selectedQuote={selectedQuote}
          onCloseSelectedQuote={() => setSelectedQuote(null)}
          selectedCoverage={selectedCoverage}
          onCloseSelectedCoverage={() => setSelectedCoverage(null)}
          activeContributeModal={activeContributeModal}
          onCloseContributeModal={() => setActiveContributeModal(null)}
          reviewersModalOpen={reviewersModalOpen}
          onCloseReviewersModal={() => setReviewersModalOpen(false)}
        />

      </main>

      <Footer />

    </div>
  )
}
