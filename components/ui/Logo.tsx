import Link from 'next/link'
import { cn } from './cn'

interface LogoProps {
  href: string
  className?: string
}

// The brand mark (design-system.md 2.6): the rose and cobalt circle pair and
// the Inter wordmark. Same mark as the landing header.
export default function Logo({ href, className }: LogoProps) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-control font-ui text-ui font-medium tracking-[-0.01em] text-umber focus-ring',
        className,
      )}
    >
      <svg width="28" height="18" viewBox="0 0 28 18" aria-hidden="true">
        <circle cx="9" cy="9" r="8" className="fill-rose-bright" />
        <circle cx="19" cy="9" r="8" className="fill-cobalt-bright" fillOpacity=".92" />
      </svg>
      Tell The World
    </Link>
  )
}
