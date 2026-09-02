'use client'

import { useState } from 'react'

// Topic tags input — mirrors PostModal.tsx's TagInput behavior (Enter/comma
// commits the draft as a chip, Backspace on an empty draft pops the last
// chip) but styled to this screen's mono/border-line admin look rather than
// PostModal's rounded-pill one.
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
    <div className="w-full border border-line bg-paper-raised px-3 py-2 flex flex-wrap items-center gap-1.5 focus-within:border-ink">
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 border border-line px-2 py-0.5 font-mono text-xs text-ink"
        >
          {tag}
          <button
            type="button"
            onClick={() => onChange(tags.filter((t) => t !== tag))}
            className="text-ink-soft hover:text-ink leading-none"
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
        className="flex-1 min-w-[120px] bg-transparent font-mono text-sm text-ink focus:outline-none py-1"
      />
    </div>
  )
}
