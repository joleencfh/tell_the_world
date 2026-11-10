import Link from 'next/link'
import { buttonClasses } from './Button'
import { cn } from './cn'

export interface PaginationProps {
  page: number
  pageSize: number
  total: number
  buildHref: (page: number) => string
  /** For use on the inverse (dark) surface. */
  dark?: boolean
}

// Same box as a small secondary Button, for the controls that cannot be used.
const DISABLED_BASE =
  'inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-control border-2 border-transparent px-[22px] font-ui text-ui font-medium leading-none md:min-h-9 md:px-3.5 md:text-ui-sm'

export default function Pagination({ page, pageSize, total, buildHref, dark = false }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  if (totalPages <= 1) return null

  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  const hasPrev = page > 1
  const hasNext = page < totalPages
  // First/Last are redundant with Prev/Next once there are only two pages —
  // only show the jump controls when there's an actual middle to skip.
  const showJump = totalPages > 2

  const ruleCls = dark ? 'border-inverse-soft' : 'border-rule'
  const mutedCls = dark ? 'text-inverse-soft' : 'text-umber-soft'
  const linkCls = dark
    ? cn(DISABLED_BASE, 'border-inverse-soft text-parchment hover:bg-umber-hover focus-ring')
    : buttonClasses({ variant: 'secondary', small: true })
  const disabledCls = dark
    ? cn(DISABLED_BASE, 'text-inverse-soft opacity-50')
    : cn(DISABLED_BASE, 'bg-disabled text-umber-soft')

  function control(label: string, enabled: boolean, target: number, ariaLabel?: string) {
    return enabled ? (
      <Link href={buildHref(target)} aria-label={ariaLabel} className={linkCls}>
        {label}
      </Link>
    ) : (
      <span aria-disabled="true" className={disabledCls}>
        {label}
      </span>
    )
  }

  return (
    <div className={cn('mt-8 flex flex-wrap items-center justify-between gap-4 border-t pt-6', ruleCls)}>
      <span className={cn('font-ui text-ui-sm tabular-nums', mutedCls)}>
        Showing {from}–{to} of {total}
      </span>
      <nav className="flex flex-wrap items-center gap-2" aria-label="Pagination">
        {showJump && control('« First', hasPrev, 1, 'First page')}
        {control('← Prev', hasPrev, page - 1)}
        <span className={cn('px-1 font-ui text-ui-sm tabular-nums', mutedCls)}>
          Page {page} of {totalPages}
        </span>
        {control('Next →', hasNext, page + 1)}
        {showJump && control('Last »', hasNext, totalPages, 'Last page')}
      </nav>
    </div>
  )
}
