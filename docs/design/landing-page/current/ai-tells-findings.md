# Landing page: AI tells and quality findings (Step 2)

Date: 2026-10-07. Surface: `/` (`app/(landing)/page.tsx`, `components/landing/*`, `app/landing-theme.css`). Mode: Persuade. Branch `docs/landing-ai-tells-findings`. No UI file was edited.

Method: `/impeccable critique` as two isolated sub-agents (A: design review, no detector output; B: detector plus measured browser evidence), then `/impeccable audit` dimensions folded into B's measurements and my own source read. Live browser at 375x812 and 1440x900 (dev server). Not done: real-phone touch, a screen reader, production-build timings, mid-fade contrast states of the demos, and off-screen demo behavior was read from code, not observed live. `LegacyLandingPage.tsx` is unrouted dead code and is excluded from every finding below.

Decisions are collected at the bottom ("Decisions", for you to fill in). Steps 3 and 4 follow them.

## 1. Scores

**Critique (Nielsen, 24/32 = 75%, Good).** Heuristics 7 and 10 are n/a on a Persuade surface.

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 3 | Pause/Play, rest frame without JS, "illustrative" caption. Q&A window sits mostly empty for part of every loop |
| 2 | Match system and real world | 3 | "Brief" is used (`page.tsx:30`) before it is ever defined; tab names in the demo assume it |
| 3 | User control and freedom | 3 | Modal closes three ways, demos pause. Demos cannot be stepped |
| 4 | Consistency and standards | 3 | One action name everywhere. Header button is 36px, everything else 44px |
| 5 | Error prevention | 3 | Role chips are a radiogroup. Error paths not exercised live |
| 6 | Recognition rather than recall | 3 | Sign in and Blog are hidden in a hamburger below 768 |
| 8 | Aesthetic and minimalist | 3 | Disciplined. Mono 12px labels everywhere, legend repeats the cards |
| 9 | Error recovery | 3 | Icon plus text errors per DESIGN.md. Not triggered live |
| **Total** | | **24/32** | Good |

**Audit (technical, 16/20, Good).**

| Dimension | Score | Key finding |
|---|---|---|
| Accessibility | 3 | Dialog, radiogroup, inert background, Pause, reduced motion all work. Focus ring not global (DESIGN.md Drift 12), header button 36px |
| Performance | 4 | Server-component page, IntersectionObserver-gated demos, no images, no CSS animations running, no layout transitions |
| Responsive | 3 | No overflow at 375 or 1440; header button 36px and "Become an early tester" 31px high at 375 |
| Theming | 3 | Tokens good; 13px/11px/22px/34px literals and `border-umber/15` (Drift 16, 18) |
| Implementation integrity | 3 | Coherent and product-specific; the system is applied by habit in places (see Section 3) |
| **Total** | **16/20** | Good |

Counts: P0 0, P1 2 (both credibility, not code), P2 8, P3 6. Compare the old audit: 14/20 with 4 P1.

## 2. Detector, compared with baseline

`../evidence/baseline/detect-before.json` is `[]`. It was captured when `DESIGN.md` did not exist, so design-system rules could not run.

| Run | Result |
|---|---|
| Baseline command, `--no-design-system` | `[]` (identical to baseline, exit 0) |
| Baseline command, with `DESIGN.md` | 527 advisory findings (515 `design-system-font-size`, 12 `design-system-color`). 487 are the rest of `app/*` (old Two-Ink Bold UI) measured against the landing DESIGN.md; not a landing problem |
| `app/(landing)` + `components/landing` + theme css | 40, of which 27 are `LegacyLandingPage.tsx` (dead code). **13 live, all font-size** |
| URL scan at 375 and 1440 (identical at both) | 10: `kicker-above-heading` 4, `nested-cards` 3, `side-tab` 1, `tight-leading` 1, `overused-font` 1 |

Read this carefully: the **static scan has zero real anti-pattern hits, same as baseline**. The rendered-page scan the baseline never ran finds the things the plan targets.

Verdicts on the URL scan: `kicker-above-heading` x4 is **real** ("Opening soon", "Why this matters now", "Community Q&A", "Quotes, on record"). `nested-cards` x3 is **real but representational** (answer cards in a window; the quote form in the window). `side-tab` is a **false positive** (`AddQuoteDemo.tsx:231`, a 3px bottom underline on the flagged term, not a side stripe). `tight-leading` is **borderline false positive** (closing statement 1.12, `landing-theme.css:67`, allowed on short large text). `overused-font` (Inter 38% of text) is **deliberate**, Inter is the documented control face.

The 13 live font-size hits: 8 real drift (13px at `DemoWindow.tsx:28,109,118`, `WaitlistButton.tsx:27`, `WaitlistModal.tsx:64`; 11px `WaitlistModal.tsx:77`; 22px/20px demo headings `AddQuoteDemo.tsx:169,197`; 34px `WaitlistModal.tsx:195`), 2 deliberate under-md prose steps documented in DESIGN.md but not tokenised (`ArtifactSection.tsx:18`, `WhyThisMatters.tsx:13`), 3 minor (`AddQuoteDemo.tsx:74,198`). `WaitlistModal.tsx:76` uses `text-[13.5px]` and was not flagged.

## 3. Slop catalog: every category

P = present, A = absent, J = judgment call.

### Visual details

| Item | Verdict | Evidence |
|---|---|---|
| Gradients and glow | A | 0 gradient backgrounds measured at both widths. Circles are flat fills (`CirclePair.tsx:27-29`) |
| Glass and blur | A | `backdrop-filter` 0 measured |
| Side-stripe borders | A | None over 1px. Detector hit is a false positive (`AddQuoteDemo.tsx:231`) |
| Rounded card plus shadow | J | Audience cards use a 1px hairline ring, 4px radius (`Hero.tsx:22`). Only the demo windows carry soft shadow (`DemoWindow.tsx:21`, `landing-theme.css:106`). Restrained, documented |
| Icons and emoji | A | Only hamburger and Pause/Play, drawn SVG (`MobileMenu.tsx:95`, `DemoWindow.tsx:38-45`) |
| Decorative dots | P | Traffic-light dots in the window chrome (`DemoWindow.tsx:23-27`); 10px dot before each card label and legend row (`Hero.tsx:28,62,66`) |
| Hairlines everywhere | P (mild) | Hairline above every section (`WhyThisMatters.tsx:5`, `ArtifactSection.tsx:13`), under each card label (`Hero.tsx:26`), above each Endorsed footer (`QACommunityDemo.tsx:43`), around windows |
| Nested cards | P / J | Answer cards inside a window inside a section (`QACommunityDemo.tsx:157`); the quote form is a modal inside the window (`AddQuoteDemo.tsx:188,195`). Representational, but the detector fires 3 |

### Typography

| Item | Verdict | Evidence |
|---|---|---|
| Italic serif accent in the display headline | P | `Hero.tsx:49` and again `WhyThisMatters.tsx:10`, both rose italics |
| Mono uppercase eyebrow above headings | **P (heavy)** | `Hero.tsx:46`, `WhyThisMatters.tsx:8`, `ArtifactSection.tsx:16` (x2 via `page.tsx:28,35`). Mono also used for the hero legend (`Hero.tsx:60`), tab labels, "Answer", "Question", "Endorsed" (`QACommunityDemo.tsx:158,163,181`). The craft floor treats page eyebrows as an outright ban |
| Font pairing reflex | J | EB Garamond, Inter, IBM Plex Mono is the stock "editorial" trio. Works, but it is a default |
| Scale monotony | A | Display up to 76px, h2s 56/46/44, serif body 21-25px. The three h2s are close in size |
| Tracking | A | Display -0.03em, inside the -0.04em floor |
| Body size and measure | A | Serif body 20-21px; minimum rendered text 12px (measured). Nothing under 12px |

### Color

| Item | Verdict | Evidence |
|---|---|---|
| Cream background by reflex | J (leans P) | Parchment `#F7F4EE` plus umber plus vellum (`landing-theme.css:20-22`). DESIGN.md justifies it as a reading room, but that metaphor comes from the doc, not from the subject |
| Pink plus blue accent duo | J, earned | Rose = creators, cobalt = researchers, graphic-only rule for the bright values (`landing-theme.css:43,47`). It is the product's audience code, not decoration |
| Washes and tints | P | Pale band `#EFF2F9` and closing band `#E5EAF6` are nearly indistinguishable; plus card tints and `rose-wash`/`cobalt-wash` |
| Gradient text | A | None |
| Contrast failures | A | 0 failures at either width (WCAG formula, backgrounds resolved through ancestors). Lowest pair 5.06:1 ("Review flags", 14px) |

### Layout

| Item | Verdict | Evidence |
|---|---|---|
| Identical cards | P (mild) | Two audience cards share one structure and one component (`Hero.tsx:8-39`), differing only by color and sentence |
| Hero template | P | Eyebrow, big serif headline with italic accent, muted lead, two tinted cards (`Hero.tsx:41-87`) |
| Monotonous rhythm and mirrored sections | P | Both demo sections are one component, same 88px padding, hairline, text-left window-right (`ArtifactSection.tsx:11-23`, used twice at `page.tsx:27,34`) |
| Centered-everything | A | Left-aligned throughout |
| Section numbers | A | None |
| Hero-metric template | A | No numbers (the 200,000 stat is gone, `page.tsx:15-17`) |
| Modal for a task that needs none | A | The waitlist modal is a form that needs protected focus |

### Motion

| Item | Verdict | Evidence |
|---|---|---|
| Pulsing dot | A | `document.getAnimations()` empty at every scroll position |
| Endless loops | P (judgment) | Both demos loop forever while in view (`useDemoLoop.ts:66-120`). There is a Pause button, an IntersectionObserver gate and a rest frame, so the accessibility rules are met. The loop itself is the tell |
| Entrance animation on every section | A | `reveal()` is only used for demo beats (`DemoWindow.tsx:58`) |
| Layout-property transitions | A | No `layout-transition` finding; demo height is reserved |
| Reduced motion | A (handled) | Demos assume reduced until asked (`useDemoLoop.ts:19`), `motion-reduce:` utilities on transitions. One quirk: the 0ms token override (`landing-theme.css:123-126`) is consumed by nothing (Drift 8) |
| Dead air | P | Reserved height leaves a mostly empty Q&A window while answer 2 waits (`QACommunityDemo.tsx:14-15`) |

### Copy (flag only; wording is yours, see Step 5)

| Item | Verdict | Evidence |
|---|---|---|
| Slop words | J | "credible", "explanations", "at scale", "real audiences" (`Hero.tsx:51-54`, `WhyThisMatters.tsx:15-17`). "Credible" is a product principle but reads as filler here |
| Forced contrast "Not X. Y." | P | "That's not a story about one bug. It's a preview..." (`QACommunityDemo.tsx:82-83`), "not just more widely covered" and "The real question isn't only... It's whether" (`:86-89`) |
| Balanced-clause aphorism as a headline | P | "Attention shows up, understanding doesn't always follow." (`WhyThisMatters.tsx:10`) |
| Stacked abstractions | P | "keep the momentum going", "candid & credible", "at scale, now" (`WhyThisMatters.tsx:15-17`) |
| Filler | P (mild) | "Ask what's on your mind" (`page.tsx:30`); closing line mixes two asks (`Closing.tsx:17-20`) |
| Em dashes | A | None in `components/landing` or `app/(landing)` |
| Claims the product cannot back | J | Multilingual is **not** claimed anywhere (the old page did). "Get an answer from someone who studies this" (`page.tsx:29`) promises responsiveness during a waitlist. The Q&A demo uses a real incident (confirmed by the owner) with illustrative expert quotes, labelled as such (`DemoWindow.tsx:52`). That is acceptable; not a tell |
| One action, one name | A | "Join the waitlist" everywhere (`WaitlistButton.tsx:34`). Remaining variants: "Become an early tester" (`EarlyTesterLink.tsx:52`) and "Sign in" |

### Design system

| Item | Verdict | Evidence |
|---|---|---|
| Token drift and one-offs | P (moderate) | 25 Drift rows in DESIGN.md. Verified live: header button `min-h-9` at every width (`WaitlistButton.tsx:27`), 13px/11px/22px/34px literals, `border-umber/15` instead of tokens (`Hero.tsx:26`, `QACommunityDemo.tsx:43`) |
| Browser surfaces themed | P (gap) | No `::selection`, caret or scrollbar theming; no global `:focus-visible` (grep of `app/globals.css`). Focus ring is applied per component; missing on header links, hamburger and footer links per Drift 12 (not confirmed at runtime) |
| Unused tokens | P (minor) | `diff-removed`, `--duration-fast`, `--duration-demo-step` have no consumer (Drift 8) |

## 4. The six design-review patterns a detector cannot catch

| # | Pattern | Here? | Evidence |
|---|---|---|---|
| 1 | Reflexive aesthetic for the category (warm paper plus serif plus mono kicker is "thoughtful editorial" by default) | **Present** | Whole shell around the demos |
| 2 | Structural sameness (sections cut from one mould) | **Present** | `ArtifactSection` twice, every section hairline plus 88px plus two columns |
| 3 | Copy that sounds right and says nothing | **Present** | "Why this matters now", closing line |
| 4 | Hierarchy that is correct but emotionally flat | **Present** | Nothing on the page conveys the stakes; tonally a newsletter signup |
| 5 | Trust gap (claims without proof or process) | **Present** | Vetting is one 14px line (`Hero.tsx:82-84`); the only evidence is labelled illustrative |
| 6 | Demos that perform rather than explain | **Partly** | The quote demo explains (the clarity-check moment is the page's one authored peak). The Q&A loop spends much of its time showing little |

Design specificity: half authored. The demos, the audience circle pair with a violet overlap, and the people-are-circles, organisations-are-squares avatars could not be copied by a neighbour. The shell around them could be any research-media startup's.

## 5. What happened to the 2026-09-29 audit (page rebuilt in PR #110)

| 9/29 finding | Now | Evidence |
|---|---|---|
| P1 Demos not operable, dead buttons, no pause | **Obsolete** | Window is a labelled group, interior `aria-hidden`, Pause is the only control (`DemoWindow.tsx:21,31,50`). B confirmed no focusables inside |
| P1 "200,000" stat | **Obsolete** | Section removed (`page.tsx:15-17`) |
| P1 Modal focus, role picker | **Mostly obsolete** | `aria-labelledby`, focus to heading, trap, restore, `inert` background, radiogroup with roving tabindex (`WaitlistModal.tsx:209-211,297-308`, `WaitlistProvider.tsx:67`). Residual: modal heading is an `h3` with no `h2` (Drift 22), focus cycle includes the heading, scroll lock not present, radios measured 43px |
| P1 Demo microtype 5-8px | **Obsolete** | No `zoom`; minimum rendered text 12px |
| P2 Fictional demo, disclosure sr-only | **Obsolete** | Visible caption now exists (`DemoWindow.tsx:52`), comments beat gone. The demo uses a real incident with illustrative quotes, confirmed by the owner |
| P2 Demos run off-screen | **Obsolete** | IntersectionObserver gate (`useDemoLoop.ts:36-50`). Endless-while-visible remains as a judgment call |
| P2 Whole route a client component | **Obsolete** | `page.tsx` is a server component |
| P2 `max-height` transition | **Obsolete** | No `layout-transition` finding |
| P2 Small targets | **Mostly obsolete** | Footer and nav are 44px. Remaining: header button 117x36, "Become an early tester" 223x31 at 375 |
| P2 Heading structure | **Mostly obsolete** | One h1, no demo headings, no skipped levels. Residual: audience card labels are `h2`s (`Hero.tsx:24`) |
| P3 Pink on white 4.08:1 | **Obsolete** | Rose is now `#B80F5A`; lowest measured text pair 5.06:1 |
| P3 Idle card clipped at 375 | **Not observed** | Demo rebuilt. At 375 the quote form fills nearly the whole window instead |
| P3 Hard-coded literals | **Reproduces, new form** | 13px/11px/22px/34px and `border-umber/15` (Drift 16, 18) |
| P3 Side-stripe borders | **Obsolete** | No side stripes; one false-positive hit |
| P3 Magic-number spacers, `zoom` | **Partly** | `zoom` gone; arbitrary px values remain (`px-[22px]` in `Hero.tsx`) |
| P3 Sticky header blur | **Obsolete** | `backdrop-filter` 0, `LandingHeader.tsx:12` |
| Critique: positioning never stated | **Partly reproduces** | One 14px line (`Hero.tsx:82-84`); "brief" still undefined before first use |
| Critique: apply path split five ways | **Largely fixed** | One verb. Remaining: "Sign in" in nav, "Become an early tester" |
| Critique: hero has one CTA for one audience | **Fixed on desktop, weak on mobile** | Two role cards (`Hero.tsx:73-80`); on a phone neither is near the fold (Section 7) |
| Critique: who runs this | **Reproduces** | No team, mission or data-promise line anywhere |
| Critique: copy table | **Mostly reproduces** | Card sentences verbatim (`Hero.tsx:75,78`), aphorism and stacked abstractions (`WhyThisMatters.tsx`). Fixed: multilingual promise, "Imagine", most "actually" (one left, `WhyThisMatters.tsx:16`) |

## 6. Real tells, with fix size

Small fixes need no decision from you. Bigger shifts have two options and a recommendation.

### Small fixes (no gate)

| # | Tell | Fix | Where |
|---|---|---|---|
| S1 | Traffic-light dots | Delete | `DemoWindow.tsx:23-27` |
| S2 | Italic accent used twice | Keep the hero one, set the second heading plain | `WhyThisMatters.tsx:10` |
| S3 | Two near-identical bands | Merge to one tint or make them clearly different | `WhyThisMatters.tsx:5`, `Closing.tsx:13` |
| S4 | Hairline stacking | Drop the card-header and answer-footer hairlines | `Hero.tsx:26`, `QACommunityDemo.tsx:43` |
| S5 | Hero legend repeats the cards and uses mono as a costume | Remove the legend or set it in the UI face | `Hero.tsx:60-69` |
| S6 | Demos loop forever | Play once on entering view, then hold the rest frame (keep Pause) | `useDemoLoop.ts` |
| S7 | Q&A dead air | Show both answers at rest and animate only the Endorsed tick and typing | `QACommunityDemo.tsx:14-16` |
| S8 | Header button 36px, early-tester link 31px | 44px targets | `WaitlistButton.tsx:27`, `EarlyTesterLink.tsx` |
| S9 | No global focus ring, browser-default selection and caret | One `:focus-visible` rule, themed `::selection` and caret | `app/globals.css` |
| S10 | Off-ramp literals (13px, 11px, 22px, 34px, `border-umber/15`) | Snap to the scale or add one documented step | Section 2 list |
| S11 | Modal heading `h3` with no `h2`; audience labels as `h2` | Fix the outline | `WaitlistModal.tsx:228`, `Hero.tsx:24` |
| S12 | Dead tokens | Consume or delete | `landing-theme.css:27,111-112` |

### Bigger shifts (need your answer)

**B1. Page eyebrows (kickers above headings).** Four on the page, all mono uppercase 12px; the craft floor says no brief earns them back.
- Option A: delete all four. Headings stand alone; "Opening soon" becomes a status chip next to the header button. Demo-internal mono labels (role, Endorsed) stay, they are content.
- Option B: replace the device, not just remove it. Keep one short label only where it carries information (the "Opening soon" status), set in the UI face, sentence case.
- **Recommendation: A.** It is the most visible tell, it is cheap, and the headings are already strong.

**B2. Ground and type voice (cream parchment, Garamond, Inter, Plex Mono).** The shell is the "editorial landing" default and says nothing about catastrophic risk.
- Option A: keep warm paper and the serif, but make it deliberate: cool the neutrals slightly, drop the extra tints (S3), and justify it as the reading surface for briefs.
- Option B: darker "evidence" ground behind the two demo sections so the framed windows read as documents on a table, leaving the hero and closing light.
- **Recommendation: keep (A at most).** A warm reading surface suits long-form briefs and a mixed lay audience, and the rose/cobalt code is earned. The page's flatness comes more from the template (B3, B4) than from the paper color. Revisit only if B3 and B4 still feel generic.

**B3. Hero composition (template plus identical cards).** Eyebrow, big headline, lead, two same-shaped cards, a circle pair and a legend. On a phone the real CTAs are at y of about 710 and 940 (Section 7).
- Option A: one hero invitation and one button, with the role chosen inside the modal (it already has six role chips). Simplest, most reachable on a phone, loses the visible two-audience split above the fold.
- Option B: keep two cards, make them differ by purpose and not color: creators see what they get (a sourced brief to reuse), experts see what they give (their work reaching an audience). Move the circle pair under the headline on mobile so both CTAs land in the first screen and a half.
- **Recommendation: B.** Both audiences are co-primary in PRODUCT.md and the split is the product's idea. The plan already asks for cards that differ by purpose.

**B4. Section rhythm and the mirrored demo sections.** Both demo sections are one component.
- Option A: flip the second section (window left, text right) and vary the scale of one window.
- Option B: merge into one tabbed artifact ("Q&A | Quotes") so the page has one demo, not two, and use the freed height for B5.
- **Recommendation: A**, with B5 below. B keeps the page shorter but couples the two demos' loop and pause logic.

**B5. The trust gap.** Vetted, invite-only membership, the page's defensible claim, is one 14px line. No "who runs this", no data promise.
- Option A: promote the line to a visible claim beside the card buttons, plus a one-line data promise under the form button. No invented proof.
- Option B: replace one demo with a labelled example brief (TL;DR, sources, a "use this" affordance), the artifact both audiences care about.
- **Recommendation: A now, B as its own later epic.** B is a new feature surface, out of scope for a tells cleanup. Whatever wording A needs is a Step 5 proposal, not a silent edit.

**B6. Nested modal in the quote demo.** A scrim-and-modal inside a window inside a section (`AddQuoteDemo.tsx:188,195`).
- Option A: show the form as the window's own content, no scrim, no inner shadow.
- Option B: keep it; it mirrors the real product's modal.
- **Recommendation: A.** It clears two detector hits and removes the shadow-in-window effect. It is representational, so B is defensible; the cost is small either way.

### Copy flags (for Step 5, not fixed here)

1. "Why this matters now" aphorism headline and stacked-abstraction paragraph (`WhyThisMatters.tsx:10,14-17`).
2. Forced contrast in the two expert answers (`QACommunityDemo.tsx:81-89`).
3. Resolved by the owner: the incident in the Q&A demo is real and the quotes are illustrative, labelled as such. No change needed. (Earlier draft flagged this as a no-fabricated-proof risk; that was wrong on the facts.)
4. Closing line mixes two asks (`Closing.tsx:17-20`).
5. "Brief" appears before it is defined (`page.tsx:30`).
6. "Get an answer from someone who studies this" promises response during a waitlist (`page.tsx:29`).

## 7. Mobile versus desktop

| Aspect | 375 | 1440 |
|---|---|---|
| Layout | Single column; page 4759px tall (3652px at 1440). Hero spends about 1000px before the second audience card | Two-column hero; both cards, both buttons and the trust line fit in the first 900px |
| First-screen CTA (375x667) | **Neither audience button is reachable without scrolling.** Rose card button about y=710, cobalt about y=940. Only the 117x36 header button is above the fold | All three buttons visible together (three identical labels in three colors) |
| Touch targets | Header button 36px high, "Become an early tester" 31px high. Hamburger, Pause, footer links, menu items, role chips are 44px | Pause drops to 32px (`md:min-h-8`); header button 36px. Acceptable with a pointer |
| Legibility | Same 12px mono labels (24 nodes under 13px). Display about 38-40px, wraps to three lines and reads well | Display 76px; the same 12px labels read relatively smaller |
| Hero graphic | Circle pair 132px beside a legend, legend wraps to two lines | Circle pair pinned top-right, not aligned to the headline baseline |
| Nav | Sign in and Blog hidden in a hamburger (works, Escape returns focus) | Blog and Sign in visible |
| Demos | Quote form fills nearly the whole window, window title truncates ("Security Inc..."). Q&A section is about 1544px tall | Reads as a cleaner mock |
| Modal | Full screen (812 high, content 903, scrolls); the submit is reachable only after scrolling | Centered card |
| Overflow | None (scrollWidth 375) | None |

Net: desktop is the stronger composition; mobile's real problem is reachability, not legibility.

## 8. Not verified

- Focus-ring presence on header links, hamburger and footer links at runtime (static Drift 12 says missing; B confirmed only the Pause button and the modal controls).
- Which element carries the 3px bottom border behind the `side-tab` hit: located by me as `AddQuoteDemo.tsx:231`.
- Whether the modal locks body scroll (no lock found; chaining not tested).
- Radio and close-button heights of 43px in the modal (rounding or panel animation).
- Contrast in mid-fade demo states (rest frames all pass).
- Dev-only: the Next.js badge overlaps the footer Blog link at 375. Not a product issue.

## Decisions (yours)

Answered by the owner on 2026-10-07: all recommendations accepted.

- B1 Page eyebrows: **option A** (delete all four; "Opening soon" becomes a status chip)
- B2 Ground and type voice: **keep**
- B3 Hero composition: **option B** (two cards that differ by purpose, both CTAs near the fold on mobile)
- B4 Section rhythm: **option A** (flip the second demo section, vary scale)
- B5 Trust gap: **option A now**, example-brief section deferred to its own later epic
- B6 Nested modal in the quote demo: **option A** (form inline, no scrim)
- Small fixes S1 to S12: **all approved**
