import Link from 'next/link'
import Tag from '@/components/ui/Tag'
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
      <span className="font-mono text-label tabular-nums text-umber-soft">{formatRowDate(item.created_at)}</span>
      {/* The kind is told by the word, not by a hue. */}
      <Tag className="w-fit shrink-0">{TAG_LABEL[item.kind]}</Tag>
      <div className="flex min-w-0 items-center gap-3">
        {showThumb && <Thumb id={item.id} className="size-9 shrink-0 rounded-control" />}
        <div className="min-w-0">
          <div className="truncate font-ui text-ui font-semibold text-umber">{heading}</div>
          {description && <div className="mt-0.5 truncate text-caption text-umber-soft">{description}</div>}
        </div>
      </div>
    </>
  )

  const rowClassName =
    'grid min-h-11 grid-cols-1 items-start gap-1.5 px-5 py-4 transition-colors hover:bg-bone focus-ring sm:grid-cols-[84px_auto_1fr_auto] sm:items-center sm:gap-4'
  const goLabel = item.kind === 'external' || item.kind === 'coverage' ? 'Open ↗' : 'Read →'

  if (item.kind === 'external' || item.kind === 'coverage') {
    return (
      <a href={item.url} target="_blank" rel="noopener noreferrer" className={rowClassName}>
        {inner}
        <span className="font-ui text-ui-sm text-umber-soft">{goLabel}</span>
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
      <span className="font-ui text-ui-sm text-umber-soft">{goLabel}</span>
    </Link>
  )
}

export default function ThisWeek({ items }: { items: ActivityItem[] }) {
  return (
    <section className={`${DASH_SECTION_BORDER_CLASSES.rose} pt-8`}>
      <DashboardSectionHeader
        tone="rose"
        label="This Week"
        title="What moved since Monday"
        description="Brief updates and outside coverage, in the order they happened, not split into separate feeds."
      />
      <div className="flex flex-col divide-y divide-rule overflow-hidden rounded-control bg-vellum shadow-hairline">
        {items.map((item) => (
          <Row key={`${item.kind}-${item.id}`} item={item} />
        ))}
      </div>
    </section>
  )
}
