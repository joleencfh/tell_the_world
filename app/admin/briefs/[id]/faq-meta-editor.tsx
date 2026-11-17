'use client'

import Field, { CONTROL } from '@/components/ui/Field'
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
    <Field label={label} hint="Ctrl/Cmd-click to select multiple.">
      {(p) => (
        <select
          {...p}
          multiple
          value={selectedIds}
          onChange={(e) => onChange(Array.from(e.target.selectedOptions, (o) => o.value))}
          className={`${CONTROL} h-28`}
        >
          {userOptions.map((u) => (
            <option key={u.id} value={u.id}>
              {optionLabel(u)}
            </option>
          ))}
        </select>
      )}
    </Field>
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
    <div className="space-y-4 rounded-control border border-window-line bg-vellum p-4">
      <p className="font-ui text-ui-sm font-medium text-umber">{question}</p>
      <div className="grid gap-4 sm:grid-cols-2">
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
        <span className="mb-1.5 block font-ui text-caption font-medium text-umber">
          Rich-text answer override (optional)
        </span>
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
    <div className="space-y-4">
      <h2 className="font-mono text-label uppercase text-umber-soft">
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
