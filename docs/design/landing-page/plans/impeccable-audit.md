# Landing page audit (Impeccable)

Date: 2026-09-29. Surface: `/` (`app/page.tsx`, `components/landing/*`). Mode: Persuade. Branch `landing/background-intensity`. No files were edited.

Method: `impeccable detect` on the route and components, full read of the source, DOM and computed-style probes against the dev server at 375, 768 and 1440 wide. Not done: real keyboard tabbing and a screen reader (focus order is read from the DOM), and production-build timings (dev timings are ignored below).

## Audit Health Score

| # | Dimension | Score | Key finding |
|---|-----------|-------|-------------|
| 1 | Accessibility | 2 | Live demos: dead focusable buttons, no pause control, sub-7px text; modal has no focus management |
| 2 | Performance | 3 | Demos loop forever even off-screen; whole page is a client component |
| 3 | Responsive Design | 3 | No overflow at 375/768/1440; header targets and demo text are small |
| 4 | Theming | 3 | Tokens used well; literals for wash colours and several demo/section colours |
| 5 | Implementation Integrity | 3 | Coherent Two-Ink Bold system; 3 detector hits (2 are the demo tell) |
| **Total** | | **14/20** | **Good, address the demos and the modal** |

## Implementation Integrity verdict

Pass. The page uses one coherent, product-specific system (paper/ink, pink and blue inks, mono eyebrows, 2px ink borders). It isn't interchangeable with a generic SaaS page. Detector findings (3 total):

- `AddQuoteDemo.tsx:633` `side-tab` (3px left border, `.clarity-box`). Real, but it mirrors the shipped ClarityFlagsPanel, so it is faithful-to-product. P3.
- `QACommunityDemo.tsx:387` `side-tab` (3px left border, `.answer`). Same story, mirrors the brief page's answer card. P3.
- `QACommunityDemo.tsx:403` `layout-transition` (`max-height` transition). Real. See P2-4.

## Summary

Counts: P0 0, P1 4, P2 6, P3 6.

Top issues:

1. Both demos are one-way animations with live `<button>`s that do nothing, and no pause control (P1).
2. The 200,000 stat is an uncited projection labelled "Creators reached" and fails contrast (P1).
3. WaitlistModal has no focus move, trap or restore, and the role picker has no state (P1).
4. Demo text renders at roughly 5 to 8px effective and fails contrast on the wash (P1).

## Findings

### P1

**[P1] Live demos are not operable or controllable; dead buttons are in the tab order**
- Location: `components/landing/AddQuoteDemo.tsx:446, 547, 548`; `QACommunityDemo.tsx` (whole component); loops at `AddQuoteDemo.tsx:309-405`, `QACommunityDemo.tsx:145-181`.
- Evidence: DOM focusables in tab order include `+ Add quote`, `Review flags` (changes text during the loop), and `Cancel` inside `.aq-demo`. All are real `<button>`s with no handlers. The `sr-only` description is read alongside the live-updating visible text, and the visible loop is not `aria-hidden`. Neither loop offers pause/stop. The Q&A demo loops every 13s, the quote demo every 24s.
- Impact: keyboard and screen-reader users land on controls that do nothing. Auto-updating content longer than 5s needs a pause (WCAG 2.2.2). The `Review flags`/`Published` label churn is a moving target for AT.
- Fix: wrap each demo in `role="img"` with `aria-label`/`aria-describedby` pointing at the `sr-only` text and `aria-hidden` the animated internals, or make the internals `<div>`/`<span>`s not `<button>`s. Add a visible Pause/Play toggle (also stops the timers). Optionally add `inert` to the demo subtree so nothing inside is focusable.
- Command: `/impeccable harden`.

**[P1] "200,000" stat: uncited projection reads as achieved fact, and fails contrast**
- Location: `ImagineScaleSection.tsx:36-48`.
- Evidence: caption "Creators reached, before journalists even factor in" states a result. The body says "would bring around 200,000" (a projection) from "5% of creators with more than 10,000 followers, across ten G20 countries", with no source for the base population. Pink `#F0197E` on `#0B2C99` measures 2.80:1 at 41.6px bold (large text needs 3:1).
- Impact: PRODUCT.md forbids fabricated proof. A number with no source that a visitor can read as a current count damages the "credibility over reach" principle. It also fails WCAG 1.4.3.
- Fix: relabel as a projection ("Creators we could bring in", "If just 5% joined"), cite the base data and method, or move the arithmetic next to the figure. Recolour the figure: white, or a lighter pink that reaches 3:1 on `blue-ink` (about `#FF7DB6`).
- Command: `/impeccable clarify`, `/impeccable colorize`.

**[P1] WaitlistModal lacks dialog focus management; role picker has no state**
- Location: `WaitlistModal.tsx:110-128, 201-220`.
- Evidence: `role="dialog" aria-modal="true"` but no `aria-labelledby`, no initial focus, no focus trap, no focus restore to the trigger, and the page behind stays interactive to AT/Tab. Escape works. The six role buttons show selection by colour only (no `aria-pressed`/radio semantics); the group label "I am a" is a `<label>` with no `htmlFor`. Input focus is only `border` colour change with `outline-none` (line 42), a 1px low-contrast cue.
- Impact: keyboard users can tab into the page behind the modal; SR users don't hear a dialog name or the selected role; weak focus indicator (WCAG 2.4.3, 2.4.7, 4.1.2, 1.3.1).
- Fix: use `<dialog>` with `showModal()` or add a small focus trap, focus the heading/first field on open, restore focus on close, add `aria-labelledby`. Make the roles a `role="radiogroup"` with `role="radio"`/`aria-checked` (or real radios) and a `fieldset`/`legend`. Replace `focus:outline-none` with a visible `focus-visible` ring.
- Command: `/impeccable harden`.

**[P1] Demo microtype is effectively 5 to 8px and fails contrast on the wash**
- Location: `QACommunityDemo.tsx:367-414`; `AddQuoteDemo.tsx:602-610, 626, 631, 643`.
- Evidence: font sizes of 6.5 to 11px set inside `zoom:.85` / `zoom:.75`. Measured effective sizes at 375px: role badges 6.8px, credential lines 6.8 to 7.65px. `--color-ink-faint` (#727679) on the blue wash `#EAF0FE` is 4.01:1 for `.cred`, `.clarity-suggestion` (needs 4.5:1). The token comment (globals.css:27) only verified 4.57:1 against white.
- Impact: unreadable on phones and for low-vision users. The demo is the page's main proof-of-product, and its text is the least legible on it. Persuade-mode content that cannot be read does not persuade.
- Fix: raise the floor to about 10px effective (drop the zoom, or size for the narrow column instead of shrinking), and use `ink-soft` where text sits on the wash. Consider showing fewer, larger elements rather than a full-fidelity miniature.
- Command: `/impeccable typeset`, `/impeccable adapt`.

### P2

**[P2] Demo content is fictional and its disclosure is screen-reader only**
- Location: `QACommunityDemo.tsx:201-207, 212-333`; `AddQuoteDemo.tsx:426-433`.
- Evidence: named personas (Priya Sharma, Elena Vasquez, Theo Bergstrom, Sana Kader, Foresight Commons), vote counts, "Endorsed", and a comments feature that per the sr-only note "does not exist in the product yet". The visible page carries no "illustrative" label. The Add-quote sr-only text claims the feature is "an existing, shipped feature".
- Impact: PRODUCT.md bans fabricated proof/endorsements. Sighted visitors could read invented people and counts as real members or real activity, and the demo shows an unbuilt feature (comments) as live.
- Fix: add a small visible caption ("Illustrative example, sample content") to each demo and drop the comments beat or mark it "coming soon". Keep persona names clearly fictional.
- Command: `/impeccable clarify`.

**[P2] Demos run continuously, even off-screen**
- Location: `QACommunityDemo.tsx:188-189`; `AddQuoteDemo.tsx:412-413`.
- Evidence: loops start on mount and pause only on `document.hidden`. No IntersectionObserver gating, so both keep firing timers, layout reads (`getBoundingClientRect`, `scrollHeight`) and DOM writes while scrolled away. The eyebrow dot (`globals.css:166`) and closing arrow (`anim-nudge`) also loop forever.
- Impact: needless main-thread work and battery use on mobile; also feeds P1-1 (no way to stop motion).
- Fix: start the loop when the demo is at least 40% visible and stop when it leaves, tied to the same pause state as P1-1.
- Command: `/impeccable optimize`.

**[P2] Whole route is a client component**
- Location: `app/page.tsx:1`.
- Evidence: `'use client'` at the top so hero, header, both text blocks and the static sections hydrate as JS. Only the modal state needs the client. `RevealOnScroll` also SSRs content at `opacity-0` (`RevealOnScroll.tsx:37`), so without JS the sections stay invisible.
- Impact: larger JS payload than needed; content hidden until hydration (LCP/CLS-adjacent risk on slow devices, a11y for no-JS/crawlers).
- Fix: make `page.tsx` a server component, move the modal state into a small `LandingShell`/CTA client wrapper; render Reveal content visible by default and only apply the hidden start state once JS has run.
- Command: `/impeccable optimize`.

**[P2] `max-height` transition on the comments panel**
- Location: `QACommunityDemo.tsx:403-405`.
- Evidence: detector `layout-transition`; the panel animates `max-height` .5s inside a fixed-height viewport.
- Impact: layout work per frame inside the demo loop, minor but flagged.
- Fix: `grid-template-rows: 0fr -> 1fr` with `overflow:hidden` on the child, or since the viewport is fixed-height, animate `transform`/`opacity` only.
- Command: `/impeccable optimize`.

**[P2] Small interactive targets and small mono type in the header and footer**
- Location: `app/page.tsx:50-69` (Blog 31x15px, Sign in 55x15px, Apply 64x28px, 10px text); `ClosingSection.tsx:58-64` (early-tester link 144x20px).
- Evidence: measured target sizes at 1440 and 375. WCAG 2.5.8 wants 24px unless spacing exempts; Apple/Google guidance is 44px. Footer links are 17px tall.
- Impact: hard to hit on phones, especially Sign in and Blog.
- Fix: pad links to at least 44px tall on touch (`py-3`, negative margin to keep the look), raise the nav to 11 to 12px.
- Command: `/impeccable adapt`.

**[P2] Heading structure skips levels and a section has no heading**
- Location: `app/page.tsx:161, 186` (h3 after an h2 and no h2 for the Q&A/Quotes sections); `TwoCirclesSection.tsx` (no heading); `AddQuoteDemo.tsx:443, 509` (demo's own `h2` "Quotes" and "Add a quote" enter the page outline).
- Evidence: outline read from the DOM: H1, H2 (Why this matters now), H3, H3, H2 Quotes, H2 Add a quote, H2 Imagine. The demo's mock headings pollute the outline for AT.
- Impact: heading navigation is confusing, with fake H2s from a decorative demo.
- Fix: make the two feature headings `h2`, add a visually hidden `h2` for the audience section, and use `<p>`/`aria-hidden` for the demo's internal titles.
- Command: `/impeccable harden`.

### P3

- **[P3] Pink text on white is 4.08:1.** `text-pink` on the H1 last line and `WhyThisMattersNow.tsx:26` passes only because it is large (24.8px and 27.2px bold). Any smaller use of `text-pink` on white would fail; keep it to large display text.
- **[P3] Second idle card is clipped at 375px.** `.idle-cards` is 406px wide inside a 361px viewport (`AddQuoteDemo.tsx:599-600`). It reads as an intentional fade-out but hides content; confirm it is intended.
- **[P3] Hard-coded colour literals.** Avatar backgrounds `#B45309/#BE123C/#7E22CE` (`QACommunityDemo.tsx:212, 278, 295`), `#B9C6F2` / `#E2E8FC` (`ImagineScaleSection.tsx:14, 26, 40, 45`), wash `rgba()` values in `page.tsx:154, 179`, `globals.css:221-231`. Dark mode is off sitewide so this is contained; move to tokens when dark mode returns.
- **[P3] Side-stripe borders** at `AddQuoteDemo.tsx:633` and `QACommunityDemo.tsx:387`. Detector-flagged; they mirror shipped UI. Leave, or swap for a full border plus tint if you want to clear the detector.
- **[P3] Two magic-number spacers and a `zoom` dependency.** `py-[1.33875rem]` / `pb-[2.52rem]` (`page.tsx:84, 138`) and `zoom:.85/.75` with JS that divides by zoom (`AddQuoteDemo.tsx:167-178`). Works, but is fragile; `zoom` is a non-standard-history property.
- **[P3] Sticky header `backdrop-blur-sm` at `bg-paper/95`** (`page.tsx:41`). Barely visible blur; remove to save compositing cost.

## Responsive summary (measured)

| Width | Horizontal overflow | Hero | H1 size | Notes |
|---|---|---|---|---|
| 375 | none | 489px tall, no forced min-height | 24.8px | Demos 327px and 312px wide; circle pair stacks above copy; idle card 2 clipped |
| 768 | none | 426px | 29.9px | Sections stay single column until `md`; demo columns 325px and 312px, i.e. narrow for the space |
| 1440 | none | 828px in a 900px viewport (`min-h calc(100dvh-4.5rem)`) | 49px | Q&A demo 408px wide, 678px tall; text/demo split works |

Two-circles flank only appears from `xl` (1280px), so 768 to 1279 are stacked with lots of vertical space.

## Performance summary

- No `<img>` on the page (0 images), so no image weight or missing lazy-load problems; the graphics are CSS/SVG.
- Fonts: one webfont (IBM Plex Mono, 3 weights, `display: swap`); display/body use the system stack, so no display-font layout shift. Consider trimming to the weights actually used.
- Background washes and top blue fade: `.page-wash` is 4 static gradient layers on `<main>`; no animation, painted once, low cost. The wash is tuned to fixed `rem` stops so it does not stretch with page height (docH 4207 to 5477 across widths).
- Animation cost: the scroll-linked circle pair writes one CSS variable per rAF and only moves `transform` (good). The demos are the costly part (P2-2, P2-4).
- Dev-mode load timings (DCL about 9.7s) are not representative; measure a production build before drawing conclusions.
- CLS: the demos measure their content and set a fixed viewport height after fonts settle (double rAF, `fonts.ready`, 350ms timeout), so a small shift is possible on first paint; not observed but worth a Lighthouse pass.

## Positive findings

- Reduced motion is handled properly: both demos jump to a meaningful resting state, the two-circles pair sets `--meet: 1`, `.anim-rise`, the eyebrow dot and the nudge arrow are gated, and the modal skips its exit delay.
- Zero em/en dashes in rendered copy.
- No overflow at any tested width; hero copy scales well on phones.
- Semantic basics are right: `lang`, one `h1`, `header`/`main`/`footer`, decorative dots `aria-hidden`, modal Escape-to-close, real `<label htmlFor>` on the form fields, a honeypot that stays out of the a11y tree.
- The token system is used consistently; `ink-faint` was already darkened for AA against white.
- No fabricated member counts or testimonials on the page itself (see P1-2 and P2-1 for the two places that come close).

## Recommended actions

1. **[P1] `/impeccable harden`**: demo semantics, pause control, `inert` on dead buttons (P1-1); modal focus trap and role-picker semantics (P1-3); heading outline (P2-6).
2. **[P1] `/impeccable clarify`**: relabel the 200,000 stat as a projection with a source (P1-2); add a visible "illustrative" caption to the demos (P2-1).
3. **[P1] `/impeccable typeset`** and **`/impeccable adapt`**: lift demo type to about 10px effective and fix wash contrast (P1-4); enlarge header and footer targets (P2-5).
4. **[P2] `/impeccable optimize`**: viewport-gated demos, server-component page shell, replace `max-height` transition (P2-2, P2-3, P2-4).
5. **[P1] `/impeccable colorize`**: fix the pink-on-blue-ink contrast on the stat.
6. **[P3]** clear detector side-stripes and literals as part of a final `/impeccable polish`.

Re-run `/impeccable audit` after fixes to see the score move.

---

## Critique

Date: 2026-09-29. Surface: `/` (Persuade mode). Judged against `PRODUCT.md`: two co-primary audiences, and the positioning "vetted, invite-only network plus briefs built for repackaging". No files other than this one were edited.

⚠️ DEGRADED: single-context (design review and detector evidence ran in one context, not as two isolated sub-agents, because sub-agents were not requested for this task). Evidence: full read of `app/page.tsx` and the five landing sections, plus `impeccable detect` (3 hits, same as the audit above). No live browser pass this time, and the `.impeccable/critique/` snapshot was skipped to honour "edit no other files". The WaitlistModal was only skimmed for role labels and copy.

### Design Health Score

Heuristics 7 (Flexibility), 9 (Error Recovery) and 10 (Help) are `n/a`: a one-decision Persuade page has no accelerators or help surface, and the only error state lives in the modal, which was not exercised. The total is renormalised to 28.

| # | Heuristic | Score | Key issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | The "Opening soon" eyebrow says the product is not open, yet the header offers live "Apply" and "Sign in" links with no explanation of which applies to whom |
| 2 | Match System / Real World | 3 | Mostly plain language. "Briefs", "on the record" and "clarity check" are used as if known; "make AI go well" is a slogan, not a claim |
| 3 | User Control and Freedom | 3 | Modal closes on Escape and the CTAs are reversible; nothing traps the visitor |
| 4 | Consistency and Standards | 2 | The same action has five names: "Apply", "Join the waitlist", "Apply as an expert or org", "Join as an early user", "Become an early tester". Header Apply and the waitlist lead to different systems |
| 5 | Error Prevention | 3 | Role is pre-selected per CTA, which prevents the wrong-audience form. Header "Apply" skips that and sends everyone to `/apply` |
| 6 | Recognition Rather Than Recall | 3 | The two audience labels repeat consistently from hero to closing; the "brief" concept is never shown once |
| 8 | Aesthetic and Minimalist Design | 3 | Clear, restrained system. Two long animated demos carry more weight than the argument around them |
| **Total** | | **19/28** | **Acceptable (68%). Solid craft; the messaging has not caught up to the positioning** |

### Design Specificity Verdict

**LLM assessment.** Visually authored: the two-circle motif, ink borders, mono eyebrows and pink/blue split belong to this product and would not drop into a generic SaaS page. Message-wise it is much closer to category-interchangeable. Swap "AI safety" for "climate" or "public health" and the hero, "Why this matters now" and the closing columns read unchanged. What a neighbour could not copy, the vetted membership and the reusable brief, is exactly what the page never states outright.

**Deterministic scan.** 3 findings, all already logged in the audit above (two mirrored side-stripe borders inside the demos, one `max-height` transition). None bears on messaging, and the detector cannot see copy problems.

### Overall Impression

A well-built page that answers "who is this for?" better than "why should I trust it, and what do I get?". The biggest opportunity: state the two positioning claims plainly and show a brief, the one artifact both audiences care about, instead of spending the middle of the page on two miniature product demos.

### Answers to the brief

**Does the first viewport make both audiences feel addressed? Mostly, but not equally.** The H1 ("AI safety research rarely reaches the people who could tell its story") names both sides in one sentence and the subtext names both by role. That is good. But the story is told from the expert's problem, while the only action is `Join the waitlist`, which opens the modal with `creator` preselected (`app/page.tsx:128`). An expert or org reading the hero sees a story about them and a button for someone else. The explicit two-column split does not appear until the last section, and `TwoCirclesSection` (the one section that addresses both directly) sits below the fold on most laptops because the hero is sized to fill about one viewport.

**Is the path to "apply" clear? No.** There are two parallel entrances where PRODUCT.md describes one funnel:
- Header `Apply` goes to `/apply`, the full application form, for everyone. Header `Sign in` sits beside it while the eyebrow says "Opening soon".
- Every body CTA opens a waitlist modal instead. The expert button says "Apply as an expert or org" but opens a waitlist form ("Tell us who you are"), and the copy above it says "Join as an early user". A researcher clicking that button gets a waitlist; one clicking the header "Apply" gets an application. Neither says what happens next (approved by whom, when, by email?).

**Do the sections build a credible argument without invented proof? Partly.** No fake testimonials, logos or member counts appear, which is correct. But the argument has gaps and one weak link:
1. Hero: the problem (research does not reach people). Good and plain.
2. Two circles: two labelled halves. Good structure, thin copy (see copy flags).
3. "Why this matters now": asserts urgency with no source ("AI incidents are all over the news and existential risk is reaching the mainstream"). It is the page's only "why", and it is uncited.
4. Q&A and Quotes demos: show features, with invented people and votes (audit P2-1). They show a Q&A and a clarity check, not the brief or the vetting.
5. "Imagine": the 200,000 figure is a projection presented as an outcome (audit P1-2). This is the one place the page comes near fabricated proof, and it is the emotional peak.
6. Closing: two clear columns. Good.

Missing entirely: any statement that membership is approved and invite-only, what "vetted" means, who does the vetting, and what a brief is. "A name and a face behind every claim" (Imagine section) is the nearest thing to the trust story, and it is buried in a paragraph.

### What's Working

- **Both audiences are named symmetrically, in the same words, at three points** (hero subtext, two circles, closing). The pink/blue coding is consistent, so the split is learned once.
- **Restraint about proof.** No counts, endorsements or press. The 200,000 aside, the page honours "do not fabricate".
- **The closing ask is well structured:** two role-specific columns, each with a benefit sentence and a matching button colour, and the modal pre-selects the role. This is the clearest stretch of the page.

### Priority Issues

**[P1] The positioning is never stated: nothing says "vetted", "invite-only" or "built to repackage"**
- Why it matters: PRODUCT.md says the defensible claim is verified membership plus a brief made for reuse. The page says neither. "Brief" first appears about halfway down inside Q&A copy, undefined, and "repackage" or "use in your own content" appears nowhere. A creator cannot tell what they would get; an expert cannot tell that being vetted is the value. "Opening soon" plus a waitlist reads as an ordinary early-access page.
- Fix: add one line under the hero subtext, e.g. "Members are approved before they can post or sign in. Every brief is written to be reused in your own video, article or post." Add a section, before the demos, that shows a brief (TL;DR, sources, a "use this" affordance), clearly labelled as an example.
- Suggested command: `/impeccable clarify`, then `/impeccable shape` for the brief section.

**[P1] The apply path splits in two and mislabels itself**
- Why it matters: for a gated network the funnel is the product. Header `Apply` (to `/apply`), header `Sign in`, hero `Join the waitlist`, closing `Apply as an expert or org` (which opens a waitlist), and `Become an early tester` (a third variant). A visitor cannot tell whether "apply" means waitlist, application or invitation, or what the wait is for.
- Fix: choose one verb. If the real state is "waitlist, then invited", drop or relabel the header `Apply` and quieten `Sign in`; if `/apply` is live, send every CTA there. Rename the expert button to match what it does. State the next step under each button ("We review every request and reply by email").
- Suggested command: `/impeccable clarify`.

**[P1] The hero addresses both audiences in words but not in action**
- Why it matters: the audiences are co-primary, yet the hero has one button, preselected to creator. Experts and orgs are half the network and must scroll well past two tall demos to find "Apply as an expert or org".
- Fix: two CTAs in the hero using the closing section's role colours, or one CTA whose first step is the role picker. Pull a compact version of the two-audience split into the first viewport.
- Suggested command: `/impeccable layout`, `/impeccable adapt`.

**[P2] The middle of the page shows features, not the argument, and one figure is unsourced**
- Why it matters: the demos take about half the scroll and prove a Q&A and a jargon checker, while the question that decides whether a creator applies (can I trust and reuse this?) has no visual. "Why this matters now" carries the whole urgency case in one uncited paragraph. The 200,000 projection is the most quotable thing on the page and the least supportable; a journalist will notice.
- Fix: keep the Q&A demo (it shows on-record expert answers), shrink the clarity-check demo to a sentence, and use the space for the brief. Cite one credible external source in "Why this matters now" or cut it to what can be stood behind. Relabel the stat as a projection with its method (audit P1-2).
- Suggested command: `/impeccable distill`, `/impeccable clarify`.

**[P2] The sceptic's question is unanswered: who runs this?**
- Why it matters: this is a network about existential risk that asks strangers for their details. There is no "who is building this", no contact route above the footer, and the only external link is a Substack blog. With no proof to show, provenance (a named team, a mission statement, a data promise) is the main trust asset available, and it is absent.
- Fix: a two-line "who is building this" block near the closing section, and a one-line data promise beside the form button ("Only used to review your request"). No invented endorsements.
- Suggested command: `/impeccable clarify`.

### Copy that reads as generic or AI-generated

| Where | Line | Problem | Direction |
|---|---|---|---|
| Eyebrow | "Opening soon" | Says nothing; soon relative to what | State the gate or a real window ("Invite-only. Requests open") |
| Two circles, creators | "Know how to turn complicated research into stories people can relate to." | Fragment with no subject; describes any comms person and says what they get from us nowhere | "You tell the stories. We give you sourced material to tell them with." |
| Two circles, experts | "Have important messages on how to make AI go well." | Vague; "go well" is slogan-level; says nothing of what the org gets | "You have findings the public should hear. We connect you with people who can carry them." |
| Why this matters now | "Attention shows up, understanding doesn't always follow." | Balanced-clause aphorism, a common AI cadence, and it is the second-biggest headline | Lead with the concrete gap instead |
| Why this matters now | "we need a way to keep the momentum going, while providing candid & credible explanations... We need to do this at scale, now." | Stacked abstractions ("momentum", "candid & credible", "at scale, now") and three "we need" beats | One sentence and one cited fact |
| Imagine | "Imagine every AI safety expert's public voice, in one place & in multiple languages." | "Imagine..." opener, and PRODUCT.md defers multilingual to v2, so this promises what the product does not yet do | Drop "multiple languages" until it ships |
| Imagine | "What if a critical minority of the world's communicators could draw from all of it in one place, with a name and a face behind every claim?" | Rhetorical question plus "critical minority" jargon; the real proposition is in the last clause | Make "a name and a face behind every claim" the headline |
| Quotes | "A quote experts can actually stand behind." | "actually" is filler, and the section is really about plain language | "Quotes in plain language, on the record." |
| Q&A | "an expert or organisation working on the problem answers directly, on the record" | "directly" and "on the record" restate each other | Keep one |
| Closing, experts | "Join as an early user and help shape the first briefs and Q&A threads creators and journalists will actually use." | Second "actually"; "early user" does not match the "Apply" button | Align the verb with the button and the real process |

Pattern to watch: "actually" appears three times as a credibility tic. The page is trying to sound sincere rather than being specific. Rendered copy has no em or en dashes, which matches the brand rule.

### Persona Red Flags

**Jordan (first-time creator, runs an explainer channel):** Reads the hero, understands the problem, clicks "Join the waitlist" and gets a form. Never learns what a "brief" is, what they would receive, or when. The 200,000 stat reads as being counted rather than offered something. Likely to bounce at "Opening soon" with no date.

**Riley (sceptical journalist who tests claims):** Looks for who is behind this and how experts are verified. Finds "a name and a face behind every claim", no vetting detail, invented persona names in the demos with no visible "illustrative" label, and a 200,000 figure with no source. Concludes it is unverified and does not apply.

**Casey (expert on a phone, sent the link by a colleague):** The hero speaks to their problem but the button is for creators; their own CTA is far down the page after two tall demos. Header targets are 15px tall. Likely to leave before the closing column.

**Dana (project persona, comms lead at an AI safety organisation):** Wants to know whether this reaches real creators and whether an org can publish under its own name. Sees "researchers & organisations" as one flat label, no mention of org profiles or briefs, and no sign of who has been approved. The lack of fake proof is right, but there is also no roadmap or plan to stand in for it.

### Minor Observations

- The header order (Blog, Apply, Sign in) gives Blog the same weight as the main action. Apply is the only outlined item, which is right.
- "Community Q&A" implies open participation; the product is gated. Say who can answer, or "Members' Q&A".
- "Try Tell The World while it's still rough" is candid and in voice, but one line above the footer it undercuts "vetted, credible" for an expert audience.
- The audit's contrast and demo findings (P1-2, P1-4, P2-1) also erode credibility; fix them alongside the copy.

### Questions to Consider

- If a visitor read only the hero, what one sentence would they repeat to a colleague? Currently "a site that connects safety people with creators", which any neighbour could claim.
- What would the page look like if the first thing under the hero were one real brief, opened, with its sources visible?
- Is "waitlist" the right frame for a network meant to be selective? "Request an invite" says the same thing and states the gate.
- What would you cut if the demos had to fit in one screen?

### Recommended actions

1. **[P1] `/impeccable clarify`**: state the positioning (approved members, briefs made for reuse), unify the apply verbs and next-step copy, remove the multilingual promise, relabel the 200,000 figure, rewrite the flagged lines.
2. **[P1] `/impeccable layout`**: add an expert CTA to the hero and bring the two-audience split into the first viewport.
3. **[P2] `/impeccable shape`**: design a "what is a brief" section from a labelled example, replacing one demo.
4. **[P2] `/impeccable distill`**: trim "Why this matters now" and the demo copy to what can be sourced.
5. **`/impeccable polish`** last, together with the audit's accessibility fixes.
