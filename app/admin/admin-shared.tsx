import Alert from '@/components/ui/Alert'
import { cn } from '@/components/ui/cn'
import StatusChip from '@/components/ui/StatusChip'

type StatusChipProps = React.ComponentProps<typeof StatusChip>

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

// ---------------------------------------------------------------------------
// Moderation queue pieces (shared by every queue card)
// ---------------------------------------------------------------------------

/** Row of action buttons at the foot of a queue item. */
export function AdminActions({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('flex flex-wrap gap-3', className)}>{children}</div>
}

/** Inline error for a failed moderation action. Renders nothing without a message. */
export function AdminError({ message, className }: { message: string | null | undefined; className?: string }) {
  if (!message) return null
  return (
    <Alert tone="danger" className={className}>
      {message}
    </Alert>
  )
}

/**
 * Flat container for one item in a moderation queue: a header (title, meta
 * line, optional status chip), the item's content, an optional error and an
 * optional action bar.
 */
export function QueueItem({
  title,
  meta,
  status,
  error,
  actions,
  children,
  className,
  testId,
}: {
  title?: React.ReactNode
  meta?: React.ReactNode
  status?: StatusChipProps
  error?: string | null
  actions?: React.ReactNode
  children?: React.ReactNode
  className?: string
  testId?: string
}) {
  const hasHeader = title || meta || status
  return (
    <div className={cn('border border-rule bg-vellum px-5 py-4', className)} data-testid={testId}>
      {hasHeader && (
        <div className="mb-3 flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
          <div className="min-w-0 flex-1">
            {title && <div className="font-ui text-ui-sm font-semibold text-umber">{title}</div>}
            {meta && <div className="font-ui text-ui-sm text-umber-soft">{meta}</div>}
          </div>
          {status && <StatusChip {...status} className="shrink-0" />}
        </div>
      )}
      {children}
      {error && <AdminError message={error} className="mt-3" />}
      {actions && <AdminActions className="mt-4">{actions}</AdminActions>}
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
