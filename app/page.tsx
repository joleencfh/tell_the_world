import Link from "next/link";

// ---------------------------------------------------------------------------
// Placeholder data — replace with Supabase queries in a later session
// ---------------------------------------------------------------------------

const MEMBERS = [
  {
    name: "Dr. Sarah Chen",
    role: "expert" as const,
    affiliation: "Professor of Climate Policy, University of Oxford",
  },
  {
    name: "James Okafor",
    role: "expert" as const,
    affiliation: "Former Senior Negotiator, UN Climate Affairs",
  },
  {
    name: "Prof. David Walsh",
    role: "expert" as const,
    affiliation: "Economist, London School of Economics",
  },
  {
    name: "Dr. Aisha Ndlovu",
    role: "expert" as const,
    affiliation: "Public Health Researcher, Wits University",
  },
  {
    name: "Maria Santos",
    role: "expert" as const,
    affiliation: "CEO, Renewable Energy Coalition",
  },
  {
    name: "Global Health Alliance",
    role: "organisation" as const,
    affiliation: "Geneva, Switzerland",
  },
  {
    name: "Transparency International",
    role: "organisation" as const,
    affiliation: "Berlin, Germany",
  },
  {
    name: "Future of Work Institute",
    role: "organisation" as const,
    affiliation: "San Francisco, USA",
  },
  {
    name: "Climate Action Network Europe",
    role: "organisation" as const,
    affiliation: "Brussels, Belgium",
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
    title: "The Hidden Cost of Fast Fashion",
    tldr: "We're investigating the environmental and labour impacts of the global fast fashion industry — from manufacturing plants in Southeast Asia to the landfills receiving discarded clothing in the Global South.",
    visibility: "public",
    sections: [
      {
        title: "Background",
        content:
          "The global fashion industry produces roughly 10% of all human carbon emissions and is the second-largest consumer of the world's water supply. Despite growing consumer awareness, fast fashion brands have accelerated production cycles rather than slowing them. Regulatory pressure is building in the EU, but enforcement remains patchy.",
      },
      {
        title: "What we're looking for",
        content:
          "We want to hear from supply chain workers, environmental scientists, policy experts, and NGOs working on fashion industry reform. We're particularly interested in first-hand accounts from manufacturing regions in Bangladesh, Vietnam, and Cambodia, as well as from communities receiving exported second-hand clothing in sub-Saharan Africa.",
      },
      {
        title: "Timeline",
        content:
          "We're aiming to publish in Q2 2026. Initial contributor calls will begin in April. Final deadline for written submissions is 31 May 2026.",
      },
    ],
  },
  {
    id: 2,
    title: "AI in Healthcare: Promise vs Reality",
    tldr: "As AI diagnostic tools enter hospitals globally, we're examining the gap between vendor claims and real-world outcomes — and who bears the risk when systems fail.",
    visibility: "public",
    sections: [
      {
        title: "Background",
        content:
          "AI-powered diagnostic tools are being deployed in hospitals across Europe, North America, and parts of Asia, with adoption accelerating post-pandemic. Early trials show promise in radiology and pathology, but independent validation remains limited. Several high-profile failures have gone largely unreported.",
      },
      {
        title: "What we're looking for",
        content:
          "We're seeking radiologists, hospital administrators, patient advocates, clinical AI researchers, and regulatory experts who can speak to real deployment experiences — successes and failures alike. Whistleblowers with direct knowledge of product misrepresentation are especially welcome.",
      },
      {
        title: "Timeline",
        content:
          "This is an ongoing investigation. We are accepting contributions on a rolling basis through June 2026.",
      },
    ],
  },
  {
    id: 3,
    title: "Corporate Lobbying and Climate Policy",
    tldr: "How fossil fuel companies are shaping international climate negotiations from the inside — and what that means for net-zero targets.",
    visibility: "members",
    sections: [],
  },
  {
    id: 4,
    title: "The Mental Health Crisis in Schools",
    tldr: "A cross-country investigation into why youth mental health services are failing students, and what schools and governments are — and aren't — doing about it.",
    visibility: "members",
    sections: [],
  },
  {
    id: 5,
    title: "Housing Affordability: A Global Perspective",
    tldr: "Examining policy failures and grassroots solutions in cities where housing has become inaccessible to the majority of residents.",
    visibility: "members",
    sections: [],
  },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function LockIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function PublicBriefCard({ brief }: { brief: Brief }) {
  return (
    <article className="rounded-2xl border border-zinc-200 bg-white p-8">
      <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
        <span
          className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500"
          aria-hidden="true"
        />
        Open brief
      </div>
      <h3 className="mt-3 text-xl font-semibold text-zinc-900">{brief.title}</h3>
      <p className="mt-2 text-base leading-relaxed text-zinc-600">{brief.tldr}</p>
      <div className="mt-6 space-y-5 border-t border-zinc-100 pt-6">
        {brief.sections.map((section) => (
          <div key={section.title}>
            <h4 className="mb-1.5 text-sm font-semibold uppercase tracking-wide text-zinc-400">
              {section.title}
            </h4>
            <p className="text-sm leading-relaxed text-zinc-700">{section.content}</p>
          </div>
        ))}
      </div>
      <div className="mt-6">
        <Link
          href="/apply"
          className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
        >
          Apply to contribute
        </Link>
      </div>
    </article>
  );
}

function LockedBriefCard({ brief }: { brief: Brief }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
      <div className="p-8 pb-5">
        <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-500">
          <LockIcon />
          Members only
        </div>
        <h3 className="mt-3 text-xl font-semibold text-zinc-900">{brief.title}</h3>
        <p className="mt-2 text-base leading-relaxed text-zinc-600">{brief.tldr}</p>
      </div>

      {/* Blurred content placeholder */}
      <div className="relative px-8 pb-8">
        <div
          aria-hidden="true"
          className="select-none space-y-5 blur-sm"
        >
          {[
            { w1: "w-1/4", lines: ["w-full", "w-5/6", "w-4/6"] },
            { w1: "w-1/3", lines: ["w-full", "w-11/12", "w-3/5"] },
          ].map((block, i) => (
            <div key={i} className="space-y-2">
              <div className={`h-3 rounded ${block.w1} bg-zinc-300`} />
              {block.lines.map((w, j) => (
                <div key={j} className={`h-2.5 rounded ${w} bg-zinc-200`} />
              ))}
            </div>
          ))}
        </div>

        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/75 backdrop-blur-[2px]">
          <p className="text-sm font-medium text-zinc-500">
            Full brief visible to members
          </p>
          <Link
            href="/apply"
            className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
          >
            Apply to join
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
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      {/* ------------------------------------------------------------------ */}
      {/* Nav */}
      {/* ------------------------------------------------------------------ */}
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="text-base font-semibold tracking-tight text-zinc-900">
            Tell The World
          </span>
          <Link
            href="/login"
            className="text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900"
          >
            Log in
          </Link>
        </div>
      </header>

      <main>
        {/* ---------------------------------------------------------------- */}
        {/* Hero */}
        {/* ---------------------------------------------------------------- */}
        <section className="bg-zinc-900 px-6 py-24 text-center">
          <div className="mx-auto max-w-3xl">
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
              Expert knowledge meets
              <br />
              public interest journalism.
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-zinc-400">
              Tell The World connects journalists with verified experts and
              organisations. If you have knowledge that the public deserves to
              hear, this is where your voice belongs.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/apply"
                className="inline-flex items-center justify-center rounded-full bg-white px-7 py-3 text-sm font-semibold text-zinc-900 transition-colors hover:bg-zinc-100"
              >
                Apply to join
              </Link>
              <a
                href="#briefs"
                className="inline-flex items-center justify-center rounded-full border border-zinc-600 px-7 py-3 text-sm font-semibold text-zinc-300 transition-colors hover:border-zinc-400 hover:text-white"
              >
                See active briefs
              </a>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Who's here */}
        {/* ---------------------------------------------------------------- */}
        <section className="border-b border-zinc-200 bg-white px-6 py-16">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
              Who's on the platform
            </h2>
            <div className="mt-8 grid gap-10 sm:grid-cols-2">
              <div>
                <h3 className="mb-4 text-sm font-semibold text-zinc-900">
                  Experts
                </h3>
                <ul className="space-y-3">
                  {experts.map((m) => (
                    <li key={m.name}>
                      <p className="text-sm font-medium text-zinc-800">{m.name}</p>
                      <p className="text-xs text-zinc-500">{m.affiliation}</p>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="mb-4 text-sm font-semibold text-zinc-900">
                  Organisations
                </h3>
                <ul className="space-y-3">
                  {organisations.map((m) => (
                    <li key={m.name}>
                      <p className="text-sm font-medium text-zinc-800">{m.name}</p>
                      <p className="text-xs text-zinc-500">{m.affiliation}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <p className="mt-8 text-xs text-zinc-400">
              And more — full directory visible to members.
            </p>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Briefs */}
        {/* ---------------------------------------------------------------- */}
        <section id="briefs" className="px-6 py-16">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
              Active briefs
            </h2>
            <p className="mt-2 text-sm text-zinc-500">
              Journalists are actively seeking expert sources for these stories.
            </p>

            {/* Public briefs — fully visible */}
            <div className="mt-8 space-y-6">
              {publicBriefs.map((brief) => (
                <PublicBriefCard key={brief.id} brief={brief} />
              ))}
            </div>

            {/* Members-only briefs — locked previews */}
            {membersBriefs.length > 0 && (
              <>
                <h3 className="mt-12 text-xs font-semibold uppercase tracking-widest text-zinc-400">
                  More briefs — members only
                </h3>
                <div className="mt-6 space-y-6">
                  {membersBriefs.map((brief) => (
                    <LockedBriefCard key={brief.id} brief={brief} />
                  ))}
                </div>
              </>
            )}
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Bottom CTA */}
        {/* ---------------------------------------------------------------- */}
        <section className="border-t border-zinc-200 bg-white px-6 py-16 text-center">
          <div className="mx-auto max-w-xl">
            <h2 className="text-2xl font-bold text-zinc-900">
              Ready to tell the world?
            </h2>
            <p className="mt-3 text-base leading-relaxed text-zinc-500">
              Applications are reviewed by our editorial team. We accept experts,
              researchers, NGOs, and organisations with relevant knowledge to
              share.
            </p>
            <Link
              href="/apply"
              className="mt-8 inline-flex items-center justify-center rounded-full bg-zinc-900 px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-700"
            >
              Apply to join
            </Link>
          </div>
        </section>
      </main>

      {/* ------------------------------------------------------------------ */}
      {/* Footer */}
      {/* ------------------------------------------------------------------ */}
      <footer className="border-t border-zinc-200 bg-zinc-50 px-6 py-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <span className="text-sm font-medium text-zinc-400">Tell The World</span>
          <Link
            href="/login"
            className="text-sm text-zinc-400 transition-colors hover:text-zinc-600"
          >
            Log in
          </Link>
        </div>
      </footer>
    </div>
  );
}
