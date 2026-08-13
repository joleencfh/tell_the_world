// Shared avatar primitive — consolidates 6 near-identical implementations
// (UserCard, QuoteCard, home, EditProfileModal, ProfileView, BriefView) that
// each hand-rolled their own size scale, initials fallback, and background
// treatment. Every size/palette/ring combination below reproduces one of
// those screens' exact prior appearance — see the callers for which token
// maps to which screen.

export type AvatarSize = '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'
export type AvatarPalette = 'gray' | 'colored' | 'blue'
export type AvatarShape = 'circle' | 'square'

// (width/height, initials text size) per token — every distinct combination
// found across the app, named by ascending pixel size. '2xs' is for the
// Community Q&A card's thin metadata bar (two-ink-bold-plan.md Part 5
// redesign, 2026-08-13) — every other token was already spoken for by an
// existing screen and too big for that context.
const SIZE_CLASSES: Record<AvatarSize, string> = {
  '2xs': 'w-[18px] h-[18px] text-[7px]',
  xs: 'w-8 h-8 text-xs',
  sm: 'w-9 h-9 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-11 h-11 text-sm',
  xl: 'w-12 h-12 text-base',
  '2xl': 'w-14 h-14 text-base',
  '3xl': 'w-20 h-20 text-2xl',
}

// Rotating background for the "colored" palette — same 5 colors used by
// UserCard, QuoteCard, and BriefView before this consolidation.
const COLORED_BACKGROUNDS = [
  'bg-amber-700',
  'bg-emerald-700',
  'bg-sky-700',
  'bg-purple-700',
  'bg-rose-700',
]

function initials(name: string): string {
  return name.charAt(0).toUpperCase()
}

export interface AvatarProps {
  name: string
  avatarUrl: string | null
  size?: AvatarSize
  palette?: AvatarPalette
  // 'square' is only meaningful with palette="blue" — the Two-Ink Bold
  // convention for distinguishing an organisation avatar (square, blue-ink)
  // from an individual's (circle, blue). Other palettes ignore it.
  shape?: AvatarShape
  // Ring classes applied only to real avatar images (matches prior behavior —
  // none of the source screens ringed the colored-initials fallback).
  ringClassName?: string
}

export default function Avatar({
  name,
  avatarUrl,
  size = 'md',
  palette = 'gray',
  shape = 'circle',
  ringClassName,
}: AvatarProps) {
  const sizeClasses = SIZE_CLASSES[size]
  const shapeClass = shape === 'square' ? 'rounded' : 'rounded-full'

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={`${sizeClasses} ${shapeClass} object-cover shrink-0 ${ringClassName ?? ''}`}
      />
    )
  }

  if (palette === 'blue') {
    const bg = shape === 'square' ? 'bg-blue-ink' : 'bg-blue'
    return (
      <div
        className={`${sizeClasses} ${shapeClass} ${bg} flex items-center justify-center shrink-0 select-none`}
      >
        <span className="text-white font-bold">{initials(name)}</span>
      </div>
    )
  }

  if (palette === 'colored') {
    const bg = COLORED_BACKGROUNDS[name.charCodeAt(0) % COLORED_BACKGROUNDS.length]
    return (
      <div
        className={`${sizeClasses} ${bg} rounded-full flex items-center justify-center shrink-0 select-none`}
      >
        <span className="text-white font-bold">{initials(name)}</span>
      </div>
    )
  }

  return (
    <div
      className={`${sizeClasses} rounded-full bg-gray-200 text-gray-600 font-semibold flex items-center justify-center shrink-0 select-none`}
    >
      {initials(name)}
    </div>
  )
}
