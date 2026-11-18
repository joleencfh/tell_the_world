// ---------------------------------------------------------------------------
// Role badges
// ---------------------------------------------------------------------------

export const ROLE_LABELS: Record<string, string> = {
  creator:      'Creator',
  journalist:   'Journalist',
  expert:       'Expert',
  organisation: 'Organisation',
  comms_specialist: 'Comms Specialist',
  other:        'Other',
}

export const ROLE_COLORS: Record<string, string> = {
  creator:      'bg-amber-100 text-amber-800',
  journalist:   'bg-blue-100 text-blue-800',
  expert:       'bg-green-100 text-green-800',
  organisation: 'bg-purple-100 text-purple-800',
  comms_specialist: 'bg-pink-100 text-pink-800',
  other:        'bg-gray-100 text-gray-600',
}

export function RoleBadge({ role }: { role: string }) {
  const colors = ROLE_COLORS[role] ?? 'bg-gray-100 text-gray-600'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 font-mono text-[9px] tracking-[0.18em] uppercase ${colors}`}>
      {ROLE_LABELS[role] ?? role}
    </span>
  )
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
    <div className="grid grid-cols-[160px_1fr] gap-3 py-2.5 border-b border-line last:border-0">
      <span className="font-mono text-[9px] tracking-[0.18em] uppercase text-ink-soft pt-0.5">{label}</span>
      <span className="font-body text-sm text-ink leading-relaxed break-words">{String(value)}</span>
    </div>
  )
}

export function LinkField({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div className="grid grid-cols-[160px_1fr] gap-3 py-2.5 border-b border-line last:border-0">
      <span className="font-mono text-[9px] tracking-[0.18em] uppercase text-ink-soft pt-0.5">{label}</span>
      <a
        href={value}
        target="_blank"
        rel="noopener noreferrer"
        className="font-body text-sm text-blue-ink hover:underline break-all"
      >
        {value}
      </a>
    </div>
  )
}
