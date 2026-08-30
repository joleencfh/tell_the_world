import type { Metadata } from 'next'
import Link from 'next/link'
import Logo from '@/components/ui/Logo'
import Footer from '@/components/ui/Footer'

export const metadata: Metadata = {
  title: 'Privacy Policy — Tell The World',
  description: 'How Tell The World collects, uses, and protects your personal data.',
}

const LAST_UPDATED = 'August 30, 2026'

// ---------------------------------------------------------------------------
// Content primitives — a plain long-form legal document, not one of the
// data-driven brief sections elsewhere in app/briefs. Kept intentionally
// simple: font-display uppercase h2s, font-body paragraphs/lists, the same
// dot-bullet list treatment as the brief TL;DR (section-content.tsx), and a
// bordered table for §3's legal-basis grid.
// ---------------------------------------------------------------------------

function Section({
  id,
  num,
  title,
  children,
}: {
  id: string
  num: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-24 py-10 border-b border-line last:border-b-0">
      <div className="flex items-center gap-4 mb-5">
        <span className="font-mono text-sm tracking-[0.2em] font-bold tabular-nums text-ink-soft">
          {num}
        </span>
        <h2 className="font-display uppercase font-extrabold text-ink text-xl sm:text-2xl tracking-tight">
          {title}
        </h2>
      </div>
      <div className="font-body text-[0.95rem] leading-[1.75] text-ink-soft space-y-4 [&_strong]:text-ink [&_strong]:font-semibold [&_a]:text-ink [&_a]:underline [&_a]:underline-offset-2 [&_a]:hover:text-ink-soft [&_a]:transition-colors">
        {children}
      </div>
    </section>
  )
}

function List({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3">
          <span className="mt-2.5 h-1.5 w-1.5 rounded-full bg-ink-faint shrink-0" aria-hidden />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col">
      <header className="sticky top-0 z-10 bg-paper/95 backdrop-blur-sm border-b-2 border-ink px-6">
        <div className="mx-auto flex max-w-3xl items-center justify-between py-4">
          <Logo href="/" />
          <Link
            href="/"
            className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink-soft hover:text-ink transition-colors"
          >
            Back home
          </Link>
        </div>
      </header>

      <main className="flex-1 px-6 py-14">
        <div className="mx-auto max-w-3xl">
          <div className="mb-5 flex items-center gap-2.5">
            <span className="h-1.5 w-1.5 rounded-full bg-ink-soft shrink-0" aria-hidden />
            <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-ink-soft">
              Legal
            </span>
          </div>
          <h1 className="font-display uppercase leading-[0.96] tracking-tight text-[2.25rem] sm:text-[2.75rem] text-ink mb-4">
            Privacy Policy
          </h1>
          <p className="font-mono text-xs text-ink-faint mb-3">Last updated: {LAST_UPDATED}</p>
          <p className="font-body text-base leading-[1.7] text-ink-soft max-w-2xl">
            This Privacy Policy explains how Tell The World (&ldquo;we,&rdquo; &ldquo;us,&rdquo;
            &ldquo;the Platform&rdquo;) collects, uses, and protects your personal data when you
            visit{' '}
            <a href="https://www.telltheworld.io" target="_blank" rel="noopener noreferrer">
              telltheworld.io
            </a>{' '}
            or use the Platform, in accordance with the EU General Data Protection Regulation
            (GDPR).
          </p>

          <div className="mt-14">
            <Section id="controller" num="01" title="Who is responsible for your data">
              <p>The data controller is:</p>
              <p>
                <strong>Giulia Consonni</strong>
                <br />
                Operating &ldquo;Tell The World&rdquo; as an individual / sole proprietor
                <br />
                Neumayerstr. 19, Neustadt an der Weinstraße, Germany
              </p>
              <p>
                You can reach us with any privacy question or request via our{' '}
                <Link href="/contact">contact form</Link>.
              </p>
            </Section>

            <Section id="data-we-collect" num="02" title="What data we collect">
              <p>
                <strong>a) If you just browse the site or join the waitlist</strong>
              </p>
              <List
                items={[
                  'Email address (waitlist signup only)',
                  'Standard technical data (IP address, browser type, pages visited) via server logs',
                ]}
              />

              <p className="pt-2">
                <strong>b) If you apply for membership (creator, journalist, expert,
                organisation, communications specialist, or other)</strong>
              </p>
              <List
                items={[
                  'Full name, email, desired role, bio, website URL',
                  'Role-specific details you provide: e.g. platform/audience size and content language (creators/journalists), affiliation and credibility link (experts), org name/size/mission (organisations), publication and reporting beat (journalists)',
                  'Internal admin notes and review status (visible only to us, not to you)',
                ]}
              />

              <p className="pt-2">
                <strong>c) If you&rsquo;re an approved member</strong>
              </p>
              <List
                items={[
                  'Everything from your application, now stored as your profile: display name, avatar, bio, availability status, preferred language, and the role-specific fields above',
                  <>
                    Authentication data from Supabase Auth: when you sign in with Google or
                    LinkedIn, we receive your email and basic profile info from that provider; if
                    you use magic link, we only use your email to send the sign-in link. We do not
                    receive or store passwords.
                  </>,
                  <>
                    <strong>Content you publish</strong>: posts (videos, articles, papers, quotes,
                    resources) and any text/links you submit
                  </>,
                  <>
                    <strong>Questions and answers</strong> you post on briefs
                  </>,
                  <>
                    <strong>Messages</strong>: when you send or receive a contact request, we
                    store the sender, recipient, subject, and body of that message
                  </>,
                ]}
              />

              <p className="pt-2">
                <strong>What we don&rsquo;t collect</strong>
              </p>
              <p>We don&rsquo;t run advertising trackers, and we don&rsquo;t sell or rent your data to anyone.</p>
            </Section>

            <Section id="legal-basis" num="03" title="Why we process your data (legal basis)">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-line">
                      <th className="font-mono text-[10px] tracking-[0.12em] uppercase text-ink-faint py-2 pr-4 font-medium">
                        Purpose
                      </th>
                      <th className="font-mono text-[10px] tracking-[0.12em] uppercase text-ink-faint py-2 font-medium">
                        Legal basis
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['Reviewing your application', 'Steps taken at your request prior to a contract (Art. 6(1)(b))'],
                      ['Providing the Platform to approved members (profiles, briefs, directory, messaging)', 'Performance of a contract (Art. 6(1)(b))'],
                      ['Authenticating you via Google, LinkedIn, or magic link', 'Performance of a contract / your consent to the OAuth provider (Art. 6(1)(b))'],
                      ['Sending you transactional emails (approval/rejection notices, contact request notifications)', 'Performance of a contract (Art. 6(1)(b))'],
                      ['Keeping the Platform secure, preventing abuse, basic analytics', 'Legitimate interest (Art. 6(1)(f))'],
                      ['Complying with legal obligations (e.g. tax records)', 'Legal obligation (Art. 6(1)(c))'],
                    ].map(([purpose, basis]) => (
                      <tr key={purpose} className="border-b border-line last:border-b-0 align-top">
                        <td className="py-3 pr-4 text-ink">{purpose}</td>
                        <td className="py-3 text-ink-soft">{basis}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>

            <Section id="sharing" num="04" title="Who we share data with">
              <p>
                We use a small number of service providers (&ldquo;processors&rdquo;) to run the
                Platform. They only process your data on our instructions and are contractually
                bound to protect it:
              </p>
              <List
                items={[
                  <><strong>Supabase</strong> — database, authentication, and file storage. Hosted in the EU (Ireland).</>,
                  <><strong>Vercel</strong> — application hosting.</>,
                  <><strong>Resend</strong> — transactional email delivery (approval notices, contact request emails).</>,
                  <><strong>Google / LinkedIn</strong> — only if you choose to sign in using one of these; they act as identity providers for that sign-in.</>,
                ]}
              />
              <p>
                <strong>Visible to other users:</strong> your profile information and anything you
                publish (posts, Q&amp;A, quotes) is visible to other approved members (and, for
                public briefs, to logged-out visitors) as a core function of the Platform — this
                is not third-party sharing, it&rsquo;s the service itself.
              </p>
              <p>We do not sell your personal data, and we do not share it with advertisers.</p>
            </Section>

            <Section id="transfers" num="05" title="International data transfers">
              <p>
                Our database, authentication, and file storage (Supabase) are hosted in the EU
                (Ireland). Some of our other processors — Vercel, Resend, Google, and LinkedIn —
                may store or process data outside the EU/EEA, including in the United States.
                Where this happens, we rely on appropriate safeguards such as the EU&ndash;US
                Data Privacy Framework or Standard Contractual Clauses (SCCs), as provided by
                these vendors.
              </p>
            </Section>

            <Section id="retention" num="06" title="How long we keep your data">
              <List
                items={[
                  <><strong>Rejected applications:</strong> deleted or anonymised after 12 months, kept only long enough to handle appeals or repeat applications.</>,
                  <><strong>Approved member profiles:</strong> kept for as long as your account is active, plus 30 days after you delete your account, to handle immediate recovery requests.</>,
                  <><strong>Content posts, Q&amp;A, quotes:</strong> kept until you delete them or your account is closed, since they form part of the Platform&rsquo;s shared knowledge base — removal on account deletion is handled on request (see Section 7).</>,
                  <><strong>Messages:</strong> kept for as long as either party&rsquo;s account is active.</>,
                  <><strong>Server/access logs:</strong> kept for 90 days for security purposes, then deleted.</>,
                ]}
              />
            </Section>

            <Section id="rights" num="07" title="Your rights">
              <p>Under the GDPR, you have the right to:</p>
              <List
                items={[
                  <><strong>Access</strong> the personal data we hold about you</>,
                  <><strong>Rectify</strong> inaccurate or incomplete data</>,
                  <><strong>Erase</strong> your data (&ldquo;right to be forgotten&rdquo;), subject to legal or legitimate-interest exceptions</>,
                  <><strong>Restrict</strong> processing in certain circumstances</>,
                  <><strong>Data portability</strong> — receive your data in a structured, machine-readable format</>,
                  <><strong>Object</strong> to processing based on legitimate interest</>,
                  <><strong>Withdraw consent</strong> at any time, where processing is based on consent (e.g. OAuth sign-in), without affecting prior processing</>,
                  <>
                    <strong>Lodge a complaint</strong> with a supervisory authority — either your
                    own country&rsquo;s data protection authority, or ours: the{' '}
                    <em>Landesbeauftragte für den Datenschutz und die Informationsfreiheit
                    Rheinland-Pfalz</em> (Rhineland-Palatinate, Germany), since that&rsquo;s where
                    the Platform is operated from
                  </>,
                ]}
              />
              <p>
                To exercise any of these rights, reach us via our{' '}
                <Link href="/contact">contact form</Link>. We&rsquo;ll respond within one month, as
                required by GDPR.
              </p>
            </Section>

            <Section id="cookies" num="08" title="Cookies">
              <p>
                We use only the minimal cookies/local storage needed for Supabase Auth to keep you
                signed in. We don&rsquo;t currently use analytics or advertising cookies. If that
                changes (e.g. we add product analytics), we&rsquo;ll update this policy and add a
                cookie consent mechanism as required.
              </p>
            </Section>

            <Section id="security" num="09" title="Security">
              <p>
                We use industry-standard measures to protect your data, including encrypted
                connections (HTTPS), access-controlled admin tools, and provider-level security
                (Supabase&rsquo;s built-in row-level security and authentication). No system is
                100% secure, but we take reasonable steps to protect your information against
                unauthorised access, loss, or misuse.
              </p>
            </Section>

            <Section id="children" num="10" title="Children">
              <p>
                Tell The World is intended for professional use by adults — content creators,
                journalists, researchers, and organisations. It is not directed at, and we do not
                knowingly collect data from, anyone under 16.
              </p>
            </Section>

            <Section id="changes" num="11" title="Changes to this policy">
              <p>
                We may update this policy as the Platform evolves (e.g. when multilingual support
                or new features launch). We&rsquo;ll update the &ldquo;Last updated&rdquo; date
                above and, for material changes, notify active members by email.
              </p>
            </Section>

            <Section id="contact" num="12" title="Contact">
              <p>
                Questions about this policy or your data: use our{' '}
                <Link href="/contact">contact form</Link>.
              </p>
            </Section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
