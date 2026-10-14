import type { InputHTMLAttributes, Ref } from 'react'
import { cn } from './cn'

// Checkbox (design-system.md 3.2): 24px box, 2px umber border, rounded-tag.
// The whole label row is the target (44px min). The native input is visually
// hidden but stays the real control, so keyboard and screen readers get a
// real checkbox; the box is drawn from its state.
export default function Checkbox({
  label,
  className,
  ref,
  ...rest
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: React.ReactNode
  ref?: Ref<HTMLInputElement>
}) {
  return (
    <label className={cn('flex min-h-11 cursor-pointer items-start gap-3 font-ui text-ui text-umber', className)}>
      <input ref={ref} type="checkbox" className="peer sr-only" {...rest} />
      <span
        aria-hidden
        className="mt-px grid size-6 shrink-0 place-items-center rounded-tag border-2 border-umber bg-white text-umber peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-umber peer-disabled:border-disabled peer-disabled:bg-disabled [&>svg]:opacity-0 peer-checked:[&>svg]:opacity-100"
      >
        <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
          <path d="M4 10.5L8 14.5L16 5.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="pt-0.5 leading-snug">{label}</span>
    </label>
  )
}
