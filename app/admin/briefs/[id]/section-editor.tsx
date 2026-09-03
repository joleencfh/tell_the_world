import type { ReactNode } from 'react'
import type { BriefSection } from '@/lib/admin/brief-actions'
import RichTextEditor from '@/lib/richtext/editor'
import { SourcesFormEditor } from './sources-editor'

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
export type EditableSection = Omit<BriefSection, 'id'> & { id: string | null; clientKey: string }

// Every section is authored as plain text in a convention the public brief
// page's parsers understand (parseFAQ/parseSources/ParagraphContent in
// app/briefs/[slug]/section-content.tsx and sources.tsx, the keyterm/
// paragraph parsing in app/briefs/[slug]/explainer.tsx) — there is no rich
// HTML rendering path on the public page, so the editor must not produce HTML.
// Explainer subsections are the one exception (Part 0b): lib/richtext/editor.tsx
// uses Lexical, which never produces HTML either — its JSON tree is walked
// by lib/richtext/render.tsx into plain React elements instead.
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
        One card per source. <strong className="text-ink">Publisher is required</strong> — a source without one is
        rejected on save. Needs at least 2 sources to render, folded into the Explainer section&apos;s Sources block
        on the public page.
      </>
    ),
    placeholder: '',
    rows: 0,
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

// Shown instead of SECTION_HELP.explainer once a subsection is switched to
// the rich text editor (Part 0b).
const EXPLAINER_RICH_HELP = (
  <>
    Use the <strong className="text-ink">B</strong>, <strong className="text-ink">Link</strong>,{' '}
    <strong className="text-ink">Section</strong>, and <strong className="text-ink">Subsection</strong> buttons
    above to format text, and <strong className="text-ink">Image</strong> to drop in a picture anywhere in the
    text. Link to another brief with a path like <code className="font-mono text-[11px]">/briefs/some-brief-slug</code>,
    or paste a full URL for an external link. Mark a key term inline with{' '}
    <code className="font-mono text-[11px]">{'{{term|definition}}'}</code> to get a hover/focus tooltip on the
    public page — same syntax as the plain-text editor, no toolbar button needed.
  </>
)

// Shown instead of SECTION_HELP.tldr once TL;DR is switched to the rich text
// editor. No Section/Subsection/Image buttons here (allowHeadings/allowImages
// both off below) — TL;DR is a flat list of short bullets, one per paragraph.
const TLDR_RICH_HELP = (
  <>
    Press <strong className="text-ink">Enter</strong> for a new bullet, 3–5 recommended. Use the{' '}
    <strong className="text-ink">B</strong> button to bold a lead term at the start of a bullet, e.g.{' '}
    <strong className="text-ink">Compute race</strong> — followed by an em dash and the rest of the line.
  </>
)

const TLDR_RICH_PLACEHOLDER =
  'Compute race — governments vs. governments, companies vs. companies.\nA second bullet goes here.'

// Section types the Lexical rich text editor (lib/richtext/editor.tsx) can
// author, alongside the per-type toolbar/help it gets — every other type
// stays on the plain textarea (or its own specialized editor, e.g.
// SourcesFormEditor) below. Keyed lookup rather than a per-type boolean flag
// so adding a third rich-text-eligible section type is a one-entry change
// here, not a new `isFoo` variable threaded through the component.
const RICH_TEXT_SECTIONS: Partial<Record<BriefSection['section_type'], {
  allowHeadings: boolean
  allowImages: boolean
  helpText: ReactNode
  placeholder?: string
}>> = {
  explainer: { allowHeadings: true, allowImages: true, helpText: EXPLAINER_RICH_HELP },
  tldr: { allowHeadings: false, allowImages: false, helpText: TLDR_RICH_HELP, placeholder: TLDR_RICH_PLACEHOLDER },
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
  // Only meaningful for section types in RICH_TEXT_SECTIONS above (Part 0b:
  // explainer; TL;DR added 2026-09-03) — every other section type stays on
  // the plain textarea.
  onRichContentChange?: (key: string, richContent: unknown, plainText: string) => void
  onSwitchToRichText?: (key: string) => void
  // Backs the rich text editor's Image toolbar button — only wired up for
  // section types with allowImages set in RICH_TEXT_SECTIONS (explainer).
  // Not passed through for FAQ answer authoring (faq-answers.tsx,
  // faq-meta-editor.tsx), which also reuses RichTextEditor but hasn't been
  // asked to carry headings/images.
  onUploadImage?: (file: File) => Promise<string | null>
}

export function SectionEditor({
  section,
  isFirst,
  isLast,
  onContentChange,
  onMoveUp,
  onMoveDown,
  onTitleChange,
  onRemove,
  onRichContentChange,
  onSwitchToRichText,
  onUploadImage,
}: SectionEditorProps) {
  const isExplainer = section.section_type === 'explainer'
  const isGoingDeeper = section.section_type === 'going_deeper'
  const help = SECTION_HELP[section.section_type]
  const richConfig = RICH_TEXT_SECTIONS[section.section_type]
  // A brand-new, still-empty subsection goes straight to the rich text
  // editor (nothing legacy to preserve); an existing plain-text subsection
  // keeps the textarea until the admin deliberately switches it — the two
  // shapes coexist rather than one silently replacing the other (§2, Part 0b).
  const useRichEditor = !!richConfig && (section.rich_content !== null || section.content.trim() === '')

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
        <p className="font-body text-xs text-ink-soft leading-relaxed">
          {useRichEditor && richConfig ? richConfig.helpText : help.instructions}
        </p>
      </div>

      {isGoingDeeper ? (
        <SourcesFormEditor
          key={section.clientKey}
          initialContent={section.content}
          onChange={(content) => onContentChange(section.clientKey, content)}
        />
      ) : useRichEditor && richConfig && onRichContentChange ? (
        <RichTextEditor
          key={section.clientKey}
          initialValue={section.rich_content}
          onChange={(json, plainText) => onRichContentChange(section.clientKey, json, plainText)}
          placeholder={richConfig.placeholder ?? help.placeholder}
          allowHeadings={richConfig.allowHeadings}
          allowImages={richConfig.allowImages}
          onUploadImage={onUploadImage}
        />
      ) : (
        <>
          <textarea
            value={section.content}
            onChange={(e) => onContentChange(section.clientKey, e.target.value)}
            rows={help.rows}
            className="w-full px-3 py-3 font-mono text-sm text-ink leading-relaxed focus:outline-none resize-y"
            placeholder={help.placeholder}
          />
          {richConfig && onSwitchToRichText && (
            <div className="border-t border-line px-4 py-2.5">
              <button
                type="button"
                onClick={() => onSwitchToRichText(section.clientKey)}
                className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink-soft hover:text-ink transition-colors"
              >
                Switch to rich text editor →
              </button>
              <p className="mt-1 font-body text-xs text-ink-soft/70">
                {isExplainer
                  ? 'Carries the existing text over as plain paragraphs. Key term tooltips become literal text.'
                  : 'Carries each existing bullet over as its own paragraph, keeping any bold lead term.'}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
