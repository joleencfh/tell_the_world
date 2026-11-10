'use client'

import { useEffect, useRef, useState } from 'react'
import { getSourceOrganizations, uploadSourceOrganizationLogo, type SourceOrganizationOption } from '@/lib/admin/actions'
import ChoiceChips from '@/components/ui/ChoiceChips'
import Field, { TextInput } from '@/components/ui/Field'
import Tag from '@/components/ui/Tag'
import type { QuotePlatform, QuoteSource } from './page'

// Shared between AddQuoteModal (quote-modals.tsx) and EditQuoteModal
// (quote-edit-modal.tsx) — both need the same name/platform/organization/
// detail/source-link fields for a person/document/ai-attributed quote, and
// duplicating that block across create and edit was pushing both files past
// the project's ~500-line convention (CONTRIBUTING.md).

export type SourcedType = Exclude<QuoteSource, 'member'>

export const DETAIL_FIELD_LABEL: Record<SourcedType, string> = {
  person: 'Title / affiliation',
  document: 'Publisher / year',
  ai: 'Provider',
}

// 'person' quotes only — which social platform the post came from, so the
// card shows that platform's icon instead of the generic person glyph.
export const PLATFORM_OPTIONS: { value: QuotePlatform | ''; label: string }[] = [
  { value: '', label: 'None' },
  { value: 'x', label: 'X' },
  { value: 'linkedin', label: 'LinkedIn' },
]

export function useSourceOrganizations(enabled: boolean) {
  const [organizations, setOrganizations] = useState<SourceOrganizationOption[]>([])
  useEffect(() => {
    if (!enabled) return
    getSourceOrganizations().then(setOrganizations).catch(() => {})
  }, [enabled])
  return [organizations, setOrganizations] as const
}

export function matchOrganization(organizations: SourceOrganizationOption[], orgName: string): SourceOrganizationOption | null {
  const key = orgName.trim().toLowerCase()
  return organizations.find((o) => o.name.trim().toLowerCase() === key) ?? null
}

export function TagInput({ tags, onChange }: { tags: string[]; onChange: (tags: string[]) => void }) {
  const [draft, setDraft] = useState('')

  function addTag(raw: string) {
    const tag = raw.trim()
    if (tag && !tags.includes(tag)) onChange([...tags, tag])
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

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-control border border-field-line bg-white px-3 py-2 focus-within:border-umber focus-within:outline-2 focus-within:outline-offset-1 focus-within:outline-umber">
      {tags.map((tag) => (
        <Tag key={tag} className="inline-flex items-center gap-1">
          {tag}
          <button
            type="button"
            onClick={() => onChange(tags.filter((t) => t !== tag))}
            className="-my-2 inline-flex min-h-11 min-w-8 items-center justify-center leading-none text-umber-soft hover:text-umber focus-ring"
            aria-label={`Remove ${tag}`}
          >
            ×
          </button>
        </Tag>
      ))}
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => { if (draft.trim()) addTag(draft) }}
        placeholder={tags.length === 0 ? 'Type a tag and press Enter' : ''}
        className="min-h-8 min-w-[100px] flex-1 bg-transparent font-ui text-base text-umber outline-none placeholder:text-umber-soft"
      />
    </div>
  )
}

export interface SourcedQuoteFieldsState {
  sourceName: string
  setSourceName: (v: string) => void
  sourceDetail: string
  setSourceDetail: (v: string) => void
  sourceUrl: string
  setSourceUrl: (v: string) => void
  platform: QuotePlatform | ''
  setPlatform: (v: QuotePlatform | '') => void
  orgName: string
  setOrgName: (v: string) => void
  orgLogoFile: File | null
  setOrgLogoFile: (f: File | null) => void
}

// Name + (Platform | Organization, mutually exclusive by type) + Detail +
// Source link. Doesn't render the attribution-type switcher itself (add and
// edit each have a different valid set of switch options) or the Quote/Tags
// fields below it — callers wrap this in their own bordered container.
export function SourcedQuoteFields({
  idPrefix,
  sourceType,
  organizations,
  disabled,
  state,
}: {
  idPrefix: string
  sourceType: SourcedType
  organizations: SourceOrganizationOption[]
  disabled: boolean
  state: SourcedQuoteFieldsState
}) {
  const orgLogoInputRef = useRef<HTMLInputElement>(null)
  const {
    sourceName, setSourceName,
    sourceDetail, setSourceDetail,
    sourceUrl, setSourceUrl,
    platform, setPlatform,
    orgName, setOrgName,
    orgLogoFile, setOrgLogoFile,
  } = state
  const matchedOrg = matchOrganization(organizations, orgName)

  return (
    <>
      <Field id={`${idPrefix}-name`} label="Name">
        {(p) => (
          <TextInput
            {...p}
            value={sourceName}
            onChange={(e) => setSourceName(e.target.value)}
            maxLength={200}
            placeholder={sourceType === 'document' ? 'Document title…' : sourceType === 'ai' ? 'Model name…' : 'Full name…'}
            disabled={disabled}
          />
        )}
      </Field>

      {sourceType === 'person' && (
        <ChoiceChips
          label="Platform (optional — from a social post)"
          options={PLATFORM_OPTIONS}
          value={platform}
          onChange={setPlatform}
          disabled={disabled}
          className="grid-cols-3"
        />
      )}

      {(sourceType === 'document' || sourceType === 'ai') && (
        <div>
          <Field id={`${idPrefix}-org`} label="Organization (optional — shows a logo on the card)">
            {(p) => (
              <TextInput
                {...p}
                list={`${idPrefix}-org-list`}
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                maxLength={200}
                placeholder="e.g. OpenAI"
                disabled={disabled}
              />
            )}
          </Field>
          <datalist id={`${idPrefix}-org-list`}>
            {organizations.map((org) => (
              <option key={org.id} value={org.name} />
            ))}
          </datalist>
          {orgName.trim() && matchedOrg && (
            <p className="mt-2 flex items-center gap-2 font-ui text-caption text-umber-soft">
              {/* eslint-disable-next-line @next/next/no-img-element -- tiny inline preview of an already-uploaded logo */}
              <img src={matchedOrg.logo_url} alt="" className="h-4 w-4 object-contain" />
              Reusing the saved logo for {matchedOrg.name}.
            </p>
          )}
          {orgName.trim() && !matchedOrg && (
            <div className="mt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => orgLogoInputRef.current?.click()}
                disabled={disabled}
                className="min-h-11 font-ui text-ui-sm text-cobalt underline underline-offset-2 transition-colors hover:text-umber focus-ring disabled:opacity-50"
              >
                {orgLogoFile ? `Logo selected: ${orgLogoFile.name}` : 'Upload a logo for this organization'}
              </button>
              <input
                ref={orgLogoInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
                disabled={disabled}
                onChange={(e) => setOrgLogoFile(e.target.files?.[0] ?? null)}
              />
            </div>
          )}
          <p className="mt-2 font-ui text-caption text-umber-soft">
            New here? Upload its logo once — every future quote from this organization reuses it automatically.
          </p>
        </div>
      )}

      <Field id={`${idPrefix}-detail`} label={`${DETAIL_FIELD_LABEL[sourceType]} (optional)`}>
        {(p) => (
          <TextInput {...p} value={sourceDetail} onChange={(e) => setSourceDetail(e.target.value)} maxLength={200} disabled={disabled} />
        )}
      </Field>
      <Field id={`${idPrefix}-url`} label="Source link" hint="Required — this is what the reader taps to verify the quote.">
        {(p) => (
          <TextInput
            {...p}
            type="url"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            placeholder="https://…"
            disabled={disabled}
          />
        )}
      </Field>
    </>
  )
}

// Shared by AddQuoteModal and EditQuoteModal's submit handlers: resolves an
// organization name typed into the field to a source_org_id, uploading a
// new logo first if the name doesn't match a saved organization and the
// admin picked a file for it. Returns an error string on upload failure.
export async function resolveSourceOrgId(
  sourceType: SourcedType,
  orgName: string,
  orgLogoFile: File | null,
  organizations: SourceOrganizationOption[],
  onSaved: (org: SourceOrganizationOption) => void,
): Promise<{ sourceOrgId: string | null; error?: string }> {
  if ((sourceType !== 'document' && sourceType !== 'ai') || !orgName.trim()) {
    return { sourceOrgId: null }
  }

  const matched = matchOrganization(organizations, orgName)
  if (matched) return { sourceOrgId: matched.id }
  if (!orgLogoFile) return { sourceOrgId: null }

  const fd = new FormData()
  fd.append('file', orgLogoFile)
  const result = await uploadSourceOrganizationLogo(orgName, fd)
  if (result.error) return { sourceOrgId: null, error: result.error }
  if (result.organization) {
    onSaved(result.organization)
    return { sourceOrgId: result.organization.id }
  }
  return { sourceOrgId: null }
}
