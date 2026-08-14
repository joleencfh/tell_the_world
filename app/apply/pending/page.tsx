import Link from "next/link";

export default function PendingPage() {
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
          <div className="mb-8 flex items-center justify-center w-14 h-14 rounded-full border border-line bg-paper-raised mx-auto">
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
              className="text-ink"
              aria-hidden
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>

          {/* Eyebrow */}
          <div className="mb-5 flex justify-center items-center gap-2.5">
            <span className="h-1.5 w-1.5 rounded-full bg-ink-soft shrink-0" aria-hidden />
            <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-ink-soft">
              Application received
            </span>
          </div>

          {/* Heading */}
          <h1 className="font-display uppercase leading-[0.96] tracking-tight text-[2.5rem] sm:text-[3rem] text-ink mb-6">
            You&rsquo;re in the queue
          </h1>

          {/* Body */}
          <div className="font-body text-base leading-[1.8] text-ink-soft space-y-4 mb-10">
            <p>Thanks for applying!</p>
            <p>
              Every application is reviewed personally. You&rsquo;ll hear back
              within a few days.
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
