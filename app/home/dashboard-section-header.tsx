// Home dashboard's own section header — a lighter sibling to the Brief
// page's numbered SectionHeader (app/briefs/[slug]/section-content.tsx),
// not a variant of it. Deliberately has no numeral: the Brief page's
// sections are read in a fixed narrative order, so 01/02/03 communicates
// something real; dashboard modules are scanned independently, so
// numbering them would imply an order that isn't there (see
// home-dashboard-plan.md §0). Keeps the family resemblance instead — mono
// eyebrow, tone-colored square dot, italic description.
//
// Reference: "Two-Ink Bold Dashboard" artifact, .dash-head/.eyebrow.

import type { ReactNode } from 'react'

export type DashboardTone = 'ink' | 'blue' | 'pink'

const DOT_TONE_CLASSES: Record<DashboardTone, string> = {
  ink: 'bg-ink',
  blue: 'bg-blue',
  pink: 'bg-pink',
}

// Each dash-section's own 4px top-accent border shares the same tone as
// this header's eyebrow dot (artifact: section.dash-section.tone-*) — a
// section's <section> tag pulls its border class from here rather than
// re-deriving the tone-to-color mapping at every call site.
export const DASH_SECTION_BORDER_CLASSES: Record<DashboardTone, string> = {
  ink: 'border-t-ink',
  blue: 'border-t-blue',
  pink: 'border-t-pink',
}

// Shared style for a section's trailing "View all →" / "Browse directory →"
// link (artifact: .dash-head .action) — centralized so the four sections
// that use it don't each redeclare the same mono/uppercase/hover treatment.
export const DASH_ACTION_LINK_CLASSES =
  'shrink-0 whitespace-nowrap font-mono text-[10px] tracking-[0.1em] uppercase text-ink-soft transition-colors hover:text-ink'

export interface DashboardSectionHeaderProps {
  label: string
  tone: DashboardTone
  title: string
  description?: string
  action?: ReactNode
}

export default function DashboardSectionHeader({ label, tone, title, description, action }: DashboardSectionHeaderProps) {
  return (
    <div className="mb-[22px] flex flex-wrap items-end justify-between gap-5">
      <div>
        <div className="mb-1.5 flex items-center gap-[9px] font-mono text-[10px] tracking-[0.16em] uppercase text-ink-faint">
          <span className={`h-2 w-2 shrink-0 ${DOT_TONE_CLASSES[tone]}`} aria-hidden />
          {label}
        </div>
        <h2 className="text-[1.4rem] font-extrabold uppercase tracking-[0.005em]">{title}</h2>
        {description && <p className="mt-1 max-w-[40em] text-[0.88rem] italic text-ink-soft">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
