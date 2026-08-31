'use client'

// Button-driven sliding tab track for the Highlighted module's Overview /
// Selected Quotes / Covered By subsections (home-dashboard-plan.md §2 Part
// 0 step 6). All panes render on one shared background and slide via
// translateX instead of crossfading or swapping, so the background never
// jumps color mid-transition. Deliberately not built on top of
// components/ui/Carousel.tsx: that component is scroll/drag-driven for a
// variable-length list, this is a fixed, small set of panes driven only by
// clicking a tab — porting the artifact's simpler .spot-viewport/.spot-
// track mechanics directly is a better fit than reusing carousel machinery
// built for a different interaction.
//
// The transition itself (and dropping it under prefers-reduced-motion) is
// pure CSS via the .slide-track class in app/globals.css — the transform
// still applies so reduced-motion users land on the right pane instantly,
// just without the animated slide.
//
// Reference: "Two-Ink Bold Dashboard" artifact, .spot-tabs/.spot-viewport/
// .spot-track/.spot-pane and its tab-click handler.

import { useState, type ReactNode } from 'react'

export interface SlidingTabItem {
  id: string
  label: string
  content: ReactNode
  /** Full override for this tab's active-state classes (border + text
   *  color) — e.g. Highlighted's Quotes/Covered By tabs use blue/pink
   *  instead of the default ink. Defaults to the ink treatment when
   *  omitted. Provide a complete class string, not just a color, since
   *  Tailwind utility precedence isn't source-order-safe when mixed with
   *  the default active classes. */
  activeClassName?: string
}

export interface SlidingTabTrackProps {
  tabs: SlidingTabItem[]
  defaultTabId?: string
}

const DEFAULT_ACTIVE_CLASSES = 'border-b-ink bg-paper text-ink'
const INACTIVE_CLASSES = 'border-b-transparent text-ink-faint hover:text-ink-soft'

export default function SlidingTabTrack({ tabs, defaultTabId }: SlidingTabTrackProps) {
  const [activeId, setActiveId] = useState(defaultTabId ?? tabs[0]?.id)
  const activeIndex = Math.max(
    0,
    tabs.findIndex((tab) => tab.id === activeId)
  )

  return (
    <div>
      <div role="tablist" className="flex border-y border-line">
        {tabs.map((tab) => {
          const active = tab.id === activeId
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveId(tab.id)}
              className={`flex-1 border-b-[3px] px-2.5 py-[13px] text-center font-mono text-[10px] tracking-[0.1em] uppercase transition-colors ${
                active ? (tab.activeClassName ?? DEFAULT_ACTIVE_CLASSES) : INACTIVE_CLASSES
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>
      <div className="overflow-hidden">
        <div className="slide-track flex" style={{ transform: `translateX(-${activeIndex * 100}%)` }}>
          {tabs.map((tab) => (
            <div key={tab.id} className="w-full shrink-0 basis-full">
              {tab.content}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
