'use client'

import { useId, useRef } from 'react'
import { cn } from './cn'

// Choice chips (design-system.md 3.2), used for roles and for filters. A real
// role="radiogroup": one tab stop, arrow keys move AND select (wrapping),
// Home/End jump. A selected chip shows a filled dot and a heavier border as
// well as its tint, so selection is never colour alone.

export type ChipTone = 'rose' | 'cobalt' | 'neutral'

export interface ChoiceOption<T extends string> {
  value: T
  label: string
  /** Tint when selected: rose, cobalt or neutral (bone). */
  tone?: ChipTone
}

const SELECTED_TINT: Record<ChipTone, string> = {
  rose: 'bg-rose-wash',
  cobalt: 'bg-cobalt-wash',
  neutral: 'bg-bone',
}

export default function ChoiceChips<T extends string>({
  label,
  options,
  value,
  onChange,
  disabled,
  className,
}: {
  /** Visible group label. */
  label: string
  options: ChoiceOption<T>[]
  value: T
  onChange: (value: T) => void
  disabled?: boolean
  /** Layout of the chip grid, e.g. "grid-cols-2 md:grid-cols-3". */
  className?: string
}) {
  const labelId = useId()
  const refs = useRef<(HTMLButtonElement | null)[]>([])

  function move(to: number) {
    const next = (to + options.length) % options.length
    onChange(options[next].value)
    refs.current[next]?.focus()
  }

  function onKeyDown(e: React.KeyboardEvent, index: number) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault()
      move(index + 1)
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault()
      move(index - 1)
    } else if (e.key === 'Home') {
      e.preventDefault()
      move(0)
    } else if (e.key === 'End') {
      e.preventDefault()
      move(options.length - 1)
    }
  }

  return (
    <div>
      <span id={labelId} className="mb-1.5 block font-ui text-caption font-medium text-umber">
        {label}
      </span>
      <div role="radiogroup" aria-labelledby={labelId} className={cn('grid gap-2', className ?? 'grid-cols-2 md:grid-cols-3')}>
        {options.map((opt, i) => {
          const selected = value === opt.value
          return (
            <button
              key={opt.value}
              ref={(el) => {
                refs.current[i] = el
              }}
              type="button"
              role="radio"
              aria-checked={selected}
              tabIndex={selected ? 0 : -1}
              disabled={disabled}
              onClick={() => onChange(opt.value)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={cn(
                'flex min-h-11 items-center justify-center gap-1.5 rounded-control px-2.5 py-2 text-center font-ui text-ui-sm font-medium leading-tight text-umber transition-colors duration-150 ease-standard focus-ring disabled:cursor-not-allowed disabled:text-umber-soft',
                selected
                  ? `border-2 border-umber px-[9px] py-[7px] before:size-3 before:shrink-0 before:rounded-full before:border before:border-umber before:bg-umber before:shadow-[inset_0_0_0_3px_var(--color-vellum)] before:content-[''] ${SELECTED_TINT[opt.tone ?? 'neutral']}`
                  : 'border border-field-line hover:bg-bone',
              )}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
