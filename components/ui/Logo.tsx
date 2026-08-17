import Link from 'next/link'

interface LogoProps {
  href: string
  className?: string
}

// Two-Ink Bold wordmark: pink + blue circles overlapping under multiply
// blend (the brand's two inks, literally), matching the reference
// artifact's .brand-mark exactly (12px circles, 6px offset).
export default function Logo({ href, className = '' }: LogoProps) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-[0.55rem] font-display text-[1.02rem] font-extrabold tracking-[-0.01em] text-ink ${className}`}
    >
      <span className="relative inline-block h-3 w-3 shrink-0" aria-hidden>
        <span className="absolute inset-0 rounded-full bg-pink" />
        <span className="absolute left-1.5 top-0 h-3 w-3 rounded-full bg-blue mix-blend-multiply" />
      </span>
      Tell The World
    </Link>
  )
}
