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

Four new sections, added between the existing hero and the footer.
Order, top to bottom:

1. Hero (unchanged, already live)
2. Existing "Creators & journalists" / "Researchers & organisations"
   cards (unchanged, already live)
3. **New — Why this matters now**
4. **New — What's inside** (includes a product screenshot)
5. **New — Differentiation line**
6. **New — Closing ask**, replacing the current single waitlist CTA
   block with two role-specific columns
7. Footer (unchanged)

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

**What's inside**

> Eyebrow: WHAT'S INSIDE
> Headline: Real questions, answered by the people doing the research.
> Body:
> Briefs give creators and journalists the background they need without
> months of digging.
> A searchable quotes database gives them something they can attribute:
> on the record statements from real researchers.
> A directory makes experts and organisations easy to find and contact
> directly.
> Every brief has open Q&A too, so members can ask a question and get an
> answer from someone who actually works on this.
> Screenshot caption: Example brief conversation. Tell The World is in
> early access.

Layout note: screenshot on one side (device or browser frame, per the
existing design system's card treatment), the four sentences above as
short stacked lines next to it, not a paragraph. The screenshot is the
existing Q&A mock-up (Priya Sharma's question, Dr. Sarah Chen and Amara
Osei's answers) exported as an image. **This image doesn't exist as a
file yet** — it needs to be exported from the deck and dropped in before
Part 1 can ship. The caption is required, not optional: without it, a
visitor could mistake mock names for real users.

**Differentiation line**

> AI explainer sites exist. So do quote services for journalists. What's
> missing is one place built specifically for AI safety, with an expert
> directory, a quotes database, and a design meant to reach past
> English-language creators.

Layout note: short, centered, on its own, styled to stand out from the
surrounding body copy (a pull-quote or highlighted band) so it reads as
a confident, deliberate assertion right before the ask, not another
paragraph to skim past.

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
- Live rendered version: https://claude.ai/artifact/6LTUH2Ua3FHUmWC9847SqK

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
- Live rendered version: https://claude.ai/artifact/HWGBpfvrmi7bGQSTCtHYuf

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

**Depends on: Part 0's sign-off.**

1. Confirm the Q&A screenshot image has been supplied (ask the user if
   it's missing rather than proceeding without it) and add it under
   `public/`.
2. Check whether `components/landing/WaitlistModal.tsx` already
   supports an initial/pre-selected role. If not, add an optional
   `defaultRole` prop that pre-selects the role field when the modal
   opens, and wire the two closing-ask buttons to pass `expert` (or
   `organisation`, whichever reads better given the copy says "an
   expert or org" — use judgment, or ask) and `creator` respectively. If
   this turns out to be more invasive than expected, flag it and ship
   the buttons opening the modal with no pre-selection rather than
   over-engineering it.
3. Add the four new sections to `app/page.tsx` in the order specified in
   §0, using the exact copy from §0, matching whatever
   component-vs-inline pattern the file already uses. Reuse existing
   design tokens and card styles, don't introduce new ones.
4. Re-check all new copy against the copy-tone rules in §0 one more time
   before finalizing (no em dashes, no "quietly"/"genuinely," no
   rule-of-three flourishes) — easy to drift on during implementation.
5. Run `bun run build` and confirm it succeeds.

#### Prompt for next session — Part 1

```
Read docs/design/landing-page/conference-landing-page-plan.md in full
before doing anything else — §0 for the copy, layout notes, and open
questions, §1 for engineering conventions. Confirm Part 0 has a
signed-off design direction before starting.

Build Part 1 (conference-landing-page-plan.md §2, Part 1) — the four new
sections in app/page.tsx.

1. Confirm the Q&A screenshot has been supplied and lives under public/.
   If it's missing, ask the user rather than proceeding without it.
2. Check components/landing/WaitlistModal.tsx for existing role
   pre-selection support. If none exists, add an optional defaultRole
   prop and wire the two closing-ask CTAs to it (expert/org column ->
   expert or organisation, creator/journalist column -> creator). If
   this is more invasive than a small prop addition, flag it and ship
   the buttons without pre-selection instead.
3. Add Why This Matters Now, What's Inside (with screenshot and
   caption), the differentiation line, and the two-column closing ask to
   app/page.tsx, in that order, using the exact copy from §0 and the
   signed-off design from Part 0. Match the file's existing
   component-vs-inline pattern rather than introducing a new one.
4. Re-check all new copy against the §0 copy-tone rules one final time.
5. Run bun run build and confirm it succeeds.

Verify: bunx tsc --noEmit && bun run lint clean && bun run build,
browser-check the new sections match the signed-off design, both
closing-ask buttons open WaitlistModal correctly (with pre-selected
roles if that was implemented), the page reads correctly on mobile
width.
```
