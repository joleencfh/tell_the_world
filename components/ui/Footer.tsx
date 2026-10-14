import Link from 'next/link'

// design-system.md 3.3: a hairline above, text-ui-sm, 44px link targets. One
// variant; the old "bold" brief footer (2px ink rule) is retired.
const LINK =
  'inline-flex min-h-11 items-center rounded-control text-umber-deep underline decoration-umber-deep/40 underline-offset-[5px] hover:text-umber hover:decoration-umber focus-ring'

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-rule px-4 py-6 md:px-gutter">
      <div className="mx-auto flex max-w-page flex-wrap items-center justify-between gap-x-6 gap-y-2 font-ui text-ui-sm text-umber-deep">
        <span className="inline-flex min-h-11 items-center gap-2">
          <svg width="28" height="18" viewBox="0 0 28 18" aria-hidden="true">
            <circle cx="9" cy="9" r="8" className="fill-rose-bright" />
            <circle cx="19" cy="9" r="8" className="fill-cobalt-bright" fillOpacity=".92" />
          </svg>
          Tell The World
        </span>
        <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-5">
          <Link href="/privacy" className={LINK}>
            Privacy Policy
          </Link>
          <Link href="/contact" className={LINK}>
            Contact
          </Link>
          <span className="tabular-nums">© {new Date().getFullYear()}</span>
        </nav>
      </div>
    </footer>
  )
}
