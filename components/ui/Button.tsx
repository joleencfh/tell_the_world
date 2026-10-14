import type { ButtonHTMLAttributes, Ref } from 'react'
import { cn } from './cn'

// Button (design-system.md 3.1). One size contract for every variant: 44px
// min height (36px `sm` from md up), a 2px transparent border so a bordered
// and an unbordered variant never differ in size.

export type ButtonVariant = 'primary' | 'rose' | 'cobalt' | 'secondary' | 'ghost' | 'danger'

const BASE =
  'inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-control border-2 border-transparent font-ui text-ui font-medium leading-none transition-colors duration-150 ease-standard focus-ring active:scale-[.97] disabled:cursor-not-allowed disabled:bg-disabled disabled:text-umber-soft disabled:active:scale-100'

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-umber text-parchment hover:bg-umber-hover',
  rose: 'bg-rose text-white hover:bg-rose-deep',
  cobalt: 'bg-cobalt text-white hover:bg-cobalt-deep',
  secondary: 'bg-bone text-umber hover:bg-window-line',
  ghost: 'text-umber hover:bg-bone',
  danger: 'bg-brick text-white hover:bg-brick-deep',
}

// Padding is chosen, never overridden: two padding utilities on one element
// would be decided by stylesheet order, not by the class list.
const PADDING = 'px-[22px]'
const PADDING_SMALL = 'px-[22px] md:min-h-9 md:px-3.5 md:text-ui-sm'
const ICON_ONLY = 'size-11 shrink-0'

/** The class string for a Button, for the rare link that has to look like one. */
export function buttonClasses({
  variant = 'primary',
  small = false,
  icon = false,
  fullWidth = false,
  className,
}: {
  variant?: ButtonVariant
  small?: boolean
  icon?: boolean
  fullWidth?: boolean
  className?: string
} = {}): string {
  const size = icon ? ICON_ONLY : small ? PADDING_SMALL : PADDING
  return cn(BASE, VARIANTS[variant], size, fullWidth && 'w-full', className)
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  /** 36px on desktop; still 44px under md. */
  small?: boolean
  /** Square icon button. Needs an aria-label. */
  icon?: boolean
  fullWidth?: boolean
  /**
   * Pending look: disabled fill with the present-tense label (pass it as
   * children, "Joining…"). Same size, not clickable, aria-busy.
   */
  pending?: boolean
  ref?: Ref<HTMLButtonElement>
}

export default function Button({
  variant = 'primary',
  small,
  icon,
  fullWidth,
  pending,
  className,
  disabled,
  type = 'button',
  ref,
  ...rest
}: ButtonProps) {
  const pendingLook = pending ? 'cursor-not-allowed bg-disabled text-umber-soft active:scale-100' : undefined
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      className={cn(buttonClasses({ variant, small, icon, fullWidth }), pendingLook, className)}
      {...rest}
    />
  )
}
