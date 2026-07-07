// Shared avatar primitive — consolidates 6 near-identical implementations
// (UserCard, QuoteCard, home, EditProfileModal, ProfileView, BriefView) that
// each hand-rolled their own size scale, initials fallback, and background
// treatment. Every size/palette/ring combination below reproduces one of
// those screens' exact prior appearance — see the callers for which token
// maps to which screen.

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'
export type AvatarPalette = 'gray' | 'colored'

// (width/height, initials text size) per token — every distinct combination
// found across the app, named by ascending pixel size.
const SIZE_CLASSES: Record<AvatarSize, string> = {
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
  // Ring classes applied only to real avatar images (matches prior behavior —
  // none of the source screens ringed the colored-initials fallback).
  ringClassName?: string
}

export default function Avatar({
  name,
  avatarUrl,
  size = 'md',
  palette = 'gray',
  ringClassName,
}: AvatarProps) {
  const sizeClasses = SIZE_CLASSES[size]

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={`${sizeClasses} rounded-full object-cover shrink-0 ${ringClassName ?? ''}`}
      />
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
