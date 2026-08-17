export default function Footer() {
  return (
    <footer className="border-t border-line px-6 py-8 mt-16">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 opacity-80">
        <span className="inline-flex items-center gap-[0.55rem] font-body text-sm font-bold text-ink-soft tracking-tight">
          <span className="relative inline-block h-3 w-3 shrink-0" aria-hidden>
            <span className="absolute inset-0 rounded-full bg-pink" />
            <span className="absolute left-1.5 top-0 h-3 w-3 rounded-full bg-blue mix-blend-multiply" />
          </span>
          <span style={{ wordSpacing: '-1.3px' }}>Tell The World</span>
        </span>
        <span className="font-mono text-[11px] tracking-[0.05em] text-ink-faint">
          © {new Date().getFullYear()}
        </span>
      </div>
    </footer>
  )
}
