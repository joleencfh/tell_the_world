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
        <p className="font-body text-xs text-ink-soft/70">
          Needs at least one more source before this section renders on the public page.
        </p>
      )}

      {items.map((item, i) => (
        <div key={item.clientKey} className="space-y-3 border border-line bg-paper p-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] tracking-[0.18em] uppercase text-ink-soft">
              Source {String(i + 1).padStart(2, '0')}
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => moveItem(item.clientKey, 'up')}
                disabled={i === 0}
                title="Move up"
                className="px-2 py-1 font-mono text-[10px] border border-line text-ink-soft hover:border-ink hover:text-ink transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => moveItem(item.clientKey, 'down')}
                disabled={i === items.length - 1}
                title="Move down"
                className="px-2 py-1 font-mono text-[10px] border border-line text-ink-soft hover:border-ink hover:text-ink transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => removeItem(item.clientKey)}
                title="Remove this source"
                className="px-2 py-1 font-mono text-[10px] border border-line text-ink-soft hover:border-red-600 hover:text-red-600 transition-colors"
              >
                Remove
              </button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block font-mono text-[9px] tracking-[0.18em] uppercase text-ink-soft">
                Title
              </label>
              <input
                type="text"
                value={item.title}
                onChange={(e) => patchItem(item.clientKey, { title: e.target.value })}
                className="w-full border border-line bg-paper-raised px-3 py-2 font-body text-sm text-ink focus:outline-none focus:border-ink"
                placeholder="e.g. How export controls reshaped the chip market"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block font-mono text-[9px] tracking-[0.18em] uppercase text-ink-soft">
                Publisher <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={item.publisher}
                onChange={(e) => patchItem(item.clientKey, { publisher: e.target.value })}
                className="w-full border border-line bg-paper-raised px-3 py-2 font-body text-sm text-ink focus:outline-none focus:border-ink"
                placeholder="e.g. Financial Times"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block font-mono text-[9px] tracking-[0.18em] uppercase text-ink-soft">
              Description
            </label>
            <textarea
              value={item.description}
              onChange={(e) => patchItem(item.clientKey, { description: e.target.value })}
              rows={2}
              className="w-full border border-line bg-paper-raised px-3 py-2 font-body text-sm text-ink leading-relaxed focus:outline-none focus:border-ink resize-y"
              placeholder="A short description of the source, shown on its card."
            />
          </div>

          <div className="space-y-1.5">
            <label className="block font-mono text-[9px] tracking-[0.18em] uppercase text-ink-soft">
              URL
            </label>
            <input
              type="url"
              value={item.url}
              onChange={(e) => patchItem(item.clientKey, { url: e.target.value })}
              className="w-full border border-line bg-paper-raised px-3 py-2 font-mono text-sm text-ink focus:outline-none focus:border-ink"
              placeholder="https://example.com/article"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block font-mono text-[9px] tracking-[0.18em] uppercase text-ink-soft">
              Summary
            </label>
            <textarea
              value={item.summary}
              onChange={(e) => patchItem(item.clientKey, { summary: e.target.value })}
              rows={3}
              className="w-full border border-line bg-paper-raised px-3 py-2 font-body text-sm text-ink leading-relaxed focus:outline-none focus:border-ink resize-y"
              placeholder="A longer summary shown in the source's detail drawer on the public page."
            />
          </div>

          <div className="space-y-1.5">
            <label className="block font-mono text-[9px] tracking-[0.18em] uppercase text-ink-soft">
              Key takeaways
            </label>
            <div className="space-y-1.5">
              {item.takeaways.map((takeaway, ti) => (
                <div key={ti} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={takeaway}
                    onChange={(e) => updateTakeaway(item.clientKey, ti, e.target.value)}
                    className="min-w-0 flex-1 border border-line bg-paper-raised px-3 py-2 font-body text-sm text-ink focus:outline-none focus:border-ink"
                    placeholder="A key point worth pulling out"
                  />
                  <button
                    type="button"
                    onClick={() => removeTakeaway(item.clientKey, ti)}
                    title="Remove this takeaway"
                    className="shrink-0 px-2 py-2 font-mono text-[10px] border border-line text-ink-soft hover:border-red-600 hover:text-red-600 transition-colors"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => addTakeaway(item.clientKey)}
              className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink-soft hover:text-ink transition-colors"
            >
              + Add takeaway
            </button>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addItem}
        className="w-full border border-dashed border-line px-4 py-3 font-mono text-[10px] tracking-[0.18em] uppercase text-ink-soft hover:border-ink hover:text-ink transition-colors"
      >
        + Add source
      </button>
    </div>
  )
}
