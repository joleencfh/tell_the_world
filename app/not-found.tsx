import Link from 'next/link'
import Logo from '@/components/ui/Logo'

// Covers both unmatched routes and explicit notFound() calls. Also what a
// logged-in-but-unauthorized visit ends up looking like in practice (e.g.
// /admin bounces a non-admin session to /home rather than rendering this),
// but this page itself doesn't know the difference between "doesn't exist"
// and "you can't see it" — the copy is written to read fine either way.
export default function NotFound() {
  return (
    <div className="min-h-screen bg-paper flex flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mb-10">
        <Logo href="/" />
      </div>

      <p className="font-mono text-xs tracking-[0.2em] uppercase text-ink-soft mb-3">
        404
      </p>
      <h1 className="font-display text-2xl text-ink mb-3">
        Looks like you got lost
      </h1>
      <p className="font-body italic text-sm text-ink-soft leading-relaxed max-w-xs mb-8">
        This page doesn&rsquo;t exist, or you don&rsquo;t have access to it.
      </p>

      <Link
        href="/"
        className="font-body flex items-center justify-center h-11 px-6 bg-ink text-paper text-sm rounded-sm hover:opacity-90 transition-opacity"
      >
        Back to Tell The World
      </Link>
    </div>
  )
}
