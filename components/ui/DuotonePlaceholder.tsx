// Deterministic "no photo yet" placeholder (Covered By, Part 7) — same id always
// renders the same abstract graphic, so it looks designed rather than empty.
// Swap for a real image_url field later without touching card layout.

function hashKey(key: string): number {
  let hash = 0
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0
  }
  return hash
}

export interface DuotonePlaceholderProps {
  id: string
  className?: string
}

export default function DuotonePlaceholder({ id, className }: DuotonePlaceholderProps) {
  const hash = hashKey(id)
  const isBlue = hash % 2 === 0
  const gradientId = `duotone-gradient-${id}`
  const dotsId = `duotone-dots-${id}`
  const [colorA, colorB] = isBlue
    ? ['var(--color-blue-ink)', 'var(--color-blue)']
    : ['var(--color-pink-ink)', 'var(--color-pink)']

  const shapes = [0, 1, 2].map((i) => {
    const seed = (hash >> (i * 6)) & 0xff
    return { cx: 20 + (seed % 60), cy: 15 + ((seed * 7) % 45), r: 16 + (seed % 22) }
  })

  return (
    <svg
      viewBox="0 0 100 75"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={colorA} />
          <stop offset="100%" stopColor={colorB} />
        </linearGradient>
        <pattern id={dotsId} width="4" height="4" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="0.6" fill="#000" />
        </pattern>
      </defs>
      <rect width="100" height="75" fill={`url(#${gradientId})`} />
      {shapes.map((s, i) => (
        <circle key={i} cx={s.cx} cy={s.cy} r={s.r} fill="#fff" fillOpacity={0.08 + i * 0.04} />
      ))}
      <rect width="100" height="75" fill={`url(#${dotsId})`} opacity={0.25} style={{ mixBlendMode: 'multiply' }} />
    </svg>
  )
}
