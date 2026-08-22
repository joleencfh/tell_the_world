'use client'

import ProposeBriefModal from '@/components/ProposeBriefModal'
import { AddQuoteModal, QuoteDetailModal } from './quote-modals'
import { ContributeModals, type ContributeModalKind } from './contribute'
import { ProposeCorrectionModal } from './qa'
import { SuggestCtaModal } from './ctas'
import { AddCoverageModal } from './coverage'
import { FeedbackModal } from './feedback'
import { ReviewersModal } from './section-content'
import type { Brief, CurrentUser, Quote } from './page'
import type { ContributionStatus, Reviewer } from '@/lib/data/contributions'

// ---------------------------------------------------------------------------
// Every top-level modal BriefView.tsx can open, pulled out to keep that file
// under the project's ~500-line convention (CONTRIBUTING.md) — pure prop-
// passing, same split rationale as ContributeModals/HeroChipBar before it.
// Rendered once at BriefView's <main> level (not nested inside any
// anim-rise-wrapped section) — see ReviewersModal's own comment in
// section-content.tsx for why a position:fixed modal can't live any deeper.
// ---------------------------------------------------------------------------

export function BriefModals({
  brief,
  currentUser,
  isLoggedIn,
  myReviewStatus,
  reviewers,
  endorsers,
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
  faqFeedbackQuestion,
  onCloseFaqFeedback,
  addQuoteOpen,
  onCloseAddQuote,
  selectedQuote,
  onCloseQuoteDetail,
  activeContributeModal,
  onCloseContributeModal,
  reviewersModalOpen,
  onCloseReviewersModal,
}: {
  brief: Brief
  currentUser: CurrentUser | null
  isLoggedIn: boolean
  myReviewStatus: ContributionStatus
  reviewers: Reviewer[]
  endorsers: Reviewer[]
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
  faqFeedbackQuestion: string | null
  onCloseFaqFeedback: () => void
  addQuoteOpen: boolean
  onCloseAddQuote: () => void
  selectedQuote: Quote | null
  onCloseQuoteDetail: () => void
  activeContributeModal: ContributeModalKind | null
  onCloseContributeModal: () => void
  reviewersModalOpen: boolean
  onCloseReviewersModal: () => void
}) {
  return (
    <>
      {/* ── Propose correction modal ─────────────────────────────────── */}
      {proposeCorrectionOpen && currentUser && (
        <ProposeCorrectionModal
          briefId={brief.id} briefSlug={brief.slug} briefTitle={brief.title} onClose={onCloseProposeCorrection}
        />
      )}

      {/* ── Propose brief modal ───────────────────────────────────────── */}
      {proposeBriefOpen && currentUser && (
        <ProposeBriefModal
          submitterName={currentUser.display_name || currentUser.email.split('@')[0]}
          submitterEmail={currentUser.email}
          fromBriefTitle={brief.title}
          onClose={onCloseProposeBrief}
        />
      )}

      {/* ── Suggest a call to action modal ───────────────────────────── */}
      {suggestCtaOpen && currentUser && (
        <SuggestCtaModal
          briefId={brief.id} briefSlug={brief.slug} briefTitle={brief.title} onClose={onCloseSuggestCta}
        />
      )}

      {/* ── Add coverage modal ───────────────────────────────────────── */}
      {addCoverageOpen && currentUser && (
        <AddCoverageModal
          briefId={brief.id} briefSlug={brief.slug} briefTitle={brief.title} onClose={onCloseAddCoverage}
        />
      )}

      {/* ── TL;DR "Suggest changes" feedback modal ───────────────────── */}
      {tldrFeedbackOpen && currentUser && (
        <FeedbackModal
          context={{ briefId: brief.id, briefTitle: brief.title, section: 'tldr', sectionLabel: 'TL;DR' }}
          onClose={onCloseTldrFeedback}
        />
      )}

      {/* ── FAQ "give feedback" modal (Part 6 step 1) ────────────────── */}
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

      {/* ── Add quote modal ──────────────────────────────────────────── */}
      {addQuoteOpen && currentUser && (
        <AddQuoteModal
          briefId={brief.id} briefSlug={brief.slug} briefTitle={brief.title} defaultTags={brief.topic_tags} onClose={onCloseAddQuote}
        />
      )}

      {/* ── Quote detail modal — no currentUser gate: viewing a quote's
          detail is informational, available logged out too (like/copy
          just adapt). */}
      {selectedQuote && (
        <QuoteDetailModal quote={selectedQuote} briefSlug={brief.slug} isLoggedIn={isLoggedIn} onClose={onCloseQuoteDetail} />
      )}

      {/* ── Contribute menu's modals — activeContributeModal can only be
          set by ContributeMenu, which only renders for currentUser, so no
          separate currentUser gate is needed here. ────────────────────── */}
      <ContributeModals
        brief={brief} myReviewStatus={myReviewStatus} active={activeContributeModal} onClose={onCloseContributeModal}
      />

      {/* ── Reviewed/endorsed-by modal — no currentUser gate: viewing who
          reviewed a brief is informational, not a submission, so it's
          available logged out too. ──────────────────────────────────── */}
      {reviewersModalOpen && (
        <ReviewersModal
          reviewers={reviewers}
          endorsers={endorsers}
          onClose={onCloseReviewersModal}
        />
      )}
    </>
  )
}
