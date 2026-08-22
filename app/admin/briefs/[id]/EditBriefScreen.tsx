'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import Logo from '@/components/ui/Logo'
import { saveBrief, deleteBrief } from '@/lib/admin/brief-actions'
import type { Brief, BriefSection, MediaPickerOption, UserOption, FaqMetaRow } from '@/lib/admin/brief-actions'
import { plainTextToRichContent } from '@/lib/richtext/types'
import { SectionEditor, type EditableSection } from './section-editor'
import { FaqMetaEditor, DEFAULT_FAQ_META, type EditableFaqMeta } from './faq-meta-editor'
import { parseFAQ } from '@/lib/briefs/parse-faq'

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

interface Props {
  adminEmail: string
  brief: Brief
  sections: BriefSection[]
  mediaOptions: MediaPickerOption[]
  userOptions: UserOption[]
  faqMeta: FaqMetaRow[]
}

export default function EditBriefScreen({ adminEmail, brief, sections: initialSections, mediaOptions, userOptions, faqMeta: initialFaqMeta }: Props) {
  const [title, setTitle]           = useState(brief.title)
  const [subtitle, setSubtitle]     = useState(brief.subtitle ?? '')
  const [topicTag, setTopicTag]     = useState(brief.topic_tag ?? '')
  const [tldrTeaser, setTldrTeaser] = useState(brief.tldr_teaser ?? '')
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
  const [faqMeta, setFaqMeta] = useState<Record<string, EditableFaqMeta>>(() =>
    Object.fromEntries(initialFaqMeta.map((m) => [m.question, {
      collaboratorUserIds: m.collaboratorUserIds,
      feedbackGiverUserIds: m.feedbackGiverUserIds,
      richContent: m.richContent,
    }])),
  )

  // Re-derived from the FAQ section(s)' current content on every render, so
  // the meta editor's row list tracks live edits to the Q:/A: text above —
  // same parser the public page uses (lib/briefs/parse-faq.ts).
  const faqQuestions = sections
    .filter((s) => s.section_type === 'faq')
    .flatMap((s) => parseFAQ(s.content) ?? [])
    .map((item) => item.question)
    .filter((question, i, all) => all.indexOf(question) === i)

  const handleFaqMetaChange = useCallback((question: string, patch: Partial<EditableFaqMeta>) => {
    setFaqMeta((prev) => ({ ...prev, [question]: { ...(prev[question] ?? DEFAULT_FAQ_META), ...patch } }))
  }, [])

  const handleContentChange = useCallback((key: string, content: string) => {
    setSections(prev => prev.map(s => s.clientKey === key ? { ...s, content } : s))
  }, [])

  const handleTitleChange = useCallback((key: string, title: string) => {
    setSections(prev => prev.map(s => s.clientKey === key ? { ...s, title } : s))
  }, [])

  // rich_content is the source of truth once a subsection is in rich-text
  // mode; content keeps a plain-text mirror (not-null column, and it's what
  // computeReadTimeMinutes reads — app/briefs/[slug]/helpers.ts).
  const handleRichContentChange = useCallback((key: string, richContent: unknown, plainText: string) => {
    setSections(prev => prev.map(s => s.clientKey === key ? { ...s, rich_content: richContent, content: plainText } : s))
  }, [])

  // One-way per-row switch (Part 0b) — seeds an initial rich-text doc from
  // the subsection's current plain content so nothing is silently lost.
  const handleSwitchToRichText = useCallback((key: string) => {
    setSections(prev => prev.map(s => s.clientKey === key ? { ...s, rich_content: plainTextToRichContent(s.content) } : s))
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
        rich_content: null,
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
      tldrTeaser,
      pinnedMediaPostId: pinnedMediaPostId || null,
      visibility,
      sections: sections.map(s => ({
        id: s.id,
        section_type: s.section_type,
        title: s.title,
        content: s.content,
        rich_content: s.rich_content,
        display_order: s.display_order,
      })),
      faqMeta: faqQuestions.map((question) => ({
        question,
        ...(faqMeta[question] ?? DEFAULT_FAQ_META),
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
      <header className="border-b-2 border-ink px-6">
        <div className="mx-auto flex max-w-4xl items-center justify-between py-4">
          <div className="flex items-center gap-4">
            <Logo href="/admin" />
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

          {/* TL;DR teaser — the one-liner shown under the TL;DR section
              header on the public page, in place of the generic default
              (Part 3 step 1). */}
          <div className="space-y-1.5">
            <label className="font-mono text-[9px] tracking-[0.18em] uppercase text-ink-soft">
              TL;DR teaser
            </label>
            <input
              type="text"
              value={tldrTeaser}
              onChange={e => setTldrTeaser(e.target.value)}
              className="w-full border border-line bg-paper-raised px-4 py-3 font-body text-sm text-ink focus:outline-none focus:border-ink"
              placeholder="e.g. Three races, conflated constantly — the skim version"
            />
            <p className="font-body text-xs text-ink-soft/70">
              Shown under the TL;DR heading on the public page. Leave blank to fall back to a generic default.
            </p>
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
                  onRichContentChange={handleRichContentChange}
                  onSwitchToRichText={handleSwitchToRichText}
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

          {/* FAQ per-question meta — collaborators/feedback-givers/rich-text
              override (Part 6), one row per question currently parsed out of
              the FAQ section(s) above. */}
          <FaqMetaEditor
            questions={faqQuestions}
            metaByQuestion={faqMeta}
            userOptions={userOptions}
            onChange={handleFaqMetaChange}
          />

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
