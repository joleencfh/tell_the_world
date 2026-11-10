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
  ink: 'border-field-line text-umber-soft hover:border-umber hover:bg-umber hover:text-parchment',
  blue: 'border-cobalt text-cobalt hover:bg-cobalt hover:text-white',
}

export default function CardGoLink({ href, ariaLabel, variant = 'internal', tone = 'ink', className }: CardGoLinkProps) {
  const glyph = variant === 'external' ? '↗' : '→'
  const classes = `flex size-9 shrink-0 items-center justify-center self-end rounded-control border font-ui text-ui transition-colors focus-ring ${TONE_CLASSES[tone]} ${className ?? ''}`

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
