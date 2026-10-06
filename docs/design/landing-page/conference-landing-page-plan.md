# Conference-Ready Landing Page — New Sections

**Status: draft, not started.** This plan adds four new sections to the
current homepage (`app/page.tsx`), on top of whatever the silent-launch
plan (`temp-landing-page-plan.md`) already shipped there. It does not
touch the waitlist schema, the submit action, or OAuth gating — those
are done and this plan doesn't reopen them.

This is meant to sit next to `temp-landing-page-plan.md` in the same
folder. That plan explicitly kept things bare on purpose, for cold,
anonymous traffic. This plan exists because the audience changed: the
next couple of weeks include people who'll open this link right before
a 1:1 conversation at an AI safety conference, and a bare page under-
sells what's actually already built. The bare version was right for its
purpose. This one is for a different, more informed reader.

## How to use this

Same convention as `temp-landing-page-plan.md`: each part has a
ready-to-paste "prompt for next session" block. **Part 0 (design
proposals) must be signed off before Part 1 (implementation) starts.**
Every part needs the user's explicit sign-off, not just green CI.

---

## 0. Where this comes from

**Revised 2026-09-23** after a design-review session that iterated past
this section's original scope — see "Sign-off and revision history"
right after this list for what changed and why. The section order below
is current; treat the copy in this section as current too (superseding
anything with the same name in an older read of this doc).

Six new sections, added between the existing hero and the footer. Order,
top to bottom:

1. Hero (unchanged, already live)
2. Existing "Creators & journalists" / "Researchers & organisations"
   cards (unchanged, already live)
3. **New — Why this matters now**
4. **New — Community Q&A demo** (dedicated section: title + copy on one
   side, a crafted loop animation on the other)
5. **New — Quotes/Add-a-quote demo** (same shape as #4, sides reversed;
   the animation itself is not built yet)
6. **New — Imagine + scale** (replaces the earlier "Differentiation
   line" concept — same job, more developed)
7. **New — Closing ask**, replacing the current single waitlist CTA
   block with two role-specific columns
8. Footer (unchanged)

### Sign-off and revision history

- **2026-09-16/17**: Part 0 design proposals produced (three directions:
  Calm Editorial, Bold Ink Block, Asymmetric Press). **Bold Ink Block
  signed off** as the direction — reversed blue-ink bands, 2px ink
  borders, mono numbered dividers, shadow-block accents. Artifact: a private claude.ai mockup (note: this mockup
  predates everything below — its What's Inside section still shows a
  placeholder image, not the two dedicated demo sections).
- **2026-09-17**: explored a crafted (non-video) loop animation of the
  real Community Q&A card for the What's Inside screenshot placeholder.
  Built out, iterated on copy (uses the real July 2026 Hugging Face/
  OpenAI incident as example content), and saved at
  `docs/design/landing-page/qa-feature-loop-concept.html` — see that
  file's own header comment for the full history.
  This is **built and signed off** as the Community Q&A demo.
- **2026-09-23**: decided one demo animation wasn't enough to convey
  what the product does, and restructured What's Inside into two
  dedicated title+demo sections instead of one section with a bullet
  list. Second feature chosen: the real **Add a quote** flow
  (`app/briefs/[slug]/quote-modals.tsx`'s `AddQuoteModal`) — chosen over
  the quotes database (not ready) and over the CTA carousel/Explainer
  (less central to the pitch, or too similar in interaction shape to
  Q&A). A build prompt for this second animation was written in that
  session's chat; the animation itself was then built separately (a
  different working session on this same branch, commit `7f7cabf`) —
  see `docs/design/landing-page/quote-feature-loop-concept.html`. Note
  it uses a different fictional persona (Elena Vasquez) than the Q&A
  loop (Dr. Sarah Chen) — reconcile or not, see the open question below.
- **2026-09-23**, same session: added the new "Imagine + scale" section
  (replacing the shorter "Differentiation line" pull-quote), reverted
  "Why This Matters Now" to its original full-copy/pink-bloom treatment
  after a brief attempt to shorten it, and added thin rule dividers
  bounding "Why This Matters Now" and between the two demo sections so
  sections read as visually distinct blocks. Final full-page layout
  mockup: `docs/design/landing-page/two-demo-layout-concept.html` — **this
  mockup is the current signed-off layout direction**, superseding the
  original Bold Ink Block mockup's section structure while keeping its
  visual language. Note: this mockup's Quotes-demo slot still shows a
  "Not yet built" placeholder — stale as of the Add a Quote loop landing
  the same day (see above); Part 1 uses the real animation, not that
  placeholder.

### Copy-tone rules (reused from `temp-landing-page-plan.md` §0)

Same rules apply here, they're not being relaxed: no em dashes, avoid
"quietly," "genuinely," and rule-of-three rhetorical flourishes. Write
plainly, the way a person who works here would write it. The copy
below has already been written to this standard — implementation
should use it as given, not "improve" it back toward something more
polished-sounding.

### The copy, section by section

**Why this matters now**

> Eyebrow: WHY THIS MATTERS NOW
> Headline: Attention shows up. Understanding doesn't stick.
> Body: Every few months a warning from inside a frontier lab goes
> viral and the whole internet spends a week arguing about AI risk.
> Then it fades, and what's left is confusion and a fight split down
> party lines, not a public that understands the problem any better.
> People are already paying attention. What's missing is careful
> explanation from the people who actually study this, coming from
> voices audiences already trust.

Layout note: full-width text block, similar treatment to the hero but
smaller, on a different background tint from the paper/ink tokens to
break up the page rhythm. No image, no CTA here, it's a beat, not a
pitch.

**Community Q&A demo** (replaces the old single "What's Inside" section)

> Eyebrow: COMMUNITY Q&A
> Headline: Ask a question. Get an answer from someone who studies this.
> Body: Every brief has open Q&A. Ask what's actually on your mind, and
> an expert or organisation working on the problem answers directly, on
> the record, with their name and affiliation attached.

Layout note: two columns on desktop (title+copy one side, demo the
other), stacking on mobile. Title+copy on the left, demo on the right.
The demo is a crafted CSS/JS loop animation (not a video, not a static
screenshot) of the real Community Q&A card —
`docs/design/landing-page/qa-feature-loop-concept.html` is the finished,
signed-off version; Part 1 ports it into a real React client component
rather than embedding the static file. Treat the headline/body above as
a first draft, not final copy — re-check it reads well next to the
actual animation before shipping.

**Quotes/Add-a-quote demo**

> Eyebrow: QUOTES, ON RECORD
> Headline: A quote experts can actually stand behind.
> Body: Experts and organisations add their own on-record quotes
> directly, in plain language. Every submission runs through a clarity
> check first, so jargon gets caught before it ever reaches a reader.

Layout note: same two-column shape as the Q&A demo, sides reversed (demo
on the left, title+copy on the right) so the two sections don't read as
a repeated template. The demo is built —
`docs/design/landing-page/quote-feature-loop-concept.html` — a crafted
loop of the real Add a Quote flow (`app/briefs/[slug]/quote-modals.tsx`'s
`AddQuoteModal`): idle state shows the real Quotes section behind the
button, click opens the form, the clarity check flags "reward hacking,"
it gets revised to plain language, and the quote publishes. Treat the
headline/body above as a first draft, same caveat as the Q&A section's
copy.

**Imagine + scale** (replaces the earlier "Differentiation line" —
same job in the page's argument, more developed)

> Eyebrow: WHY THIS COULD BE BIG
> Headline: Imagine every AI safety expert's public voice, in one place.
> Body: Right now the case for AI safety lives in scattered X threads,
> Substack posts, and knowledge that never leaves a lab. What if a
> small, critical group of the world's communicators could draw from
> all of it in one place, with a name and a face behind every claim,
> one question away instead of one search away?
>
> Stat: 200,000
> Stat caption: Creators reached, before journalists even factor in
> Supporting line: Just 5% of creators with more than 10,000 followers,
> across ten major western countries, would bring around 200,000
> creators into AI safety communications, each reaching thousands of
> people directly. Add even a small share of journalists and the reach
> grows further.

Layout note: full-bleed reversed band (`--color-blue-ink` background,
white/light-blue text, pink accent on the stat number) — the same
visual treatment Bold Ink Block used for the old differentiation line,
just carrying more content now (an argument paragraph, then the stat as
a large centered callout, then a supporting sentence). Centered, max
content width ~42rem. This section sits right before the closing ask,
as the emotional-plus-rational beat that sets up "join now."

**Closing ask** (replaces the current single CTA block)

> Column 1 — For researchers & organisations
> Body: You've done the work. Getting it in front of a non-specialist
> audience shouldn't be another job on top of your research. Join as an
> early expert or organisation and help shape the first briefs and Q&A
> threads creators and journalists will actually use.
> Button: Apply as an expert or org
>
> Column 2 — For creators & journalists
> Body: You know how to make people care about something. What's
> usually missing is the background and a real expert willing to go on
> record. Join the waitlist for early access to briefs, quotes, and
> direct contact with the people doing the research.
> Button: Join the waitlist
>
> Below both columns: Want in sooner? Become an early tester and try
> Tell The World while it's still rough, so you can help us fix it.

Layout note: two columns side by side on desktop, stacked on mobile,
using the existing border-line card style. Both buttons open the
existing `WaitlistModal`. Ideally each button pre-selects the relevant
role in the modal rather than leaving the role selector blank (see Part
1, step 2) — nice to have, not a blocker if it turns out to be more
work than it's worth.

### Open questions for implementation to check, not assume

- Whether the current `app/page.tsx` already has separate section
  components or is still one flat file (per `temp-landing-page-plan.md`
  Part 3, it may be simple) — match whatever pattern already exists
  rather than introducing a new one.
- Whether `WaitlistModal` already accepts any kind of initial-role prop.
  If not, this plan proposes adding one; if it does, use it.
- No schema, RLS, or migration changes are expected anywhere in this
  plan. If implementation turns up a reason one is needed, stop and
  flag it rather than proceeding.
- ~~The Quotes/Add-a-quote demo animation does not exist yet~~ — it
  does now (built 2026-09-23, commit `7f7cabf`, see the sign-off history
  above). Not a blocker for Part 1 anymore. One loose end to reconcile
  before or during Part 1: that build used a different fictional expert
  persona (Elena Vasquez, Independent Researcher) than the Q&A loop
  (Dr. Sarah Chen) — decide whether to unify on one persona across both
  demos for continuity, or leave them distinct. Not a blocker either
  way, just a polish call.

### Design exploration: a crafted loop animation for "What's Inside"

**Status: exploration only, not part of this plan's signed-off scope.**
Branched from a 2026-09-17 design session (branch
`feature/conference-landing-page-part0`) exploring the Notion-style
"product in motion" idea for the What's Inside screenshot placeholder —
a hand-built, looping CSS/JS animation of the real Community Q&A card
(`app/briefs/[slug]/qa.tsx` and `qa-answers.tsx`), not a video. Static
copy exploration used a real, sourced AI-safety incident (the July 2026
Hugging Face/OpenAI security incident); the "comments on an answer"
feature it demonstrates does not exist in the real product yet — see
the Notion story "Community Q&A: threaded comments on an answer" under
the Briefs epic.

Saved for later reference:
- In-repo source: `docs/design/landing-page/qa-feature-loop-concept.html`
  (open directly in a browser, or drop into any static server).
- (The original claude.ai artifact was private and is no longer linked.)

This has **not** been signed off as the direction for the What's Inside
section — treat it the same as Part 0's other design proposals (needs
explicit user sign-off) before wiring it into `app/page.tsx` in Part 1.

**Status: exploration only, not signed off.** A second loop of the same
kind, this time of the real Add a Quote flow (`app/briefs/[slug]/
quote-modals.tsx`'s `AddQuoteModal`, `lib/briefs/actions.ts`'s
`submitQuote`, and the deterministic clarity check in
`lib/clarity/check.ts` / `useClarityGate.ts` / `ClarityFlagsPanel.tsx`).
Unlike the Q&A loop above, every behavior it shows is already shipped:
an expert types a quote, the clarity check flags the jargon term
"reward hacking," she revises it into plain language, the flag clears,
and it publishes immediately (the happy path: a `pending`-status ending
was avoided as anticlimactic for a landing page). Same fictional expert
persona (Elena Vasquez, Independent Researcher) and same Hugging Face /
OpenAI incident as the Q&A loop, for continuity between the two demos.

Saved for later reference:
- In-repo source: `docs/design/landing-page/quote-feature-loop-concept.html`
- (The original claude.ai artifact was private and is no longer linked.)

Not signed off as a direction. Needs explicit sign-off before either
loop is wired into `app/page.tsx`.

---

## 1. Engineering conventions

Reused from `temp-landing-page-plan.md` §1, only the parts relevant
here:

- **Bun only.**
- **Verify in-browser before calling any part done.** Check
  `[[build_plan_dev_server_lock]]` memory if a second session's dev
  server is already bound to this repo.
- **This is a shared working directory** — check `git status`/
  `git branch --show-current` before assuming the tree matches what you
  last saw.
- **Every part needs the user's explicit sign-off, not just green CI.**
- **Copy-tone rules** — see §0 above, reused as-is.

---

## 2. Part-by-part build order

### Part 0 — Design proposals (design-first, do this before Part 1)

**Depends on:** nothing. **Blocks:** Part 1.

Produce 2–3 distinct visual directions for the four new sections, as
Claude Code Artifacts, before writing any page code. Each direction
should show the full page flow for context — the existing header, hero,
and audience cards can be represented simply and faithfully since
they're not changing — with the actual design effort going into the
four new sections: Why This Matters Now, What's Inside (with the
screenshot and its caption), the differentiation line, and the two-
column closing ask.

Use the exact copy from §0 above in the mockups, not placeholder text.
If the Q&A screenshot image isn't available yet, use a clearly labeled
placeholder box in its place rather than inventing fake UI content —
don't fabricate a stand-in screenshot that looks like a real product
shot.

Match the existing design tokens exactly (`app/globals.css`'s
paper/ink/pink/blue color tokens, the Segoe UI display font, mono
uppercase eyebrow/label treatment, border-line card style) so the new
sections read as part of the same page, not a new visual system.

Share the directions with the user and get explicit sign-off on one (or
a named hybrid) before Part 1 starts.

#### Prompt for next session — Part 0

```
Read docs/design/landing-page/conference-landing-page-plan.md in full
before doing anything else — §0 for the copy and layout notes, §1 for
engineering conventions. Also skim app/page.tsx to see its current
structure, app/globals.css for the exact design tokens, and
docs/design/landing-page/temp-landing-page-plan.md for context on what's
already live and why it was kept bare.

Build Part 0 (conference-landing-page-plan.md §2, Part 0) — design
proposals only, no app code changes.

Produce 2-3 distinct visual directions for the four new sections
described in §0 (Why This Matters Now, What's Inside, the
differentiation line, the two-column closing ask), as Claude Code
Artifacts. Show the full page flow for context, but put the design
effort into the four new sections — the existing header, hero, and
audience cards can be represented plainly since they aren't changing.

Use the exact copy from §0, not placeholder text. If
public/images/qa-example.png (or wherever the Q&A screenshot should
live) doesn't exist yet, use a clearly labeled placeholder box instead
of inventing fake UI content. Match the existing design tokens in
app/globals.css exactly (paper/ink/pink/blue colors, Segoe UI display
font, mono uppercase labels, border-line card style).

Present the directions to the user and get explicit sign-off on one (or
a named hybrid) before Part 1 starts. Do not proceed to Part 1 in this
same session unless the user explicitly signs off first.
```

---

### Part 1 — Implementation

**Depends on: Part 0's sign-off (Bold Ink Block) and the 2026-09-23
layout revision (both signed off, see "Sign-off and revision history"
under §0).** Both demo animations exist and are built — this part is
no longer blocked on anything. Six new sections go into `app/page.tsx`,
per §0's current order: Why This Matters Now, Community Q&A demo,
Quotes/Add-a-quote demo, Imagine + scale, closing ask (the last one may
already partly exist — check `components/landing/ClosingSection.tsx`
before assuming it needs to be built from scratch).

Before starting, resolve two things with the user (don't assume either):
1. The two demo animations use different fictional expert personas
   (Dr. Sarah Chen in the Q&A loop, Elena Vasquez in the Add-a-quote
   loop). Ask whether to unify on one before shipping, or leave as is.
2. `qa-feature-loop-concept.html` and `quote-feature-loop-concept.html`
   are static, self-contained HTML/CSS/JS files (their own `<style>` +
   inline `<script>`, no React) — Part 1 needs to port each into a real
   React client component, not `dangerouslySetInnerHTML` the whole file
   in. Confirm the porting approach with the user if the scope looks
   larger than expected (e.g. if the inline JS timeline logic doesn't
   translate cleanly to `useEffect`/`useState`).

1. Check `components/landing/WaitlistModal.tsx` for existing role
   pre-selection support. If none exists, add an optional `defaultRole`
   prop and wire the closing-ask CTAs to it (expert/org column ->
   `expert` or `organisation`, creator/journalist column -> `creator`).
   If this is more invasive than a small prop addition, flag it and ship
   the buttons without pre-selection instead.
2. Port `docs/design/landing-page/qa-feature-loop-concept.html` into a
   new client component (e.g. `components/landing/QACommunityDemo.tsx`)
   — same markup/CSS/animation-timeline logic, translated into JSX +
   `useEffect` for the timers/`ResizeObserver`/cursor positioning math.
   Keep the `prefers-reduced-motion` fallback and the fixed-height
   fade-viewport mechanic exactly as built; don't simplify them away.
3. Port `docs/design/landing-page/quote-feature-loop-concept.html` the
   same way (e.g. `components/landing/AddQuoteDemo.tsx`).
4. Build the six sections in `app/page.tsx` in §0's order, using the
   exact current copy from §0 (treat the demo-section headline/body
   copy as first-draft — flag if it reads badly once actually laid out,
   don't silently "improve" it). Match whatever component-vs-inline
   pattern the file already uses; reuse existing design tokens, don't
   introduce new ones. Include the thin `line-strong` rule dividers
   bounding Why This Matters Now (top+bottom) and between the two demo
   sections, per the layout notes in §0.
5. Re-check all new copy against the copy-tone rules in §0 one more time
   before finalizing (no em dashes, no "quietly"/"genuinely," no
   rule-of-three flourishes) — easy to drift on during implementation.
6. Run `bun run build` and confirm it succeeds.

#### Prompt for next session — Part 1

```
Read docs/design/landing-page/conference-landing-page-plan.md in full
before doing anything else, specifically §0's "Sign-off and revision
history" (both demo animations are built and signed off — this is not
blocked), the current section copy in §0, and §1 for engineering
conventions. Also open docs/design/landing-page/two-demo-layout-concept.html
directly in a browser first to see the full signed-off page flow before
touching any code.

Build Part 1 (conference-landing-page-plan.md §2, Part 1) — six new
sections in app/page.tsx: Why This Matters Now, a Community Q&A demo
section, a Quotes/Add-a-quote demo section, an Imagine + scale section,
and the closing ask (check components/landing/ClosingSection.tsx first —
it may already exist from earlier work).

Before writing code, resolve two things with the user:
1. The two demo animations use different fictional personas (Dr. Sarah
   Chen vs Elena Vasquez) — ask whether to unify on one.
2. Confirm the porting approach for turning the two static HTML/CSS/JS
   demo files into React components (see step 2-3 below) — flag if the
   inline JS timeline logic doesn't translate cleanly.

1. Check components/landing/WaitlistModal.tsx for existing role
   pre-selection support. If none exists, add an optional defaultRole
   prop and wire the closing-ask CTAs to it (expert/org column ->
   expert or organisation, creator/journalist column -> creator). If
   this is more invasive than a small prop addition, flag it and ship
   the buttons without pre-selection instead.
2. Port docs/design/landing-page/qa-feature-loop-concept.html into a new
   client component (components/landing/QACommunityDemo.tsx or similar)
   — same markup, CSS, and animation-timeline logic, translated into
   JSX + useEffect. Keep the prefers-reduced-motion fallback and the
   fixed-height fade-viewport mechanic (dynamic height measurement via
   requestAnimationFrame + document.fonts.ready + a timeout safety net,
   plus a ResizeObserver) exactly as built — this was a real bug last
   time (an early measurement before fonts/layout settled undersized
   the box and clipped the resting state), don't simplify it away.
3. Port docs/design/landing-page/quote-feature-loop-concept.html the
   same way into a second client component.
4. Add all six sections to app/page.tsx in §0's current order, using the
   exact current copy from §0 (the demo-section headline/body copy is
   marked as first-draft in §0 — flag it if it reads badly next to the
   real animation rather than silently rewriting it). Match the file's
   existing component-vs-inline pattern. Include the thin line-strong
   rule dividers bounding Why This Matters Now and between the two demo
   sections.
5. Re-check all new copy against the §0 copy-tone rules one final time.
6. Run bun run build and confirm it succeeds.

Verify: bunx tsc --noEmit && bun run lint clean && bun run build,
browser-check the new sections match
docs/design/landing-page/two-demo-layout-concept.html, both demo
animations actually run in the browser (not just render statically —
confirm the reveal timeline, the click-to-expand comments interaction
in the Q&A one, and the clarity-check flag-then-revise interaction in
the Add-a-quote one), prefers-reduced-motion shows each demo's fully-
resolved end state with no animation, both closing-ask buttons open
WaitlistModal correctly, the page reads correctly on mobile width.
```
