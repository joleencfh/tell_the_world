import { formatDateOnly } from './helpers'
import type { BriefTimelineEvent } from './page'

// ---------------------------------------------------------------------------
// Timeline graphic — Part 5 step 2. One reusable visual style: a vertical
// rule with a dot per event (same small rounded-full marker convention
// TLDRList's own bullets already use elsewhere on this page), event name +
// date. Rendered by ExplainerSections after the first subsection.
// display_order (not event_date) controls ordering — the admin author
// controls sequence explicitly, same convention as brief_sections/explainer
// subsections.
// ---------------------------------------------------------------------------

export function TimelineGraphic({ events }: { events: BriefTimelineEvent[] }) {
  if (events.length === 0) return null

  const sorted = [...events].sort((a, b) => a.display_order - b.display_order)

  return (
    <div className="max-w-2xl border-y border-line py-6">
      <p className="mb-5 font-mono text-[10px] tracking-[0.2em] uppercase text-blue-ink">Timeline</p>
      <ol className="relative space-y-6 border-l-2 border-line pl-6">
        {sorted.map((event) => (
          <li key={event.id} className="relative">
            <span
              className="absolute top-[0.3rem] h-2.5 w-2.5 rounded-full bg-blue ring-4 ring-paper"
              style={{ left: 'calc(-1.5rem - 5px)' }}
              aria-hidden
            />
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-blue-ink tabular-nums">
              {formatDateOnly(event.event_date)}
            </p>
            <p className="mt-1 font-body text-[0.95rem] leading-snug text-ink">{event.event_name}</p>
          </li>
        ))}
      </ol>
    </div>
  )
}
