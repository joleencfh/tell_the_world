// ---------------------------------------------------------------------------
// Role labels
// ---------------------------------------------------------------------------

export const ROLE_LABELS: Record<string, string> = {
  creator:      'Creator',
  journalist:   'Journalist',
  expert:       'Expert',
  organisation: 'Organisation',
  comms_specialist: 'Comms Specialist',
  other:        'Other',
}

// ---------------------------------------------------------------------------
// Field display helpers
// ---------------------------------------------------------------------------

export const REFERRAL_LABELS: Record<string, string> = {
  search_engine:      'Search engine',
  social_media:       'Social media',
  word_of_mouth:      'Word of mouth / colleague',
  newsletter_podcast: 'Newsletter or podcast',
  linkedin:           'LinkedIn',
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (!value && value !== 0) return null
  return (
    <div className="grid grid-cols-1 gap-1 border-b border-rule py-2.5 last:border-0 sm:grid-cols-[160px_1fr] sm:gap-3">
      <span className="pt-0.5 font-mono text-label uppercase text-umber-soft">{label}</span>
      <span className="break-words font-ui text-ui-sm leading-relaxed text-umber">{String(value)}</span>
    </div>
  )
}

export function LinkField({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div className="grid grid-cols-1 gap-1 border-b border-rule py-2.5 last:border-0 sm:grid-cols-[160px_1fr] sm:gap-3">
      <span className="pt-0.5 font-mono text-label uppercase text-umber-soft">{label}</span>
      <a
        href={value}
        target="_blank"
        rel="noopener noreferrer"
        className="break-all font-ui text-ui-sm text-cobalt underline focus-ring"
      >
        {value}
      </a>
    </div>
  )
}
