'use client'

import { useEffect, useRef, useState } from 'react'
import { SECTION_ORDER, SECTION_META } from './section-content'
import type { BriefSection } from './page'

// Sticky jump-to-section nav: a horizontal underline-tab bar that sits
// directly under the shared header. It is a <nav> of buttons (not a
// tablist): it jumps within one page and does not switch panels. Layout
// offsets: the shared header is 60px tall on phones (py-2 + 44px target)
// and 68px from md up (py-3); the bar is 44px, so sections use
// scroll-mt-26 (104px) and md:scroll-mt-28 (112px).
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
  const activeRef = useRef<HTMLButtonElement>(null)

  // Scroll-spy: IntersectionObserver, not a scroll listener (react-best-
  // practices' passive-listener guidance) — rootMargin biases toward a
  // band just under the sticky header + nav (about 112px) so "active"
  // changes when a section crosses into reading position.
  useEffect(() => {
    if (sections.length === 0) return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveId(entry.target.id)
        }
      },
      { rootMargin: '-112px 0px -70% 0px', threshold: 0 },
    )
    const els = sections.map((s) => document.getElementById(s.id)).filter((el): el is HTMLElement => el !== null)
    els.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
    // sections' identity changes only when the set of rendered sections
    // changes (role/login state), not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections.map((s) => s.id).join(',')])

  // Keep the active tab visible in the horizontally scrolling row, without
  // moving the page vertically.
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [activeId])

  if (sections.length === 0) return null

  function jump(id: string) {
    setActiveId(id)
    document.getElementById(id)?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'start',
    })
  }

  return (
    <nav aria-label="Sections" className="sticky top-15 z-10 border-b border-rule bg-parchment md:top-17">
      <div className="mx-auto flex max-w-content gap-5 overflow-x-auto whitespace-nowrap px-4 md:px-gutter [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {sections.map((s) => {
          const isActive = s.id === activeId
          return (
            <button
              key={s.id}
              ref={isActive ? activeRef : undefined}
              type="button"
              onClick={() => jump(s.id)}
              aria-current={isActive ? 'true' : undefined}
              style={{ touchAction: 'manipulation' }}
              className={`inline-flex min-h-11 shrink-0 items-center border-b-2 py-2.5 font-ui text-ui-sm focus-ring ${
                isActive ? 'border-umber text-umber' : 'border-transparent text-umber-soft hover:text-umber'
              }`}
            >
              {s.label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
