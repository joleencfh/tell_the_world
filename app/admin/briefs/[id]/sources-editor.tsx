'use client'

// Part 5 step 5 UX follow-up: replaces the raw "•/Publisher:/Summary:"
// plain-text textarea for going_deeper sections with a structured form. The
// underlying storage is unchanged — sources.tsx (public page) and
// brief-actions.ts (save-time Publisher validation) still read a plain-text
// blob following the parse-sources.ts convention, so this editor just
// serializes its structured fields into that same convention on every edit,
// same "initialValue + onChange" pattern RichTextEditor uses for explainer
// subsections (uncontrolled after the first render).

import { useState } from 'react'
import Button from '@/components/ui/Button'
import Field, { Textarea, TextInput } from '@/components/ui/Field'
import { parseSourcesRaw, type SourceItem } from '@/lib/briefs/parse-sources'

interface FormSource {
  clientKey: string
  title: string
  description: string
  publisher: string
  url: string
  summary: string
  takeaways: string[]
}

function itemsFromContent(content: string): FormSource[] {
  return parseSourcesRaw(content).map((item: SourceItem) => ({
    clientKey: crypto.randomUUID(),
    title: item.title,
    description: item.description,
    publisher: item.publisher ?? '',
    url: item.url ?? '',
    summary: item.summary ?? '',
    takeaways: item.takeaways ?? [],
  }))
}

function emptySource(): FormSource {
  return { clientKey: crypto.randomUUID(), title: '', description: '', publisher: '', url: '', summary: '', takeaways: [] }
}

// parse-sources.ts's quoted-title match is `["](.+?)["]` — a literal
// straight quote inside the title would end the match early and truncate
// it, so swap any embedded `"` for a typographic one before wrapping.
function sanitizeTitleForLine(title: string): string {
  return title.replace(/"/g, '”')
}

// Title goes on its own quoted line so the parser's quoted-title match
// never has to disambiguate it from a dash-joined description (see
// buildSourceItem in parse-sources.ts) — description is just the next line.
// An empty title is left unquoted (bare "•") since the parser only matches
// a quoted pair with at least one character inside it.
function serialize(items: FormSource[]): string {
  return items
    .map((item) => {
      const title = sanitizeTitleForLine(item.title.trim())
      const lines = [title ? `• "${title}"` : '•']
      if (item.description.trim()) lines.push(item.description.trim())
      if (item.publisher.trim()) lines.push(`Publisher: ${item.publisher.trim()}`)
      if (item.url.trim()) lines.push(item.url.trim())
      if (item.summary.trim()) lines.push(`Summary: ${item.summary.trim()}`)
      const takeaways = item.takeaways.map((t) => t.trim()).filter(Boolean)
      if (takeaways.length > 0) {
        lines.push('Key takeaways:')
        for (const t of takeaways) lines.push(`- ${t}`)
      }
      return lines.join('\n')
    })
    .join('\n\n')
}

interface Props {
  initialContent: string
  onChange: (content: string) => void
}

export function SourcesFormEditor({ initialContent, onChange }: Props) {
  const [items, setItems] = useState<FormSource[]>(() => itemsFromContent(initialContent))

  function commit(next: FormSource[]) {
    setItems(next)
    onChange(serialize(next))
  }

  function patchItem(key: string, patch: Partial<FormSource>) {
    commit(items.map((it) => (it.clientKey === key ? { ...it, ...patch } : it)))
  }

  function addItem() {
    commit([...items, emptySource()])
  }

  function removeItem(key: string) {
    commit(items.filter((it) => it.clientKey !== key))
  }

  function moveItem(key: string, dir: 'up' | 'down') {
    const idx = items.findIndex((it) => it.clientKey === key)
    if (dir === 'up' && idx <= 0) return
    if (dir === 'down' && (idx === -1 || idx === items.length - 1)) return
    const next = [...items]
    const swap = dir === 'up' ? idx - 1 : idx + 1
    ;[next[idx], next[swap]] = [next[swap], next[idx]]
    commit(next)
  }

  function addTakeaway(key: string) {
    const item = items.find((it) => it.clientKey === key)
    if (!item) return
    patchItem(key, { takeaways: [...item.takeaways, ''] })
  }

  function updateTakeaway(key: string, index: number, value: string) {
    const item = items.find((it) => it.clientKey === key)
    if (!item) return
    patchItem(key, { takeaways: item.takeaways.map((t, i) => (i === index ? value : t)) })
  }

  function removeTakeaway(key: string, index: number) {
    const item = items.find((it) => it.clientKey === key)
    if (!item) return
    patchItem(key, { takeaways: item.takeaways.filter((_, i) => i !== index) })
  }

  return (
    <div className="space-y-3 px-4 py-3">
      {items.length > 0 && items.length < 2 && (
        <p className="font-ui text-caption text-umber-soft">
          Needs at least one more source before this section renders on the public page.
        </p>
      )}

      {items.map((item, i) => (
        <div key={item.clientKey} className="space-y-3 rounded-control border border-window-line bg-vellum p-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-label uppercase tracking-[0.18em] text-umber-soft">
              Source {String(i + 1).padStart(2, '0')}
            </span>
            <div className="flex gap-1">
              <Button
                variant="secondary"
                icon
                onClick={() => moveItem(item.clientKey, 'up')}
                disabled={i === 0}
                title="Move up"
                aria-label="Move up"
              >
                ↑
              </Button>
              <Button
                variant="secondary"
                icon
                onClick={() => moveItem(item.clientKey, 'down')}
                disabled={i === items.length - 1}
                title="Move down"
                aria-label="Move down"
              >
                ↓
              </Button>
              <Button variant="ghost" onClick={() => removeItem(item.clientKey)} title="Remove this source">
                Remove
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Title">
              {(p) => (
                <TextInput
                  {...p}
                  value={item.title}
                  onChange={(e) => patchItem(item.clientKey, { title: e.target.value })}
                  placeholder="e.g. How export controls reshaped the chip market"
                />
              )}
            </Field>
            <Field label="Publisher">
              {(p) => (
                <TextInput
                  {...p}
                  value={item.publisher}
                  onChange={(e) => patchItem(item.clientKey, { publisher: e.target.value })}
                  placeholder="e.g. Financial Times"
                />
              )}
            </Field>
          </div>

          <Field label="Description">
            {(p) => (
              <Textarea
                {...p}
                value={item.description}
                onChange={(e) => patchItem(item.clientKey, { description: e.target.value })}
                rows={2}
                placeholder="A short description of the source, shown on its card."
              />
            )}
          </Field>

          <Field label="URL">
            {(p) => (
              <TextInput
                {...p}
                type="url"
                value={item.url}
                onChange={(e) => patchItem(item.clientKey, { url: e.target.value })}
                placeholder="https://example.com/article"
              />
            )}
          </Field>

          <Field label="Summary">
            {(p) => (
              <Textarea
                {...p}
                value={item.summary}
                onChange={(e) => patchItem(item.clientKey, { summary: e.target.value })}
                rows={3}
                placeholder="A longer summary shown in the source's detail drawer on the public page."
              />
            )}
          </Field>

          <div>
            <p className="mb-1.5 font-ui text-caption font-medium text-umber">Key takeaways</p>
            <div className="space-y-1.5">
              {item.takeaways.map((takeaway, ti) => (
                <div key={ti} className="flex items-center gap-2">
                  <TextInput
                    aria-label={`Key takeaway ${ti + 1}`}
                    value={takeaway}
                    onChange={(e) => updateTakeaway(item.clientKey, ti, e.target.value)}
                    className="min-w-0 flex-1"
                    placeholder="A key point worth pulling out"
                  />
                  <Button
                    variant="ghost"
                    icon
                    onClick={() => removeTakeaway(item.clientKey, ti)}
                    title="Remove this takeaway"
                    aria-label="Remove this takeaway"
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
            <Button variant="ghost" small className="mt-1.5" onClick={() => addTakeaway(item.clientKey)}>
              + Add takeaway
            </Button>
          </div>
        </div>
      ))}

      <Button variant="secondary" fullWidth onClick={addItem}>
        + Add source
      </Button>
    </div>
  )
}
