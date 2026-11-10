'use client'

import { useCallback, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateProfile } from './actions'
import type { ProfileUser, AvailabilityStatus, PrimaryPlatform, OrgSize } from './page'
import type { ProfileUpdatePayload } from './actions'
import AvatarEditor from './AvatarEditor'
import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
import ChoiceChips from '@/components/ui/ChoiceChips'
import Field, { CONTROL, Select, TextInput, Textarea } from '@/components/ui/Field'
import FormSection from '@/components/ui/FormSection'
import Modal from '@/components/ui/Modal'
import { cn } from '@/components/ui/cn'

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function getDisplayName(user: Pick<ProfileUser, 'display_name' | 'email'>): string {
  return user.display_name?.trim() || user.email.split('@')[0]
}

// ---------------------------------------------------------------------------
// Tag input for areas_of_focus
// ---------------------------------------------------------------------------

function TagInput({
  id,
  tags,
  onChange,
  ...aria
}: {
  id: string
  tags: string[]
  onChange: (tags: string[]) => void
  'aria-describedby'?: string
  'aria-invalid'?: true
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
    <div
      className={cn(
        CONTROL,
        'flex flex-wrap items-center gap-1.5 focus-within:border-umber focus-within:outline-2 focus-within:outline-offset-1 focus-within:outline-umber',
      )}
    >
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded-tag border border-window-line px-2 py-0.5 font-mono text-label uppercase text-umber-soft"
        >
          {tag}
          <button
            type="button"
            onClick={() => removeTag(tag)}
            className="inline-flex size-6 items-center justify-center rounded-tag leading-none text-umber-soft hover:bg-bone hover:text-umber focus-ring"
            aria-label={`Remove ${tag}`}
          >
            ×
          </button>
        </span>
      ))}
      <input
        id={id}
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => { if (draft.trim()) addTag(draft) }}
        placeholder={tags.length === 0 ? 'Type a topic and press Enter' : ''}
        className="min-w-[140px] flex-1 bg-transparent font-ui text-base text-umber outline-none placeholder:text-umber-soft"
        {...aria}
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

const AVAILABILITY_OPTIONS: { value: AvailabilityStatus; label: string }[] = [
  { value: 'open', label: 'Open to work' },
  { value: 'limited', label: 'Limited availability' },
  { value: 'unavailable', label: 'Not available' },
]

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
  const [open, setOpen] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{ display_name?: string; full_name?: string }>({})

  const initial = useRef(buildInitialState(user))
  const [form, setForm] = useState<ProfileUpdatePayload>(() => buildInitialState(user))

  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url)

  const displayName = getDisplayName(user)

  // A request to close (Escape, the scrim, the X button, Cancel). The shared
  // Modal plays its exit animation and then calls onExited, which unmounts us.
  const handleClose = useCallback(() => {
    if (isDirty(initial.current, form)) {
      if (!window.confirm('Discard changes?')) return
    }
    setOpen(false)
  }, [form])

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
      setOpen(false)
    })
  }

  const role = user.role
  const isCreatorOrJournalist = role === 'creator' || role === 'journalist'
  const isJournalist = role === 'journalist'
  const isExpert = role === 'expert'
  const isOrg = role === 'organisation'

  return (
    <Modal open={open} onClose={handleClose} onExited={onClose} title="Edit profile" dismissible={!isPending}>
      <div className="mt-4">
        <AvatarEditor
          userId={user.id}
          displayName={displayName}
          role={user.role}
          avatarUrl={avatarUrl}
          onAvatarChange={setAvatarUrl}
        />
      </div>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-8" noValidate>

        {/* Section 1 — Basic Info */}
        <FormSection legend="Basic Info">
          <Field label="Full name" error={fieldErrors.full_name}>
            {(p) => (
              <TextInput
                {...p}
                value={form.full_name ?? ''}
                onChange={(e) => set('full_name', e.target.value)}
                required
              />
            )}
          </Field>
          <Field label="Display name" error={fieldErrors.display_name}>
            {(p) => (
              <TextInput
                {...p}
                value={form.display_name ?? ''}
                onChange={(e) => set('display_name', e.target.value)}
                required
              />
            )}
          </Field>
          <Field label="Bio">
            {(p) => (
              <Textarea
                {...p}
                rows={4}
                value={form.bio ?? ''}
                onChange={(e) => set('bio', e.target.value || null)}
              />
            )}
          </Field>
          <Field label="Website">
            {(p) => (
              <TextInput
                {...p}
                type="url"
                value={form.website_url ?? ''}
                onChange={(e) => set('website_url', e.target.value || null)}
                placeholder="https://example.com"
              />
            )}
          </Field>
          <Field label="Preferred language">
            {(p) => (
              <TextInput
                {...p}
                value={form.preferred_language ?? ''}
                onChange={(e) => set('preferred_language', e.target.value || null)}
                placeholder="en"
              />
            )}
          </Field>
        </FormSection>

        {/* Section 2 — Availability (creator + journalist) */}
        {isCreatorOrJournalist && (
          <ChoiceChips<AvailabilityStatus>
            label="Availability"
            options={AVAILABILITY_OPTIONS}
            value={form.availability ?? 'open'}
            onChange={(value) => set('availability', value)}
            className="grid-cols-1 sm:grid-cols-3"
          />
        )}

        {/* Section 3 — Content (creator + journalist) */}
        {isCreatorOrJournalist && (
          <FormSection legend="Content">
            <Field label="Channel / publication name">
              {(p) => (
                <TextInput
                  {...p}
                  value={form.channel_name ?? ''}
                  onChange={(e) => set('channel_name', e.target.value || null)}
                  placeholder="e.g. The Daily Signal"
                />
              )}
            </Field>
            <Field label="Primary platform">
              {(p) => (
                <Select
                  {...p}
                  value={form.primary_platform ?? ''}
                  onChange={(e) =>
                    set('primary_platform', (e.target.value || null) as PrimaryPlatform | null)
                  }
                >
                  <option value="">— Select —</option>
                  <option value="youtube">YouTube</option>
                  <option value="podcast">Podcast</option>
                  <option value="instagram">Instagram</option>
                  <option value="tiktok">TikTok</option>
                  <option value="other">Other</option>
                </Select>
              )}
            </Field>
            <Field label="Platform URL">
              {(p) => (
                <TextInput
                  {...p}
                  type="url"
                  value={form.platform_url ?? ''}
                  onChange={(e) => set('platform_url', e.target.value || null)}
                  placeholder="https://"
                />
              )}
            </Field>
            <Field label="Audience size">
              {(p) => (
                <TextInput
                  {...p}
                  type="number"
                  min={0}
                  value={form.audience_size ?? ''}
                  onChange={(e) =>
                    set('audience_size', e.target.value === '' ? null : parseInt(e.target.value, 10))
                  }
                />
              )}
            </Field>
            <Field label="Content language">
              {(p) => (
                <TextInput
                  {...p}
                  value={form.content_language ?? ''}
                  onChange={(e) => set('content_language', e.target.value || null)}
                  placeholder="en"
                />
              )}
            </Field>
          </FormSection>
        )}

        {/* Section 4 — Publication (journalist only) */}
        {isJournalist && (
          <FormSection legend="Publication">
            <Field label="Publication name">
              {(p) => (
                <TextInput
                  {...p}
                  value={form.publication_name ?? ''}
                  onChange={(e) => set('publication_name', e.target.value || null)}
                />
              )}
            </Field>
            <Field label="Publication URL">
              {(p) => (
                <TextInput
                  {...p}
                  type="url"
                  value={form.publication_url ?? ''}
                  onChange={(e) => set('publication_url', e.target.value || null)}
                  placeholder="https://"
                />
              )}
            </Field>
            <Field label="Reporting beat">
              {(p) => (
                <TextInput
                  {...p}
                  value={form.reporting_beat ?? ''}
                  onChange={(e) => set('reporting_beat', e.target.value || null)}
                  placeholder="e.g. AI policy, climate"
                />
              )}
            </Field>
          </FormSection>
        )}

        {/* Section 5 — Expertise (expert only) */}
        {isExpert && (
          <FormSection legend="Expertise">
            <Field label="Affiliation">
              {(p) => (
                <TextInput
                  {...p}
                  value={form.affiliation ?? ''}
                  onChange={(e) => set('affiliation', e.target.value || null)}
                  placeholder="University or organisation"
                />
              )}
            </Field>
            <Field label="Job title">
              {(p) => (
                <TextInput
                  {...p}
                  value={form.job_title ?? ''}
                  onChange={(e) => set('job_title', e.target.value || null)}
                />
              )}
            </Field>
            <Field label="Credibility URL">
              {(p) => (
                <TextInput
                  {...p}
                  type="url"
                  value={form.credibility_url ?? ''}
                  onChange={(e) => set('credibility_url', e.target.value || null)}
                  placeholder="Link to profile, paper, or CV"
                />
              )}
            </Field>
            <Field label="Areas of focus" hint="Press Enter or comma to add a topic">
              {(p) => (
                <TagInput
                  {...p}
                  tags={form.areas_of_focus ?? []}
                  onChange={(tags) => set('areas_of_focus', tags.length > 0 ? tags : null)}
                />
              )}
            </Field>
          </FormSection>
        )}

        {/* Section 6 — Organisation */}
        {isOrg && (
          <FormSection legend="Organisation">
            <Field label="Organisation name">
              {(p) => (
                <TextInput
                  {...p}
                  value={form.org_name ?? ''}
                  onChange={(e) => set('org_name', e.target.value || null)}
                />
              )}
            </Field>
            <Field label="Organisation size">
              {(p) => (
                <Select
                  {...p}
                  value={form.org_size ?? ''}
                  onChange={(e) => set('org_size', (e.target.value || null) as OrgSize | null)}
                >
                  <option value="">— Select —</option>
                  <option value="small">Small (1–20)</option>
                  <option value="medium">Medium (21–100)</option>
                  <option value="large">Large (100+)</option>
                </Select>
              )}
            </Field>
            <Field label="Mission">
              {(p) => (
                <Textarea
                  {...p}
                  rows={4}
                  value={form.org_mission ?? ''}
                  onChange={(e) => set('org_mission', e.target.value || null)}
                />
              )}
            </Field>
          </FormSection>
        )}

        {/* Server error */}
        {serverError && <Alert tone="danger">{serverError}</Alert>}

        {/* Actions */}
        <div className="flex flex-col-reverse gap-2 md:flex-row md:justify-end">
          <Button type="button" variant="secondary" onClick={handleClose} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" pending={isPending}>
            {isPending ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
