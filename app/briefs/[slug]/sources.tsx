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
      className={`group bg-card rounded-r-2xl rounded-l-none p-5 flex flex-col gap-3 transition-all cursor-pointer select-none
        border border-edge border-l-[3px]
        ${isSelected
          ? 'border-l-live shadow-md ring-1 ring-live/20'
          : isOtherSelected
            ? 'border-l-live/20 opacity-50'
            : 'border-l-live/50 hover:border-l-live hover:shadow-md'
        }`}
    >
      <div className="flex items-start gap-3">
        <span className="font-mono text-xs tracking-[0.15em] text-live font-bold tabular-nums mt-0.5 shrink-0">
          {String(index + 1).padStart(2, '0')}
        </span>
        <p className={`font-serif text-[0.9rem] font-bold leading-snug transition-colors flex-1 ${isSelected ? 'text-live' : 'text-dark group-hover:text-live'}`}>
          {item.title}
        </p>
        {/* Expand indicator */}
        <span
          className={`shrink-0 text-live/50 text-xs transition-transform duration-300 mt-0.5 ${isSelected ? 'rotate-180' : ''}`}
          aria-hidden
        >
          ↓
        </span>
      </div>
      {item.description && (
        <p className="font-serif text-sm text-soft leading-relaxed pl-8">{item.description}</p>
      )}
      {item.url && (
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Visit source: ${item.title}`}
          className="ml-auto mt-auto w-8 h-8 rounded-full bg-live/10 hover:bg-live flex items-center justify-center text-live hover:text-white transition-all group/link shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="text-sm group-hover/link:translate-x-0.5 transition-transform" aria-hidden>→</span>
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
    <div
      className="mt-3 bg-dark rounded-2xl overflow-hidden anim-drawer"
      style={{ borderTop: '3px solid var(--color-live)' }}
    >
      <div className="px-7 py-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-7">
          <div>
            <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-live/60 mb-1.5">
              Source {String(index + 1).padStart(2, '0')} — Summary
            </p>
            <h3 className="font-display uppercase text-white text-xl leading-tight">
              {item.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close summary"
            className="shrink-0 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white/80 transition-all text-lg leading-none"
          >
            ×
          </button>
        </div>

        {/* Body — summary + takeaways */}
        <div className="grid sm:grid-cols-[1fr_220px] gap-6 sm:gap-10">
          {/* Summary */}
          <div>
            <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-live/50 mb-3">
              Overview
            </p>
            <p className={`font-serif text-[0.95rem] leading-relaxed ${isPlaceholder ? 'text-white/35 italic' : 'text-white/75'}`}>
              {summary}
            </p>
          </div>

          {/* Takeaways */}
          <div className="sm:border-l sm:border-white/[0.08] sm:pl-8">
            <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-live/50 mb-3">
              Key takeaways
            </p>
            <ul className="space-y-2.5">
              {takeaways.map((point, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="text-live shrink-0 text-[10px] mt-[3px]" aria-hidden>▸</span>
                  <span className={`font-serif text-sm leading-snug ${isPlaceholder ? 'text-white/30 italic' : 'text-white/65'}`}>
                    {point}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer CTA */}
        {item.url && (
          <div className="mt-8 pt-6 border-t border-white/[0.08] flex items-center justify-between gap-4 flex-wrap">
            <p className="font-mono text-[9px] tracking-[0.12em] uppercase text-white/25">
              Ready to go deeper?
            </p>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-display uppercase tracking-widest text-xs bg-live text-white px-5 py-2.5 hover:bg-live/90 transition-colors inline-flex items-center gap-2"
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
