'use client'

import Link from 'next/link'
import { useEffect, useId, useRef, useState } from 'react'
import { cn } from './cn'

// Menu / dropdown (design-system.md 3.7). role="menu" with arrow keys, Home
// and End, Escape closes and returns focus to the trigger, Tab and an outside
// click close it. A destructive item is brick.

export interface MenuItem {
  label: string
  /** Internal path (client navigation) or absolute URL. */
  href?: string
  onSelect?: () => void
  destructive?: boolean
}

export default function Menu({
  label,
  trigger,
  items,
  align = 'right',
  triggerClassName,
}: {
  /** Accessible name of the trigger button, e.g. "Account menu". */
  label: string
  /** What the trigger shows: an Avatar, a word, an icon. */
  trigger: React.ReactNode
  items: MenuItem[]
  align?: 'left' | 'right'
  triggerClassName?: string
}) {
  const [open, setOpen] = useState(false)
  const uid = useId()
  const menuId = `${uid}-menu`
  const wrapRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const itemRefs = useRef<(HTMLElement | null)[]>([])
  // Which item gets focus when the menu opens (ArrowUp opens on the last).
  const openAt = useRef<'first' | 'last'>('first')

  function close(returnFocus: boolean) {
    setOpen(false)
    if (returnFocus) triggerRef.current?.focus()
  }

  // Focus the first (or last) item when it opens.
  useEffect(() => {
    if (!open) return
    const list = itemRefs.current.filter(Boolean) as HTMLElement[]
    ;(openAt.current === 'last' ? list[list.length - 1] : list[0])?.focus()
  }, [open])

  // Outside pointer press closes without stealing focus from where it went.
  useEffect(() => {
    if (!open) return
    function onPointerDown(e: PointerEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  function onTriggerKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      openAt.current = e.key === 'ArrowUp' ? 'last' : 'first'
      setOpen(true)
    }
  }

  function onMenuKeyDown(e: React.KeyboardEvent) {
    const list = itemRefs.current.filter(Boolean) as HTMLElement[]
    const at = list.indexOf(document.activeElement as HTMLElement)
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      list[(at + 1) % list.length]?.focus()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      list[(at - 1 + list.length) % list.length]?.focus()
    } else if (e.key === 'Home') {
      e.preventDefault()
      list[0]?.focus()
    } else if (e.key === 'End') {
      e.preventDefault()
      list[list.length - 1]?.focus()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      close(true)
    } else if (e.key === 'Tab') {
      close(false)
    }
  }

  const itemClass = (destructive?: boolean) =>
    cn(
      'flex min-h-11 w-full items-center px-3 text-left font-ui text-ui hover:bg-bone focus-visible:bg-bone focus-visible:outline-none',
      destructive ? 'text-brick' : 'text-umber',
    )

  return (
    <div ref={wrapRef} className="relative inline-block">
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => {
          openAt.current = 'first'
          setOpen((v) => !v)
        }}
        onKeyDown={onTriggerKeyDown}
        className={cn(
          'inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-control font-ui text-ui text-umber transition-colors duration-150 ease-standard hover:bg-bone focus-ring',
          triggerClassName,
        )}
      >
        {trigger}
      </button>
      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label={label}
          onKeyDown={onMenuKeyDown}
          className={cn(
            'absolute top-full z-[var(--z-dropdown)] mt-1 min-w-48 rounded-control bg-vellum py-1 shadow-menu',
            align === 'right' ? 'right-0' : 'left-0',
          )}
        >
          {items.map((item, i) => {
            const common = {
              role: 'menuitem' as const,
              tabIndex: -1,
              className: itemClass(item.destructive),
              ref: (el: HTMLElement | null) => {
                itemRefs.current[i] = el
              },
              onClick: () => {
                close(true)
                item.onSelect?.()
              },
            }
            return item.href ? (
              <Link key={item.label} href={item.href} {...common}>
                {item.label}
              </Link>
            ) : (
              <button key={item.label} type="button" {...common}>
                {item.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
