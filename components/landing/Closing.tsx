import Link from 'next/link'
import CirclePair from '@/components/landing/CirclePair'
import EarlyTesterLink from '@/components/landing/EarlyTesterLink'
import WaitlistButton from '@/components/landing/WaitlistButton'
import { BLOG_URL } from '@/components/landing/LandingHeader'

// Closing band with a small cropped circle pair, then the footer
// (design-system.md, Band and Footer). The footer is landing-specific and
// sits inside the band; the shared <Footer /> used by other pages is not
// touched. Blog lives here on mobile only.
export default function Closing() {
  return (
    <div className="border-t border-rule bg-band-soft">
      <div className="relative overflow-hidden">
        <CirclePair className="pointer-events-none absolute -bottom-[70px] -right-[60px] h-auto w-[250px] md:-bottom-[90px] md:-right-[70px] md:w-[380px]" />
        <div className="relative mx-auto max-w-page px-5 pb-[130px] pt-14 md:px-gutter md:pb-[88px] md:pt-24">
          <p className="max-w-[16em] font-serif text-statement text-umber">
            Want in sooner? <EarlyTesterLink /> and try Tell The World while it&rsquo;s still rough, so you
            can help us fix it.
          </p>
          <div className="mt-7">
            <WaitlistButton />
          </div>
        </div>
      </div>

      <footer className="border-t border-umber/20">
        <div className="mx-auto flex max-w-page flex-wrap items-center justify-between gap-x-4 px-5 py-2 text-ui-sm text-umber-deep md:px-gutter md:py-3">
          <span>Tell The World · © {new Date().getFullYear()}</span>
          <span className="flex flex-wrap items-center">
            <a
              href={BLOG_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center px-2 hover:underline md:hidden"
            >
              Blog
            </a>
            <Link href="/privacy" className="inline-flex min-h-11 items-center px-2 hover:underline">
              Privacy Policy
            </Link>
            <Link href="/contact" className="inline-flex min-h-11 items-center px-2 hover:underline">
              Contact
            </Link>
          </span>
        </div>
      </footer>
    </div>
  )
}
