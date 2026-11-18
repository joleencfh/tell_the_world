'use client'

import { useState } from 'react'
import { approveCta, dismissCta, setCtaDisplayOrder } from '@/lib/admin/actions'
import type { PendingCta, PublishedCta } from '@/lib/admin/actions'
import Button from '@/components/ui/Button'
import Field, { TextInput } from '@/components/ui/Field'
import { formatDate, QueueItem } from './admin-shared'

// Split out of cards.tsx to keep that file under the project's ~500-line
// convention (CONTRIBUTING.md) — same card shape as FaqAnswerCard in
// app/admin/faq-answer-card.tsx, just for brief_ctas pending rows
// (two-ink-bold-plan.md Part 6).

export function CtaCard({ cta }: { cta: PendingCta }) {
  const [loading, setLoading] = useState<'approving' | 'dismissing' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const submitterName = cta.users.display_name || cta.users.email.split('@')[0]

  async function handleApprove() {
    setLoading('approving')
    setError(null)
    const result = await approveCta(cta.id)
    if (result.error) { setError(result.error); setLoading(null) }
  }

  async function handleDismiss() {
    setLoading('dismissing')
    setError(null)
    const result = await dismissCta(cta.id)
    if (result.error) { setError(result.error); setLoading(null) }
  }

  return (
    <QueueItem
      testId="admin-cta-card"
      title={cta.briefs.title}
      meta={
        <>
          {submitterName}
          {' · '}
          <span className="capitalize">{cta.users.role}</span>
          {' · '}
          {formatDate(cta.created_at)}
        </>
      }
      error={error}
      actions={
        <>
          <Button
            variant="primary"
            onClick={handleApprove}
            disabled={loading !== null}
            pending={loading === 'approving'}
          >
            {loading === 'approving' ? 'Approving…' : 'Approve'}
          </Button>
          <Button
            variant="secondary"
            onClick={handleDismiss}
            disabled={loading !== null}
            pending={loading === 'dismissing'}
          >
            {loading === 'dismissing' ? 'Dismissing…' : 'Dismiss'}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div>
          <p className="mb-1 font-mono text-label uppercase text-umber-soft">Title</p>
          <p className="font-ui text-ui-sm font-semibold leading-snug text-umber">{cta.title}</p>
        </div>
        {cta.description && (
          <div>
            <p className="mb-1 font-mono text-label uppercase text-umber-soft">Description</p>
            <p className="whitespace-pre-wrap font-ui text-ui-sm leading-relaxed text-umber">{cta.description}</p>
          </div>
        )}
        <div>
          <p className="mb-1 font-mono text-label uppercase text-umber-soft">Link</p>
          <a
            href={cta.link_url}
            target="_blank"
            rel="noopener noreferrer"
            className="break-all font-ui text-ui-sm text-cobalt underline focus-ring"
          >
            {cta.link_url}
          </a>
        </div>
      </div>
    </QueueItem>
  )
}

// ---------------------------------------------------------------------------
// Published CTA reorder control (brief-page-part2-plan.md §2, Part 8).
// Default ordering (created_at descending) needs no admin action at all —
// this card is only for the override: a lower number promotes a CTA
// earlier in the public carousel, empty/cleared falls back to that
// default. Immediate-save-per-field, same interaction shape as the
// approve/dismiss buttons above rather than a bulk form, since these rows
// span many different briefs and aren't edited together as one set (unlike
// TimelineEditor's per-brief reorder-together shape).
// ---------------------------------------------------------------------------

export function PublishedCtaCard({ cta }: { cta: PublishedCta }) {
  const [value, setValue] = useState(cta.display_order === null ? '' : String(cta.display_order))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const dirty = value !== (cta.display_order === null ? '' : String(cta.display_order))

  async function handleSave() {
    const parsed = value.trim() === '' ? null : Number(value)
    if (parsed !== null && !Number.isInteger(parsed)) {
      setError('Enter a whole number, or leave blank to clear.')
      return
    }
    setSaving(true)
    setError(null)
    const result = await setCtaDisplayOrder(cta.id, cta.briefs.slug, parsed)
    if (result.error) setError(result.error)
    setSaving(false)
  }

  return (
    <QueueItem testId="admin-published-cta-card" title={cta.briefs.title} error={error}>
      <p className="font-ui text-ui-sm font-semibold leading-snug text-umber">{cta.title}</p>
      <div className="mt-3 flex flex-wrap items-end gap-3">
        <Field label="Order" id={`order-${cta.id}`} className="w-32">
          {(p) => (
            <TextInput
              {...p}
              type="number"
              inputMode="numeric"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="default"
              disabled={saving}
            />
          )}
        </Field>
        <Button variant="primary" onClick={handleSave} disabled={saving || !dirty} pending={saving}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </QueueItem>
  )
}
