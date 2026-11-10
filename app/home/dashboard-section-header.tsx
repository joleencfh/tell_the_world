// Home dashboard's own section header: a mono eyebrow with a tone dot, a
// serif section title and an optional description. No numeral: dashboard
// modules are scanned independently, so numbering them would imply an order
// that is not there. Tones are graphic only (a dot): neutral, cobalt for the
// experts and organisations side, rose for the creators and journalists side.

import type { ReactNode } from 'react'

export type DashboardTone = 'neutral' | 'cobalt' | 'rose'

const DOT_TONE_CLASSES: Record<DashboardTone, string> = {
  neutral: 'bg-umber-soft',
  cobalt: 'bg-cobalt-bright',
  rose: 'bg-rose-bright',
}

// Sections are separated by a hairline and space, not boxes or coloured
// rules (design-system.md 2.3). Kept per tone so a section's <section> tag
// pulls its border from one place.
export const DASH_SECTION_BORDER_CLASSES: Record<DashboardTone, string> = {
  neutral: 'border-t border-rule',
  cobalt: 'border-t border-rule',
  rose: 'border-t border-rule',
}

// Shared style for a section's trailing "View all →" / "Browse directory →"
// link: an underlined text link with a 44px target.
export const DASH_ACTION_LINK_CLASSES =
  'inline-flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-control font-ui text-ui-sm text-umber-soft underline decoration-umber-soft/40 underline-offset-[5px] hover:text-umber hover:decoration-umber focus-ring'

export interface DashboardSectionHeaderProps {
  label: string
  tone: DashboardTone
  title: string
  description?: string
  action?: ReactNode
}

export default function DashboardSectionHeader({ label, tone, title, description, action }: DashboardSectionHeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-x-5 gap-y-2">
      <div>
        <div className="mb-1.5 flex items-center gap-2 font-mono text-label uppercase text-umber-soft">
          <span className={`size-2 shrink-0 rounded-full ${DOT_TONE_CLASSES[tone]}`} aria-hidden />
          {label}
        </div>
        <h2 className="font-serif text-section text-umber">{title}</h2>
        {description && <p className="mt-1 max-w-[40em] font-ui text-ui-sm text-umber-soft">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
