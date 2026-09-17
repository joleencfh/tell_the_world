'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import Logo from '@/components/ui/Logo'
import SignOutButton from '@/components/ui/SignOutButton'
import { saveBrief, deleteBrief, uploadExplainerImage } from '@/lib/admin/brief-actions'
import type { Brief, BriefSection, MediaPickerOption, TimelineEvent, UserOption, FaqMetaRow } from '@/lib/admin/brief-actions'
import { plainTextToRichContent, tldrPlainTextToRichContent } from '@/lib/richtext/types'
import { SectionEditor, type EditableSection } from './section-editor'
import { TimelineEditor, type EditableTimelineEvent } from './timeline-editor'
import { FaqMetaEditor, DEFAULT_FAQ_META, type EditableFaqMeta } from './faq-meta-editor'
import { BriefMetaFields } from './brief-meta-fields'
import { SaveStatus } from './save-status'
import { parseFAQ } from '@/lib/briefs/parse-faq'

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

interface Props {
  adminEmail: string
  brief: Brief
  sections: BriefSection[]
  timelineEvents: TimelineEvent[]
  mediaOptions: MediaPickerOption[]
  userOptions: UserOption[]
  faqMeta: FaqMetaRow[]
}

export default function EditBriefScreen({ adminEmail, brief, sections: initialSections, timelineEvents: initialTimelineEvents, mediaOptions, userOptions, faqMeta: initialFaqMeta }: Props) {
  const [title, setTitle]           = useState(brief.title)
  const [subtitle, setSubtitle]     = useState(brief.subtitle ?? '')
  const [explainerTitle, setExplainerTitle] = useState(brief.explainer_title ?? '')
  const [topicTags, setTopicTags]   = useState<string[]>(brief.topic_tags)
  const [tldrTeaser, setTldrTeaser] = useState(brief.tldr_teaser ?? '')
  const [pinnedMediaPostId, setPinnedMediaPostId] = useState(brief.pinned_media_post_id ?? '')
  const [visibility, setVisibility] = useState<Brief['visibility']>(brief.visibility)
  const [dashboardFeatured, setDashboardFeatured] = useState(brief.dashboard_featured ?? false)
  const [sections, setSections]     = useState<EditableSection[]>(
    [...initialSections]
      .sort((a, b) => a.display_order - b.display_order)
      .map(s => ({ ...s, clientKey: s.id }))
  )
  const [timelineEvents, setTimelineEvents] = useState<EditableTimelineEvent[]>(
    [...initialTimelineEvents]
      .sort((a, b) => a.display_order - b.display_order)
      .map(e => ({ clientKey: e.id, event_name: e.event_name, event_date: e.event_date, display_order: e.display_order }))
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

  // One-way per-row switch (Part 0b; extended to TL;DR 2026-09-03) — seeds
  // an initial rich-text doc from the section's current plain content so
  // nothing is silently lost. TL;DR's bullets are one-per-line rather than
  // blank-line-separated paragraphs, so it gets its own converter.
  const handleSwitchToRichText = useCallback((key: string) => {
    setSections(prev => prev.map(s => {
      if (s.clientKey !== key) return s
      const convert = s.section_type === 'tldr' ? tldrPlainTextToRichContent : plainTextToRichContent
      return { ...s, rich_content: convert(s.content) }
    }))
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

  // Backs the Explainer rich text editor's Image toolbar button
  // (section-editor.tsx -> lib/richtext/editor.tsx) — wraps the server
  // action in the File-to-FormData shape it expects, and collapses its
  // {url?, error?} result to null on failure so the editor only needs to
  // handle "got a URL" vs "didn't".
  async function handleUploadImage(file: File): Promise<string | null> {
    const formData = new FormData()
    formData.set('file', file)
    const result = await uploadExplainerImage(formData)
    return result.url ?? null
  }

  function removeSection(key: string) {
    setSections(prev =>
      prev.filter(s => s.clientKey !== key).map((s, i) => ({ ...s, display_order: i + 1 })),
    )
  }

  function addTimelineEvent() {
    setTimelineEvents(prev => [
      ...prev,
      { clientKey: crypto.randomUUID(), event_name: '', event_date: '', display_order: prev.length + 1 },
    ])
  }

  function removeTimelineEvent(key: string) {
    setTimelineEvents(prev =>
      prev.filter(e => e.clientKey !== key).map((e, i) => ({ ...e, display_order: i + 1 })),
    )
  }

  function moveTimelineEvent(key: string, dir: 'up' | 'down') {
    setTimelineEvents(prev => {
      const idx = prev.findIndex(e => e.clientKey === key)
      if (dir === 'up' && idx === 0) return prev
      if (dir === 'down' && idx === prev.length - 1) return prev
      const next = [...prev]
      const swap = dir === 'up' ? idx - 1 : idx + 1
      ;[next[idx], next[swap]] = [next[swap], next[idx]]
      return next.map((e, i) => ({ ...e, display_order: i + 1 }))
    })
  }

  function handleTimelineNameChange(key: string, event_name: string) {
    setTimelineEvents(prev => prev.map(e => e.clientKey === key ? { ...e, event_name } : e))
  }

  function handleTimelineDateChange(key: string, event_date: string) {
    setTimelineEvents(prev => prev.map(e => e.clientKey === key ? { ...e, event_date } : e))
  }

  async function handleSave() {
    setSaving(true)
    setSaveError(null)
    setSaved(false)

    const result = await saveBrief(brief.id, {
      title,
      subtitle,
      explainerTitle,
      topicTags,
      tldrTeaser,
      pinnedMediaPostId: pinnedMediaPostId || null,
      visibility,
      dashboardFeatured,
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
      timelineEvents: timelineEvents.map(e => ({
        event_name: e.event_name,
        event_date: e.event_date,
        display_order: e.display_order,
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
      if (result.timelineEvents) {
        setTimelineEvents(
          [...result.timelineEvents]
            .sort((a, b) => a.display_order - b.display_order)
            .map(e => ({ clientKey: e.id, event_name: e.event_name, event_date: e.event_date, display_order: e.display_order })),
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
          <div className="flex items-center gap-4">
            <span className="font-mono text-[9px] text-ink-soft hidden sm:block">{adminEmail}</span>
            <SignOutButton className="font-mono text-[9px] tracking-[0.2em] uppercase text-ink-soft hover:text-ink transition-colors" />
          </div>
        </div>
      </header>

      <main className="px-6 py-10">
        <div className="mx-auto max-w-4xl space-y-8">

          {/* Page title + back link */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-4">
                <Link
                  href="/admin"
                  className="font-mono text-[9px] tracking-[0.18em] uppercase text-ink-soft hover:text-ink transition-colors"
                >
                  ← Back to admin
                </Link>
                {/* Opens in a new tab — an admin checking their save (or
                    just reading the live page) shouldn't lose this form's
                    state, which a same-tab navigation away and back would
                    otherwise discard. */}
                <Link
                  href={`/briefs/${brief.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-[9px] tracking-[0.18em] uppercase text-blue-ink hover:text-blue transition-colors"
                >
                  View brief →
                </Link>
              </div>
              <h1 className="font-display uppercase text-[2rem] tracking-tight text-ink leading-none mt-1">
                Edit Brief
              </h1>
            </div>

            <SaveStatus saving={saving} saveError={saveError} saved={saved} onSave={handleSave} />
          </div>

          <BriefMetaFields
            title={title}
            onTitleChange={setTitle}
            subtitle={subtitle}
            onSubtitleChange={setSubtitle}
            tldrTeaser={tldrTeaser}
            onTldrTeaserChange={setTldrTeaser}
            topicTags={topicTags}
            onTopicTagsChange={setTopicTags}
            pinnedMediaPostId={pinnedMediaPostId}
            onPinnedMediaPostIdChange={setPinnedMediaPostId}
            mediaOptions={mediaOptions}
            visibility={visibility}
            onVisibilityChange={setVisibility}
            dashboardFeatured={dashboardFeatured}
            onDashboardFeaturedChange={setDashboardFeatured}
            explainerTitle={explainerTitle}
            onExplainerTitleChange={setExplainerTitle}
          />

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
                  onUploadImage={handleUploadImage}
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

          <TimelineEditor
            events={timelineEvents}
            onNameChange={handleTimelineNameChange}
            onDateChange={handleTimelineDateChange}
            onMoveUp={(key) => moveTimelineEvent(key, 'up')}
            onMoveDown={(key) => moveTimelineEvent(key, 'down')}
            onRemove={removeTimelineEvent}
            onAdd={addTimelineEvent}
          />

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

            <SaveStatus saving={saving} saveError={saveError} saved={saved} onSave={handleSave} />
          </div>

        </div>
      </main>
    </div>
  )
}
