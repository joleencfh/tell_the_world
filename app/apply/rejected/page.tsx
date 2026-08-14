import Link from "next/link";

export default function RejectedPage() {
  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col">
      {/* Nav */}
      <header className="border-b border-line px-6">
        <div className="mx-auto flex max-w-2xl items-center justify-between py-4">
          <Link
            href="/"
            className="font-body text-base font-bold tracking-tight text-ink"
          >
            Tell <em className="italic">The</em> World
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="mx-auto max-w-lg text-center">
          {/* Icon */}
          <div className="mb-8 inline-flex items-center justify-center w-14 h-14 rounded-full border border-line bg-paper-raised">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-ink-soft"
              aria-hidden
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>

          {/* Eyebrow */}
          <div className="mb-5 inline-flex items-center gap-2.5">
            <span className="h-1.5 w-1.5 rounded-full bg-ink-soft shrink-0" aria-hidden />
            <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-ink-soft">
              Application reviewed
            </span>
          </div>

          {/* Heading */}
          <h1 className="font-display uppercase leading-[0.96] tracking-tight text-[2.5rem] sm:text-[3rem] text-ink mb-6">
            Not right now
          </h1>

          {/* Body */}
          <div className="font-body text-base leading-[1.8] text-ink-soft space-y-4 mb-10 text-left">
            <p>
              Thanks for your interest in Tell The World. After reviewing your
              application, we&rsquo;re not able to offer you a place at this
              time.
            </p>
            <p>
              This doesn&rsquo;t mean your work isn&rsquo;t valuable. The
              platform is still small and we&rsquo;re being selective about who
              joins in this early stage.
            </p>
            <p>
              You&rsquo;re welcome to reapply in the future as the platform
              grows and the community expands.
            </p>
          </div>

          {/* Back to homepage */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.2em] uppercase text-ink-soft hover:text-ink transition-colors group"
          >
            <span
              className="group-hover:-translate-x-1 transition-transform duration-150"
              aria-hidden
            >
              ←
            </span>
            Back to home
          </Link>
        </div>
      </main>
    </div>
  );
}
