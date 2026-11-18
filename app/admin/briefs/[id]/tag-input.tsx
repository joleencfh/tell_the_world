'use client'

import { useState } from 'react'

// Topic tags input — mirrors PostModal.tsx's TagInput behavior (Enter/comma
// commits the draft as a chip, Backspace on an empty draft pops the last
// chip) but styled with the shared Field control recipe and Tag-style chips.
export function TagInput({ tags, onChange }: { tags: string[]; onChange: (tags: string[]) => void }) {
  const [draft, setDraft] = useState('')

  function addTag(raw: string) {
    const tag = raw.trim()
    if (tag && !tags.includes(tag)) onChange([...tags, tag])
    setDraft('')
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(draft)
    } else if (e.key === 'Backspace' && draft === '' && tags.length > 0) {
      onChange(tags.slice(0, -1))
    }
  }

  return (
    <div className="flex min-h-11 w-full flex-wrap items-center gap-1.5 rounded-control border border-field-line bg-white px-3 py-1.5 hover:border-umber-soft focus-within:border-umber focus-within:outline-2 focus-within:outline-offset-1 focus-within:outline-umber">
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded-tag border border-window-line px-2 py-0.5 font-mono text-label uppercase text-umber-soft"
        >
          {tag}
          <button
            type="button"
            onClick={() => onChange(tags.filter((t) => t !== tag))}
            className="focus-ring relative inline-flex size-6 items-center justify-center rounded-tag leading-none text-umber-soft hover:text-umber after:absolute after:-inset-2.5 after:content-['']"
            aria-label={`Remove ${tag}`}
          >
            ×
          </button>
        </span>
      ))}
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          if (draft.trim()) addTag(draft)
        }}
        placeholder={tags.length === 0 ? 'e.g. ai-safety, then Enter' : ''}
        className="min-w-[120px] flex-1 bg-transparent py-1 font-ui text-base text-umber placeholder:text-umber-soft focus:outline-none"
      />
    </div>
  )
}
