import type { ReactNode } from 'react'

// Fixed dark section wrapper (Covered By, Part 7) — bg-coverage-bg/text-coverage-fg
// are the two tokens that stay dark/light across both themes on purpose, unlike
// ink/paper which invert. Don't swap these for ink/paper here.
export default function DarkBand({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={`bg-coverage-bg text-coverage-fg ${className ?? ''}`}>{children}</div>
}
