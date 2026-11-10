import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'
import Link from 'next/link'
import { getFeaturedBrief, getFeaturedBriefDetail } from '@/lib/data/briefs'
import { getEndorsementBar } from '@/lib/data/contributions'
import { getQuotesForBrief, type Quote } from '@/lib/data/posts'
import { getPublishedCoverage, type Coverage } from '@/lib/data/coverage'
import { computeReadTimeMinutes, formatDate } from '@/app/briefs/[slug]/helpers'
import { TLDRList } from '@/app/briefs/[slug]/section-content'
import Tag from '@/components/ui/Tag'
import { QuoteAuthorFooter } from '@/app/briefs/[slug]/quotes'
import SlidingTabTrack from './sliding-tabs'
import DashboardSectionHeader, { DASH_SECTION_BORDER_CLASSES } from './dashboard-section-header'
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
    <div className="flex h-full flex-col gap-3 rounded-control bg-card-cobalt p-5">
      <span className="font-mono text-label tabular-nums text-umber-soft">{formatDate(quote.created_at)}</span>
      <p className="line-clamp-3 flex-1 font-serif text-message text-umber">&ldquo;{quoteText}&rdquo;</p>
      <div className="flex items-center gap-2.5 border-t border-window-line pt-3.5">
        <QuoteAuthorFooter quote={quote} />
      </div>
    </div>
  )
}

function OverviewEmptyState() {
  return <p className="font-ui text-ui-sm text-umber-soft">This brief has no TL;DR yet.</p>
}

function QuotesEmptyState() {
  return <p className="font-ui text-ui-sm text-umber-soft">No quotes attached to this brief yet.</p>
}

function CoverageEmptyState() {
  return <p className="font-ui text-ui-sm text-umber-soft">No press coverage attached to this brief yet.</p>
}

// ---------------------------------------------------------------------------
// Section
// ---------------------------------------------------------------------------

export default function Highlighted({ data }: { data: HighlightedSectionData }) {
  const { brief, tldr, tldrRichContent, readTimeMinutes, reviewedCount, endorsedCount, quotes, coverage } = data

  return (
    <section className={`${DASH_SECTION_BORDER_CLASSES.cobalt} pt-8`}>
      <DashboardSectionHeader tone="cobalt" label="★ Spotlight" title="This brief is worth your time" />

      <div>
        <div className="rounded-control bg-vellum p-6 shadow-hairline sm:p-8">
          <h3 className="font-serif text-section text-umber">{brief.title}</h3>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {reviewedCount > 0 && <Tag>✓ Reviewed by {reviewedCount}</Tag>}
            {endorsedCount > 0 && <Tag>★ Endorsed by {endorsedCount}</Tag>}
            <Tag>{readTimeMinutes} min read</Tag>
            {brief.topicTags.map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </div>

          <Link
            href={`/briefs/${brief.slug}`}
            className="group mt-4 inline-flex min-h-11 items-center gap-1 rounded-control font-ui text-ui-sm text-umber-soft underline decoration-umber-soft/40 underline-offset-[5px] hover:text-umber hover:decoration-umber focus-ring"
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
