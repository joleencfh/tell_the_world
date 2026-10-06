'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

const itemClass =
  'flex min-h-11 items-center px-4 text-ui-sm text-umber-soft hover:bg-rule/40 hover:text-umber'

// Mobile-only menu for the header's secondary links (Blog, Sign in).
export default function MobileMenu({ blogUrl }: { blogUrl: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointer = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} className="relative md:hidden">
      <button
        type="button"
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex size-11 items-center justify-center rounded-control text-umber hover:bg-rule/40"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
          {open ? (
            <path d="M4 4l12 12M16 4L4 16" />
          ) : (
            <path d="M3 5h14M3 10h14M3 15h14" />
          )}
        </svg>
      </button>
      {open && (
        <div
          id="mobile-menu"
          className="absolute right-0 top-full z-30 mt-2 w-44 overflow-hidden rounded-control border border-rule bg-parchment py-1 shadow-lg"
        >
          <a
            href={blogUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={itemClass}
            onClick={() => setOpen(false)}
          >
            Blog
          </a>
          <Link href="/login" className={itemClass} onClick={() => setOpen(false)}>
            Sign in
          </Link>
        </div>
      )}
    </div>
  )
}
