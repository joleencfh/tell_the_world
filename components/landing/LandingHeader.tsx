import Link from 'next/link'
import WaitlistButton from '@/components/landing/WaitlistButton'

export const BLOG_URL = 'https://telltheworldblog.substack.com/'

// design-system.md, Header. The header's one action is the waitlist (the old
// "Apply" link is gone). Blog is desktop only here and moves to the footer on
// mobile so Sign in and the button always fit; every target is 44px on touch.
export default function LandingHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-rule bg-parchment">
      <div className="mx-auto flex max-w-page items-center justify-between gap-2 px-4 py-2 md:px-gutter md:py-3">
        <Link href="/" className="inline-flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap font-ui text-ui font-medium tracking-[-0.01em] text-umber">
          <svg width="28" height="18" viewBox="0 0 28 18" aria-hidden="true">
            <circle cx="9" cy="9" r="8" className="fill-rose-bright" />
            <circle cx="19" cy="9" r="8" className="fill-cobalt-bright" fillOpacity=".92" />
          </svg>
          Tell The World
        </Link>
        <nav aria-label="Primary" className="flex shrink-0 items-center md:gap-2">
          <a
            href={BLOG_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden min-h-11 items-center rounded-control px-2.5 text-ui-sm text-umber-soft hover:text-umber hover:underline hover:underline-offset-[3px] md:inline-flex"
          >
            Blog
          </a>
          <Link
            href="/login"
            className="inline-flex min-h-11 items-center rounded-control px-2 text-ui-sm text-umber-soft hover:text-umber hover:underline hover:underline-offset-[3px] md:px-2.5"
          >
            Sign in
          </Link>
          <WaitlistButton size="sm" />
        </nav>
      </div>
    </header>
  )
}
