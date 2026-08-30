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
      className={`group flex cursor-pointer select-none items-center gap-2.5 sm:gap-3.5 border border-line border-l-[3px] bg-paper px-3 py-2 sm:px-4 sm:py-3 outline-none transition-all duration-150 motion-reduce:transition-none focus-visible:ring-2 focus-visible:ring-blue
        ${isSelected
          ? 'border-l-blue ring-1 ring-blue/20'
          : isOtherSelected
            ? 'border-l-blue/20 opacity-50'
            : 'border-l-blue/50 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:border-blue hover:shadow-[3px_3px_0_0_var(--color-blue)]'
        }`}
    >
      <span className="shrink-0 font-mono text-[11px] sm:text-xs font-bold tabular-nums tracking-[0.15em] text-blue-ink">
        {String(index + 1).padStart(2, '0')}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-baseline gap-x-2.5">
          <p className={`font-body text-[0.8rem] sm:text-[0.9rem] font-bold leading-snug transition-colors ${isSelected ? 'text-blue-ink' : 'text-ink group-hover:text-blue-ink'}`}>
            {item.title}
          </p>
          {/* Publisher — provenance (Part 5 step 5), required at authoring
              time (lib/admin/brief-actions.ts's saveBrief rejects a source
              with no Publisher line) so every card can show one. Its own
              line on mobile (not sharing the title's line) keeps the card
              thin without crowding a long title — sm+ reverts to the
              original inline-wrap treatment. */}
          {item.publisher && (
            <span className="shrink-0 font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.1em] text-ink-faint mt-0.5 sm:mt-0">
              {item.publisher}
            </span>
          )}
        </div>
        {/* Description hidden on mobile — it's what made the collapsed row
            tall on a phone; sm+ still shows it since there's room there. */}
        {item.description && (
          <p className="mt-0.5 line-clamp-2 font-body text-sm leading-snug text-ink-soft hidden sm:block">
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
          className="group/link flex h-6 w-6 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full bg-blue-soft text-blue-ink transition-all hover:bg-blue hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="text-xs sm:text-sm transition-transform group-hover/link:translate-x-0.5" aria-hidden>→</span>
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
    <div className="anim-drawer mt-3 overflow-hidden border border-t-[3px] border-line border-t-blue bg-paper-raised">
      <div className="px-7 py-8">
        {/* Header */}
        <div className="mb-7 flex items-start justify-between gap-4">
          <div>
            <p className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-blue-ink">
              Source {String(index + 1).padStart(2, '0')} — Summary
            </p>
            <h3 className="font-display text-xl uppercase leading-tight text-ink">
              {item.title}
            </h3>
            {item.publisher && (
              <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.15em] text-ink-faint">{item.publisher}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close summary"
            style={{ touchAction: 'manipulation' }}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-soft text-lg leading-none text-blue-ink transition-all hover:bg-blue hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue"
          >
            ×
          </button>
        </div>

        {/* Body — summary + takeaways */}
        <div className="grid gap-6 sm:grid-cols-[1fr_220px] sm:gap-10">
          {/* Summary */}
          <div>
            <p className="mb-3 font-mono text-[9px] uppercase tracking-[0.2em] text-ink-faint">
              Overview
            </p>
            <p className={`font-body text-[0.95rem] leading-relaxed ${isPlaceholder ? 'italic text-ink-faint' : 'text-ink-soft'}`}>
              {summary}
            </p>
          </div>

          {/* Takeaways */}
          <div className="sm:border-l sm:border-line sm:pl-8">
            <p className="mb-3 font-mono text-[9px] uppercase tracking-[0.2em] text-ink-faint">
              Key takeaways
            </p>
            <ul className="space-y-2.5">
              {takeaways.map((point, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="mt-[3px] shrink-0 text-[10px] text-blue" aria-hidden>▸</span>
                  <span className={`font-body text-sm leading-snug ${isPlaceholder ? 'italic text-ink-faint' : 'text-ink-soft'}`}>
                    {point}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer CTA */}
        {item.url && (
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
            <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-ink-faint">
              Ready to go deeper?
            </p>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ touchAction: 'manipulation' }}
              className="inline-flex items-center gap-2 bg-blue px-5 py-2.5 font-display text-xs uppercase tracking-widest text-white transition-colors hover:bg-blue-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue"
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
          className="w-full border-[1.5px] border-line-strong bg-paper px-4 py-2.5 font-mono text-[0.68rem] uppercase tracking-[0.1em] text-ink-soft outline-none transition-colors hover:border-blue hover:text-blue-ink focus-visible:ring-2 focus-visible:ring-blue"
        >
          Show {remaining} more source{remaining === 1 ? '' : 's'} <span aria-hidden>↓</span>
        </button>
      )}
      {canCollapse && (
        <button
          type="button"
          onClick={collapse}
          style={{ touchAction: 'manipulation' }}
          className="w-full border-[1.5px] border-line bg-paper px-4 py-2.5 font-mono text-[0.68rem] uppercase tracking-[0.1em] text-ink-soft outline-none transition-colors hover:border-blue hover:text-blue-ink focus-visible:ring-2 focus-visible:ring-blue"
        >
          Show less <span aria-hidden>↑</span>
        </button>
      )}
    </div>
  )
}
