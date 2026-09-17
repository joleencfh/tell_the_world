import Link from 'next/link'
import { HeroChipBar, ContributorsList } from './section-content'
import { ContributeMenu, type ContributeModalKind } from './contribute'
import { ReviewEndorseControl } from './review-endorse'
import { getBriefNumber, getBriefCategory } from './helpers'
import type { Brief, CurrentUser, ContributionStatus, BriefContributor } from './page'

// ---------------------------------------------------------------------------
// Hero — neutral ink, no blue/pink tint (§1.1)
// ---------------------------------------------------------------------------

export function BriefHero({
  brief,
  currentUser,
  canContribute,
  myReviewStatus,
  reviewedCount,
  endorsedCount,
  readTimeMinutes,
  contributors,
  onOpenModal,
  onSuggestCta,
  onAddCoverage,
  onOpenReviewers,
}: {
  brief: Brief
  currentUser: CurrentUser | null
  canContribute: boolean
  myReviewStatus: ContributionStatus
  reviewedCount: number
  endorsedCount: number
  readTimeMinutes: number
  contributors: BriefContributor[]
  onOpenModal: (kind: ContributeModalKind) => void
  onSuggestCta: () => void
  onAddCoverage: () => void
  onOpenReviewers: () => void
}) {
  return (
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
                role={currentUser.role} onOpenModal={onOpenModal}
                onSuggestCta={onSuggestCta} onAddCoverage={onAddCoverage}
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
          onOpenReviewers={onOpenReviewers}
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
  )
}
