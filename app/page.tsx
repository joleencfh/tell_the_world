import Link from "next/link";

// ---------------------------------------------------------------------------
// Placeholder data — replace with Supabase queries in a later session
// ---------------------------------------------------------------------------

const MEMBERS = [
  {
    name: "Dr. Stuart Russell",
    role: "expert" as const,
    affiliation: "Professor of Computer Science, UC Berkeley",
  },
  {
    name: "Dr. Paul Christiano",
    role: "expert" as const,
    affiliation: "Founder, Alignment Research Center",
  },
  {
    name: "Prof. Yoshua Bengio",
    role: "expert" as const,
    affiliation: "Professor, Université de Montréal / Mila",
  },
  {
    name: "Jaan Tallinn",
    role: "expert" as const,
    affiliation: "Co-founder, Centre for the Study of Existential Risk",
  },
  {
    name: "Dr. Victoria Krakovna",
    role: "expert" as const,
    affiliation: "Research Scientist, Google DeepMind Safety",
  },
  {
    name: "Machine Intelligence Research Institute",
    role: "organisation" as const,
    affiliation: "Berkeley, USA",
  },
  {
    name: "Centre for Human-Compatible AI",
    role: "organisation" as const,
    affiliation: "Berkeley, USA",
  },
  {
    name: "Center for AI Safety",
    role: "organisation" as const,
    affiliation: "San Francisco, USA",
  },
  {
    name: "UK AI Safety Institute",
    role: "organisation" as const,
    affiliation: "London, UK",
  },
];

type BriefSection = { title: string; content: string };
type Brief = {
  id: number;
  title: string;
  tldr: string;
  visibility: "public" | "members";
  sections: BriefSection[];
};

const BRIEFS: Brief[] = [
  {
    id: 1,
    title: "Who Controls the Off Switch?",
    tldr: "Imagine building a powerful tool and realising you're not sure you can turn it off. That's not a hypothetical. It's a live debate in AI research right now.",
    visibility: "public",
    sections: [
      {
        title: "The idea",
        content:
          "One of the central questions in AI safety is whether an AI system will actually do what its operators tell it to, including stopping when asked. Researchers call this 'corrigibility', but the concept is simple: can you correct it, adjust it, or shut it down if something goes wrong?",
      },
      {
        title: "What kind of creator fits this",
        content:
          "You don't need a technical background. You need curiosity and an audience. This brief suits educators, science communicators, tech YouTubers, newsletter writers, and podcast hosts.",
      },
    ],
  },
  {
    id: 2,
    title: "Inside the Alignment Labs",
    tldr: "A quiet community of researchers is working on what they believe is the most important problem in the world. Most people have never heard of them.",
    visibility: "public",
    sections: [
      {
        title: "The idea",
        content:
          "Alongside the big AI companies, a cluster of organisations has grown up with a different goal: not to build the most powerful AI, but to figure out how to build it safely. They're mostly small, mostly underfunded, and mostly ignored by mainstream coverage.",
      },
      {
        title: "What kind of creator fits this",
        content:
          "This brief is for creators who like going behind the scenes: documentary makers, long-form explainers, investigative newsletter writers. You'd be getting access to researchers who are usually very hard to reach.",
      },
    ],
  },
  {
    id: 3,
    title: "The Compute Governance Gap",
    tldr: "The most powerful AI systems in the world run on a small number of chips, built by a small number of companies, sitting in a small number of data centres. Nobody elected those companies, and almost no government has a plan for what happens if they make the wrong decisions.",
    visibility: "members",
    sections: [],
  },
  {
    id: 4,
    title: "Safety vs Speed: The Culture War Inside AI Labs",
    tldr: "Inside the companies building the most powerful AI, two groups of people are in constant tension: the ones who want to move fast, and the ones who want to be careful. The outcome of that tension will affect all of us, but it's happening behind closed doors.",
    visibility: "members",
    sections: [],
  },
  {
    id: 5,
    title: "Are AI Safety Tests Rigorous Enough?",
    tldr: "Before releasing a powerful new AI, labs run tests to make sure it won't do anything dangerous. But who writes those tests? Who checks the results? And what happens when a company has a financial incentive to pass?",
    visibility: "members",
    sections: [],
  },
];

// ---------------------------------------------------------------------------
// Brief illustrations — abstract CSS gradient + SVG per topic
// ---------------------------------------------------------------------------

type IllustrationConfig = {
  gradient: string;
  svgContent: React.ReactNode;
};

const ILLUSTRATIONS: Record<number, IllustrationConfig> = {
  1: {
    gradient: "linear-gradient(135deg, #0f0c08 0%, #1c1508 40%, #120e06 100%)",
    svgContent: (
      <svg viewBox="0 0 480 220" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
        {Array.from({ length: 12 }, (_, col) =>
          Array.from({ length: 6 }, (_, row) => (
            <circle key={`${col}-${row}`} cx={col * 44 + 10} cy={row * 40 + 10} r="1" fill="rgba(255,255,255,0.12)" />
          ))
        )}
        <path d="M 60 110 L 160 110 L 160 60 L 280 60 L 280 110 L 380 110" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" fill="none" />
        <path d="M 60 110 L 160 110 L 160 160 L 280 160 L 280 110 L 380 110" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" fill="none" />
        <circle cx="60" cy="110" r="5" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
        <circle cx="60" cy="110" r="2.5" fill="rgba(255,255,255,0.6)" />
        <circle cx="160" cy="110" r="4" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
        <circle cx="280" cy="110" r="4" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
        <circle cx="380" cy="110" r="5" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
        <circle cx="380" cy="110" r="2.5" fill="rgba(255,255,255,0.6)" />
        <circle cx="160" cy="60" r="3" fill="rgba(255,255,255,0.25)" />
        <circle cx="160" cy="160" r="3" fill="rgba(255,255,255,0.25)" />
        <circle cx="280" cy="60" r="3" fill="rgba(255,255,255,0.25)" />
        <circle cx="280" cy="160" r="3" fill="rgba(255,255,255,0.25)" />
        <circle cx="220" cy="110" r="40" fill="rgba(255,255,255,0.03)" />
        <circle cx="220" cy="110" r="20" fill="rgba(255,255,255,0.04)" />
      </svg>
    ),
  },
  2: {
    gradient: "linear-gradient(135deg, #0a0a0a 0%, #141414 40%, #0d0d0d 100%)",
    svgContent: (
      <svg viewBox="0 0 480 220" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
        {Array.from({ length: 8 }, (_, i) => (
          <line key={i} x1="0" y1={i * 30 + 15} x2="480" y2={i * 30 + 15} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
        ))}
        {[
          [120, 70], [140, 90], [115, 105], [155, 75], [130, 130],
          [240, 80], [260, 60], [250, 110], [275, 85], [235, 140],
          [360, 90], [380, 70], [350, 120], [375, 110], [355, 60],
        ].map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r={i % 3 === 0 ? 3 : i % 3 === 1 ? 2 : 1.5} fill="rgba(255,255,255,0.45)" opacity={0.4 + (i % 4) * 0.1} />
        ))}
        <line x1="130" y1="90" x2="250" y2="85" stroke="rgba(255,255,255,0.15)" strokeWidth="0.75" strokeDasharray="4 3" />
        <line x1="250" y1="85" x2="365" y2="90" stroke="rgba(255,255,255,0.15)" strokeWidth="0.75" strokeDasharray="4 3" />
        <line x1="60" y1="170" x2="420" y2="170" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
        <line x1="60" y1="30" x2="60" y2="170" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
        <circle cx="240" cy="100" r="60" fill="rgba(255,255,255,0.02)" />
      </svg>
    ),
  },
  3: {
    gradient: "linear-gradient(135deg, #111111 0%, #1a1a1a 100%)",
    svgContent: (
      <svg viewBox="0 0 480 200" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
        {Array.from({ length: 10 }, (_, col) =>
          Array.from({ length: 6 }, (_, row) => (
            <rect key={`${col}-${row}`} x={col * 48 + 10} y={row * 32 + 12} width="28" height="18" rx="2" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
          ))
        )}
        <rect x="160" y="60" width="160" height="80" rx="4" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" />
      </svg>
    ),
  },
  4: {
    gradient: "linear-gradient(135deg, #1a1000 0%, #2d1f08 100%)",
    svgContent: (
      <svg viewBox="0 0 480 200" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
        {Array.from({ length: 8 }, (_, i) => (
          <line key={i} x1={-20 + i * 60} y1="200" x2={60 + i * 60} y2="0" stroke="rgba(251,191,36,0.08)" strokeWidth="16" />
        ))}
        <line x1="0" y1="100" x2="480" y2="100" stroke="rgba(251,191,36,0.12)" strokeWidth="1" strokeDasharray="8 6" />
      </svg>
    ),
  },
  5: {
    gradient: "linear-gradient(135deg, #111111 0%, #1c1c1c 100%)",
    svgContent: (
      <svg viewBox="0 0 480 200" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
        {[50, 90, 130, 170].map((y, i) => (
          <g key={i} opacity="0.18">
            <rect x="140" y={y} width="14" height="14" rx="2" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
            <line x1="166" y1={y + 7} x2={166 + 100 + (i % 2) * 40} y2={y + 7} stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
          </g>
        ))}
      </svg>
    ),
  },
};

function BriefIllustration({ id, tall = false }: { id: number; tall?: boolean }) {
  const config = ILLUSTRATIONS[id] ?? ILLUSTRATIONS[1];
  return (
    <div
      className={`relative w-full overflow-hidden ${tall ? "h-52" : "h-36"}`}
      style={{ background: config.gradient }}
    >
      {config.svgContent}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

// Shared placeholder line widths for blurred content
const aria_hidden_lines = [
  ["w-full", "w-5/6", "w-4/5"],
  ["w-full", "w-11/12"],
];

function LockIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function PublicBriefCard({ brief, index }: { brief: Brief; index: number }) {
  const num = String(index + 1).padStart(2, "0");
  return (
    <div className="flex flex-col">
      {/* Number label */}
      <p className="font-display text-5xl sm:text-6xl leading-none text-edge select-none mb-1" aria-hidden>
        #{num}
      </p>
      <article className="border border-edge bg-card overflow-hidden flex flex-col flex-1">
        <BriefIllustration id={brief.id} tall />
        <div className="p-7 sm:p-9 flex flex-col flex-1">
          {/* Badge */}
          <div className="mb-5 inline-flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-live shrink-0" aria-hidden />
            <span className="font-mono text-[9px] tracking-[0.25em] uppercase text-live">Open brief</span>
          </div>

          {/* Title */}
          <h3 className="font-serif text-2xl sm:text-3xl font-bold leading-[1.15] text-dark mb-4">
            {brief.title}
          </h3>

          {/* TLDR */}
          <p className="font-serif text-base leading-[1.8] text-soft line-clamp-3 mb-7">
            {brief.tldr}
          </p>

          {/* CTA */}
          <Link
            href="/apply"
            className="mt-auto inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.22em] uppercase text-live hover:opacity-75 transition-opacity group"
          >
            Cover this story
            <span className="group-hover:translate-x-1 transition-transform duration-150" aria-hidden>→</span>
          </Link>
        </div>
      </article>
    </div>
  );
}

function LockedBriefCard({ brief }: { brief: Brief }) {
  return (
    <article className="border border-edge bg-card overflow-hidden flex flex-col">
      <BriefIllustration id={brief.id} />

      <div className="p-5 flex flex-col flex-1">
        {/* Badge */}
        <div className="mb-3 inline-flex items-center gap-1.5 text-soft">
          <LockIcon />
          <span className="font-mono text-[9px] tracking-[0.2em] uppercase">Members only</span>
        </div>

        {/* Title */}
        <h3 className="font-serif text-base font-bold leading-snug text-dark mb-3">
          {brief.title}
        </h3>

        {/* Blurred placeholder */}
        <div className="relative overflow-hidden rounded-sm mb-3">
          <div aria-hidden="true" className="select-none pointer-events-none blur-[3px] space-y-1.5">
            {[aria_hidden_lines[0], aria_hidden_lines[1]].map((widths, i) => (
              <div key={i} className="space-y-1">
                {widths.map((w, j) => (
                  <div key={j} className={`h-1.5 rounded-sm bg-edge ${w}`} />
                ))}
              </div>
            ))}
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-card" aria-hidden="true" />
        </div>

        {/* Join prompt */}
        <div className="mt-auto pt-3 border-t border-edge flex items-center justify-between">
          <span className="font-mono text-[9px] text-soft">Full brief for members.</span>
          <Link
            href="/apply"
            className="font-mono text-[9px] tracking-[0.15em] uppercase text-live hover:opacity-75 transition-opacity inline-flex items-center gap-1 group"
          >
            Apply to join
            <span className="group-hover:translate-x-0.5 transition-transform duration-150" aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function LandingPage() {
  const publicBriefs = BRIEFS.filter((b) => b.visibility === "public");
  const membersBriefs = BRIEFS.filter((b) => b.visibility === "members");
  const experts = MEMBERS.filter((m) => m.role === "expert");
  const organisations = MEMBERS.filter((m) => m.role === "organisation");

  return (
    <div className="min-h-screen bg-base text-text">

      {/* ------------------------------------------------------------------ */}
      {/* Nav                                                                  */}
      {/* ------------------------------------------------------------------ */}
      <header className="sticky top-0 z-10 bg-base/95 backdrop-blur-sm border-b border-edge px-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between py-4">
          <span className="font-serif text-base font-bold tracking-tight text-text">
            Tell <em className="italic text-live">The</em> World
          </span>
          <Link
            href="/login"
            className="font-mono text-[10px] tracking-[0.18em] uppercase text-soft hover:text-text transition-colors"
          >
            Log in
          </Link>
        </div>
      </header>

      <main>

        {/* ---------------------------------------------------------------- */}
        {/* Hero                                                              */}
        {/* ---------------------------------------------------------------- */}
        <section className="bg-base px-6 pt-20 pb-20 sm:pt-28 sm:pb-24 border-b border-edge">
          <div className="mx-auto max-w-5xl">
            {/* Eyebrow */}
            <div className="mb-8 inline-flex items-center gap-2.5">
              <span className="h-1.5 w-1.5 rounded-full bg-live animate-pulse shrink-0" aria-hidden />
              <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-soft">
                Now open: AI safety x independent media
              </span>
            </div>

            {/* Headline — Anton, full impact */}
            <h1 className="font-display uppercase leading-[0.96] tracking-tight mb-8 max-w-4xl">
              <span className="block text-[3.5rem] sm:text-[5.5rem] text-dark">AI safety is</span>
              <span className="block text-[3.5rem] sm:text-[5.5rem] text-dark">the story</span>
              <span className="block text-[3.5rem] sm:text-[5.5rem] text-dark">your audience</span>
              <span className="block text-[3.5rem] sm:text-[5.5rem] text-live">hasn&rsquo;t heard yet.</span>
            </h1>

            {/* Subtext */}
            <p className="font-serif text-lg leading-[1.8] text-soft max-w-xl mb-10">
              The people who understand AI safety best are looking for creators like you.
              Podcasters, writers, educators, video makers. No PhD. No jargon.
              Just good storytelling that reaches the audiences who need to hear it.
            </p>

            {/* CTAs */}
            <div className="flex items-center gap-6 flex-wrap">
              <Link
                href="/apply"
                className="font-display uppercase tracking-widest text-sm bg-live text-white px-8 py-4 hover:bg-amber-700 transition-colors"
              >
                Apply to join
              </Link>
              <a
                href="#briefs"
                className="font-mono text-[10px] tracking-[0.2em] uppercase text-soft hover:text-text transition-colors inline-flex items-center gap-2"
              >
                See active briefs <span aria-hidden>↓</span>
              </a>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Who's here — dark trust strip                                    */}
        {/* ---------------------------------------------------------------- */}
        <section className="bg-dark px-6 py-10">
          <div className="mx-auto max-w-5xl">
            <p className="font-mono text-[9px] tracking-[0.22em] uppercase text-white/25 mb-7">
              Trusted by leading researchers and organisations
            </p>
            <div className="grid sm:grid-cols-2 gap-10">
              <div>
                <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-white/40 border-b border-white/10 pb-2 mb-4">
                  Experts
                </p>
                <div className="flex flex-col gap-2.5">
                  {experts.map((m) => (
                    <div key={m.name} className="flex flex-col">
                      <span className="font-serif text-sm text-white/75 leading-snug">{m.name}</span>
                      <span className="font-mono text-[9px] text-white/30 mt-0.5">{m.affiliation}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-white/40 border-b border-white/10 pb-2 mb-4">
                  Organisations
                </p>
                <div className="flex flex-col gap-2.5">
                  {organisations.map((m) => (
                    <div key={m.name} className="flex flex-col">
                      <span className="font-serif text-sm text-white/75 leading-snug">{m.name}</span>
                      <span className="font-mono text-[9px] text-white/30 mt-0.5">{m.affiliation}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Briefs                                                            */}
        {/* ---------------------------------------------------------------- */}
        <section id="briefs" className="px-6 py-16">
          <div className="mx-auto max-w-5xl">
            {/* Section label */}
            <div className="flex items-center gap-5 mb-14">
              <span className="font-display uppercase tracking-[0.18em] text-dark text-sm shrink-0">Active briefs</span>
              <div className="flex-1 h-px bg-edge" />
            </div>

            {/* Public briefs */}
            <div className="grid sm:grid-cols-2 gap-8 mb-16">
              {publicBriefs.map((brief, i) => (
                <PublicBriefCard key={brief.id} brief={brief} index={i} />
              ))}
            </div>

            {/* Members-only briefs */}
            {membersBriefs.length > 0 && (
              <>
                <div className="flex items-center gap-5 mb-8">
                  <span className="font-display uppercase tracking-[0.18em] text-soft text-sm shrink-0">More briefs: members only</span>
                  <div className="flex-1 h-px bg-edge" />
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {membersBriefs.map((brief) => (
                    <LockedBriefCard key={brief.id} brief={brief} />
                  ))}
                </div>
              </>
            )}
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Bottom CTA                                                        */}
        {/* ---------------------------------------------------------------- */}
        <section className="bg-dark px-6 py-24 text-center">
          <div className="mx-auto max-w-xl">
            <h2 className="font-display uppercase leading-[0.88] tracking-tight mb-7">
              <span className="block text-5xl sm:text-6xl text-white">Ready to tell</span>
              <span className="block text-5xl sm:text-6xl text-live">the world?</span>
            </h2>
            <p className="font-serif text-base leading-[1.8] text-white/50 mb-9 max-w-md mx-auto">
              Whether you research AI safety, run an organisation working on it, or create content
              that reaches real people, Tell The World is where your work connects with the
              audiences that matter.
            </p>
            <Link
              href="/apply"
              className="font-display uppercase tracking-widest text-sm bg-live text-white px-8 py-4 inline-block hover:bg-amber-700 transition-colors"
            >
              Apply to join
            </Link>
          </div>
        </section>

      </main>

      {/* ------------------------------------------------------------------ */}
      {/* Footer                                                              */}
      {/* ------------------------------------------------------------------ */}
      <footer className="bg-dark border-t border-white/10 px-6 py-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <span className="font-serif text-sm font-bold text-white/40 tracking-tight">
            Tell <em className="italic">The</em> World
          </span>
          <Link
            href="/login"
            className="font-mono text-[10px] tracking-[0.18em] uppercase text-white/40 hover:text-white/70 transition-colors"
          >
            Log in
          </Link>
        </div>
      </footer>

    </div>
  );
}
