'use client'

import { useState } from 'react'

// Parsing lives in lib/briefs/parse-sources.ts (plain module, no 'use
// client') so lib/admin/brief-actions.ts's save-time validation (Part 5
// step 5: a source with no Publisher line is a save-blocking error, not a
// silent gap) can import the exact same parser instead of duplicating it.
export { parseSources } from '@/lib/briefs/parse-sources'
export type { SourceItem } from '@/lib/briefs/parse-sources'
import type { SourceItem } from '@/lib/briefs/parse-sources'

// ---------------------------------------------------------------------------
// Source card — clickable, opens detail drawer
// ---------------------------------------------------------------------------

// Single-column, full-width row (not a 2-up grid card) — title/publisher and
// a clamped description sit inline so the card reads left-to-right instead
// of stacking vertically, which is what keeps its height well below the old
// stacked layout's.
function SourceCard({
  item,
  index,
  isSelected,
  isOtherSelected,
  onClick,
}: {
  item: SourceItem
  index: number
  isSelected: boolean
  isOtherSelected: boolean
  onClick: () => void
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick() }}
      style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
      className={`group focus-ring flex min-h-11 cursor-pointer select-none items-center gap-2.5 rounded-control bg-vellum px-3 py-2 transition-colors duration-150 motion-reduce:transition-none sm:gap-3.5 sm:px-4 sm:py-3
        ${isSelected
          ? 'shadow-[0_0_0_2px_var(--color-cobalt)]'
          : isOtherSelected
            ? 'opacity-60 shadow-hairline'
            : 'shadow-hairline hover:bg-bone'
        }`}
    >
      <span className="shrink-0 font-mono text-label tabular-nums text-umber-soft">
        {String(index + 1).padStart(2, '0')}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-baseline gap-x-2.5">
          <p className={`font-ui text-ui-sm font-semibold transition-colors ${isSelected ? 'text-cobalt' : 'text-umber group-hover:text-cobalt'}`}>
            {item.title}
          </p>
          {/* Publisher — provenance (Part 5 step 5), required at authoring
              time (lib/admin/brief-actions.ts's saveBrief rejects a source
              with no Publisher line) so every card can show one. Its own
              line on mobile (not sharing the title's line) keeps the card
              thin without crowding a long title — sm+ reverts to the
              original inline-wrap treatment. */}
          {item.publisher && (
            <span className="shrink-0 text-caption text-umber-soft mt-0.5 sm:mt-0">
              {item.publisher}
            </span>
          )}
        </div>
        {/* Description hidden on mobile — it's what made the collapsed row
            tall on a phone; sm+ still shows it since there's room there. */}
        {item.description && (
          <p className="mt-0.5 line-clamp-2 hidden font-ui text-caption text-umber-soft sm:block">
            {item.description}
          </p>
        )}
      </div>

      {item.url && (
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Visit source: ${item.title}`}
          style={{ touchAction: 'manipulation' }}
          className="group/link focus-ring flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-cobalt transition-colors hover:bg-cobalt-wash"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="text-ui-sm transition-transform group-hover/link:translate-x-0.5" aria-hidden>→</span>
        </a>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Source drawer — full-width detail panel
// ---------------------------------------------------------------------------

const PLACEHOLDER_SUMMARY =
  'A detailed summary of this source will be added soon. Check back after the brief has been fully annotated, or visit the original source using the link below.'
const PLACEHOLDER_TAKEAWAYS = [
  'Key insight from this source',
  'Another important takeaway',
  'A third point worth noting',
]

function SourceDrawer({
  item,
  index,
  onClose,
}: {
  item: SourceItem
  index: number
  onClose: () => void
}) {
  const summary = item.summary ?? PLACEHOLDER_SUMMARY
  const takeaways = item.takeaways ?? PLACEHOLDER_TAKEAWAYS
  const isPlaceholder = !item.summary

  return (
    <div className="anim-drawer mt-3 overflow-hidden rounded-control bg-vellum shadow-hairline">
      <div className="px-7 py-8">
        {/* Header */}
        <div className="mb-7 flex items-start justify-between gap-4">
          <div>
            <p className="mb-1.5 font-mono text-label uppercase text-umber-soft">
              Source {String(index + 1).padStart(2, '0')} — Summary
            </p>
            <h3 className="font-serif text-card-title text-umber">
              {item.title}
            </h3>
            {item.publisher && (
              <p className="mt-1.5 text-caption text-umber-soft">{item.publisher}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close summary"
            style={{ touchAction: 'manipulation' }}
            className="focus-ring flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg leading-none text-umber transition-colors hover:bg-bone"
          >
            ×
          </button>
        </div>

        {/* Body — summary + takeaways */}
        <div className="grid gap-6 sm:grid-cols-[1fr_220px] sm:gap-10">
          {/* Summary */}
          <div>
            <p className="mb-3 font-mono text-label uppercase text-umber-soft">
              Overview
            </p>
            <p className={`font-serif text-message ${isPlaceholder ? 'italic text-umber-soft' : 'text-umber'}`}>
              {summary}
            </p>
          </div>

          {/* Takeaways */}
          <div className="sm:border-l sm:border-rule sm:pl-8">
            <p className="mb-3 font-mono text-label uppercase text-umber-soft">
              Key takeaways
            </p>
            <ul className="space-y-2.5">
              {takeaways.map((point, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="mt-[3px] shrink-0 text-label text-cobalt" aria-hidden>▸</span>
                  <span className={`font-ui text-ui-sm ${isPlaceholder ? 'italic text-umber-soft' : 'text-umber'}`}>
                    {point}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer CTA */}
        {item.url && (
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-rule pt-6">
            <p className="font-mono text-label uppercase text-umber-soft">
              Ready to go deeper?
            </p>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ touchAction: 'manipulation' }}
              className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-control bg-umber px-5 py-2.5 font-ui text-ui font-medium text-parchment transition-colors hover:bg-umber-hover"
            >
              Visit source <span aria-hidden>→</span>
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sources grid — manages open drawer per row
// ---------------------------------------------------------------------------

// Renders only the first PAGE_SIZE sources by default (Part 5 step 4) — a
// brief with a long source list no longer dumps every card onto the page
// at once. "Show N more" / "Show less" is a plain reveal toggle (no
// pagination state to persist, no re-fetch), matching the rest of this
// page's client-only interactions.
const PAGE_SIZE = 4

export function SourcesGrid({ items }: { items: SourceItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const [showAll, setShowAll] = useState(false)

  function toggle(i: number) {
    setOpenIndex((prev) => (prev === i ? null : i))
  }

  // Collapsing back can hide the source whose drawer is currently open —
  // close it too rather than leaving an orphaned drawer under a card that's
  // no longer rendered.
  function collapse() {
    setShowAll(false)
    setOpenIndex((prev) => (prev !== null && prev >= PAGE_SIZE ? null : prev))
  }

  const visibleItems = showAll ? items : items.slice(0, PAGE_SIZE)
  const remaining = items.length - visibleItems.length
  const canCollapse = showAll && items.length > PAGE_SIZE

  return (
    <div className="space-y-2 sm:space-y-3">
      {visibleItems.map((item, i) => (
        <div key={i}>
          <SourceCard
            item={item}
            index={i}
            isSelected={openIndex === i}
            isOtherSelected={openIndex !== null && openIndex !== i}
            onClick={() => toggle(i)}
          />
          {openIndex === i && (
            <SourceDrawer item={item} index={i} onClose={() => setOpenIndex(null)} />
          )}
        </div>
      ))}
      {remaining > 0 && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          style={{ touchAction: 'manipulation' }}
          className="focus-ring min-h-11 w-full rounded-control bg-vellum px-4 py-2.5 font-mono text-label uppercase text-umber-soft shadow-hairline transition-colors hover:bg-bone hover:text-umber"
        >
          Show {remaining} more source{remaining === 1 ? '' : 's'} <span aria-hidden>↓</span>
        </button>
      )}
      {canCollapse && (
        <button
          type="button"
          onClick={collapse}
          style={{ touchAction: 'manipulation' }}
          className="focus-ring min-h-11 w-full rounded-control bg-vellum px-4 py-2.5 font-mono text-label uppercase text-umber-soft shadow-hairline transition-colors hover:bg-bone hover:text-umber"
        >
          Show less <span aria-hidden>↑</span>
        </button>
      )}
    </div>
  )
}
