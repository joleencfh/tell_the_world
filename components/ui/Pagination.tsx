import Link from 'next/link'

export interface PaginationProps {
  page: number
  pageSize: number
  total: number
  buildHref: (page: number) => string
  dark?: boolean
}

export default function Pagination({ page, pageSize, total, buildHref, dark = false }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  if (totalPages <= 1) return null

  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  const hasPrev = page > 1
  const hasNext = page < totalPages

  const borderCls = dark ? 'border-white/10' : 'border-edge'
  const mutedCls = dark ? 'text-white/40' : 'text-soft/60'
  const linkCls = dark
    ? 'text-white/70 hover:text-white transition-colors'
    : 'text-soft hover:text-text transition-colors'
  const disabledCls = dark ? 'text-white/15' : 'text-soft/30'

  return (
    <div className={`flex items-center justify-between gap-4 mt-8 pt-6 border-t ${borderCls}`}>
      <span className={`font-mono text-[9px] tracking-[0.15em] uppercase ${mutedCls}`}>
        Showing {from}–{to} of {total}
      </span>
      <nav className="flex items-center gap-4" aria-label="Pagination">
        {hasPrev ? (
          <Link href={buildHref(page - 1)} className={`font-mono text-[10px] tracking-[0.15em] uppercase ${linkCls}`}>
            ← Prev
          </Link>
        ) : (
          <span className={`font-mono text-[10px] tracking-[0.15em] uppercase ${disabledCls}`}>
            ← Prev
          </span>
        )}
        <span className={`font-mono text-[9px] tracking-[0.15em] uppercase ${mutedCls}`}>
          Page {page} of {totalPages}
        </span>
        {hasNext ? (
          <Link href={buildHref(page + 1)} className={`font-mono text-[10px] tracking-[0.15em] uppercase ${linkCls}`}>
            Next →
          </Link>
        ) : (
          <span className={`font-mono text-[10px] tracking-[0.15em] uppercase ${disabledCls}`}>
            Next →
          </span>
        )}
      </nav>
    </div>
  )
}
