import { cn } from './cn'

// Skeleton (design-system.md 3.6): size it like the real content so nothing
// jumps when it loads. Decorative: hide it from assistive tech and announce
// loading on the container instead (aria-busy).
export default function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn('rounded-control bg-bone motion-safe:animate-pulse', className)} />
}
