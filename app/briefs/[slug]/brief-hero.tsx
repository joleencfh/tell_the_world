import Link from 'next/link'
import { HeroChipBar, ContributorsList } from './section-content'
import { ContributeMenu, type ContributeModalKind } from './contribute'
import { ReviewEndorseControl } from './review-endorse'
import { getBriefNumber, getBriefCategory } from './helpers'
import type { Brief, CurrentUser, ContributionStatus, BriefContributor } from './page'

// ---------------------------------------------------------------------------
// Hero — page header (design-system.md 3.3): eyebrow, serif title, lead
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
    <div id="section-top" className="border-b border-rule px-4 pb-10 pt-14 md:px-gutter">
      <div className="mx-auto max-w-content">
        {/* Numbered eyebrow — 01, so the SectionHeader sequence starting
            at 02 (TL;DR, just below) doesn't appear to skip 01 (§1.3). */}
        <div className="flex items-center gap-4 mb-4 anim-rise" style={{ animationDelay: '0ms' }}>
          <span className="font-mono text-label tabular-nums text-umber-soft">01</span>
          <div className="h-px flex-1 bg-rule" />
          <span className="font-mono text-label uppercase text-umber-soft">
            Brief No. {getBriefNumber(brief.id)} — {getBriefCategory(brief.topic_tag)}
          </span>
          {/* Admin-only entry point into the existing brief editor (Part 5
              step 3) — no new editing capability, just a visible link
              into /admin/briefs/[id] from the live page. */}
          {currentUser?.role === 'admin' && (
            <Link
              href={`/admin/briefs/${brief.id}`}
              className="focus-ring inline-flex min-h-11 shrink-0 items-center font-mono text-label uppercase text-umber-soft transition-colors hover:text-umber"
            >
              Edit this brief →
            </Link>
          )}
        </div>

        {/* Title/subtitle block + Contribute — flex row so the hero's
            role-gated dropdown (Part 9) sits top-right of the title on wide
            screens and drops below it on phones. */}
        <div className="flex flex-wrap items-start justify-between gap-6 md:gap-10">
          <div className="min-w-0 flex-1 basis-full md:basis-0">
            {/* Title — large, dominant */}
            <h1 className="font-serif text-title text-umber anim-rise break-words" style={{ animationDelay: '80ms' }}>
              {brief.title}
            </h1>

            {/* Subtitle — one sentence, allowed a point of view */}
            {brief.subtitle && (
              <p className="font-serif text-lead text-umber-soft mt-6 max-w-reading anim-rise" style={{ animationDelay: '120ms' }}>
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
