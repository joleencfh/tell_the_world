import Link from 'next/link'
import Logo from './Logo'

// The plain header for the small public pages (apply, contact, privacy):
// logo on the left, at most one text link on the right. design-system.md 3.3:
// parchment, 1px rule underneath, sticky, no uppercase mono links. The full
// app header (avatar menu, primary links) arrives with the dashboard phase.
export default function SiteHeader({ action }: { action?: { href: string; label: string } }) {
  return (
    <header className="sticky top-0 z-20 border-b border-rule bg-parchment">
      <div className="mx-auto flex max-w-page items-center justify-between gap-2 px-4 py-2 md:px-gutter md:py-3">
        <Logo href="/" />
        {action && (
          <Link
            href={action.href}
            className="inline-flex min-h-11 items-center rounded-control px-2.5 font-ui text-ui-sm text-umber-soft hover:text-umber hover:underline hover:underline-offset-[3px] focus-ring"
          >
            {action.label}
          </Link>
        )}
      </div>
    </header>
  )
}
