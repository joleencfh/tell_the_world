'use client'

import ProposeBriefModal from '@/components/ProposeBriefModal'
import { ReviewersModal } from './section-content'
import { AddQuoteModal, QuoteDetailModal } from './quote-modals'
import { ContributeModals, type ContributeModalKind } from './contribute'
import { ProposeCorrectionModal } from './qa'
import { SuggestCtaModal } from './ctas'
import { AddCoverageModal, CoverageDetailModal } from './coverage-modals'
import { FeedbackModal } from './feedback'
import type { Brief, CurrentUser, Quote, Coverage, ContributionStatus, EndorsementBarDetail } from './page'

// Every modal BriefView.tsx can open, gathered in one place — pulled out of
// that file (mirrors how ContributeModals was already split out) to keep it
// under the repo's max-lines budget. Each modal's own open/close state still
// lives in BriefView (it's what the trigger buttons scattered across the
// page's sections set), this component just centralizes the render + close
// wiring.
export interface BriefModalsProps {
  brief: Brief
  currentUser: CurrentUser | null
  isLoggedIn: boolean
  myReviewStatus: ContributionStatus
  endorsementDetail: EndorsementBarDetail
  proposeCorrectionOpen: boolean
  onCloseProposeCorrection: () => void
  proposeBriefOpen: boolean
  onCloseProposeBrief: () => void
  suggestCtaOpen: boolean
  onCloseSuggestCta: () => void
  addCoverageOpen: boolean
  onCloseAddCoverage: () => void
  tldrFeedbackOpen: boolean
  onCloseTldrFeedback: () => void
  explainerFeedbackOpen: boolean
  onCloseExplainerFeedback: () => void
  // FAQ's "give feedback" (Part 6) needs to carry which question it's about,
  // unlike TL;DR/Explainer's single fixed trigger above — context is built
  // from whichever question set this.
  faqFeedbackQuestion: string | null
  onCloseFaqFeedback: () => void
  addQuoteOpen: boolean
  onCloseAddQuote: () => void
  selectedQuote: Quote | null
  onCloseSelectedQuote: () => void
  selectedCoverage: Coverage | null
  onCloseSelectedCoverage: () => void
  activeContributeModal: ContributeModalKind | null
  onCloseContributeModal: () => void
  reviewersModalOpen: boolean
  onCloseReviewersModal: () => void
}

export function BriefModals({
  brief,
  currentUser,
  isLoggedIn,
  myReviewStatus,
  endorsementDetail,
  proposeCorrectionOpen,
  onCloseProposeCorrection,
  proposeBriefOpen,
  onCloseProposeBrief,
  suggestCtaOpen,
  onCloseSuggestCta,
  addCoverageOpen,
  onCloseAddCoverage,
  tldrFeedbackOpen,
  onCloseTldrFeedback,
  explainerFeedbackOpen,
  onCloseExplainerFeedback,
  faqFeedbackQuestion,
  onCloseFaqFeedback,
  addQuoteOpen,
  onCloseAddQuote,
  selectedQuote,
  onCloseSelectedQuote,
  selectedCoverage,
  onCloseSelectedCoverage,
  activeContributeModal,
  onCloseContributeModal,
  reviewersModalOpen,
  onCloseReviewersModal,
}: BriefModalsProps) {
  return (
    <>
      {proposeCorrectionOpen && currentUser && (
        <ProposeCorrectionModal
          briefId={brief.id} briefSlug={brief.slug} briefTitle={brief.title} onClose={onCloseProposeCorrection}
        />
      )}

      {proposeBriefOpen && currentUser && (
        <ProposeBriefModal
          submitterName={currentUser.display_name || currentUser.email.split('@')[0]}
          submitterEmail={currentUser.email}
          fromBriefTitle={brief.title}
          onClose={onCloseProposeBrief}
        />
      )}

      {suggestCtaOpen && currentUser && (
        <SuggestCtaModal
          briefId={brief.id} briefSlug={brief.slug} briefTitle={brief.title} onClose={onCloseSuggestCta}
        />
      )}

      {addCoverageOpen && currentUser && (
        <AddCoverageModal
          briefId={brief.id} briefSlug={brief.slug} briefTitle={brief.title} onClose={onCloseAddCoverage}
        />
      )}

      {tldrFeedbackOpen && currentUser && (
        <FeedbackModal
          context={{ briefId: brief.id, briefTitle: brief.title, section: 'tldr', sectionLabel: 'TL;DR' }}
          onClose={onCloseTldrFeedback}
        />
      )}

      {/* Shared by both of Part 5 step 6's triggers ("Suggest changes" in the
          Explainer SectionHeader's action slot, "Give feedback" at the end of
          ExplainerSections) — same context, only who can see the trigger
          differs. */}
      {explainerFeedbackOpen && currentUser && (
        <FeedbackModal
          context={{ briefId: brief.id, briefTitle: brief.title, section: 'explainer', sectionLabel: 'Explainer' }}
          onClose={onCloseExplainerFeedback}
        />
      )}

      {/* FAQ "give feedback" (Part 6) — per-question context. */}
      {faqFeedbackQuestion && currentUser && (
        <FeedbackModal
          context={{
            briefId: brief.id,
            briefTitle: brief.title,
            section: `faq:${faqFeedbackQuestion}`,
            sectionLabel: faqFeedbackQuestion,
          }}
          onClose={onCloseFaqFeedback}
        />
      )}

      {addQuoteOpen && currentUser && (
        <AddQuoteModal
          briefId={brief.id} briefSlug={brief.slug} briefTitle={brief.title} defaultTags={brief.topic_tags} onClose={onCloseAddQuote}
        />
      )}

      {/* No currentUser gate: viewing a quote's detail is informational,
          available logged out too (like/copy just adapt). */}
      {selectedQuote && (
        <QuoteDetailModal quote={selectedQuote} briefSlug={brief.slug} isLoggedIn={isLoggedIn} onClose={onCloseSelectedQuote} />
      )}

      {/* No currentUser gate: viewing a coverage item's detail (Part 9) is
          informational, available logged out too (like/comment/vote just
          adapt — CoverageDetailModal itself gates those). */}
      {selectedCoverage && (
        <CoverageDetailModal coverage={selectedCoverage} briefSlug={brief.slug} isLoggedIn={isLoggedIn} onClose={onCloseSelectedCoverage} />
      )}

      {/* activeContributeModal can only be set by ContributeMenu, which only
          renders for currentUser, so no separate currentUser gate is needed
          here. */}
      <ContributeModals
        brief={brief} myReviewStatus={myReviewStatus} active={activeContributeModal} onClose={onCloseContributeModal}
      />

      {/* No currentUser gate: viewing who reviewed a brief is informational,
          not a submission, so it's available logged out too. */}
      {reviewersModalOpen && (
        <ReviewersModal
          reviewers={endorsementDetail.reviewers}
          endorsers={endorsementDetail.endorsers}
          onClose={onCloseReviewersModal}
        />
      )}
    </>
  )
}
