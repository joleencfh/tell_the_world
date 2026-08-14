'use client'

import Link from 'next/link'
import { Carousel } from '@/components/ui/Carousel'
import { formatDate } from './helpers'
import type { RelatedBrief } from '@/lib/data/briefs'

// ---------------------------------------------------------------------------
// Related brief card — neutral ink (§1.1: Related Briefs is the editorial
// spine, never tinted blue or pink), same 300px/border/hover-lift shape as
// QuoteCard/CtaCard but with an ink top border and ink hover accent instead
// of blue. No author byline (a brief has no single "author" the way a quote
// or CTA does) — topic tag eyebrow + title + date stand in for it.
// ---------------------------------------------------------------------------

function RelatedBriefCard({ brief }: { brief: RelatedBrief }) {
  return (
    <Link
      href={`/briefs/${brief.slug}`}
      className="group/card block w-[300px] shrink-0 snap-start pt-1 first:pl-1"
    >
      <div className="flex h-full flex-col gap-3 border border-line border-t-[3px] border-t-ink bg-paper p-5 transition-all duration-150 motion-reduce:transition-none group-hover/card:-translate-x-0.5 group-hover/card:-translate-y-0.5 group-hover/card:border-ink group-hover/card:shadow-[4px_4px_0_0_var(--color-ink)]">
        {brief.topic_tag && (
          <span className="font-mono text-[0.62rem] uppercase tracking-[0.1em] text-ink-faint">
            {brief.topic_tag}
          </span>
        )}
        <h3 className="flex-1 break-words font-display text-[1.08rem] font-extrabold leading-[1.3] text-ink line-clamp-3">
          {brief.title}
        </h3>
        <div className="flex items-center justify-between gap-3 border-t border-line pt-[0.7rem]">
          <span className="truncate font-mono text-[0.6rem] text-ink-faint tabular-nums">
            {formatDate(brief.created_at)}
          </span>
          <span
            aria-hidden
            className="flex h-8 w-8 shrink-0 items-center justify-center text-ink-soft transition-all duration-150 motion-reduce:transition-none group-hover/card:translate-x-0.5 group-hover/card:text-ink"
          >
            <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4 stroke-current stroke-[1.6]">
              <path d="M4 10h11.5M10.5 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  )
}

// ---------------------------------------------------------------------------
// Related briefs carousel — no explicit empty-state message, unlike Quotes/
// CTAs: BriefView only renders this section at all when there's at least
// one related brief (§3 Part 8's near-empty-state convention — don't render
// the section, rather than rendering it empty).
// ---------------------------------------------------------------------------

export function RelatedBriefsCarousel({ briefs }: { briefs: RelatedBrief[] }) {
  return (
    <Carousel.Provider>
      <Carousel.PrevButton />
      <Carousel.NextButton />
      <Carousel.Track fadeColor="var(--color-paper-raised)" ariaLabel="Related briefs">
        {briefs.map((brief) => (
          <RelatedBriefCard key={brief.id} brief={brief} />
        ))}
      </Carousel.Track>
    </Carousel.Provider>
  )
}
