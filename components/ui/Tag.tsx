import { cn } from './cn'

// Tag (design-system.md 3.5): a neutral, hairline-bordered label for topics.
// Sentence case in the source; uppercase comes from CSS.
export default function Tag({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-block rounded-tag border border-window-line px-2 py-0.5 font-mono text-label uppercase text-umber-soft',
        className,
      )}
    >
      {children}
    </span>
  )
}
