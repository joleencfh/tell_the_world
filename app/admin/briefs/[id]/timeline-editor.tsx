// Part 5 step 2: admin editor for a brief's timeline events. Pulled into its
// own file (mirrors section-editor.tsx) rather than inlined into
// EditBriefScreen.tsx, which is already sized close to the repo's max-lines
// budget.

export interface EditableTimelineEvent {
  clientKey: string
  event_name: string
  event_date: string
  display_order: number
}

interface Props {
  events: EditableTimelineEvent[]
  onNameChange: (key: string, name: string) => void
  onDateChange: (key: string, date: string) => void
  onMoveUp: (key: string) => void
  onMoveDown: (key: string) => void
  onRemove: (key: string) => void
  onAdd: () => void
}

export function TimelineEditor({ events, onNameChange, onDateChange, onMoveUp, onMoveDown, onRemove, onAdd }: Props) {
  return (
    <div className="space-y-3">
      <div>
        <h2 className="font-mono text-[9px] tracking-[0.18em] uppercase text-ink-soft">Timeline</h2>
        <p className="mt-1 font-body text-xs text-ink-soft/70">
          Renders as a graphic after the Explainer&apos;s first subsection. Order here (not the date) controls
          display order — reorder with the arrows below.
        </p>
      </div>

      {events.map((event, i) => (
        <div key={event.clientKey} className="flex items-center gap-2 border border-line bg-paper-raised px-3 py-2.5">
          <input
            type="date"
            value={event.event_date}
            onChange={(e) => onDateChange(event.clientKey, e.target.value)}
            className="w-40 shrink-0 border border-line bg-paper px-2.5 py-2 font-mono text-xs text-ink focus:outline-none focus:border-ink"
          />
          <input
            type="text"
            value={event.event_name}
            onChange={(e) => onNameChange(event.clientKey, e.target.value)}
            placeholder="e.g. Export controls tightened on advanced chips"
            className="min-w-0 flex-1 border border-line bg-paper px-3 py-2 font-body text-sm text-ink focus:outline-none focus:border-ink"
          />
          <div className="flex shrink-0 gap-1">
            <button
              type="button"
              onClick={() => onMoveUp(event.clientKey)}
              disabled={i === 0}
              title="Move up"
              className="px-2 py-1.5 font-mono text-[10px] border border-line text-ink-soft hover:border-ink hover:text-ink transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
            >
              ↑
            </button>
            <button
              type="button"
              onClick={() => onMoveDown(event.clientKey)}
              disabled={i === events.length - 1}
              title="Move down"
              className="px-2 py-1.5 font-mono text-[10px] border border-line text-ink-soft hover:border-ink hover:text-ink transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
            >
              ↓
            </button>
            <button
              type="button"
              onClick={() => onRemove(event.clientKey)}
              title="Remove this event"
              className="px-2 py-1.5 font-mono text-[10px] border border-line text-ink-soft hover:border-red-600 hover:text-red-600 transition-colors"
            >
              Remove
            </button>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={onAdd}
        className="w-full border border-dashed border-line px-4 py-3 font-mono text-[10px] tracking-[0.18em] uppercase text-ink-soft hover:border-ink hover:text-ink transition-colors"
      >
        + Add timeline event
      </button>
    </div>
  )
}
