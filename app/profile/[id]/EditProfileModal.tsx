'use client'

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateProfile } from './actions'
import type { ProfileUser, AvailabilityStatus, PrimaryPlatform, OrgSize } from './page'
import type { ProfileUpdatePayload } from './actions'
import Avatar from '@/components/ui/Avatar'
import RoleBadge from '@/components/ui/RoleBadge'

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function getDisplayName(user: Pick<ProfileUser, 'display_name' | 'email'>): string {
  return user.display_name?.trim() || user.email.split('@')[0]
}

// ---------------------------------------------------------------------------
// Small UI pieces
// ---------------------------------------------------------------------------

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="border-t border-gray-100 pt-5">
      <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">{label}</p>
    </div>
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-700">{label}</label>
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}

const inputCls =
  'border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500'

// ---------------------------------------------------------------------------
// Tag input for areas_of_focus
// ---------------------------------------------------------------------------

function TagInput({
  tags,
  onChange,
}: {
  tags: string[]
  onChange: (tags: string[]) => void
}) {
  const [draft, setDraft] = useState('')

  function addTag(raw: string) {
    const tag = raw.trim()
    if (tag && !tags.includes(tag)) {
      onChange([...tags, tag])
    }
    setDraft('')
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(draft)
    } else if (e.key === 'Backspace' && draft === '' && tags.length > 0) {
      onChange(tags.slice(0, -1))
    }
  }

  function removeTag(tag: string) {
    onChange(tags.filter((t) => t !== tag))
  }

  return (
    <div className="border border-gray-300 rounded-lg px-3 py-2 flex flex-wrap gap-1.5 focus-within:ring-2 focus-within:ring-blue-500">
      {tags.map((tag) => (
        <span
          key={tag}
          className="bg-gray-100 text-gray-700 rounded-full px-2 py-0.5 text-xs inline-flex items-center gap-1"
        >
          {tag}
          <button
            type="button"
            onClick={() => removeTag(tag)}
            className="text-gray-400 hover:text-gray-700 leading-none"
            aria-label={`Remove ${tag}`}
          >
            ×
          </button>
        </span>
      ))}
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => { if (draft.trim()) addTag(draft) }}
        placeholder={tags.length === 0 ? 'Type a topic and press Enter' : ''}
        className="text-sm outline-none flex-1 min-w-[140px] bg-transparent"
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Build initial form state from user
// ---------------------------------------------------------------------------

function buildInitialState(user: ProfileUser): ProfileUpdatePayload {
  return {
    display_name: user.display_name ?? '',
    full_name: user.full_name ?? '',
    bio: user.bio ?? null,
    website_url: user.website_url ?? null,
    preferred_language: user.preferred_language ?? null,
    availability: user.availability ?? 'open',
    primary_platform: user.primary_platform ?? null,
    platform_url: user.platform_url ?? null,
    channel_name: user.channel_name ?? null,
    audience_size: user.audience_size ?? null,
    content_language: user.content_language ?? null,
    publication_name: user.publication_name ?? null,
    publication_url: user.publication_url ?? null,
    reporting_beat: user.reporting_beat ?? null,
    affiliation: user.affiliation ?? null,
    job_title: user.job_title ?? null,
    credibility_url: user.credibility_url ?? null,
    areas_of_focus: user.areas_of_focus ?? [],
    org_name: user.org_name ?? null,
    org_size: user.org_size ?? null,
    org_mission: user.org_mission ?? null,
  }
}

function isDirty(original: ProfileUpdatePayload, current: ProfileUpdatePayload): boolean {
  return JSON.stringify(original) !== JSON.stringify(current)
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface EditProfileModalProps {
  user: ProfileUser
  onClose: () => void
}

// ---------------------------------------------------------------------------
// Modal
// ---------------------------------------------------------------------------

export default function EditProfileModal({ user, onClose }: EditProfileModalProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{ display_name?: string; full_name?: string }>({})

  const initial = useRef(buildInitialState(user))
  const [form, setForm] = useState<ProfileUpdatePayload>(() => buildInitialState(user))

  const displayName = getDisplayName(user)

  const handleClose = useCallback(() => {
    if (isDirty(initial.current, form)) {
      if (!window.confirm('Discard changes?')) return
    }
    onClose()
  }, [form, onClose])

  // Close on Escape
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handleClose])

  function set<K extends keyof ProfileUpdatePayload>(key: K, value: ProfileUpdatePayload[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function validate(): boolean {
    const errors: typeof fieldErrors = {}
    if (!form.display_name?.trim()) errors.display_name = 'Display name is required'
    if (!form.full_name?.trim()) errors.full_name = 'Full name is required'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setServerError(null)

    startTransition(async () => {
      const result = await updateProfile(user.id, form)
      if (result.error) {
        setServerError(result.error)
        return
      }
      router.refresh()
      onClose()
    })
  }

  const role = user.role
  const isCreatorOrJournalist = role === 'creator' || role === 'journalist'
  const isJournalist = role === 'journalist'
  const isExpert = role === 'expert'
  const isOrg = role === 'organisation'

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget) handleClose() }}
    >
      {/* Card */}
      <div className="bg-white rounded-xl w-full max-w-lg overflow-y-auto max-h-[90vh] shadow-xl">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100 sticky top-0 bg-white rounded-t-xl">
          <Avatar name={displayName} avatarUrl={user.avatar_url} size="xl" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
            <div className="mt-0.5">
              <RoleBadge role={user.role} />
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-700 text-xl leading-none ml-2 shrink-0"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6" noValidate>

          {/* Section 1 — Basic Info */}
          <div className="space-y-4">
            <SectionDivider label="Basic Info" />
            <Field label="Full name" error={fieldErrors.full_name}>
              <input
                type="text"
                value={form.full_name ?? ''}
                onChange={(e) => set('full_name', e.target.value)}
                className={inputCls}
                required
              />
            </Field>
            <Field label="Display name" error={fieldErrors.display_name}>
              <input
                type="text"
                value={form.display_name ?? ''}
                onChange={(e) => set('display_name', e.target.value)}
                className={inputCls}
                required
              />
            </Field>
            <Field label="Bio">
              <textarea
                rows={4}
                value={form.bio ?? ''}
                onChange={(e) => set('bio', e.target.value || null)}
                className={inputCls}
              />
            </Field>
            <Field label="Website">
              <input
                type="url"
                value={form.website_url ?? ''}
                onChange={(e) => set('website_url', e.target.value || null)}
                placeholder="https://example.com"
                className={inputCls}
              />
            </Field>
            <Field label="Preferred language">
              <input
                type="text"
                value={form.preferred_language ?? ''}
                onChange={(e) => set('preferred_language', e.target.value || null)}
                placeholder="en"
                className={inputCls}
              />
            </Field>
          </div>

          {/* Section 2 — Availability (creator + journalist) */}
          {isCreatorOrJournalist && (
            <div className="space-y-3">
              <SectionDivider label="Availability" />
              {(
                [
                  { value: 'open', label: 'Open to work' },
                  { value: 'limited', label: 'Limited availability' },
                  { value: 'unavailable', label: 'Not available' },
                ] as { value: AvailabilityStatus; label: string }[]
              ).map(({ value, label }) => (
                <label key={value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="availability"
                    value={value}
                    checked={form.availability === value}
                    onChange={() => set('availability', value)}
                    className="accent-blue-600"
                  />
                  <span className="text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          )}

          {/* Section 3 — Content (creator + journalist) */}
          {isCreatorOrJournalist && (
            <div className="space-y-4">
              <SectionDivider label="Content" />
              <Field label="Channel / publication name">
                <input
                  type="text"
                  value={form.channel_name ?? ''}
                  onChange={(e) => set('channel_name', e.target.value || null)}
                  placeholder="e.g. The Daily Signal"
                  className={inputCls}
                />
              </Field>
              <Field label="Primary platform">
                <select
                  value={form.primary_platform ?? ''}
                  onChange={(e) =>
                    set('primary_platform', (e.target.value || null) as PrimaryPlatform | null)
                  }
                  className={inputCls}
                >
                  <option value="">— Select —</option>
                  <option value="youtube">YouTube</option>
                  <option value="podcast">Podcast</option>
                  <option value="instagram">Instagram</option>
                  <option value="tiktok">TikTok</option>
                  <option value="other">Other</option>
                </select>
              </Field>
              <Field label="Platform URL">
                <input
                  type="url"
                  value={form.platform_url ?? ''}
                  onChange={(e) => set('platform_url', e.target.value || null)}
                  placeholder="https://"
                  className={inputCls}
                />
              </Field>
              <Field label="Audience size">
                <input
                  type="number"
                  min={0}
                  value={form.audience_size ?? ''}
                  onChange={(e) =>
                    set('audience_size', e.target.value === '' ? null : parseInt(e.target.value, 10))
                  }
                  className={inputCls}
                />
              </Field>
              <Field label="Content language">
                <input
                  type="text"
                  value={form.content_language ?? ''}
                  onChange={(e) => set('content_language', e.target.value || null)}
                  placeholder="en"
                  className={inputCls}
                />
              </Field>
            </div>
          )}

          {/* Section 4 — Publication (journalist only) */}
          {isJournalist && (
            <div className="space-y-4">
              <SectionDivider label="Publication" />
              <Field label="Publication name">
                <input
                  type="text"
                  value={form.publication_name ?? ''}
                  onChange={(e) => set('publication_name', e.target.value || null)}
                  className={inputCls}
                />
              </Field>
              <Field label="Publication URL">
                <input
                  type="url"
                  value={form.publication_url ?? ''}
                  onChange={(e) => set('publication_url', e.target.value || null)}
                  placeholder="https://"
                  className={inputCls}
                />
              </Field>
              <Field label="Reporting beat">
                <input
                  type="text"
                  value={form.reporting_beat ?? ''}
                  onChange={(e) => set('reporting_beat', e.target.value || null)}
                  placeholder="e.g. AI policy, climate"
                  className={inputCls}
                />
              </Field>
            </div>
          )}

          {/* Section 5 — Expertise (expert only) */}
          {isExpert && (
            <div className="space-y-4">
              <SectionDivider label="Expertise" />
              <Field label="Affiliation">
                <input
                  type="text"
                  value={form.affiliation ?? ''}
                  onChange={(e) => set('affiliation', e.target.value || null)}
                  placeholder="University or organisation"
                  className={inputCls}
                />
              </Field>
              <Field label="Job title">
                <input
                  type="text"
                  value={form.job_title ?? ''}
                  onChange={(e) => set('job_title', e.target.value || null)}
                  className={inputCls}
                />
              </Field>
              <Field label="Credibility URL">
                <input
                  type="url"
                  value={form.credibility_url ?? ''}
                  onChange={(e) => set('credibility_url', e.target.value || null)}
                  placeholder="Link to profile, paper, or CV"
                  className={inputCls}
                />
              </Field>
              <Field label="Areas of focus">
                <TagInput
                  tags={form.areas_of_focus ?? []}
                  onChange={(tags) => set('areas_of_focus', tags.length > 0 ? tags : null)}
                />
                <p className="text-xs text-gray-400">Press Enter or comma to add a topic</p>
              </Field>
            </div>
          )}

          {/* Section 6 — Organisation */}
          {isOrg && (
            <div className="space-y-4">
              <SectionDivider label="Organisation" />
              <Field label="Organisation name">
                <input
                  type="text"
                  value={form.org_name ?? ''}
                  onChange={(e) => set('org_name', e.target.value || null)}
                  className={inputCls}
                />
              </Field>
              <Field label="Organisation size">
                <select
                  value={form.org_size ?? ''}
                  onChange={(e) => set('org_size', (e.target.value || null) as OrgSize | null)}
                  className={inputCls}
                >
                  <option value="">— Select —</option>
                  <option value="small">Small (1–20)</option>
                  <option value="medium">Medium (21–100)</option>
                  <option value="large">Large (100+)</option>
                </select>
              </Field>
              <Field label="Mission">
                <textarea
                  rows={4}
                  value={form.org_mission ?? ''}
                  onChange={(e) => set('org_mission', e.target.value || null)}
                  className={inputCls}
                />
              </Field>
            </div>
          )}

          {/* Server error */}
          {serverError && (
            <p className="text-sm text-red-600 border border-red-200 rounded-lg px-3 py-2 bg-red-50">
              {serverError}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isPending ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
