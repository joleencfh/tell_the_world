'use client'

import RichTextEditor from '@/lib/richtext/editor'
import type { UserOption } from '@/lib/admin/brief-actions'

// ---------------------------------------------------------------------------
// FAQ per-question metadata (Part 6, brief_faq_meta migration 041) — the
// primary Q:/A: answer above (SectionEditor's plain textarea, SECTION_HELP.faq)
// stays the source of truth for question/answer text; this editor attaches
// collaborator/feedback-giver bylines and an optional rich-text override to
// whichever questions are currently parsed out of that text, keyed by the
// question's exact wording (same match brief_faq_answers already uses —
// renaming a question here detaches this row from it, same accepted
// fragility, not a bug to fix).
// ---------------------------------------------------------------------------

export interface EditableFaqMeta {
  collaboratorUserIds: string[]
  feedbackGiverUserIds: string[]
  richContent: unknown
}

export const DEFAULT_FAQ_META: EditableFaqMeta = {
  collaboratorUserIds: [],
  feedbackGiverUserIds: [],
  richContent: null,
}

function optionLabel(u: UserOption): string {
  return `${u.display_name?.trim() || 'Unnamed'} (${u.role})`
}

function UserMultiSelect({
  label,
  userOptions,
  selectedIds,
  onChange,
}: {
  label: string
  userOptions: UserOption[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
}) {
  return (
    <div className="space-y-1">
      <label className="block font-mono text-[9px] tracking-[0.18em] uppercase text-ink-soft">{label}</label>
      <select
        multiple
        value={selectedIds}
        onChange={(e) => onChange(Array.from(e.target.selectedOptions, (o) => o.value))}
        className="h-28 w-full border border-line bg-paper-raised px-2 py-1.5 font-body text-xs text-ink focus:outline-none focus:border-ink"
      >
        {userOptions.map((u) => (
          <option key={u.id} value={u.id}>
            {optionLabel(u)}
          </option>
        ))}
      </select>
      <p className="font-body text-[10px] text-ink-soft/60">Ctrl/Cmd-click to select multiple.</p>
    </div>
  )
}

function FaqMetaRowEditor({
  question,
  meta,
  userOptions,
  onChange,
}: {
  question: string
  meta: EditableFaqMeta
  userOptions: UserOption[]
  onChange: (patch: Partial<EditableFaqMeta>) => void
}) {
  return (
    <div className="space-y-3 border border-line bg-paper-raised p-4">
      <p className="font-body text-sm font-medium text-ink">{question}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <UserMultiSelect
          label="Collaborators (linked on the info panel)"
          userOptions={userOptions}
          selectedIds={meta.collaboratorUserIds}
          onChange={(ids) => onChange({ collaboratorUserIds: ids })}
        />
        <UserMultiSelect
          label="Feedback from (linked on the info panel)"
          userOptions={userOptions}
          selectedIds={meta.feedbackGiverUserIds}
          onChange={(ids) => onChange({ feedbackGiverUserIds: ids })}
        />
      </div>
      <div>
        <label className="mb-1 block font-mono text-[9px] tracking-[0.18em] uppercase text-ink-soft">
          Rich-text answer override (optional)
        </label>
        <RichTextEditor
          key={question}
          initialValue={meta.richContent}
          onChange={(json) => onChange({ richContent: json })}
          placeholder="Leave empty to use the plain-text answer above. Use this only to add links or bold."
        />
      </div>
    </div>
  )
}

export function FaqMetaEditor({
  questions,
  metaByQuestion,
  userOptions,
  onChange,
}: {
  questions: string[]
  metaByQuestion: Record<string, EditableFaqMeta>
  userOptions: UserOption[]
  onChange: (question: string, patch: Partial<EditableFaqMeta>) => void
}) {
  if (questions.length === 0) return null

  return (
    <div className="space-y-3">
      <h2 className="font-mono text-[9px] tracking-[0.18em] uppercase text-ink-soft">
        FAQ answer info — collaborators, feedback, rich text
      </h2>
      {questions.map((question) => (
        <FaqMetaRowEditor
          key={question}
          question={question}
          meta={metaByQuestion[question] ?? DEFAULT_FAQ_META}
          userOptions={userOptions}
          onChange={(patch) => onChange(question, patch)}
        />
      ))}
    </div>
  )
}
