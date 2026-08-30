// Square icon-only "open" control on a card, replacing a text link ("Read
// brief →" / "View source →") with a compact arrow button — Two-Ink Bold
// dashboard cards (home-dashboard-plan.md §2 Part 0 step 2). No visible
// text, so aria-label is required rather than optional.
//
// Reference: "Two-Ink Bold Dashboard" artifact, .card-go.

import Link from 'next/link'

export interface CardGoLinkProps {
  href: string
  ariaLabel: string
  /** 'internal' renders a next/link with a plain arrow; 'external' renders
   *  a real <a target="_blank"> with the external-arrow glyph. */
  variant?: 'internal' | 'external'
  tone?: 'ink' | 'blue'
  className?: string
}

const TONE_CLASSES: Record<'ink' | 'blue', string> = {
  ink: 'border-line-strong text-ink-soft hover:border-ink hover:bg-ink hover:text-paper',
  blue: 'border-blue-soft text-blue-ink hover:border-blue hover:bg-blue hover:text-paper',
}

export default function CardGoLink({ href, ariaLabel, variant = 'internal', tone = 'ink', className }: CardGoLinkProps) {
  const glyph = variant === 'external' ? '↗' : '→'
  const classes = `flex h-7 w-7 shrink-0 items-center justify-center self-end border-[1.5px] text-[13px] transition-colors ${TONE_CLASSES[tone]} ${className ?? ''}`

  if (variant === 'external') {
    return (
      <a href={href} aria-label={ariaLabel} target="_blank" rel="noopener noreferrer" className={classes}>
        {glyph}
      </a>
    )
  }

  return (
    <Link href={href} aria-label={ariaLabel} className={classes}>
      {glyph}
    </Link>
  )
}
