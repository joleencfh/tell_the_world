'use client'

import { useState } from 'react'
import { approveCta, dismissCta, setCtaDisplayOrder } from '@/lib/admin/actions'
import type { PendingCta, PublishedCta } from '@/lib/admin/actions'

// Split out of cards.tsx to keep that file under the project's ~500-line
// convention (CONTRIBUTING.md) — same card shape as FaqAnswerCard in
// app/admin/faq-answer-card.tsx, just for brief_ctas pending rows
// (two-ink-bold-plan.md Part 6).

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

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
    <div className="border border-line bg-paper-raised px-5 py-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-0.5">
          <p className="font-mono text-[9px] tracking-[0.18em] uppercase text-blue-ink">
            {cta.briefs.title}
          </p>
          <p className="font-mono text-[9px] text-ink-soft">
            {submitterName}
            {' · '}
            <span className="capitalize">{cta.users.role}</span>
            {' · '}
            {formatDate(cta.created_at)}
          </p>
        </div>
      </div>
      <div>
        <p className="font-mono text-[9px] tracking-[0.18em] uppercase text-ink-soft mb-1">Title</p>
        <p className="font-body text-sm text-ink font-semibold leading-snug">{cta.title}</p>
      </div>
      {cta.description && (
        <div>
          <p className="font-mono text-[9px] tracking-[0.18em] uppercase text-ink-soft mb-1">Description</p>
          <p className="font-body text-sm text-ink leading-relaxed whitespace-pre-wrap">{cta.description}</p>
        </div>
      )}
      <div>
        <p className="font-mono text-[9px] tracking-[0.18em] uppercase text-ink-soft mb-1">Link</p>
        <a
          href={cta.link_url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-body text-sm text-blue-ink hover:underline break-all"
        >
          {cta.link_url}
        </a>
      </div>
      {error && <p className="font-mono text-[10px] text-red-600">{error}</p>}
      <div className="flex gap-3">
        <button
          onClick={handleApprove}
          disabled={loading !== null}
          className="font-mono text-[10px] tracking-[0.18em] uppercase px-5 py-2.5 bg-ink text-paper hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading === 'approving' ? 'Approving…' : 'Approve'}
        </button>
        <button
          onClick={handleDismiss}
          disabled={loading !== null}
          className="font-mono text-[10px] tracking-[0.18em] uppercase px-5 py-2.5 border border-line text-ink-soft hover:border-ink hover:text-ink transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading === 'dismissing' ? 'Dismissing…' : 'Dismiss'}
        </button>
      </div>
    </div>
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
    <div className="border border-line bg-paper-raised px-5 py-4 space-y-3">
      <div className="space-y-0.5">
        <p className="font-mono text-[9px] tracking-[0.18em] uppercase text-blue-ink">{cta.briefs.title}</p>
        <p className="font-body text-sm text-ink font-semibold leading-snug">{cta.title}</p>
      </div>
      {error && <p className="font-mono text-[10px] text-red-600">{error}</p>}
      <div className="flex items-center gap-3">
        <label className="font-mono text-[9px] tracking-[0.18em] uppercase text-ink-soft" htmlFor={`order-${cta.id}`}>
          Order
        </label>
        <input
          id={`order-${cta.id}`}
          type="number"
          inputMode="numeric"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="default"
          disabled={saving}
          className="w-24 border border-line bg-paper px-2.5 py-1.5 font-mono text-xs text-ink focus:outline-none focus:border-ink disabled:opacity-50"
        />
        <button
          onClick={handleSave}
          disabled={saving || !dirty}
          className="font-mono text-[10px] tracking-[0.18em] uppercase px-4 py-2 bg-ink text-paper hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  )
}
