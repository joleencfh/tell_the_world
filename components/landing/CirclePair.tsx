import { useId } from 'react'

interface CirclePairProps {
  className?: string
  /** Read out by screen readers. Omit for a purely decorative pair. */
  label?: string
}

// The brand's two overlapping circles (design-system.md, Circle pair):
// bright rose for creators & journalists, bright cobalt for researchers &
// organisations, violet where they overlap. Graphic only, never text.
export default function CirclePair({ className, label }: CirclePairProps) {
  const clipId = useId()
  return (
    <svg
      viewBox="0 0 280 160"
      className={className}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <defs>
        <clipPath id={clipId}>
          <circle cx="82" cy="80" r="76" />
        </clipPath>
      </defs>
      <circle cx="82" cy="80" r="76" className="fill-rose-bright" />
      <circle cx="198" cy="80" r="76" className="fill-cobalt-bright" />
      <circle cx="198" cy="80" r="76" className="fill-violet" clipPath={`url(#${clipId})`} />
    </svg>
  )
}
