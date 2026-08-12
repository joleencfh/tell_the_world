'use client'

import { useState } from 'react'

// ---------------------------------------------------------------------------
// Content parsers
// ---------------------------------------------------------------------------

export interface SourceItem {
  title: string
  description: string
  url: string | null
  summary?: string
  takeaways?: string[]
}

type ParseMode = 'desc' | 'summary' | 'takeaways'

export function parseSources(content: string): SourceItem[] | null {
  const lines = content.split('\n')
  const items: SourceItem[] = []
  let current: {
    titleLine: string
    descLines: string[]
    url: string | null
    summaryLines: string[]
    takeaways: string[]
    mode: ParseMode
  } | null = null

  for (const line of lines) {
    const trimmed = line.trim()
    // Only '•' starts a new source item — '- ' is reserved for takeaway bullets
    if (line.startsWith('•')) {
      if (current) items.push(buildSourceItem(current))
      current = { titleLine: trimmed.replace(/^•\s*/, ''), descLines: [], url: null, summaryLines: [], takeaways: [], mode: 'desc' }
    } else if (current) {
      if (trimmed.match(/^https?:\/\//)) {
        current.url = trimmed
        current.mode = 'desc'
      } else if (trimmed.toLowerCase().startsWith('summary:')) {
        current.mode = 'summary'
        const rest = trimmed.replace(/^summary:\s*/i, '')
        if (rest) current.summaryLines.push(rest)
      } else if (trimmed.toLowerCase().match(/^(key )?takeaways?:/)) {
        current.mode = 'takeaways'
      } else if (current.mode === 'takeaways' && trimmed.startsWith('- ')) {
        current.takeaways.push(trimmed.replace(/^-\s*/, ''))
      } else if (current.mode === 'summary' && trimmed) {
        current.summaryLines.push(trimmed)
      } else if (current.mode === 'desc' && trimmed) {
        current.descLines.push(trimmed)
      }
    }
  }
  if (current) items.push(buildSourceItem(current))
  return items.length >= 2 ? items : null
}

function buildSourceItem(raw: {
  titleLine: string
  descLines: string[]
  url: string | null
  summaryLines: string[]
  takeaways: string[]
}): SourceItem {
  let title = raw.titleLine
  let description = raw.descLines.join(' ')

  const quotedMatch = raw.titleLine.match(/^[""""](.+?)[""""](.*)/)
  if (quotedMatch) {
    title = quotedMatch[1]
    const rest = quotedMatch[2].replace(/^\s*[—–-]\s*/, '')
    description = (rest + ' ' + description).trim()
  } else {
    const dashMatch = raw.titleLine.match(/^(.+?)\s+[—–-]\s+(.+)/)
    if (dashMatch) {
      title = dashMatch[1]
      description = (dashMatch[2] + ' ' + description).trim()
    }
  }
  return {
    title: title.trim(),
    description: description.trim(),
    url: raw.url,
    summary: raw.summaryLines.length > 0 ? raw.summaryLines.join(' ') : undefined,
    takeaways: raw.takeaways.length > 0 ? raw.takeaways : undefined,
  }
}

// ---------------------------------------------------------------------------
// Source card — clickable, opens detail drawer
// ---------------------------------------------------------------------------

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
      className={`group flex cursor-pointer select-none flex-col gap-3 border border-line border-l-[3px] bg-paper p-5 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue
        ${isSelected
          ? 'border-l-blue ring-1 ring-blue/20'
          : isOtherSelected
            ? 'border-l-blue/20 opacity-50'
            : 'border-l-blue/50 hover:border-l-blue'
        }`}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 shrink-0 font-mono text-xs font-bold tabular-nums tracking-[0.15em] text-blue-ink">
          {String(index + 1).padStart(2, '0')}
        </span>
        <p className={`flex-1 font-body text-[0.9rem] font-bold leading-snug transition-colors ${isSelected ? 'text-blue-ink' : 'text-ink group-hover:text-blue-ink'}`}>
          {item.title}
        </p>
        {/* Expand indicator */}
        <span
          className={`mt-0.5 shrink-0 text-xs text-blue/50 transition-transform duration-300 motion-reduce:transition-none ${isSelected ? 'rotate-180' : ''}`}
          aria-hidden
        >
          ↓
        </span>
      </div>
      {item.description && (
        <p className="pl-8 font-body text-sm leading-relaxed text-ink-soft">{item.description}</p>
      )}
      {item.url && (
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Visit source: ${item.title}`}
          style={{ touchAction: 'manipulation' }}
          className="group/link ml-auto mt-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-soft text-blue-ink transition-all hover:bg-blue hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="text-sm transition-transform group-hover/link:translate-x-0.5" aria-hidden>→</span>
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

export function SourcesGrid({ items }: { items: SourceItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  function toggle(i: number) {
    setOpenIndex((prev) => (prev === i ? null : i))
  }

  // Group into rows of 2 so the drawer appears below the correct row
  const rows: { item: SourceItem; globalIndex: number }[][] = []
  for (let i = 0; i < items.length; i += 2) {
    const row: { item: SourceItem; globalIndex: number }[] = [{ item: items[i], globalIndex: i }]
    if (items[i + 1]) row.push({ item: items[i + 1], globalIndex: i + 1 })
    rows.push(row)
  }

  return (
    <div className="space-y-4">
      {rows.map((row, rowIdx) => {
        const openInRow = row.find((r) => r.globalIndex === openIndex)
        return (
          <div key={rowIdx}>
            <div className="grid sm:grid-cols-2 gap-4">
              {row.map(({ item, globalIndex }) => (
                <SourceCard
                  key={globalIndex}
                  item={item}
                  index={globalIndex}
                  isSelected={openIndex === globalIndex}
                  isOtherSelected={openIndex !== null && openIndex !== globalIndex}
                  onClick={() => toggle(globalIndex)}
                />
              ))}
            </div>
            {openInRow && (
              <SourceDrawer
                key={openIndex}
                item={openInRow.item}
                index={openInRow.globalIndex}
                onClose={() => setOpenIndex(null)}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
