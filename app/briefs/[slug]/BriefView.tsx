'use client'

import { useState, Fragment } from 'react'
import Link from 'next/link'
import ProposeBriefModal from '@/components/ProposeBriefModal'
import {
  SECTION_ORDER,
  SECTION_META,
  SECTION_BG,
  SectionHeader,
  SectionContent,
  LockedPlaceholder,
  QuotesCarousel,
  HeaderChip,
  TLDRList,
} from './section-content'
import { QuestionCard, QuestionForm, ProposeCorrectionModal } from './qa'
import { ReviewEndorseControl } from './review-endorse'
import { ExplainerSections } from './explainer'
import { MOCK_QUESTIONS } from './mock-questions'
import { formatDate, computeReadTimeMinutes } from './helpers'
import type {
  Brief,
  CurrentUser,
  Question,
  Quote,
  MediaPost,
  EndorsementBarCounts,
  ContributionStatus,
  ExplainerContributionInfo,
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
  currentUser: CurrentUser | null
  myReviewStatus: ContributionStatus
  explainerContributions: ExplainerContributionInfo[]
}

// `media` stays in BriefViewProps (page.tsx still fetches and passes it —
// dropping Media from the page was a deliberate call, but the data query
// itself is out of scope for this change) but isn't destructured here since
// nothing renders it anymore.
export default function BriefView({ brief, quotes, endorsementBar, questions, currentUser, myReviewStatus, explainerContributions }: BriefViewProps) {
  const isLoggedIn = !!currentUser
  const showSections = isLoggedIn || brief.visibility === 'public'
  const canContribute = currentUser?.role === 'expert' || currentUser?.role === 'organisation'
  const [proposeCorrectionOpen, setProposeCorrectionOpen] = useState(false)
  const [proposeBriefOpen, setProposeBriefOpen] = useState(false)
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
      <header className="sticky top-0 z-10 bg-paper/95 backdrop-blur-sm border-b border-line px-6">
        <div className="mx-auto flex max-w-4xl items-center justify-between py-4">
          <Link
            href={isLoggedIn ? '/home' : '/'}
            className="font-display text-base font-bold tracking-tight text-ink"
          >
            Tell <em className="italic text-ink-soft">The</em> World
          </Link>
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
        <div className="grid-texture relative overflow-hidden px-6 pt-16 pb-20">
          {/* Bottom fade to next section */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-b from-transparent to-paper pointer-events-none" />

          <div className="mx-auto max-w-4xl relative">
            {/* Numbered eyebrow — 01, so the SectionHeader sequence starting
                at 02 (TL;DR, just below) doesn't appear to skip 01 (§1.3). */}
            <div className="flex items-center gap-4 mb-8 anim-rise" style={{ animationDelay: '0ms' }}>
              <span className="font-mono text-sm tracking-[0.2em] text-ink font-bold tabular-nums">01</span>
              <div className="h-px flex-1 bg-line" />
              <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-ink-faint">Brief</span>
            </div>

            {/* Title — large, dominant */}
            <h1
              className="font-display uppercase font-bold text-ink anim-rise"
              style={{
                fontSize: 'clamp(3.1rem, 7.8vw, 6.6rem)',
                lineHeight: '0.93',
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
          <div className="bg-paper px-6 py-16">
            <div className="mx-auto max-w-4xl anim-rise" style={{ animationDelay: '0ms' }}>
              <SectionHeader
                num={SECTION_META.tldr.num}
                label={SECTION_META.tldr.label}
                description={SECTION_META.tldr.description}
              />
              <TLDRList content={tldr} />
            </div>
          </div>
        )}

        {/* ── Sections or lock ─────────────────────────────────────────── */}
        {showSections ? (
          <>
            {SECTION_ORDER.map((type, i) => {
              // going_deeper no longer renders as its own top-level section
              // (folded into Explainer below) — skip it here entirely.
              if (type === 'going_deeper') return null

              // A section type can have more than one row (e.g. multiple
              // titled Explainer subsections, Part 3) — render every
              // matching row, not just the first, so content isn't silently
              // dropped.
              const sections = sortedSections.filter((s) => s.section_type === type)

              return (
                <Fragment key={type}>
                  {sections.length > 0 && (() => {
                    const meta = SECTION_META[type]
                    const bgClass = SECTION_BG[i] ?? 'bg-base'
                    return (
                      <div className={`${bgClass} px-6 py-16`}>
                        <div className="mx-auto max-w-4xl anim-rise" style={{ animationDelay: '100ms' }}>
                          <SectionHeader
                            num={meta.num}
                            label={meta.label}
                            description={meta.description}
                            numTone={type === 'faq' ? 'blue' : 'ink'}
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
                            <div className="space-y-10">
                              {sections.map((section) => (
                                <SectionContent key={section.id} type={type} content={section.content} />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })()}

                  {/* Quotes — auto section, query-driven off the brief's topic_tag
                      (design doc §2 row 2). Anchored at the old "where experts
                      stand" position in the loop pending Part 10's cleanup pass,
                      which is expected to retire that section type entirely. */}
                  {type === 'where_experts_stand' && quotes.length > 0 && (
                    <div className="border-t-4 border-blue bg-paper-sunken-blue px-6 py-16">
                      <div className="mx-auto max-w-4xl anim-rise" style={{ animationDelay: '0ms' }}>
                        <QuotesCarousel quotes={quotes} />
                      </div>
                    </div>
                  )}
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
              <div className="bg-dark rounded-2xl p-10 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/5 mb-5">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-live/70">
                    <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="font-display uppercase text-white text-2xl mb-3">Members Only</p>
                <p className="font-serif text-sm text-white/50 mb-8 leading-relaxed max-w-sm mx-auto">
                  The full brief — sources, context, and expert guidance — is available to approved members of the Tell The World community.
                </p>
                <div className="flex items-center justify-center gap-6 flex-wrap">
                  <Link href="/apply" className="font-display uppercase tracking-widest text-xs bg-live text-white px-8 py-3 hover:bg-live/90 transition-colors">
                    Apply to Join
                  </Link>
                  <Link href="/login" className="font-mono text-[9px] tracking-[0.15em] uppercase text-white/40 hover:text-white/80 transition-colors">
                    Already a member? Login →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Q&A — members only ───────────────────────────────────────── */}
        {isLoggedIn && (
          <div className="bg-warm px-6 py-16">
            <div className="mx-auto max-w-4xl">
              <SectionHeader
                num="05"
                label="Community Q&A"
                description="Questions from members, answered by experts"
              />
              {(() => {
                const displayed = questions.length > 0 ? questions : MOCK_QUESTIONS
                return (
                  <div className="space-y-4 mb-6">
                    {displayed.map((q) => (
                      <QuestionCard key={q.id} question={q} />
                    ))}
                  </div>
                )
              })()}
              <QuestionForm briefId={brief.id} briefSlug={brief.slug} />
            </div>
          </div>
        )}

        {/* ── Footer actions — logged-in members ───────────────────────── */}
        {isLoggedIn && (
          <div className="px-6 py-6 border-t border-edge">
            <div className="mx-auto max-w-4xl flex flex-wrap items-center gap-6">
              {canContribute && (
                <button
                  type="button"
                  onClick={() => setProposeCorrectionOpen(true)}
                  className="font-mono text-[10px] tracking-[0.15em] uppercase text-soft hover:text-text transition-colors inline-flex items-center gap-2"
                >
                  <span aria-hidden>→</span> Propose a correction or addition
                </button>
              )}
              <button
                type="button"
                onClick={() => setProposeBriefOpen(true)}
                className="font-mono text-[10px] tracking-[0.15em] uppercase text-soft hover:text-text transition-colors inline-flex items-center gap-2"
              >
                <span aria-hidden>→</span> Propose a new brief
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

      </main>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="border-t border-edge px-6 py-6">
        <div className="mx-auto max-w-4xl flex items-center justify-between">
          <span className="font-serif text-sm font-bold text-soft/60 tracking-tight">
            Tell <em className="italic">The</em> World
          </span>
          <Link
            href={isLoggedIn ? '/home' : '/'}
            className="font-mono text-[9px] tracking-[0.15em] uppercase text-soft/60 hover:text-soft transition-colors"
          >
            ← Back to home
          </Link>
        </div>
      </footer>

    </div>
  )
}
