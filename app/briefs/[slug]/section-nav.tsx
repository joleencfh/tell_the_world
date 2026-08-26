'use client'

import { useEffect, useRef, useState } from 'react'
import { SECTION_ORDER, SECTION_META } from './section-content'
import type { BriefSection } from './page'

// Sticky jump-to-section nav (Part 11, design-first — see
// docs/design/brief-feature/brief-page-part2-plan.md §2 Part 11). Signed
// off direction: one collapsed corner tab, same on every screen size —
// shows only the current section, expands to a full list on tap. An
// earlier round of this design split mobile/tablet (corner tab) from
// desktop (a vertical rail); the user preferred a single treatment
// everywhere instead (2026-08-26). Deliberately NOT the reference
// artifact's permanent left-rail sidebar: this occupies no layout space
// and isn't visible until interacted with.
export interface NavSection {
  id: string
  num: string
  label: string
}

// Builds only the entries for sections that actually render for this
// viewer — mirrors each section block's own visibility condition in
// BriefView.tsx rather than a fixed list. IDs match the `id` set on each
// section wrapper there.
export function buildNavSections({
  tldr,
  showSections,
  hasQuotes,
  isLoggedIn,
  sortedSections,
  hasRelated,
}: {
  tldr: string
  showSections: boolean
  hasQuotes: boolean
  isLoggedIn: boolean
  sortedSections: BriefSection[]
  hasRelated: boolean
}): NavSection[] {
  return [
    { id: 'section-top', num: '01', label: 'Top' },
    ...(tldr.trim() ? [{ id: 'section-tldr', num: SECTION_META.tldr.num, label: SECTION_META.tldr.label }] : []),
    ...(showSections && hasQuotes ? [{ id: 'section-quotes', num: '03', label: 'Quotes' }] : []),
    ...(showSections
      ? SECTION_ORDER.filter((type) => sortedSections.some((s) => s.section_type === type)).map((type) => ({
          id: `section-${type}`,
          num: SECTION_META[type].num,
          label: SECTION_META[type].label,
        }))
      : []),
    ...(isLoggedIn ? [{ id: 'section-qa', num: '06', label: 'Community Q&A' }] : []),
    ...(showSections ? [{ id: 'section-cta', num: '07', label: 'Calls to Action' }] : []),
    ...(showSections ? [{ id: 'section-coverage', num: '08', label: 'Covered By' }] : []),
    ...(showSections && hasRelated ? [{ id: 'section-related', num: '09', label: 'Related Briefs' }] : []),
  ]
}

export function SectionNav({ sections }: { sections: NavSection[] }) {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? '')
  const [expanded, setExpanded] = useState(false)
  const cornerRef = useRef<HTMLDivElement>(null)

  // Scroll-spy: IntersectionObserver, not a scroll listener (react-best-
  // practices' passive-listener guidance) — rootMargin biases toward a
  // band near the top of the viewport so "active" changes when a section
  // heading crosses into reading position, not merely on first pixel.
  useEffect(() => {
    if (sections.length === 0) return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveId(entry.target.id)
        }
      },
      { rootMargin: '-15% 0px -70% 0px', threshold: 0 },
    )
    const els = sections.map((s) => document.getElementById(s.id)).filter((el): el is HTMLElement => el !== null)
    els.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
    // sections' identity changes only when the set of rendered sections
    // changes (role/login state), not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections.map((s) => s.id).join(',')])

  useEffect(() => {
    if (!expanded) return
    function onClickOutside(e: MouseEvent) {
      if (cornerRef.current && !cornerRef.current.contains(e.target as Node)) setExpanded(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setExpanded(false)
    }
    document.addEventListener('click', onClickOutside)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('click', onClickOutside)
      document.removeEventListener('keydown', onKey)
    }
  }, [expanded])

  if (sections.length === 0) return null

  const active = sections.find((s) => s.id === activeId) ?? sections[0]

  function jump(id: string) {
    document.getElementById(id)?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'start',
    })
    setExpanded(false)
  }

  return (
    <div ref={cornerRef} className="fixed bottom-4 right-4 z-30">
      {expanded && (
        <div className="absolute bottom-[calc(100%+0.5rem)] right-0 max-h-[55vh] w-52 overflow-y-auto border-[1.5px] border-ink bg-paper shadow-lg">
          {sections.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => jump(s.id)}
              style={{ touchAction: 'manipulation' }}
              className={`flex w-full items-baseline gap-2.5 border-b border-line px-3 py-2 text-left last:border-b-0 hover:bg-paper-raised ${s.id === activeId ? 'bg-blue-soft' : ''}`}
            >
              <span className={`font-mono text-[10px] ${s.id === activeId ? 'text-blue-ink' : 'text-ink-faint'}`}>{s.num}</span>
              <span className={`font-display text-[0.8rem] font-bold ${s.id === activeId ? 'text-blue-ink' : 'text-ink'}`}>{s.label}</span>
            </button>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        aria-label="Jump to section"
        style={{ touchAction: 'manipulation' }}
        className="flex items-center gap-2 border-[1.5px] border-ink bg-paper px-3.5 py-2 shadow-lg outline-none focus-visible:ring-2 focus-visible:ring-blue"
      >
        <span className="font-mono text-[11px] font-bold text-blue">{active?.num}</span>
        <span className="font-display text-[0.78rem] font-bold text-ink">{active?.label}</span>
        <span className={`font-mono text-[10px] text-ink-faint transition-transform ${expanded ? 'rotate-180' : ''}`}>▾</span>
      </button>
    </div>
  )
}
