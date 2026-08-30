// Deterministic gradient "cover image" tile — same id always renders the
// same gradient, so cards with no real photo (briefs, posts, coverage) still
// look designed rather than empty. Sibling to DuotonePlaceholder.tsx rather
// than a variant of it: that component draws abstract SVG blobs sized for a
// small circular/square avatar-adjacent slot, this one is a solid CSS
// gradient rectangle meant to fill a card header or row icon at any aspect
// ratio — different enough rendering approach that forcing one prop-driven
// component to do both would mean a variant prop that swaps the entire
// render path, not just a color.
//
// Reference: "Two-Ink Bold Dashboard" artifact, .thumb-a through .thumb-e
// (home-dashboard-plan.md §2 Part 0 step 1) — gradient stops copied verbatim.

import type { CSSProperties } from 'react'

function hashKey(key: string): number {
  let hash = 0
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0
  }
  return hash
}

const THUMB_VARIANTS = [
  'radial-gradient(130% 150% at 12% 15%, #6E8CFF 0%, var(--color-blue) 45%, var(--color-blue-ink) 100%)',
  'radial-gradient(130% 150% at 88% 20%, #FF7EB8 0%, var(--color-pink) 45%, var(--color-pink-ink) 100%)',
  'linear-gradient(135deg, var(--color-blue) 0%, var(--color-pink) 100%)',
  'radial-gradient(140% 170% at 50% 110%, var(--color-ink) 0%, #232527 55%, var(--color-blue-ink) 100%)',
  'linear-gradient(160deg, var(--color-pink-ink) 0%, var(--color-ink) 55%, var(--color-blue) 100%)',
] as const

export interface ThumbProps {
  id: string
  className?: string
  style?: CSSProperties
}

export default function Thumb({ id, className, style }: ThumbProps) {
  const hash = hashKey(id)
  const gradient = THUMB_VARIANTS[hash % THUMB_VARIANTS.length]

  return (
    <div
      aria-hidden
      className={`relative overflow-hidden bg-cover ${className ?? ''}`}
      style={{ background: gradient, ...style }}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,.4) 1px, transparent 1.4px)',
          backgroundSize: '7px 7px',
          mixBlendMode: 'overlay',
          opacity: 0.55,
        }}
      />
    </div>
  )
}
