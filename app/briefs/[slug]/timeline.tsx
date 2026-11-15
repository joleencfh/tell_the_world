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
    <div className="max-w-2xl border-y border-rule py-6">
      <p className="mb-5 font-mono text-label uppercase text-umber-soft">Timeline</p>
      <ol className="relative space-y-6 border-l border-rule pl-6">
        {sorted.map((event) => (
          <li key={event.id} className="relative">
            <span
              className="absolute top-[0.3rem] h-2.5 w-2.5 rounded-full bg-umber ring-4 ring-parchment"
              style={{ left: 'calc(-1.5rem - 5px)' }}
              aria-hidden
            />
            <p className="font-mono text-label tabular-nums text-umber-soft">
              {formatDateOnly(event.event_date)}
            </p>
            <p className="mt-1 font-ui text-ui-sm text-umber">{event.event_name}</p>
          </li>
        ))}
      </ol>
    </div>
  )
}
