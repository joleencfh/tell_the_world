'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
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

// Client-side section state. `id` is null for a subsection added in this
// session and not yet saved — saveBrief (lib/admin/brief-actions.ts) treats
// a null id as an insert. `clientKey` is the stable React key / handler
// identity independent of `id`, since `id` doesn't exist yet for new rows;
// it's the row's real id for anything loaded from the DB, or a generated
// placeholder for a new row, and gets reconciled to the real id once
// saveBrief returns the persisted rows.
type EditableSection = Omit<BriefSection, 'id'> & { id: string | null; clientKey: string }

// ---------------------------------------------------------------------------
// TipTap toolbar
// ---------------------------------------------------------------------------

function EditorToolbar({ editor }: { editor: ReturnType<typeof useEditor> }) {
  if (!editor) return null

  const btn = (active: boolean, action: () => void, label: string) => (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); action() }}
      className={[
        'px-2 py-1 font-mono text-[9px] tracking-[0.1em] uppercase border transition-colors',
        active
          ? 'border-dark bg-dark text-white'
          : 'border-edge text-soft hover:border-text hover:text-text',
      ].join(' ')}
    >
      {label}
    </button>
  )

  return (
    <div className="flex flex-wrap gap-1 px-3 py-2 border-b border-edge bg-base/60">
      {btn(editor.isActive('bold'),        () => editor.chain().focus().toggleBold().run(),        'B')}
      {btn(editor.isActive('italic'),      () => editor.chain().focus().toggleItalic().run(),      'I')}
      {btn(editor.isActive('heading', { level: 2 }), () => editor.chain().focus().toggleHeading({ level: 2 }).run(), 'H2')}
      {btn(editor.isActive('heading', { level: 3 }), () => editor.chain().focus().toggleHeading({ level: 3 }).run(), 'H3')}
      {btn(editor.isActive('bulletList'),  () => editor.chain().focus().toggleBulletList().run(),  'UL')}
      {btn(editor.isActive('orderedList'), () => editor.chain().focus().toggleOrderedList().run(), 'OL')}
      {btn(editor.isActive('blockquote'),  () => editor.chain().focus().toggleBlockquote().run(),  'BQ')}
      {btn(editor.isActive('code'),        () => editor.chain().focus().toggleCode().run(),        'Code')}
    </div>
  )
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

// TLDR is a plain textarea, not the TipTap rich editor other sections use —
// its content is short bullet lines (one per \n), each optionally starting
// with **a bold lead term** — a plain-text format the public brief page
// parses (parseTLDR in section-content.tsx), not rich HTML.
function TLDRSectionEditor({ section, isFirst, isLast, onContentChange, onMoveUp, onMoveDown }: SectionEditorProps) {
  return (
    <div className="border border-edge bg-card">
      <div className="flex items-center justify-between px-4 py-3 border-b border-edge">
        <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-dark">
          {SECTION_LABELS[section.section_type]}
        </span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => onMoveUp(section.clientKey)}
            disabled={isFirst}
            title="Move up"
            className="px-2 py-1 font-mono text-[10px] border border-edge text-soft hover:border-text hover:text-text transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={() => onMoveDown(section.clientKey)}
            disabled={isLast}
            title="Move down"
            className="px-2 py-1 font-mono text-[10px] border border-edge text-soft hover:border-text hover:text-text transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
          >
            ↓
          </button>
        </div>
      </div>

      <div className="px-4 py-3 border-b border-edge bg-base/60">
        <p className="font-serif text-xs text-soft leading-relaxed">
          One bullet per line, 3–5 lines. Optionally start a line with{' '}
          <strong className="text-dark">**a bold lead term**</strong> followed by an em dash — e.g.{' '}
          <code className="font-mono text-[11px]">**Compute race** — governments vs. governments, companies vs. companies.</code>
        </p>
      </div>

      <textarea
        value={section.content}
        onChange={(e) => onContentChange(section.clientKey, e.target.value)}
        rows={6}
        className="w-full px-3 py-3 font-mono text-sm text-text leading-relaxed focus:outline-none resize-y"
        placeholder={'**Compute race** — governments vs. governments, companies vs. companies.\nA second bullet line goes here.'}
      />
    </div>
  )
}

function SectionEditor({ section, isFirst, isLast, onContentChange, onMoveUp, onMoveDown, onTitleChange, onRemove }: SectionEditorProps) {
  const isExplainer = section.section_type === 'explainer'
  const editor = useEditor({
    extensions: [StarterKit],
    content: section.content || '',
    onUpdate: ({ editor }) => {
      onContentChange(section.clientKey, editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none px-3 py-3 min-h-[120px] focus:outline-none font-serif text-sm text-text leading-relaxed',
      },
    },
  })

  return (
    <div className="border border-edge bg-card">
      {/* Section header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-edge">
        <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-dark">
          {SECTION_LABELS[section.section_type]}
        </span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => onMoveUp(section.clientKey)}
            disabled={isFirst}
            title="Move up"
            className="px-2 py-1 font-mono text-[10px] border border-edge text-soft hover:border-text hover:text-text transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={() => onMoveDown(section.clientKey)}
            disabled={isLast}
            title="Move down"
            className="px-2 py-1 font-mono text-[10px] border border-edge text-soft hover:border-text hover:text-text transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
          >
            ↓
          </button>
          {isExplainer && onRemove && (
            <button
              type="button"
              onClick={() => onRemove(section.clientKey)}
              title="Remove this subsection"
              className="px-2 py-1 font-mono text-[10px] border border-edge text-soft hover:border-red-600 hover:text-red-600 transition-colors"
            >
              Remove
            </button>
          )}
        </div>
      </div>

      {/* Subsection title — Explainer only (Part 3): multiple explainer rows
          per brief are rendered as titled subsections on the public page. */}
      {isExplainer && onTitleChange && (
        <div className="px-4 py-3 border-b border-edge bg-base/60">
          <label className="block font-mono text-[9px] tracking-[0.18em] uppercase text-soft mb-1.5">
            Subsection title (optional)
          </label>
          <input
            type="text"
            value={section.title ?? ''}
            onChange={(e) => onTitleChange(section.clientKey, e.target.value)}
            className="w-full border border-edge bg-card px-3 py-2 font-serif text-sm text-dark focus:outline-none focus:border-text"
            placeholder="e.g. How the training process works"
          />
        </div>
      )}

      {/* Toolbar */}
      <EditorToolbar editor={editor} />

      {/* Editor */}
      <EditorContent editor={editor} />
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
              const Editor = section.section_type === 'tldr' ? TLDRSectionEditor : SectionEditor
              return (
                <Editor
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
              className="w-full border border-dashed border-edge px-4 py-3 font-mono text-[10px] tracking-[0.18em] uppercase text-soft hover:border-text hover:text-text transition-colors"
            >
              + Add explainer subsection
            </button>
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
