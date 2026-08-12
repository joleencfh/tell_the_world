'use client'

import { useState, useCallback, type ReactNode } from 'react'
import Link from 'next/link'
import { saveBrief, deleteBrief } from '@/lib/admin/brief-actions'
import type { Brief, BriefSection, MediaPickerOption } from '@/lib/admin/brief-actions'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SECTION_LABELS: Record<BriefSection['section_type'], string> = {
  tldr:                 'TL;DR',
  use_this:             'Use This',
  featured_news:        'Featured News',
  explainer:            'Explainer',
  where_experts_stand:  'Where Experts Stand',
  going_deeper:         'Going Deeper',
  faq:                  'FAQ',
}

// Every section is authored as plain text in a convention the public brief
// page's parsers understand (parseFAQ/parseSources/ParagraphContent in
// app/briefs/[slug]/section-content.tsx and sources.tsx) — there is no rich
// HTML rendering path on the public page, so the editor must not produce HTML.
const PARAGRAPH_HELP: { instructions: ReactNode; placeholder: string; rows: number } = {
  instructions: 'Plain paragraphs, separated by a blank line.',
  placeholder: 'First paragraph goes here.\n\nA second paragraph goes here.',
  rows: 8,
}

const SECTION_HELP: Record<BriefSection['section_type'], { instructions: ReactNode; placeholder: string; rows: number }> = {
  tldr: {
    instructions: (
      <>
        One bullet per line, 3–5 lines. Optionally start a line with{' '}
        <strong className="text-dark">**a bold lead term**</strong> followed by an em dash — e.g.{' '}
        <code className="font-mono text-[11px]">**Compute race** — governments vs. governments, companies vs. companies.</code>
      </>
    ),
    placeholder: '**Compute race** — governments vs. governments, companies vs. companies.\nA second bullet line goes here.',
    rows: 6,
  },
  faq: {
    instructions: (
      <>
        One question per block: a line starting with <code className="font-mono text-[11px]">Q:</code>, then a line
        starting with <code className="font-mono text-[11px]">A:</code>. Separate blocks with a blank line.
      </>
    ),
    placeholder: 'Q: What is the compute race?\nA: It is the competition to build ever-larger models.\n\nQ: Why does this matter?\nA: Because compute access increasingly determines who leads.',
    rows: 10,
  },
  going_deeper: {
    instructions: (
      <>
        One source per block, starting with a line beginning{' '}
        <code className="font-mono text-[11px]">•</code>. Optionally followed by a URL line, a{' '}
        <code className="font-mono text-[11px]">Summary:</code> line, and a{' '}
        <code className="font-mono text-[11px]">Key takeaways:</code> line with{' '}
        <code className="font-mono text-[11px]">- </code> bullets below it. Separate sources with a blank line —
        needs at least 2 sources to render.
      </>
    ),
    placeholder:
      '• "Quoted title" — a short description of the source\nhttps://example.com/article\nSummary: A longer summary of the source.\nKey takeaways:\n- First takeaway\n- Second takeaway\n\n• Another source — description',
    rows: 12,
  },
  use_this: PARAGRAPH_HELP,
  featured_news: PARAGRAPH_HELP,
  explainer: PARAGRAPH_HELP,
  where_experts_stand: PARAGRAPH_HELP,
}

// ---------------------------------------------------------------------------
// Section editor
// ---------------------------------------------------------------------------

interface SectionEditorProps {
  section: BriefSection
  isFirst: boolean
  isLast: boolean
  onContentChange: (id: string, content: string) => void
  onMoveUp: (id: string) => void
  onMoveDown: (id: string) => void
}

function SectionEditor({ section, isFirst, isLast, onContentChange, onMoveUp, onMoveDown }: SectionEditorProps) {
  const help = SECTION_HELP[section.section_type]

  return (
    <div className="border border-edge bg-card">
      <div className="flex items-center justify-between px-4 py-3 border-b border-edge">
        <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-dark">
          {SECTION_LABELS[section.section_type]}
        </span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => onMoveUp(section.id)}
            disabled={isFirst}
            title="Move up"
            className="px-2 py-1 font-mono text-[10px] border border-edge text-soft hover:border-text hover:text-text transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={() => onMoveDown(section.id)}
            disabled={isLast}
            title="Move down"
            className="px-2 py-1 font-mono text-[10px] border border-edge text-soft hover:border-text hover:text-text transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
          >
            ↓
          </button>
        </div>
      </div>

      <div className="px-4 py-3 border-b border-edge bg-base/60">
        <p className="font-serif text-xs text-soft leading-relaxed">{help.instructions}</p>
      </div>

      <textarea
        value={section.content}
        onChange={(e) => onContentChange(section.id, e.target.value)}
        rows={help.rows}
        className="w-full px-3 py-3 font-mono text-sm text-text leading-relaxed focus:outline-none resize-y"
        placeholder={help.placeholder}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

interface Props {
  adminEmail: string
  brief: Brief
  sections: BriefSection[]
  mediaOptions: MediaPickerOption[]
}

export default function EditBriefScreen({ adminEmail, brief, sections: initialSections, mediaOptions }: Props) {
  const [title, setTitle]           = useState(brief.title)
  const [subtitle, setSubtitle]     = useState(brief.subtitle ?? '')
  const [topicTag, setTopicTag]     = useState(brief.topic_tag ?? '')
  const [pinnedMediaPostId, setPinnedMediaPostId] = useState(brief.pinned_media_post_id ?? '')
  const [visibility, setVisibility] = useState<Brief['visibility']>(brief.visibility)
  const [sections, setSections]     = useState<BriefSection[]>(
    [...initialSections].sort((a, b) => a.display_order - b.display_order)
  )
  const [saving, setSaving]         = useState(false)
  const [saveError, setSaveError]   = useState<string | null>(null)
  const [saved, setSaved]           = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting]     = useState(false)

  const handleContentChange = useCallback((id: string, content: string) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, content } : s))
  }, [])

  function moveSection(id: string, dir: 'up' | 'down') {
    setSections(prev => {
      const idx = prev.findIndex(s => s.id === id)
      if (dir === 'up' && idx === 0) return prev
      if (dir === 'down' && idx === prev.length - 1) return prev
      const next = [...prev]
      const swap = dir === 'up' ? idx - 1 : idx + 1
      ;[next[idx], next[swap]] = [next[swap], next[idx]]
      return next.map((s, i) => ({ ...s, display_order: i + 1 }))
    })
  }

  async function handleSave() {
    setSaving(true)
    setSaveError(null)
    setSaved(false)

    const result = await saveBrief(brief.id, {
      title,
      subtitle,
      topicTag,
      pinnedMediaPostId: pinnedMediaPostId || null,
      visibility,
      sections: sections.map(s => ({ id: s.id, content: s.content, display_order: s.display_order })),
    })

    setSaving(false)
    if (result.error) {
      setSaveError(result.error)
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    await deleteBrief(brief.id)
    // redirect() in the server action takes over — no need to clear state
  }

  return (
    <div className="min-h-screen bg-base text-text">

      {/* Header */}
      <header className="border-b border-edge px-6">
        <div className="mx-auto flex max-w-4xl items-center justify-between py-4">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="font-serif text-base font-bold tracking-tight text-dark hover:text-live transition-colors">
              Tell <em className="italic text-live">The</em> World
            </Link>
            <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-soft border border-edge px-2 py-0.5">
              Admin
            </span>
            <span className="font-mono text-[9px] text-soft hidden sm:block">/ Edit Brief</span>
          </div>
          <span className="font-mono text-[9px] text-soft hidden sm:block">{adminEmail}</span>
        </div>
      </header>

      <main className="px-6 py-10">
        <div className="mx-auto max-w-4xl space-y-8">

          {/* Page title + back link */}
          <div className="flex items-center justify-between">
            <div>
              <Link
                href="/admin"
                className="font-mono text-[9px] tracking-[0.18em] uppercase text-soft hover:text-text transition-colors"
              >
                ← Back to admin
              </Link>
              <h1 className="font-display uppercase text-[2rem] tracking-tight text-dark leading-none mt-1">
                Edit Brief
              </h1>
            </div>

            {/* Save / status */}
            <div className="flex items-center gap-3">
              {saveError && (
                <p className="font-mono text-[10px] text-red-600">{saveError}</p>
              )}
              {saved && (
                <p className="font-mono text-[10px] text-green-700">Saved.</p>
              )}
              <button
                onClick={handleSave}
                disabled={saving}
                className="font-mono text-[10px] tracking-[0.18em] uppercase px-5 py-2.5 bg-dark text-white hover:bg-text transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <label className="font-mono text-[9px] tracking-[0.18em] uppercase text-soft">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full border border-edge bg-card px-4 py-3 font-serif text-lg text-dark focus:outline-none focus:border-text"
              placeholder="Brief title"
            />
          </div>

          {/* Subtitle */}
          <div className="space-y-1.5">
            <label className="font-mono text-[9px] tracking-[0.18em] uppercase text-soft">
              Subtitle
            </label>
            <input
              type="text"
              value={subtitle}
              onChange={e => setSubtitle(e.target.value)}
              className="w-full border border-edge bg-card px-4 py-3 font-serif text-sm text-dark focus:outline-none focus:border-text"
              placeholder="One sentence, allowed a point of view"
            />
          </div>

          {/* Topic tag + pinned media (drive the auto Quotes/Media sections) */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="font-mono text-[9px] tracking-[0.18em] uppercase text-soft">
                Topic tag
              </label>
              <input
                type="text"
                value={topicTag}
                onChange={e => setTopicTag(e.target.value)}
                className="w-full border border-edge bg-card px-4 py-3 font-mono text-sm text-dark focus:outline-none focus:border-text"
                placeholder="e.g. ai-safety"
              />
              <p className="font-serif text-xs text-soft/70">
                Drives the auto Quotes and Media sections — must match the tag used on content_posts.
              </p>
            </div>
            <div className="space-y-1.5">
              <label className="font-mono text-[9px] tracking-[0.18em] uppercase text-soft">
                Pinned media (&quot;Start here&quot;)
              </label>
              <select
                value={pinnedMediaPostId}
                onChange={e => setPinnedMediaPostId(e.target.value)}
                className="w-full border border-edge bg-card px-4 py-3 font-serif text-sm text-dark focus:outline-none focus:border-text"
              >
                <option value="">None</option>
                {mediaOptions.map(option => (
                  <option key={option.id} value={option.id}>
                    [{option.post_type}] {option.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Visibility */}
          <div className="space-y-1.5">
            <span className="font-mono text-[9px] tracking-[0.18em] uppercase text-soft">
              Visibility
            </span>
            <div className="flex gap-0">
              <button
                type="button"
                onClick={() => setVisibility('members_only')}
                className={[
                  'px-5 py-2.5 font-mono text-[10px] tracking-[0.18em] uppercase border transition-colors',
                  visibility === 'members_only'
                    ? 'border-dark bg-dark text-white'
                    : 'border-edge text-soft hover:border-text hover:text-text',
                ].join(' ')}
              >
                Members only
              </button>
              <button
                type="button"
                onClick={() => setVisibility('public')}
                className={[
                  'px-5 py-2.5 font-mono text-[10px] tracking-[0.18em] uppercase border border-l-0 transition-colors',
                  visibility === 'public'
                    ? 'border-dark bg-dark text-white'
                    : 'border-edge text-soft hover:border-text hover:text-text',
                ].join(' ')}
              >
                Public
              </button>
            </div>
          </div>

          {/* Sections */}
          <div className="space-y-3">
            <h2 className="font-mono text-[9px] tracking-[0.18em] uppercase text-soft">Sections</h2>
            {sections.map((section, i) => {
              return (
                <SectionEditor
                  key={section.id}
                  section={section}
                  isFirst={i === 0}
                  isLast={i === sections.length - 1}
                  onContentChange={handleContentChange}
                  onMoveUp={(id) => moveSection(id, 'up')}
                  onMoveDown={(id) => moveSection(id, 'down')}
                />
              )
            })}
          </div>

          {/* Bottom save */}
          <div className="flex items-center justify-between pt-2 border-t border-edge">
            <div>
              {!confirmDelete ? (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="font-mono text-[10px] tracking-[0.18em] uppercase text-soft hover:text-red-600 transition-colors"
                >
                  Delete brief
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="font-serif text-sm text-dark">Delete this brief permanently?</span>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="font-mono text-[10px] tracking-[0.18em] uppercase px-4 py-2 bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-40"
                  >
                    {deleting ? 'Deleting…' : 'Yes, delete'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="font-mono text-[10px] tracking-[0.18em] uppercase px-4 py-2 border border-edge text-soft hover:border-text hover:text-text transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              {saveError && (
                <p className="font-mono text-[10px] text-red-600">{saveError}</p>
              )}
              {saved && (
                <p className="font-mono text-[10px] text-green-700">Saved.</p>
              )}
              <button
                onClick={handleSave}
                disabled={saving}
                className="font-mono text-[10px] tracking-[0.18em] uppercase px-5 py-2.5 bg-dark text-white hover:bg-text transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}
