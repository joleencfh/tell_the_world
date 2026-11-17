// Part 5 step 2: admin editor for a brief's timeline events. Pulled into its
// own file (mirrors section-editor.tsx) rather than inlined into
// EditBriefScreen.tsx, which is already sized close to the repo's max-lines
// budget.

import Button from '@/components/ui/Button'
import { TextInput } from '@/components/ui/Field'

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
        <h2 className="font-mono text-label uppercase tracking-[0.18em] text-umber-soft">Timeline</h2>
        <p className="mt-1 font-ui text-caption text-umber-soft">
          Renders as a graphic after the Explainer&apos;s first subsection. Order here (not the date) controls
          display order — reorder with the arrows below.
        </p>
      </div>

      {events.map((event, i) => (
        <div key={event.clientKey} className="flex flex-wrap items-center gap-2 rounded-control border border-window-line bg-vellum px-3 py-2.5">
          <TextInput
            type="date"
            aria-label="Event date"
            value={event.event_date}
            onChange={(e) => onDateChange(event.clientKey, e.target.value)}
            className="w-44 shrink-0"
          />
          <TextInput
            type="text"
            aria-label="Event name"
            value={event.event_name}
            onChange={(e) => onNameChange(event.clientKey, e.target.value)}
            placeholder="e.g. Export controls tightened on advanced chips"
            className="min-w-0 flex-1"
          />
          <div className="flex shrink-0 gap-1">
            <Button
              variant="secondary"
              icon
              onClick={() => onMoveUp(event.clientKey)}
              disabled={i === 0}
              title="Move up"
              aria-label="Move up"
            >
              ↑
            </Button>
            <Button
              variant="secondary"
              icon
              onClick={() => onMoveDown(event.clientKey)}
              disabled={i === events.length - 1}
              title="Move down"
              aria-label="Move down"
            >
              ↓
            </Button>
            <Button variant="ghost" onClick={() => onRemove(event.clientKey)} title="Remove this event">
              Remove
            </Button>
          </div>
        </div>
      ))}

      <Button variant="secondary" fullWidth onClick={onAdd}>
        + Add timeline event
      </Button>
    </div>
  )
}
