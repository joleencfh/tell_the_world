'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { saveBrief, deleteBrief } from '@/lib/admin/brief-actions'
import type { Brief, BriefSection } from '@/lib/admin/brief-actions'

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
  section: BriefSection
  isFirst: boolean
  isLast: boolean
  onContentChange: (id: string, content: string) => void
  onMoveUp: (id: string) => void
  onMoveDown: (id: string) => void
}

function SectionEditor({ section, isFirst, isLast, onContentChange, onMoveUp, onMoveDown }: SectionEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: section.content || '',
    onUpdate: ({ editor }) => {
      onContentChange(section.id, editor.getHTML())
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
}

export default function EditBriefScreen({ adminEmail, brief, sections: initialSections }: Props) {
  const [title, setTitle]           = useState(brief.title)
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
            {sections.map((section, i) => (
              <SectionEditor
                key={section.id}
                section={section}
                isFirst={i === 0}
                isLast={i === sections.length - 1}
                onContentChange={handleContentChange}
                onMoveUp={(id) => moveSection(id, 'up')}
                onMoveDown={(id) => moveSection(id, 'down')}
              />
            ))}
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
