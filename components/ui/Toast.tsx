'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { cn } from './cn'
import { ALERT_TONES, type AlertTone } from './Alert'
import { Icon } from './icons'

// Toast (design-system.md 3.6). Immediate feedback on what the user just did;
// email is the notification channel, so toasts are never used for news.
// Success and info go away after 6s; errors and anything with an action stay
// until dismissed. Hovering or focusing a toast pauses its timer. Two
// persistent live regions (polite status, assertive alert) hold the toasts so
// screen readers announce them reliably.
//
//   const { toast } = useToast()
//   toast({ tone: 'success', message: 'Quote published.' })

export interface ToastOptions {
  tone?: AlertTone
  message: string
  action?: { label: string; onClick: () => void }
}

interface ToastItem extends ToastOptions {
  id: number
  tone: AlertTone
}

interface ToastContextValue {
  toast: (options: ToastOptions) => number
  dismiss: (id: number) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}

const AUTO_DISMISS_MS = 6000

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const nextId = useRef(1)

  const dismiss = useCallback((id: number) => setItems((list) => list.filter((t) => t.id !== id)), [])
  const toast = useCallback((options: ToastOptions) => {
    const id = nextId.current++
    setItems((list) => [...list, { ...options, id, tone: options.tone ?? 'info' }])
    return id
  }, [])

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss])
  const stack = "flex w-full flex-col items-center gap-2 md:items-end"

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[var(--z-toast)] p-4 md:inset-x-auto md:right-0">
        <div role="status" className={stack}>
          {items
            .filter((t) => t.tone !== "danger")
            .map((t) => (
              <ToastCard key={t.id} item={t} onDismiss={dismiss} />
            ))}
        </div>
        <div role="alert" className={stack}>
          {items
            .filter((t) => t.tone === "danger")
            .map((t) => (
              <ToastCard key={t.id} item={t} onDismiss={dismiss} />
            ))}
        </div>
      </div>
    </ToastContext.Provider>
  )
}

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: (id: number) => void }) {
  const tone = ALERT_TONES[item.tone]
  const sticky = item.tone === 'danger' || !!item.action
  const remaining = useRef(AUTO_DISMISS_MS)
  const startedAt = useRef(0)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const pause = useCallback(() => {
    if (timer.current === undefined) return
    clearTimeout(timer.current)
    timer.current = undefined
    remaining.current -= Date.now() - startedAt.current
  }, [])

  const resume = useCallback(() => {
    if (sticky || timer.current !== undefined) return
    startedAt.current = Date.now()
    timer.current = setTimeout(() => onDismiss(item.id), Math.max(remaining.current, 0))
  }, [sticky, item.id, onDismiss])

  useEffect(() => {
    resume()
    return pause
  }, [resume, pause])

  return (
    <div
      onMouseEnter={pause}
      onMouseLeave={resume}
      onFocus={pause}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) resume()
      }}
      className="anim-step-in pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-control bg-vellum py-3 pl-4 pr-2 font-ui text-ui-sm text-umber shadow-menu"
    >
      <Icon name={tone.icon} className={cn('mt-0.5 shrink-0', tone.accent)} />
      <p className="min-w-0 flex-1 py-px">{item.message}</p>
      {item.action && (
        <button
          type="button"
          onClick={() => {
            item.action?.onClick()
            onDismiss(item.id)
          }}
          className="min-h-9 shrink-0 rounded-control px-2.5 font-medium underline underline-offset-4 hover:bg-bone focus-ring"
        >
          {item.action.label}
        </button>
      )}
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => onDismiss(item.id)}
        className="grid size-9 shrink-0 place-items-center rounded-control text-umber-soft hover:bg-bone hover:text-umber focus-ring"
      >
        <Icon name="x" />
      </button>
    </div>
  )
}
