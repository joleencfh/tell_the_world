'use client'

import { useState, Fragment } from 'react'
import Link from 'next/link'
import Logo from '@/components/ui/Logo'
import DarkBand from '@/components/ui/DarkBand'
import SignOutButton from '@/components/ui/SignOutButton'
import {
  SECTION_ORDER,
  SECTION_META,
  SECTION_BG,
  SectionHeader,
  LockedPlaceholder,
  HeroChipBar,
  TLDRList,
  ContributorsList,
} from './section-content'
import { QuotesCarousel } from './quotes'
import { ContributeMenu, type ContributeModalKind } from './contribute'
import { QuestionsList, QuestionForm } from './qa'
import { ReviewEndorseControl } from './review-endorse'
import { ExplainerSections } from './explainer'
import { FAQSection } from './faq'
import { CtaCarousel } from './ctas'
import { CoverageCarousel } from './coverage'
import { RelatedBriefsCarousel } from './related-briefs'
import { BriefModals } from './brief-modals'
import { SectionNav, buildNavSections } from './section-nav'
import { computeReadTimeMinutes, getBriefNumber, getBriefCategory } from './helpers'
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
  const tldr = sortedSections.find((s) => s.section_type === 'tldr')?.content ?? ''
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
    <div className="min-h-screen bg-paper text-ink">

      {/* ── Nav ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-10 bg-paper/95 backdrop-blur-sm border-b-2 border-ink px-6">
        <div className="mx-auto flex max-w-4xl items-center justify-between py-4">
          <Logo href={isLoggedIn ? '/home' : '/'} />
          <nav className="flex items-center gap-6">
            {isLoggedIn ? (
              <>
                <Link href="/directory" className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink-faint hover:text-ink transition-colors hidden sm:block">Directory</Link>
                <Link href="/briefs" className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink-faint hover:text-ink transition-colors hidden sm:block">Briefs</Link>
                <Link href={`/profile/${currentUser.id}`} className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink-faint hover:text-ink transition-colors">Profile</Link>
                <SignOutButton className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink-faint hover:text-ink transition-colors" />
              </>
            ) : (
              <>
                <Link href="/apply" className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink-faint hover:text-ink transition-colors">Apply</Link>
                <Link href="/login" className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink-faint hover:text-ink transition-colors">Login</Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main>

        {/* ── Hero — neutral ink, no blue/pink tint (§1.1) ─────────────── */}
        <div id="section-top" className="relative overflow-hidden border-b border-line px-6 pt-12 pb-14">
          {/* Bottom fade to next section */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-b from-transparent to-paper pointer-events-none" />

          <div className="mx-auto max-w-4xl relative">
            {/* Numbered eyebrow — 01, so the SectionHeader sequence starting
                at 02 (TL;DR, just below) doesn't appear to skip 01 (§1.3). */}
            <div className="flex items-center gap-4 mb-[0.9rem] anim-rise" style={{ animationDelay: '0ms' }}>
              <span className="font-mono text-sm tracking-[0.2em] text-ink font-bold tabular-nums">01</span>
              <div className="h-px flex-1 bg-line" />
              <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-ink-faint">
                Brief No. {getBriefNumber(brief.id)} — {getBriefCategory(brief.topic_tag)}
              </span>
              {/* Admin-only entry point into the existing brief editor (Part 5
                  step 3) — no new editing capability, just a visible link
                  into /admin/briefs/[id] from the live page. */}
              {currentUser?.role === 'admin' && (
                <Link
                  href={`/admin/briefs/${brief.id}`}
                  className="shrink-0 font-mono text-[10px] tracking-[0.3em] uppercase text-ink-faint hover:text-ink transition-colors"
                >
                  Edit this brief →
                </Link>
              )}
            </div>

            {/* Title/subtitle block + Contribute — flex row so the hero's
                role-gated dropdown (Part 9) sits top-right of the title,
                matching the reference artifact's .hero-top layout. */}
            <div className="flex flex-wrap items-start justify-between gap-10">
              <div className="min-w-0 flex-1">
                {/* Title — large, dominant */}
                <h1
                  className="font-display font-extrabold text-ink anim-rise break-words"
                  style={{
                    fontSize: 'clamp(1.98rem, 4.99vw, 4.22rem)',
                    lineHeight: '0.96',
                    letterSpacing: '-0.035em',
                    animationDelay: '80ms',
                  }}
                >
                  {brief.title}
                </h1>

                {/* Subtitle — one sentence, allowed a point of view */}
                {brief.subtitle && (
                  <p
                    className="font-body text-base sm:text-lg text-ink-soft italic mt-6 max-w-2xl anim-rise"
                    style={{ animationDelay: '120ms' }}
                  >
                    {brief.subtitle}
                  </p>
                )}
              </div>

              {currentUser && (
                <div className="anim-rise" style={{ animationDelay: '100ms' }}>
                  <ContributeMenu
                    role={currentUser.role} onOpenModal={setActiveContributeModal}
                    onSuggestCta={() => setSuggestCtaOpen(true)} onAddCoverage={() => setAddCoverageOpen(true)}
                  />
                </div>
              )}
            </div>

            {/* Header chip bar + tag row — endorsement bar, last reviewed,
                read time, topic tags (Part 0a). aria-live inside HeroChipBar:
                chips appear/change count in place with no navigation when
                the review/endorse control below is used. */}
            <HeroChipBar
              reviewedCount={reviewedCount}
              endorsedCount={endorsedCount}
              lastReviewedAt={brief.last_reviewed_at}
              readTimeMinutes={readTimeMinutes}
              topicTags={brief.topic_tags}
              onOpenReviewers={() => setReviewersModalOpen(true)}
            />

            {/* Contributors — members whose proposed-brief submission was
                converted/linked into this brief (Part 10 step 3). Renders
                nothing when empty. */}
            <ContributorsList contributors={contributors} />

            {/* Brief-level review/endorse control — expert/organisation only */}
            {canContribute && (
              <div className="mt-4 anim-rise" style={{ animationDelay: '180ms' }}>
                <ReviewEndorseControl
                  briefId={brief.id}
                  briefSlug={brief.slug}
                  sectionId={null}
                  initialStatus={myReviewStatus}
                />
              </div>
            )}
          </div>
        </div>

        {/* ── TL;DR ─────────────────────────────────────────────────────── */}
        {tldr.trim() && (
          <div id="section-tldr" className="scroll-mt-20 border-t-4 border-line border-b border-line bg-paper px-6 py-16">
            <div className="mx-auto max-w-4xl anim-rise" style={{ animationDelay: '0ms' }}>
              <SectionHeader
                num={SECTION_META.tldr.num}
                label={SECTION_META.tldr.label}
                description={brief.tldr_teaser || SECTION_META.tldr.description}
                action={
                  canContribute || currentUser?.role === 'admin' ? (
                    <button
                      type="button"
                      onClick={() => setTldrFeedbackOpen(true)}
                      style={{ touchAction: 'manipulation' }}
                      className="border-[1.5px] border-blue bg-paper px-4 py-2 font-mono text-[0.68rem] uppercase tracking-[0.06em] text-blue-ink outline-none transition-colors hover:bg-blue hover:text-white focus-visible:ring-2 focus-visible:ring-blue"
                    >
                      Suggest changes
                    </button>
                  ) : undefined
                }
              />
              <TLDRList content={tldr} />
            </div>
          </div>
        )}

        {/* ── Quotes — auto section, query-driven off the brief's topic_tag
            (two-ink-bold-plan.md §2 row 2). Rendered as its own explicit
            block rather than threaded through the SECTION_ORDER loop below,
            same pattern as CTA/Covered By/Related Briefs further down. ─── */}
        {showSections && (quotes.length > 0 || canAddQuote) && (
          <div id="section-quotes" className="scroll-mt-20 border-t-4 border-t-blue border-b border-b-line bg-paper-sunken-blue px-6 py-16">
            <div className="mx-auto max-w-4xl anim-rise" style={{ animationDelay: '0ms' }}>
              <QuotesCarousel quotes={quotes} briefSlug={brief.slug} isLoggedIn={isLoggedIn} canAddQuote={canAddQuote} onAddQuote={() => setAddQuoteOpen(true)} onOpenQuote={setSelectedQuote} />
            </div>
          </div>
        )}

        {/* ── Sections or lock ─────────────────────────────────────────── */}
        {showSections ? (
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
                                  type="button" onClick={() => setActiveContributeModal('faq-question')} style={{ touchAction: 'manipulation' }}
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
                                  onClick={() => setExplainerFeedbackOpen(true)}
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
                              onFlagContentious={() => setFlagContentiousOpen(true)}
                              onShowUsefulLikers={() => setUsefulLikersOpen(true)}
                            />
                          ) : (
                            <FAQSection
                              sections={sections}
                              briefId={brief.id}
                              briefSlug={brief.slug}
                              canSubmit={canContribute || currentUser?.role === 'admin'}
                              answersByQuestion={faqAnswersByQuestion}
                              faqMetaByQuestion={faqMetaByQuestion}
                              onGiveFeedback={setFaqFeedbackQuestion}
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
        ) : (
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
        )}

        {/* ── Q&A — members only ───────────────────────────────────────── */}
        {isLoggedIn && (
          <div id="section-qa" className="scroll-mt-20 border-t-4 border-t-pink border-b border-b-line bg-paper-sunken px-6 py-16">
            <div className="mx-auto max-w-4xl">
              <SectionHeader
                num="06"
                label="Community Q&A"
                description="Questions from members, answered by experts"
                numTone="pink"
                action={
                  <button
                    type="button"
                    className="border-[1.5px] border-pink bg-paper px-4 py-2 font-mono text-[0.68rem] uppercase tracking-[0.06em] text-pink transition-colors hover:bg-pink hover:text-white"
                  >
                    + Ask a question
                  </button>
                }
              />
              <QuestionsList
                questions={questions}
                answersByQuestion={answersByQuestion}
                briefSlug={brief.slug}
                canEndorse={canContribute}
                canSubmitAnswer={canSubmitAnswer}
                voterTone={voterTone}
              />
              <QuestionForm briefId={brief.id} briefSlug={brief.slug} />
            </div>
          </div>
        )}

        {/* ── Calls to Action ──────────────────────────────────────────── */}
        {showSections && (
          <div id="section-cta" className="scroll-mt-20 border-t-4 border-t-pink border-b border-b-line bg-paper px-6 py-16">
            <div className="mx-auto max-w-4xl">
              <SectionHeader
                num="07"
                label="Calls to Action"
                description="What experts & orgs want you to do with this"
                numTone="blue"
                action={
                  canSuggestCta ? (
                    <button
                      type="button"
                      onClick={() => setSuggestCtaOpen(true)}
                      style={{ touchAction: 'manipulation' }}
                      className="border-2 border-blue bg-blue px-4 py-2 font-mono text-[0.68rem] uppercase tracking-[0.08em] text-white outline-none transition-colors hover:bg-paper hover:text-blue focus-visible:ring-2 focus-visible:ring-blue"
                    >
                      + New CTA
                    </button>
                  ) : undefined
                }
              />
              <CtaCarousel ctas={ctas} canSuggestCta={canSuggestCta} />
            </div>
          </div>
        )}

        {/* ── Covered By — fixed dark band in both themes (§1.3) ───────── */}
        {showSections && (
          <DarkBand id="section-coverage" className="scroll-mt-20 border-t-4 border-t-pink border-b border-b-line px-6 py-16">
            <div className="mx-auto max-w-4xl">
              <SectionHeader
                num="08"
                label="Covered By"
                description="Press coverage of this topic"
                numTone="pink"
                onDark
                action={
                  isLoggedIn ? (
                    <button
                      type="button"
                      onClick={() => setAddCoverageOpen(true)}
                      style={{ touchAction: 'manipulation' }}
                      className="border-2 border-pink bg-pink px-4 py-2 font-mono text-[0.68rem] uppercase tracking-[0.08em] text-white outline-none transition-colors hover:bg-transparent hover:text-pink focus-visible:ring-2 focus-visible:ring-pink"
                    >
                      + Add coverage
                    </button>
                  ) : undefined
                }
              />
              <CoverageCarousel coverage={coverage} briefSlug={brief.slug} isLoggedIn={isLoggedIn} onOpenCoverage={setSelectedCoverage} />
            </div>
          </DarkBand>
        )}

        {/* ── Related Briefs — neutral ink (§1.1: the editorial spine, never
            blue/pink). Not rendered at all when there's nothing to relate
            to (no topic_tag, or no other brief shares it) — same
            near-empty-state convention as Quotes above, don't render an
            empty section (§3 Part 8). ─────────────────────────────────── */}
        {showSections && relatedBriefs.length > 0 && (
          <div id="section-related" className="scroll-mt-20 border-t-4 border-line bg-paper-raised px-6 py-16">
            <div className="mx-auto max-w-4xl">
              <SectionHeader
                num="09"
                label="Related Briefs"
                description="More on this topic"
              />
              <RelatedBriefsCarousel briefs={relatedBriefs} />
            </div>
          </div>
        )}

        {/* ── Footer actions — logged-in members ───────────────────────── */}
        {isLoggedIn && (
          <div className="px-6 py-6 border-t border-line">
            <div className="mx-auto max-w-4xl flex flex-wrap items-center gap-6">
              {canContribute && (
                <button
                  type="button"
                  onClick={() => setProposeCorrectionOpen(true)}
                  className="font-mono text-[10px] tracking-[0.15em] uppercase text-ink-soft hover:text-ink transition-colors inline-flex items-center gap-2"
                >
                  <span aria-hidden>→</span> Propose a correction or addition
                </button>
              )}
              <button
                type="button"
                onClick={() => setProposeBriefOpen(true)}
                style={{ touchAction: 'manipulation' }}
                className="ml-auto inline-flex items-center gap-2 border-2 border-blue bg-paper px-8 py-3 font-display text-sm uppercase tracking-widest text-blue-ink transition-colors hover:bg-blue hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue"
              >
                Propose a new brief <span aria-hidden>→</span>
              </button>
            </div>
          </div>
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

        <SectionNav sections={navSections} />

      </main>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="px-6 pt-8 pb-12">
        <div className="mx-auto flex max-w-4xl items-center justify-between border-t-2 border-ink pt-6">
          <span className="font-body text-sm font-bold text-ink-soft/60 tracking-tight">
            Tell <em className="italic">The</em> World
          </span>
          <Link
            href={isLoggedIn ? '/home' : '/'}
            className="font-mono text-[9px] tracking-[0.15em] uppercase text-ink-soft/60 hover:text-ink-soft transition-colors"
          >
            ← Back to home
          </Link>
        </div>
      </footer>

    </div>
  )
}
