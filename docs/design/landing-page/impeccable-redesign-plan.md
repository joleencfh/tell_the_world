# Impeccable redesign plan: landing page

Date: 2026-10-07. Surface: `/` (`app/(landing)/page.tsx`, `components/landing/*`, `app/landing-theme.css`). Mode: Persuade.

## Ground rules (every step)

- **One branch and one PR per step**, from up-to-date `master` (`gh pr create --base master`).
- **Desktop and mobile are equal.** Verify once at 375, 768 and 1440 wide per step (no horizontal overflow, 44px touch targets, readable text). Impeccable's own verify pass runs batched: build, inspect once, fix, confirm once, stop.
- **No em dashes.** Copy is hand-written by the owner: Impeccable only *proposes* wording changes (Step 5), never silently rewrites. The original is archived in Step 1.
- **Bigger design shifts (fonts, palette, structure) only after the Step 2 decision gate.**
- **No fabricated proof** (PRODUCT.md). Demo personas must be labelled illustrative.
- **Bun only.** Impeccable CLI: `.claude/skills/impeccable/scripts/impeccable.cmd <verb>`.
- If a step needs to touch something outside its scope, Claude Code stops and reports.

## Starting state (checked 2026-10-07)

- Impeccable installed, `PRODUCT.md` exists, hooks enabled in config but not confirmed running.
- **`DESIGN.md` is missing**, so the detector's design-system rules can't run.
- `impeccable-audit.md` (9/29) describes the **pre-redesign** page. It is history, not the worklist.

## Overview

| Step | Name | Commands | Review effort |
|---|---|---|---|
| 1 | Setup and safety net | `document`, `hooks`, `doctor` | Light: docs and config only |
| 2 | Fresh review + your decisions | `critique`, `audit`, `detect` | Light: read one doc, answer questions |
| 3 | The look: type and color | `typeset`, `colorize`, `quieter` | Medium: visual diff |
| 4 | Layout and motion | `layout`, `distill`, `animate`, `optimize` | Medium: visual diff |
| 5 | Copy, proposals then apply | `clarify` | Light: you mark accept/reject |
| 6 | Mobile, accessibility, polish, CI | `adapt`, `harden`, `polish` | Medium: final pass |

---

## Step 1: Setup and safety net (no UI changes)

Branch: `chore/landing-cleanup-setup`

Prompt for Claude Code:

```
Set up for removing AI tells from the landing page. Do NOT edit any component, CSS or copy.

1. Create the local git tag `landing-before-ai-tells-cleanup` on current master (do not push until I say so).
2. Export every user-facing string of the landing page (app/(landing)/page.tsx and components/landing/*, including both demos, header, mobile menu, closing and waitlist modal) into docs/design/landing-page/copy-archive/landing-copy-ORIGINAL-2026-10-07.md, grouped by section with file:line. Header: "Frozen original, hand-written by the owner. Do not edit."
3. Run `impeccable detect --json app components/landing app/landing-theme.css`, save to docs/design/landing-page/baseline/detect-before.json. Capture full-page screenshots at 375, 768 and 1440 (use .claude/launch.json) into the same folder as before-375.png etc.
4. /impeccable document: derive DESIGN.md from the SHIPPED page (app/landing-theme.css, the components, docs/design/landing-page/design-system.md). Where the shipped page and design-system.md disagree, list it in a "Drift" section instead of choosing silently.
5. /impeccable hooks on, then /impeccable doctor. Approve hooks if asked. Silence is not proof: doctor must confirm they fire. Do not add blanket detector ignores.
Open one PR to master with these files only.
```

Done when: tag exists, archive complete, `DESIGN.md` reviewed by you (especially Drift), doctor reports hooks active.

---

## Step 2: Fresh review and decision gate (read-only)

Branch: `docs/landing-ai-tells-findings`

Prompt for Claude Code:

```
Review the CURRENT landing page for AI design tells and quality problems. Edit no UI files.

1. /impeccable critique in a live browser at 375 and 1440 wide (use independent sub-agents if available).
2. /impeccable audit on the same surface.
3. impeccable detect --json, compared against baseline/detect-before.json.
4. Write docs/design/landing-page/ai-tells-findings.md with:
   - a table mapping EVERY category of the Impeccable slop catalog (visual details, typography, color, layout, motion, copy, design system) to present / absent / judgment call, with file:line evidence;
   - the six design-review patterns the detector can't catch;
   - which 9/29 audit findings still reproduce vs are obsolete (page rebuilt in PR #110);
   - for each real tell: small fix, or "bigger shift" with 2 concrete options and a recommendation;
   - mobile vs desktop differences called out.
Do not fix anything.
```

**Your gate:** per bigger shift, write "keep / option A / option B" at the bottom of the findings doc. Steps 3 and 4 follow those answers.

---

## Step 3: The look (typography, color, surfaces)

Branch: `landing/tells-look`

Targets: italic serif display headline, mono uppercase eyebrows, flat hierarchy, cream background by reflex, gradients/glow, hairline-border-plus-shadow cards.

Prompt for Claude Code:

```
Read DESIGN.md, PRODUCT.md and the Decisions section of docs/design/landing-page/ai-tells-findings.md and follow my decisions.

1. /impeccable typeset the landing page: families, scale, weights, eyebrows/labels, and the italic serif emphasis in the hero H1.
2. /impeccable colorize, then /impeccable quieter on decoration that doesn't earn its place: page background, card surfaces, shadows, borders, washes, text colors. Keep the rose = creators / cobalt = researchers coding.
Constraints: no wording changes. Tokens only, in app/landing-theme.css; update DESIGN.md. Body text at least 16px, labels at least 11px, contrast 4.5:1 text and 3:1 large/UI on every background including washes, readable on a dim phone screen. Verify once at 375, 768 and 1440 (batched), fix, confirm once, stop.
PR to master with before/after screenshots at the three widths.
```

---

## Step 4: Layout and motion

Branch: `landing/tells-layout-motion`

Targets: identical/nested cards, side-stripe borders in the demos, monotonous spacing, two audience cards sharing one shape, pulsing dot, endless demo loops, off-screen animation, layout-property transitions.

Prompt for Claude Code:

```
Follow my decisions in docs/design/landing-page/ai-tells-findings.md and DESIGN.md (as updated by the previous PR).

1. /impeccable layout, then /impeccable distill: section rhythm, the two audience cards (differ by purpose, not just color), hero composition, demo containers incl. side-stripe borders and card-in-card nesting, closing section. Design mobile and desktop separately where it helps; on a 375x667 phone both audience CTAs must be reachable without a long scroll. Keep the circle-pair motif unless my decisions say otherwise.
2. /impeccable animate, then /impeccable optimize: keep only purposeful motion, ease-out on transform/opacity only, remove pulsing/decorative loops. Demos start only when visible (IntersectionObserver), stop off-screen, have a visible Pause/Play, and show a meaningful static state under prefers-reduced-motion. No hover-dependent motion, no scroll-jacking.
Constraints: no wording changes (moving text is fine). Verify once at 375, 768 and 1440 (batched, plus reduced motion), fix, confirm once, stop.
PR to master with before/after screenshots.
```

---

## Step 5: Copy (proposals first, you decide)

Branch: `landing/tells-copy`

Stage A prompt (no code changes):

```
/impeccable clarify the landing page copy, PROPOSALS ONLY. Do not edit components or the frozen original in docs/design/landing-page/copy-archive/.

Write docs/design/landing-page/copy-archive/landing-copy-PROPOSALS.md as a table: location (file:line), original, flagged problem (slop catalog copy rules: "supercharge/world-class" words, forced contrast like "Not X. Y.", stacked abstractions, filler, balanced-clause aphorisms, em dashes, claims the product can't back such as multilingual), proposed replacement, one-line reason, and an empty "Decision" column. Flag only lines with a real problem; say which sections are fine. Preserve the owner's voice and the no-em-dash rule. Also check that one action has one name across header, hero, closing and modal, and propose a visible "illustrative example" caption for each demo.
```

Stage B (after you fill the Decision column):

```
Apply ONLY the accepted rows in landing-copy-PROPOSALS.md, using my edited wording where I wrote one. Change nothing else. Verify longer strings don't overflow at 375, 768 and 1440. PR to master linking the proposals file.
```

Rollback: the original lives in `copy-archive/` and the git tag.

---

## Step 6: Mobile, accessibility, polish, CI

Branch: `landing/tells-finish`

Prompt for Claude Code:

```
Final pass on the landing page. Follow DESIGN.md.

1. /impeccable adapt across 375, 768, 1024 and 1440 and touch vs pointer: 44px touch targets (header, mobile menu, footer links), visible focus rings, a deliberate layout between 768 and 1279 wide.
2. /impeccable harden: WaitlistModal focus move/trap/restore, aria-labelledby, role picker as real radio semantics with a selected state not based on color alone, mobile keyboard not hiding submit, safe-area insets; sequential heading outline with no fake headings from demos; no dead tab-stops; 200% text zoom; no-JS rendering. Run the accessibility-scan skill as a second opinion.
3. /impeccable polish: states (hover, focus, active, disabled), spacing and detail alignment with DESIGN.md; remove any remaining tells.
4. Re-run /impeccable audit and critique; append a "Before / after" section to ai-tells-findings.md (scores, detector count vs baseline/detect-before.json). Save after-375/768/1440 screenshots to baseline/.
5. Add a CI step (follow the existing .github/workflows conventions) running `bunx impeccable detect --json app components/landing`, failing on exit code 2. If findings remain, record each with `impeccable ignores` and a written reason; no blanket ignores.
Verify once at the widths (batched), fix, confirm once. PR to master listing what was verified and what still needs a human on a real phone and screen reader.
```

If this is too much for one session, split it at item 2 and run 3 to 5 as a follow-up. Nothing else depends on the order inside the step.

---

## Rollback

- Whole cleanup: revert the PRs in reverse order, or branch from tag `landing-before-ai-tells-cleanup`.
- Wording only: restore from `copy-archive/landing-copy-ORIGINAL-2026-10-07.md`.
- One step: revert just that PR.
