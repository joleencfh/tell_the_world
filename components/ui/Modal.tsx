'use client'

import { useEffect, useId, useRef, useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import { cn } from './cn'
import { Icon } from './icons'

// Modal (design-system.md 3.7). The behaviour is part of the component:
//   - labelled by its title (role="dialog", aria-modal, aria-labelledby);
//   - focus moves to the title on open and whenever `focusKey` changes (a new
//     step), Tab is trapped inside, Escape and a click on the scrim close it;
//   - the rest of the page (#app-root, set in app/layout.tsx, and any modal
//     underneath this one) is `inert`, so it cannot be tabbed into, clicked or
//     read by a screen reader;
//   - focus returns to whatever opened it;
//   - on mobile it is a bottom sheet.
//
// The caller owns `open`. `onClose` is a REQUEST to close (Escape, scrim,
// the X button); set `open` to false in it. The panel then plays its exit
// animation and calls `onExited`, which is the place to unmount or reset.

type ModalSize = 'default' | 'narrow' | 'reading'

const SIZES: Record<ModalSize, string> = {
  default: 'max-w-[520px]',
  narrow: 'max-w-narrow',
  reading: 'max-w-reading',
}

// Matches .anim-modal-panel-out's duration in app/globals.css.
const EXIT_MS = 180

const FOCUSABLE =
  'a[href], button:not(:disabled), input:not(:disabled):not([type=hidden]), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'

// Open modals, topmost last. Only the topmost one reacts to the keyboard, so
// a ConfirmDialog opened from a Modal closes on its own Escape first.
const openStack: string[] = []

const subscribeNone = () => () => {}

export interface ModalProps {
  open: boolean
  onClose: () => void
  onExited?: () => void
  /** Plain text or a node; rendered as the dialog's heading. */
  title: React.ReactNode
  /** Small content above the title: a mono label, or the circle pair. */
  eyebrow?: React.ReactNode
  size?: ModalSize
  /** Change it when the content moves to a new step: focus returns to the title. */
  focusKey?: React.Key
  /** false makes Escape, the scrim and the X button inert (e.g. while saving). */
  dismissible?: boolean
  children: React.ReactNode
}

export default function Modal({
  open,
  onClose,
  onExited,
  title,
  eyebrow,
  size = 'default',
  focusKey,
  dismissible = true,
  children,
}: ModalProps) {
  const isClient = useSyncExternalStore(subscribeNone, () => true, () => false)
  const [mounted, setMounted] = useState(open)
  if (open && !mounted) setMounted(true)
  const closing = mounted && !open

  const uid = useId()
  const headingId = `${uid}-title`
  const backdropRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const opener = useRef<HTMLElement | null>(null)

  // Keep the latest callbacks without re-running the open/close effect.
  const onCloseRef = useRef(onClose)
  const onExitedRef = useRef(onExited)
  const dismissibleRef = useRef(dismissible)
  useEffect(() => {
    onCloseRef.current = onClose
    onExitedRef.current = onExited
    dismissibleRef.current = dismissible
  })

  // Exit: play the animation, then unmount.
  useEffect(() => {
    if (!closing) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const t = setTimeout(
      () => {
        setMounted(false)
        onExitedRef.current?.()
      },
      reduced ? 0 : EXIT_MS,
    )
    return () => clearTimeout(t)
  }, [closing])

  const active = isClient && mounted && open

  // While open: remember the opener, make everything else inert, lock scroll,
  // take part in the keyboard stack. Undo all of it on close.
  useEffect(() => {
    if (!active) return
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null

    const inerted: HTMLElement[] = []
    const behind = [
      document.getElementById('app-root'),
      ...Array.from(document.querySelectorAll<HTMLElement>('[data-modal-portal]')),
    ]
    for (const el of behind) {
      if (el && el !== backdropRef.current && !el.inert) {
        el.inert = true
        inerted.push(el)
      }
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    openStack.push(uid)

    function onKeyDown(e: KeyboardEvent) {
      if (openStack[openStack.length - 1] !== uid) return
      if (e.key === 'Escape') {
        if (dismissibleRef.current) {
          e.preventDefault()
          onCloseRef.current()
        }
        return
      }
      if (e.key !== 'Tab' || !panelRef.current) return
      const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null,
      )
      if (items.length === 0) {
        e.preventDefault()
        titleRef.current?.focus()
        return
      }
      const first = items[0]
      const last = items[items.length - 1]
      const current = document.activeElement
      if (e.shiftKey && (current === first || current === titleRef.current)) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && current === last) {
        e.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', onKeyDown)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      const at = openStack.indexOf(uid)
      if (at !== -1) openStack.splice(at, 1)
      document.body.style.overflow = previousOverflow
      for (const el of inerted) el.inert = false
      const back = opener.current
      if (back && back.isConnected) back.focus()
    }
  }, [active, uid])

  // Focus the title on open and on each new step.
  useEffect(() => {
    if (active) titleRef.current?.focus()
  }, [active, focusKey])

  if (!isClient || !mounted) return null

  return createPortal(
    <div
      ref={backdropRef}
      data-modal-portal=""
      className={cn(
        'fixed inset-0 z-[var(--z-modal)] flex items-end justify-center overflow-y-auto bg-scrim md:items-center md:p-8',
        closing ? 'anim-modal-backdrop-out' : 'anim-modal-backdrop-in',
      )}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && dismissible) onClose()
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        className={cn(
          'relative max-h-dvh w-full overflow-y-auto rounded-control bg-vellum px-5 pb-7 pt-6 font-ui text-umber shadow-modal max-md:rounded-b-none md:px-8 md:py-8',
          SIZES[size],
          closing ? 'anim-modal-panel-out' : 'anim-modal-panel-in',
        )}
      >
        {dismissible && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-2 top-2 grid size-11 place-items-center rounded-control text-umber transition-colors hover:bg-bone focus-ring"
          >
            <Icon name="x" />
          </button>
        )}
        <div key={focusKey} className="anim-step-in pr-8">
          {eyebrow && <div className="font-mono text-label uppercase text-umber-soft">{eyebrow}</div>}
          <h2
            id={headingId}
            ref={titleRef}
            tabIndex={-1}
            className="m-0 mb-2.5 mt-2.5 font-serif text-[1.875rem] font-normal leading-[1.05] tracking-[-0.02em] text-umber outline-none md:text-[2.125rem]"
          >
            {title}
          </h2>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  )
}
