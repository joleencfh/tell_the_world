'use client'

import { useState, Fragment } from 'react'
import Link from 'next/link'
import Logo from '@/components/ui/Logo'
import ProposeBriefModal from '@/components/ProposeBriefModal'
import DarkBand from '@/components/ui/DarkBand'
import {
  SECTION_ORDER,
  SECTION_META,
  SECTION_BG,
  SectionHeader,
  LockedPlaceholder,
  QuotesCarousel,
  HeaderChip,
  TLDRList,
  ContributeMenu,
} from './section-content'
import { QuestionsList, QuestionForm, ProposeCorrectionModal } from './qa'
import { ReviewEndorseControl } from './review-endorse'
import { ExplainerSections } from './explainer'
import { FAQSection } from './faq'
import { CtaCarousel, SuggestCtaModal } from './ctas'
import { CoverageCarousel, AddCoverageModal } from './coverage'
import { RelatedBriefsCarousel } from './related-briefs'
import { FeedbackModal } from './feedback'
import { formatDate, computeReadTimeMinutes, getBriefNumber, getBriefCategory } from './helpers'
import type {
  Brief,
  CurrentUser,
  Question,
  QuestionAnswer,
  Quote,
  MediaPost,
  EndorsementBarCounts,
  ContributionStatus,
  ExplainerContributionInfo,
  FaqAnswer,
  Cta,
  Coverage,
  RelatedBrief,
} from './page'

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface BriefViewProps {
  brief: Brief
  quotes: Quote[]
  media: MediaPost[]
  endorsementBar: EndorsementBarCounts
  questions: Question[]
  answersByQuestion: Record<string, QuestionAnswer[]>
  currentUser: CurrentUser | null
  myReviewStatus: ContributionStatus
  explainerContributions: ExplainerContributionInfo[]
  faqAnswersByQuestion: Record<string, FaqAnswer[]>
  ctas: Cta[]
  coverage: Coverage[]
  relatedBriefs: RelatedBrief[]
}

// `media` stays in BriefViewProps (page.tsx still fetches and passes it —
// dropping Media from the page was a deliberate call, but the data query
// itself is out of scope for this change) but isn't destructured here since
// nothing renders it anymore.
export default function BriefView({ brief, quotes, endorsementBar, questions, answersByQuestion, currentUser, myReviewStatus, explainerContributions, faqAnswersByQuestion, ctas, coverage, relatedBriefs }: BriefViewProps) {
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
  const [proposeCorrectionOpen, setProposeCorrectionOpen] = useState(false)
  const [proposeBriefOpen, setProposeBriefOpen] = useState(false)
  const [suggestCtaOpen, setSuggestCtaOpen] = useState(false)
  const [addCoverageOpen, setAddCoverageOpen] = useState(false)
  const [tldrFeedbackOpen, setTldrFeedbackOpen] = useState(false)
  const sortedSections = [...brief.brief_sections].sort(
    (a, b) => a.display_order - b.display_order,
  )
  const tldr = sortedSections.find((s) => s.section_type === 'tldr')?.content ?? ''
  const readTimeMinutes = computeReadTimeMinutes(sortedSections)
  const { reviewedCount, endorsedCount, orgCount } = endorsementBar
  // going_deeper's own top-level section is retired — its Sources rendering
  // now folds into Explainer as its final subsection (two-ink-bold-plan.md
  // §3 Part 3 step 5).
  const goingDeeperSections = sortedSections.filter((s) => s.section_type === 'going_deeper')

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
        <div className="grid-texture relative overflow-hidden border-b border-line px-6 pt-16 pb-20">
          {/* Bottom fade to next section */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-b from-transparent to-paper pointer-events-none" />

          <div className="mx-auto max-w-4xl relative">
            {/* Numbered eyebrow — 01, so the SectionHeader sequence starting
                at 02 (TL;DR, just below) doesn't appear to skip 01 (§1.3). */}
            <div className="flex items-center gap-4 mb-8 anim-rise" style={{ animationDelay: '0ms' }}>
              <span className="font-mono text-sm tracking-[0.2em] text-ink font-bold tabular-nums">01</span>
              <div className="h-px flex-1 bg-line" />
              <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-ink-faint">
                Brief No. {getBriefNumber(brief.id)} — {getBriefCategory(brief.topic_tag)}
              </span>
            </div>

            {/* Title/subtitle block + Contribute — flex row so the hero's
                role-gated dropdown (Part 9) sits top-right of the title,
                matching the reference artifact's .hero-top layout. */}
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div className="min-w-0 flex-1">
                {/* Title — large, dominant */}
                <h1
                  className="font-display uppercase font-extrabold text-ink anim-rise"
                  style={{
                    fontSize: 'clamp(3.1rem, 7.8vw, 6.6rem)',
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
                    className="font-body text-base sm:text-lg text-ink-soft italic mt-4 max-w-2xl anim-rise"
                    style={{ animationDelay: '120ms' }}
                  >
                    {brief.subtitle}
                  </p>
                )}
              </div>

              {currentUser && (
                <div className="anim-rise" style={{ animationDelay: '100ms' }}>
                  <ContributeMenu role={currentUser.role} />
                </div>
              )}
            </div>

            {/* Header chip bar — endorsement bar, last reviewed, read time.
                aria-live: chips appear/change count in place with no
                navigation when the review/endorse control below is used. */}
            <div
              className="flex flex-wrap items-center gap-2 mt-6 anim-rise"
              style={{ animationDelay: '160ms' }}
              aria-live="polite"
            >
              {reviewedCount > 0 && (
                <HeaderChip tone="blue">
                  ✓ Reviewed by {reviewedCount} expert{reviewedCount === 1 ? '' : 's'}
                  {orgCount > 0 && ` · ${orgCount} org${orgCount === 1 ? '' : 's'}`}
                </HeaderChip>
              )}
              {endorsedCount > 0 && (
                <HeaderChip tone="blue">
                  ★ Endorsed by {endorsedCount}
                </HeaderChip>
              )}
              {brief.last_reviewed_at && (
                <HeaderChip>Last reviewed {formatDate(brief.last_reviewed_at)}</HeaderChip>
              )}
              <HeaderChip>{readTimeMinutes} min read</HeaderChip>
            </div>

            {/* Tag row — the brief's single topic tag, styled like the
                reference artifact's multi-tag row (§ hero .tag-row). */}
            {brief.topic_tag && (
              <div
                className="flex flex-wrap gap-1.5 mt-3 anim-rise"
                style={{ animationDelay: '170ms' }}
              >
                <HeaderChip tone="tag">{brief.topic_tag}</HeaderChip>
              </div>
            )}

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
          <div className="border-t-4 border-line border-b border-line bg-paper px-6 py-16">
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
        {showSections && quotes.length > 0 && (
          <div className="border-t-4 border-t-blue border-b border-b-line bg-paper-sunken-blue px-6 py-16">
            <div className="mx-auto max-w-4xl anim-rise" style={{ animationDelay: '0ms' }}>
              <QuotesCarousel quotes={quotes} />
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
                      <div className={`${bgClass} border-t-4 border-t-blue border-b border-b-line px-6 py-16`}>
                        <div className="mx-auto max-w-4xl anim-rise" style={{ animationDelay: '100ms' }}>
                          <SectionHeader
                            num={meta.num}
                            label={meta.label}
                            description={meta.description}
                            numTone={type === 'faq' ? 'blue' : 'ink'}
                            action={
                              // Visual-only button (no onClick), so — unlike
                              // canContribute's other gated controls — it's
                              // safe to also preview for admin.
                              type === 'faq' && (canContribute || currentUser?.role === 'admin') ? (
                                <button
                                  type="button"
                                  className="border-[1.5px] border-ink bg-paper px-4 py-2 font-mono text-[0.68rem] uppercase tracking-[0.06em] text-ink transition-colors hover:border-blue hover:text-blue"
                                >
                                  + Suggest question
                                </button>
                              ) : undefined
                            }
                          />
                          {type === 'explainer' ? (
                            <ExplainerSections
                              sections={sections}
                              sourceSections={goingDeeperSections}
                              briefId={brief.id}
                              briefSlug={brief.slug}
                              canContribute={canContribute}
                              contributions={explainerContributions}
                            />
                          ) : (
                            <FAQSection
                              sections={sections}
                              briefId={brief.id}
                              briefSlug={brief.slug}
                              canSubmit={canContribute}
                              answersByQuestion={faqAnswersByQuestion}
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
          <div className="border-t-4 border-t-pink border-b border-b-line bg-paper-sunken px-6 py-16">
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
                voterTone={voterTone}
              />
              <QuestionForm briefId={brief.id} briefSlug={brief.slug} />
            </div>
          </div>
        )}

        {/* ── Calls to Action ──────────────────────────────────────────── */}
        {showSections && (
          <div className="border-t-4 border-t-pink border-b border-b-line bg-paper px-6 py-16">
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
              <CtaCarousel ctas={ctas} />
            </div>
          </div>
        )}

        {/* ── Covered By — fixed dark band in both themes (§1.3) ───────── */}
        {showSections && (
          <DarkBand className="border-t-4 border-t-pink border-b border-b-line px-6 py-16">
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
              <CoverageCarousel coverage={coverage} briefSlug={brief.slug} isLoggedIn={isLoggedIn} />
            </div>
          </DarkBand>
        )}

        {/* ── Related Briefs — neutral ink (§1.1: the editorial spine, never
            blue/pink). Not rendered at all when there's nothing to relate
            to (no topic_tag, or no other brief shares it) — same
            near-empty-state convention as Quotes above, don't render an
            empty section (§3 Part 8). ─────────────────────────────────── */}
        {showSections && relatedBriefs.length > 0 && (
          <div className="border-t-4 border-line bg-paper-raised px-6 py-16">
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

        {/* ── Propose correction modal ─────────────────────────────────── */}
        {proposeCorrectionOpen && currentUser && (
          <ProposeCorrectionModal
            briefId={brief.id}
            briefSlug={brief.slug}
            briefTitle={brief.title}
            onClose={() => setProposeCorrectionOpen(false)}
          />
        )}

        {/* ── Propose brief modal ───────────────────────────────────────── */}
        {proposeBriefOpen && currentUser && (
          <ProposeBriefModal
            submitterName={currentUser.display_name || currentUser.email.split('@')[0]}
            submitterEmail={currentUser.email}
            fromBriefTitle={brief.title}
            onClose={() => setProposeBriefOpen(false)}
          />
        )}

        {/* ── Suggest a call to action modal ───────────────────────────── */}
        {suggestCtaOpen && currentUser && (
          <SuggestCtaModal
            briefId={brief.id}
            briefSlug={brief.slug}
            briefTitle={brief.title}
            onClose={() => setSuggestCtaOpen(false)}
          />
        )}

        {/* ── Add coverage modal ───────────────────────────────────────── */}
        {addCoverageOpen && currentUser && (
          <AddCoverageModal
            briefId={brief.id}
            briefSlug={brief.slug}
            briefTitle={brief.title}
            onClose={() => setAddCoverageOpen(false)}
          />
        )}

        {/* ── TL;DR "Suggest changes" feedback modal ───────────────────── */}
        {tldrFeedbackOpen && currentUser && (
          <FeedbackModal
            context={{ briefId: brief.id, briefTitle: brief.title, section: 'tldr', sectionLabel: 'TL;DR' }}
            onClose={() => setTldrFeedbackOpen(false)}
          />
        )}

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
