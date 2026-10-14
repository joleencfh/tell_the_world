import type { UserRole } from '@/lib/types'
import { cn } from './cn'
import { ROLE_SIDE } from './RoleLabel'

// Avatar (design-system.md 3.4). A real image if there is one, otherwise the
// initial in white on a fill chosen by ROLE, not by name: creators and
// journalists rose-deep, experts cobalt, organisations a cobalt-deep SQUARE,
// everyone else umber-soft. The rotating five-hue palette retired.
//
// Compatibility: callers written before the design system pass `palette` and
// `shape` instead of `role`. They are mapped as follows until each screen is
// migrated and passes `role`:
//   palette="blue" + shape="square"    -> organisation
//   palette="blue"                     -> expert
//   palette="colored" + shape="square" -> organisation
//   anything else                      -> neutral
// New code should pass `role` and nothing else.

export type AvatarSize = '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'
export type AvatarPalette = 'gray' | 'colored' | 'blue'
export type AvatarShape = 'circle' | 'square'

// Box size and initial size per token. The initial never goes under the 12px
// floor, so the smallest avatar (18px) is a tight fit by design.
const BOX: Record<AvatarSize, string> = {
  '2xs': 'size-[18px]',
  xs: 'size-8',
  sm: 'size-9',
  md: 'size-10',
  lg: 'size-11',
  xl: 'size-12',
  '2xl': 'size-14',
  '3xl': 'size-20',
}

const INITIAL: Record<AvatarSize, string> = {
  '2xs': 'text-label tracking-normal',
  xs: 'text-ui-sm',
  sm: 'text-ui-sm',
  md: 'text-ui',
  lg: 'text-ui',
  xl: 'text-lg',
  '2xl': 'text-lg',
  '3xl': 'text-3xl',
}

type Fill = { className: string; square: boolean }

function fillFor(role: UserRole | undefined, palette: AvatarPalette, shape: AvatarShape): Fill {
  if (role === 'organisation') return { className: 'bg-cobalt-deep', square: true }
  if (role) {
    const side = ROLE_SIDE[role]
    if (side === 'rose') return { className: 'bg-rose-deep', square: false }
    if (side === 'cobalt') return { className: 'bg-cobalt', square: false }
    return { className: 'bg-umber-soft', square: false }
  }
  // Compatibility mapping for pre-design-system callers (see above).
  if (palette === 'blue') {
    return shape === 'square'
      ? { className: 'bg-cobalt-deep', square: true }
      : { className: 'bg-cobalt', square: false }
  }
  if (palette === 'colored' && shape === 'square') return { className: 'bg-cobalt-deep', square: true }
  return { className: 'bg-umber-soft', square: false }
}

export interface AvatarProps {
  name: string
  avatarUrl: string | null
  size?: AvatarSize
  /** The person's role. Chooses the fill and the shape. */
  role?: UserRole
  /** @deprecated Use `role`. Kept so existing callers keep working. */
  palette?: AvatarPalette
  /** @deprecated Use `role`. Square means organisation. */
  shape?: AvatarShape
  /** Ring classes applied only to real avatar images. */
  ringClassName?: string
}

export default function Avatar({
  name,
  avatarUrl,
  size = 'md',
  role,
  palette = 'gray',
  shape = 'circle',
  ringClassName,
}: AvatarProps) {
  const fill = fillFor(role, palette, shape)
  const shapeClass = fill.square ? 'rounded-control' : 'rounded-full'

  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={avatarUrl} alt={name} className={cn('shrink-0 object-cover', BOX[size], shapeClass, ringClassName)} />
    )
  }

  return (
    <div
      className={cn(
        'flex shrink-0 select-none items-center justify-center font-ui font-semibold leading-none text-white',
        BOX[size],
        INITIAL[size],
        shapeClass,
        fill.className,
      )}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  )
}
