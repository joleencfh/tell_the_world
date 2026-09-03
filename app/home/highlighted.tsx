import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'
import Link from 'next/link'
import { getFeaturedBrief, getFeaturedBriefDetail } from '@/lib/data/briefs'
import { getEndorsementBar } from '@/lib/data/contributions'
import { getQuotesForBrief, type Quote } from '@/lib/data/posts'
import { getPublishedCoverage, type Coverage } from '@/lib/data/coverage'
import { computeReadTimeMinutes, formatDate } from '@/app/briefs/[slug]/helpers'
import { TLDRList, HeaderChip } from '@/app/briefs/[slug]/section-content'
import { QuoteAuthorFooter } from '@/app/briefs/[slug]/quotes'
import SlidingTabTrack from './sliding-tabs'
import { DASH_SECTION_BORDER_CLASSES } from './dashboard-section-header'
import DashboardCoverageCard from './dashboard-coverage-card'

// Highlighted module (home-dashboard-plan.md §2, Part 3) — a single admin-
// curated brief pulled forward with its quotes and press coverage already
// attached. Self-contained: this file owns both the data composition
// (getHighlightedSectionData) and the rendering (Highlighted), so
// app/home/page.tsx only has to call one function and render one component
// — kept separate from page.tsx to stay under the repo's ~500-line
// max-lines convention, not because the data-fetching itself is reusable
// elsewhere.

type DB = SupabaseClient<Database>
const QUOTES_LIMIT = 2
const COVERAGE_LIMIT = 2

export interface HighlightedSectionData {
  brief: { id: string; title: string; slug: string; topicTags: string[] }
  tldr: string
  tldrRichContent: unknown
  readTimeMinutes: number
  reviewedCount: number
  endorsedCount: number
  quotes: Quote[]
  coverage: Coverage[]
}

// Step 1: is a brief even featured? If not, the caller renders nothing for
// this whole section (no placeholder chip) — same convention the Brief
// page already uses for its own empty Quotes/Related Briefs states.
export async function getHighlightedSectionData(db: DB, userId: string): Promise<HighlightedSectionData | null> {
  const briefId = await getFeaturedBrief(db)
  if (!briefId) return null

  const brief = await getFeaturedBriefDetail(db, briefId)
  if (!brief) return null // defensive: featured flag survived a since-deleted brief

  const tldrSection = brief.brief_sections.find((s) => s.section_type === 'tldr')
  const tldr = tldrSection?.content ?? ''
  const tldrRichContent = tldrSection?.rich_content ?? null
  const readTimeMinutes = computeReadTimeMinutes(brief.brief_sections)

  const [{ counts }, quotes, coverage] = await Promise.all([
    getEndorsementBar(
      db,
      briefId,
      brief.brief_sections.map((s) => ({ id: s.id, content_version: s.content_version })),
    ),
    getQuotesForBrief(db, briefId, brief.topic_tags, QUOTES_LIMIT, userId),
    getPublishedCoverage(db, briefId, userId),
  ])

  return {
    brief: { id: brief.id, title: brief.title, slug: brief.slug, topicTags: brief.topic_tags },
    tldr,
    tldrRichContent,
    readTimeMinutes,
    reviewedCount: counts.reviewedCount,
    endorsedCount: counts.endorsedCount,
    quotes,
    coverage: coverage.slice(0, COVERAGE_LIMIT),
  }
}

// ---------------------------------------------------------------------------
// Selected Quotes / Covered By cards — dashboard-local rather than reusing
// app/briefs/[slug]/quotes.tsx's QuoteCard or coverage.tsx's CoverageCard
// directly: both of those are built for their own carousel (fixed
// w-[300px] card width, snap-scroll wrapper) and both open a click-through
// detail modal via a required onOpen callback that doesn't exist on the
// dashboard. Forcing either in here would mean building the modal
// infrastructure too, well past what a 2-card preview needs. QuoteCard's
// author footer (QuoteAuthorFooter) has no such coupling, so that piece is
// reused as-is rather than re-implemented. Neither card shows a score —
// there was never one to omit here (unlike CoverageCard, which explicitly
// dropped it), so this stays true with no extra work.
// ---------------------------------------------------------------------------

function DashboardQuoteCard({ quote }: { quote: Quote }) {
  const quoteText = quote.body || quote.title
  return (
    <div className="flex h-full flex-col gap-3 border border-line border-t-[3px] border-t-blue bg-paper p-5">
      <span className="font-mono text-[0.62rem] tracking-[0.06em] text-ink-faint tabular-nums">
        {formatDate(quote.created_at)}
      </span>
      <p className="flex-1 line-clamp-3 font-body text-base font-normal leading-[1.5] text-ink">&ldquo;{quoteText}&rdquo;</p>
      <div className="flex items-center gap-[0.65rem] border-t border-line pt-[0.85rem]">
        <QuoteAuthorFooter quote={quote} />
      </div>
    </div>
  )
}

function OverviewEmptyState() {
  return <p className="font-body text-sm italic text-ink-soft/60">This brief has no TL;DR yet.</p>
}

function QuotesEmptyState() {
  return <p className="font-mono text-xs text-ink-faint">No quotes attached to this brief yet.</p>
}

function CoverageEmptyState() {
  return <p className="font-mono text-xs text-ink-faint">No press coverage attached to this brief yet.</p>
}

// ---------------------------------------------------------------------------
// Section
// ---------------------------------------------------------------------------

export default function Highlighted({ data }: { data: HighlightedSectionData }) {
  const { brief, tldr, tldrRichContent, readTimeMinutes, reviewedCount, endorsedCount, quotes, coverage } = data

  return (
    <section className={`border-t-4 ${DASH_SECTION_BORDER_CLASSES.blue} pt-8`}>
      <div className="mb-[22px]">
        <HeaderChip tone="spotlight">★ Spotlight</HeaderChip>
        <h2 className="mt-3 text-[1.4rem] font-extrabold uppercase tracking-[0.005em]">
          This brief is worth your time
        </h2>
      </div>

      <div className="shadow-block">
        <div className="border-2 border-ink bg-paper-raised p-6 sm:p-8">
          <h3 className="font-display text-2xl font-extrabold leading-tight text-ink">{brief.title}</h3>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {reviewedCount > 0 && <HeaderChip tone="blue">✓ Reviewed by {reviewedCount}</HeaderChip>}
            {endorsedCount > 0 && <HeaderChip tone="blue">★ Endorsed by {endorsedCount}</HeaderChip>}
            <HeaderChip>{readTimeMinutes} min read</HeaderChip>
            {brief.topicTags.map((tag) => (
              <HeaderChip key={tag} tone="tag">
                {tag}
              </HeaderChip>
            ))}
          </div>

          <Link
            href={`/briefs/${brief.slug}`}
            className="mt-4 inline-flex items-center gap-1 font-mono text-[9px] tracking-[0.15em] uppercase text-ink-soft transition-colors hover:text-ink group"
          >
            Read full brief{' '}
            <span className="transition-transform group-hover:translate-x-0.5" aria-hidden>
              →
            </span>
          </Link>

          <div className="mt-6">
            <SlidingTabTrack
              tabs={[
                {
                  id: 'overview',
                  label: 'Overview',
                  content: (
                    <div className="pt-6">
                      {tldr.trim() ? <TLDRList content={tldr} richContent={tldrRichContent} /> : <OverviewEmptyState />}
                    </div>
                  ),
                },
                {
                  id: 'quotes',
                  label: 'Selected Quotes',
                  activeClassName: 'border-b-blue bg-paper text-blue-ink',
                  content: (
                    <div className="pt-6">
                      {quotes.length > 0 ? (
                        <div className="grid gap-4 sm:grid-cols-2">
                          {quotes.map((q) => (
                            <DashboardQuoteCard key={q.id} quote={q} />
                          ))}
                        </div>
                      ) : (
                        <QuotesEmptyState />
                      )}
                    </div>
                  ),
                },
                {
                  id: 'coverage',
                  label: 'Covered By',
                  activeClassName: 'border-b-pink bg-paper text-pink-ink',
                  content: (
                    <div className="pt-6">
                      {coverage.length > 0 ? (
                        <div className="grid gap-4 sm:grid-cols-2">
                          {coverage.map((c) => (
                            <DashboardCoverageCard key={c.id} coverage={c} />
                          ))}
                        </div>
                      ) : (
                        <CoverageEmptyState />
                      )}
                    </div>
                  ),
                },
              ]}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
