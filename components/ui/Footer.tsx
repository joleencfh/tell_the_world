import Link from 'next/link'

interface FooterProps {
  // 'bold' matches the Brief page's reference-artifact footer (2px
  // border-ink on the inner wrapper, tighter max-width) — see
  // tests/two-ink-bold-11g-remnants.spec.ts, which regression-tests that
  // exact treatment. Every other page uses the plain 1px border-line look.
  variant?: 'default' | 'bold'
}

export default function Footer({ variant = 'default' }: FooterProps) {
  const isBold = variant === 'bold'
  return (
    <footer className={isBold ? 'px-6 pt-8 pb-12' : 'border-t border-line px-6 py-8 mt-16'}>
      <div
        className={`mx-auto flex flex-wrap items-center justify-between gap-4 ${
          isBold ? 'max-w-4xl border-t-2 border-ink pt-6' : 'max-w-5xl'
        }`}
      >
        <span className="inline-flex items-center gap-[0.55rem] font-body text-sm font-bold text-ink-soft tracking-tight opacity-80">
          <span className="relative inline-block h-3 w-3 shrink-0" aria-hidden>
            <span className="absolute inset-0 rounded-full bg-pink" />
            <span className="absolute left-1.5 top-0 h-3 w-3 rounded-full bg-blue mix-blend-multiply" />
          </span>
          <span style={{ wordSpacing: '-1.3px' }}>Tell The World</span>
        </span>
        <div className="flex items-center gap-5">
          <Link
            href="/privacy"
            className="font-mono text-[11px] tracking-[0.05em] text-ink-faint hover:text-ink-soft transition-colors"
          >
            Privacy Policy
          </Link>
          <Link
            href="/contact"
            className="font-mono text-[11px] tracking-[0.05em] text-ink-faint hover:text-ink-soft transition-colors"
          >
            Contact
          </Link>
          <span className="font-mono text-[11px] tracking-[0.05em] text-ink-faint opacity-80">
            © {new Date().getFullYear()}
          </span>
        </div>
      </div>
    </footer>
  )
}
