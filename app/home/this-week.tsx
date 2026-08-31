import Link from 'next/link'
import Thumb from '@/components/ui/Thumb'
import type { ActivityItem } from '@/lib/data/activity'
import DashboardSectionHeader, { DASH_SECTION_BORDER_CLASSES } from './dashboard-section-header'

// This Week — one chronological river mixing internal items (new/updated
// briefs, quotes) with external items (press coverage, posts linking out),
// instead of splitting them into separate feeds (home-dashboard-plan.md §2,
// Part 4). Split out from page.tsx for the same reason highlighted.tsx was —
// staying under the repo's ~500-line max-lines convention.

const WEEKDAY_FORMAT = new Intl.DateTimeFormat('en-GB', { weekday: 'short' })

function formatRowDate(iso: string): string {
  const date = new Date(iso)
  return `${WEEKDAY_FORMAT.format(date).toUpperCase()} ${date.getDate()}`
}

const TAG_LABEL: Record<ActivityItem['kind'], string> = {
  brief_new: 'Brief',
  brief_updated: 'Brief',
  quote: 'Quote',
  external: 'External',
  coverage: 'Coverage',
}

// Matches the artifact's .week-tag rules exactly: brief is an unfilled
// neutral outline, quote fills blue, coverage/external both fill pink (the
// same "external content" meaning pink already carries sitewide).
const TAG_CLASSES: Record<ActivityItem['kind'], string> = {
  brief_new: 'border-line-strong bg-paper text-ink-soft',
  brief_updated: 'border-line-strong bg-paper text-ink-soft',
  quote: 'border-blue-soft bg-blue-soft text-blue-ink',
  external: 'border-pink-soft bg-pink-soft text-pink-ink',
  coverage: 'border-pink-soft bg-pink-soft text-pink-ink',
}

// Row background tint by kind — no tint for Brief rows, blue-wash for
// Quote, pink-wash for External/Coverage (this part's write-up).
const ROW_TINT_CLASSES: Record<ActivityItem['kind'], string> = {
  brief_new: '',
  brief_updated: '',
  quote: 'bg-blue-wash',
  external: 'bg-pink-wash',
  coverage: 'bg-pink-wash',
}

function rowHeading(item: ActivityItem): string {
  switch (item.kind) {
    case 'brief_new':
      return `New brief: ${item.title}`
    case 'brief_updated':
      return `Updated: ${item.title}`
    case 'coverage':
      return `${item.outletName} covered “${item.title}”`
    default:
      return item.title
  }
}

function rowDescription(item: ActivityItem): string | null {
  if (item.kind === 'quote') return item.body
  return null
}

function Row({ item }: { item: ActivityItem }) {
  const heading = rowHeading(item)
  const description = rowDescription(item)
  const showThumb = item.kind === 'external' || item.kind === 'coverage'

  const inner = (
    <>
      <span className="font-mono text-[10px] tracking-[0.06em] text-ink-faint tabular-nums">
        {formatRowDate(item.created_at)}
      </span>
      <span
        className={`w-fit shrink-0 border font-mono text-[8.5px] uppercase tracking-[0.08em] px-[7px] py-1 ${TAG_CLASSES[item.kind]}`}
      >
        {TAG_LABEL[item.kind]}
      </span>
      <div className="flex min-w-0 items-center gap-3">
        {showThumb && <Thumb id={item.id} className="h-9 w-9 shrink-0" />}
        <div className="min-w-0">
          <div className="truncate font-body text-[0.92rem] font-bold text-ink">{heading}</div>
          {description && <div className="mt-0.5 truncate text-[0.78rem] text-ink-faint">{description}</div>}
        </div>
      </div>
    </>
  )

  const rowClassName = `grid grid-cols-1 items-start gap-1.5 border-b border-line px-2.5 py-2.5 transition-colors hover:bg-paper-raised sm:grid-cols-[84px_auto_1fr_auto] sm:items-center sm:gap-4 ${ROW_TINT_CLASSES[item.kind]}`
  const goLabel = item.kind === 'external' || item.kind === 'coverage' ? 'Open ↗' : 'Read →'

  if (item.kind === 'external' || item.kind === 'coverage') {
    return (
      <a href={item.url} target="_blank" rel="noopener noreferrer" className={rowClassName}>
        {inner}
        <span className="font-mono text-[10px] text-ink-soft">{goLabel}</span>
      </a>
    )
  }

  // A quote's brief_id (and therefore slug) is nullable — set null when its
  // brief is deleted, or never set for a quote posted outside a brief
  // context. Without a slug there's nowhere to send the reader, so the row
  // renders as plain, non-interactive text instead of linking to a broken
  // /briefs/undefined route.
  if (item.kind === 'quote' && !item.slug) {
    return <div className={rowClassName}>{inner}</div>
  }

  return (
    <Link href={`/briefs/${item.slug}`} className={rowClassName}>
      {inner}
      <span className="font-mono text-[10px] text-ink-soft">{goLabel}</span>
    </Link>
  )
}

export default function ThisWeek({ items }: { items: ActivityItem[] }) {
  return (
    <section className={`border-t-4 ${DASH_SECTION_BORDER_CLASSES.pink} pt-8`}>
      <DashboardSectionHeader
        tone="pink"
        label="This Week"
        title="What moved since Monday"
        description="Brief updates and outside coverage, in the order they happened, not split into separate feeds."
      />
      <div className="flex flex-col">
        {items.map((item) => (
          <Row key={`${item.kind}-${item.id}`} item={item} />
        ))}
      </div>
    </section>
  )
}
