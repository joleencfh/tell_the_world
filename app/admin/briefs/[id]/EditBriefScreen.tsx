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
  going_deeper:         'Sources',
  faq:                  'FAQ',
}

// Client-side section state. `id` is null for a subsection added in this
// session and not yet saved — saveBrief (lib/admin/brief-actions.ts) treats
// a null id as an insert. `clientKey` is the stable React key / handler
// identity independent of `id`, since `id` doesn't exist yet for new rows;
// it's the row's real id for anything loaded from the DB, or a generated
// placeholder for a new row, and gets reconciled to the real id once
// saveBrief returns the persisted rows.
type EditableSection = Omit<BriefSection, 'id'> & { id: string | null; clientKey: string }

// Every section is authored as plain text in a convention the public brief
// page's parsers understand (parseFAQ/parseSources/ParagraphContent in
// app/briefs/[slug]/section-content.tsx and sources.tsx, the keyterm/
// paragraph parsing in app/briefs/[slug]/explainer.tsx) — there is no rich
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
        <strong className="text-ink">**a bold lead term**</strong> followed by an em dash — e.g.{' '}
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
        {' '}
        <strong className="text-ink">Renaming a question detaches its expert answers</strong> — additional expert
        answers are matched against the question&apos;s exact wording, so editing it here orphans anything already
        submitted under the old text.
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
        needs at least 2 sources to render. Renders folded into the Explainer section&apos;s Sources block on the
        public page.
      </>
    ),
    placeholder:
      '• "Quoted title" — a short description of the source\nhttps://example.com/article\nSummary: A longer summary of the source.\nKey takeaways:\n- First takeaway\n- Second takeaway\n\n• Another source — description',
    rows: 12,
  },
  explainer: {
    instructions: (
      <>
        Plain paragraphs, separated by a blank line. Mark a key term inline with{' '}
        <code className="font-mono text-[11px]">{'{{term|definition}}'}</code> to get a hover/focus tooltip on the
        public page — e.g.{' '}
        <code className="font-mono text-[11px]">{'{{alignment|making an AI system pursue what its designers actually intend}}'}</code>.
      </>
    ),
    placeholder:
      'The first paragraph of this subsection goes here, optionally with a {{keyterm|its definition}} inline.\n\nA second paragraph goes here.',
    rows: 8,
  },
  use_this: PARAGRAPH_HELP,
  featured_news: PARAGRAPH_HELP,
  where_experts_stand: PARAGRAPH_HELP,
}

// ---------------------------------------------------------------------------
// Section editor
// ---------------------------------------------------------------------------

interface SectionEditorProps {
  section: EditableSection
  isFirst: boolean
  isLast: boolean
  onContentChange: (key: string, content: string) => void
  onMoveUp: (key: string) => void
  onMoveDown: (key: string) => void
  // Only meaningful for explainer subsections (Part 3) — the only type this
  // editor lets the author title or remove.
  onTitleChange?: (key: string, title: string) => void
  onRemove?: (key: string) => void
}

function SectionEditor({ section, isFirst, isLast, onContentChange, onMoveUp, onMoveDown, onTitleChange, onRemove }: SectionEditorProps) {
  const isExplainer = section.section_type === 'explainer'
  const help = SECTION_HELP[section.section_type]

  return (
    <div className="border border-line bg-paper-raised">
      {/* Section header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-line">
        <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink">
          {SECTION_LABELS[section.section_type]}
        </span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => onMoveUp(section.clientKey)}
            disabled={isFirst}
            title="Move up"
            className="px-2 py-1 font-mono text-[10px] border border-line text-ink-soft hover:border-ink hover:text-ink transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={() => onMoveDown(section.clientKey)}
            disabled={isLast}
            title="Move down"
            className="px-2 py-1 font-mono text-[10px] border border-line text-ink-soft hover:border-ink hover:text-ink transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
          >
            ↓
          </button>
          {isExplainer && onRemove && (
            <button
              type="button"
              onClick={() => onRemove(section.clientKey)}
              title="Remove this subsection"
              className="px-2 py-1 font-mono text-[10px] border border-line text-ink-soft hover:border-red-600 hover:text-red-600 transition-colors"
            >
              Remove
            </button>
          )}
        </div>
      </div>

      {/* Subsection title — Explainer only (Part 3): multiple explainer rows
          per brief are rendered as titled subsections on the public page. */}
      {isExplainer && onTitleChange && (
        <div className="px-4 py-3 border-b border-line bg-paper/60">
          <label className="block font-mono text-[9px] tracking-[0.18em] uppercase text-ink-soft mb-1.5">
            Subsection title (optional)
          </label>
          <input
            type="text"
            value={section.title ?? ''}
            onChange={(e) => onTitleChange(section.clientKey, e.target.value)}
            className="w-full border border-line bg-paper-raised px-3 py-2 font-body text-sm text-ink focus:outline-none focus:border-ink"
            placeholder="e.g. How the training process works"
          />
        </div>
      )}

      <div className="px-4 py-3 border-b border-line bg-paper/60">
        <p className="font-body text-xs text-ink-soft leading-relaxed">{help.instructions}</p>
      </div>

      <textarea
        value={section.content}
        onChange={(e) => onContentChange(section.clientKey, e.target.value)}
        rows={help.rows}
        className="w-full px-3 py-3 font-mono text-sm text-ink leading-relaxed focus:outline-none resize-y"
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
  const [sections, setSections]     = useState<EditableSection[]>(
    [...initialSections]
      .sort((a, b) => a.display_order - b.display_order)
      .map(s => ({ ...s, clientKey: s.id }))
  )
  const [saving, setSaving]         = useState(false)
  const [saveError, setSaveError]   = useState<string | null>(null)
  const [saved, setSaved]           = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting]     = useState(false)

  const handleContentChange = useCallback((key: string, content: string) => {
    setSections(prev => prev.map(s => s.clientKey === key ? { ...s, content } : s))
  }, [])

  const handleTitleChange = useCallback((key: string, title: string) => {
    setSections(prev => prev.map(s => s.clientKey === key ? { ...s, title } : s))
  }, [])

  function moveSection(key: string, dir: 'up' | 'down') {
    setSections(prev => {
      const idx = prev.findIndex(s => s.clientKey === key)
      if (dir === 'up' && idx === 0) return prev
      if (dir === 'down' && idx === prev.length - 1) return prev
      const next = [...prev]
      const swap = dir === 'up' ? idx - 1 : idx + 1
      ;[next[idx], next[swap]] = [next[swap], next[idx]]
      return next.map((s, i) => ({ ...s, display_order: i + 1 }))
    })
  }

  // "Add explainer subsection" (Part 3) — appended at the end; the author
  // uses the existing move-up control to place it where it belongs, same as
  // every other section-ordering interaction in this screen.
  function addExplainerSection() {
    setSections(prev => [
      ...prev,
      {
        clientKey: crypto.randomUUID(),
        id: null,
        brief_id: brief.id,
        section_type: 'explainer',
        title: '',
        content: '',
        display_order: prev.length + 1,
      },
    ])
  }

  function removeSection(key: string) {
    setSections(prev =>
      prev.filter(s => s.clientKey !== key).map((s, i) => ({ ...s, display_order: i + 1 })),
    )
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
      sections: sections.map(s => ({
        id: s.id,
        section_type: s.section_type,
        title: s.title,
        content: s.content,
        display_order: s.display_order,
      })),
    })

    setSaving(false)
    if (result.error) {
      setSaveError(result.error)
    } else {
      // Reconcile client state with the persisted rows — newly-added
      // subsections had no real id until now (saveBrief inserted them and
      // returned the fresh set with ids assigned).
      if (result.sections) {
        setSections(
          [...result.sections]
            .sort((a, b) => a.display_order - b.display_order)
            .map(s => ({ ...s, clientKey: s.id })),
        )
      }
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
    <div className="min-h-screen bg-paper text-ink">

      {/* Header */}
      <header className="border-b border-line px-6">
        <div className="mx-auto flex max-w-4xl items-center justify-between py-4">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="font-body text-base font-bold tracking-tight text-ink hover:opacity-80 transition-opacity">
              Tell <em className="italic">The</em> World
            </Link>
            <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-ink-soft border border-line px-2 py-0.5">
              Admin
            </span>
            <span className="font-mono text-[9px] text-ink-soft hidden sm:block">/ Edit Brief</span>
          </div>
          <span className="font-mono text-[9px] text-ink-soft hidden sm:block">{adminEmail}</span>
        </div>
      </header>

      <main className="px-6 py-10">
        <div className="mx-auto max-w-4xl space-y-8">

          {/* Page title + back link */}
          <div className="flex items-center justify-between">
            <div>
              <Link
                href="/admin"
                className="font-mono text-[9px] tracking-[0.18em] uppercase text-ink-soft hover:text-ink transition-colors"
              >
                ← Back to admin
              </Link>
              <h1 className="font-display uppercase text-[2rem] tracking-tight text-ink leading-none mt-1">
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
                className="font-mono text-[10px] tracking-[0.18em] uppercase px-5 py-2.5 bg-ink text-paper hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <label className="font-mono text-[9px] tracking-[0.18em] uppercase text-ink-soft">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full border border-line bg-paper-raised px-4 py-3 font-body text-lg text-ink focus:outline-none focus:border-ink"
              placeholder="Brief title"
            />
          </div>

          {/* Subtitle */}
          <div className="space-y-1.5">
            <label className="font-mono text-[9px] tracking-[0.18em] uppercase text-ink-soft">
              Subtitle
            </label>
            <input
              type="text"
              value={subtitle}
              onChange={e => setSubtitle(e.target.value)}
              className="w-full border border-line bg-paper-raised px-4 py-3 font-body text-sm text-ink focus:outline-none focus:border-ink"
              placeholder="One sentence, allowed a point of view"
            />
          </div>

          {/* Topic tag + pinned media (drive the auto Quotes/Media sections) */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="font-mono text-[9px] tracking-[0.18em] uppercase text-ink-soft">
                Topic tag
              </label>
              <input
                type="text"
                value={topicTag}
                onChange={e => setTopicTag(e.target.value)}
                className="w-full border border-line bg-paper-raised px-4 py-3 font-mono text-sm text-ink focus:outline-none focus:border-ink"
                placeholder="e.g. ai-safety"
              />
              <p className="font-body text-xs text-ink-soft/70">
                Drives the auto Quotes and Media sections — must match the tag used on content_posts.
              </p>
            </div>
            <div className="space-y-1.5">
              <label className="font-mono text-[9px] tracking-[0.18em] uppercase text-ink-soft">
                Pinned media (&quot;Start here&quot;)
              </label>
              <select
                value={pinnedMediaPostId}
                onChange={e => setPinnedMediaPostId(e.target.value)}
                className="w-full border border-line bg-paper-raised px-4 py-3 font-body text-sm text-ink focus:outline-none focus:border-ink"
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
            <span className="font-mono text-[9px] tracking-[0.18em] uppercase text-ink-soft">
              Visibility
            </span>
            <div className="flex gap-0">
              <button
                type="button"
                onClick={() => setVisibility('members_only')}
                className={[
                  'px-5 py-2.5 font-mono text-[10px] tracking-[0.18em] uppercase border transition-colors',
                  visibility === 'members_only'
                    ? 'border-ink bg-ink text-paper'
                    : 'border-line text-ink-soft hover:border-ink hover:text-ink',
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
                    ? 'border-ink bg-ink text-paper'
                    : 'border-line text-ink-soft hover:border-ink hover:text-ink',
                ].join(' ')}
              >
                Public
              </button>
            </div>
          </div>

          {/* Sections */}
          <div className="space-y-3">
            <h2 className="font-mono text-[9px] tracking-[0.18em] uppercase text-ink-soft">Sections</h2>
            {sections.map((section, i) => {
              return (
                <SectionEditor
                  key={section.clientKey}
                  section={section}
                  isFirst={i === 0}
                  isLast={i === sections.length - 1}
                  onContentChange={handleContentChange}
                  onMoveUp={(key) => moveSection(key, 'up')}
                  onMoveDown={(key) => moveSection(key, 'down')}
                  onTitleChange={handleTitleChange}
                  onRemove={removeSection}
                />
              )
            })}
            <button
              type="button"
              onClick={addExplainerSection}
              className="w-full border border-dashed border-line px-4 py-3 font-mono text-[10px] tracking-[0.18em] uppercase text-ink-soft hover:border-ink hover:text-ink transition-colors"
            >
              + Add explainer subsection
            </button>
          </div>

          {/* Bottom save */}
          <div className="flex items-center justify-between pt-2 border-t border-line">
            <div>
              {!confirmDelete ? (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink-soft hover:text-red-600 transition-colors"
                >
                  Delete brief
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="font-body text-sm text-ink">Delete this brief permanently?</span>
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
                    className="font-mono text-[10px] tracking-[0.18em] uppercase px-4 py-2 border border-line text-ink-soft hover:border-ink hover:text-ink transition-colors"
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
                className="font-mono text-[10px] tracking-[0.18em] uppercase px-5 py-2.5 bg-ink text-paper hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
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
