# Brief page — Two-Ink Bold rebuild: development plan

**Status: draft, not started.** Supersedes `brief-feature-design.md` and
`build-plan.md` for the Brief page's *content structure and visual design*
(both now carry a banner pointing here). Their schema work is **not**
superseded — see "What happens to the old schema" below.

## How to use this

Same convention as the old build-plan: each part below is independently
buildable and has a ready-to-paste "prompt for next session" block. Parts
are ordered so nothing depends on a part that comes after it. **Part 0 is a
hard prerequisite for everything else** — do not start Part 1 before it
ships.

Per the process change already in place for this feature (see
`[[brief_feature_v2_progress]]` memory): each part gets its own branch, and
needs the user's explicit sign-off before being considered done — not just
`tsc`/`lint`/browser verification.

---

## 0. Where this comes from

The visual language is the "Two-Ink Bold" direction, developed and
approved across a design-review conversation and applied to a full mock of
the real Brief page. That mock is the canonical visual reference — read it
before touching CSS:

- **Visual reference (build against this):** the "The AI Race — Brief
  (Two-Ink Bold)" artifact from this conversation. Ask the user for the
  current artifact link if it's not already in your context — it gets
  redeployed in place, so old links in chat history may be stale.
- Design tokens and component patterns are transcribed in §2 below so a
  session doesn't strictly need the artifact to start, but the artifact is
  the tie-breaker for anything ambiguous in this doc.

### What replaces what

| Old doc said | This doc says instead |
|---|---|
| 11 sections: Header, TLDR, Use This, Featured News, Explainer, Where Experts Stand (+ contested points/takes), Quotes, Media, Going Deeper, FAQ, Q&A | 9 sections: Header/Hero, TL;DR, Quotes, Explainer (+ Sources), FAQ, Community Q&A, Calls to Action, Covered By, Related Briefs |
| Annotation layer (collapsed/expanded/stale chips), review-pass screen, reconfirmation email, admin moderation of takes | Not built. See below. |
| Palette: `base`/`warm`/`dark`/`live` amber, Anton + Source Serif + DM Mono | Two-Ink Bold tokens, §2 |

### What happens to the old schema

Migration `017_brief_feature_schema.sql` already shipped `contested_points`
and the polymorphic `brief_contributions` table (types `review` /
`endorsement` / `take` / `comment`, with `content_version` staleness
versioning). **Explicit decision: leave these tables in the database,
untouched.** No cleanup migration, no `DROP TABLE`. Two consequences:

1. `contested_points` and the `take`/`comment` contribution types go
   unused indefinitely — that's fine, they cost nothing sitting empty.
2. The `review` / `endorsement` contribution types **are** reused (Part 3,
   Part 1) — see "Reusing `brief_contributions`" below. This is not a
   revival of the old review-pass screen or staleness system; it's a much
   smaller self-serve mechanism that happens to fit the existing table
   shape.

Do **not** build: the annotation layer (§6 of the old design doc), the
review-pass screen (§7), the reconfirmation email (§7.1), or admin
moderation of `take`/`comment` rows. If a future session wants those back,
that's a new decision, not a resumption of this plan.

---

## 1. Design system (Part 0 builds this; everything else consumes it)

> **Skills consulted for this section and §3 below:** `web-design-guidelines`
> and `react-best-practices` (Vercel), `composition-patterns` (Vercel),
> `frontend-design` (Anthropic), and the static `accessibility-*` skill
> content (AccessLint — methodology/checkpoints only, the live-scan MCP
> server isn't installed, so nothing below is a substitute for actually
> running `accessibility-scan`/`accessibility-inspect` once real pages
> exist). Contrast numbers in §1.1 were computed by hand against the WCAG
> formula, not via the AccessLint engine — treat them as a strong signal,
> not a replacement for a real scan once Part 0 ships.

### 1.1 Tokens

Replace `app/globals.css`'s `@theme inline` block. Current tokens
(`--color-base/warm/dark/text/soft/live/edge/card`, Anton/Source Serif/DM
Mono) are the "temporary palette" being retired — don't keep them side by
side, replace them outright so nothing can accidentally reference the old
names.

```css
@theme inline {
  /* Light (default) */
  --color-paper:            #FFFFFF;
  --color-paper-raised:     #F7F7F8;
  --color-paper-sunken:     #FBEFF5;  /* pink wash — Q&A section bg */
  --color-paper-sunken-blue:#EAF0FE;  /* blue wash — Quotes section bg */
  --color-ink:               #0C0D0E;
  --color-ink-soft:          #4A4E53;
  --color-ink-faint:         #727679;  /* darkened from the artifact's #85898E — that value is 3.52:1 on white, fails WCAG AA (4.5:1) for normal-size text, and this token is used for ~9-11px mono labels/eyebrows/dates that don't qualify for the "large text" 3:1 exemption. #727679 is 4.57:1, passes. */
  --color-line:              #E2E3E5;
  --color-line-strong:       #C9CBCE;
  --color-blue:              #1E4FEB;
  --color-blue-soft:         #E7EDFD;
  --color-blue-ink:          #0B2C99;
  --color-pink:              #F0197E;
  --color-pink-soft:         #FDE6F1;
  --color-pink-ink:          #99075A;
  --color-coverage-bg:       #0C0D0E; /* fixed dark band, both themes */

  --font-display: var(--font-plex-sans), "Segoe UI", "Helvetica Neue", Arial, sans-serif;
  --font-body:    var(--font-plex-sans), "Segoe UI", "Helvetica Neue", Arial, sans-serif;
  --font-mono:    var(--font-plex-mono), ui-monospace, "SF Mono", Consolas, monospace;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --color-paper:            #0C0D0E;
    --color-paper-raised:     #151719;
    --color-paper-sunken:     #1C1420;
    --color-paper-sunken-blue:#141B2E;
    --color-ink:               #F1F2F3;
    --color-ink-soft:          #B4B8BC;
    --color-ink-faint:         #787C81;  /* lightened from #6A6E72 — that value is 3.79:1 on the dark paper, same AA failure as the light-mode value above. #787C81 is 4.63:1, passes. */
    --color-line:              #242628;
    --color-line-strong:       #35383B;
    --color-blue:              #5B8DFF;
    --color-blue-soft:         #16223F;
    --color-blue-ink:          #CFDDFF;
    --color-pink:              #FF5FA0;
    --color-pink-soft:         #3A1226;
    --color-pink-ink:          #FFD3E8;
    --color-coverage-bg:       #000000;
  }
}
/* mirror under :root[data-theme="dark"] / [data-theme="light"] for the
   in-app theme toggle, same pattern as the artifact — see it for the
   exact block, it's mechanical. */
```

This repo currently has no light/dark toggle (only `prefers-color-scheme`
is wired via the artifact's own CSS, not this app's). Check whether the
app has a manual theme toggle before assuming the `[data-theme]` selectors
are needed — if not, the `@media` block alone is sufficient and the
`[data-theme]` mirror can be skipped (add it back the day a toggle ships).

**Fonts:** `app/layout.tsx` currently loads `Anton`, `Source_Serif_4`,
`DM_Mono` via `next/font/google`. Replace with `IBM_Plex_Sans` (weights
400/500/600/700/800) and `IBM_Plex_Mono` (weights 400/500/600), same
`variable:` pattern. Two-Ink Bold uses **one** grotesk family for both
display and body — weight does the work, not a serif/sans split. Don't
substitute Inter, Roboto, or system-only fonts (Segoe UI/Helvetica Neue in
the artifact were a browser-preview constraint, not the real
recommendation — this app can and should self-host via `next/font`).

**Semantic color mapping** (the load-bearing part — get this right before
styling anything):

- **Blue = expert/org verification.** Reviewed/endorsed badges, keyterm
  tooltips, sources, expert quote avatars, FAQ, Calls to Action (see note
  below — this section was blue in the actual build, not pink as
  originally planned here).
- **Pink = creator/journalist engagement.** Q&A asks, Covered By.
- **Ink (neutral) = the editorial spine.** Masthead, hero, TL;DR,
  Explainer body prose, Related Briefs. Never tinted blue or pink.

**Deviation from this table, decided during Part 6's build (2026-08-13):**
Calls to Action shipped blue, not pink. Only experts/organisations can ever
author a CTA (migration 026's insert RLS), so pink's "creator/journalist
engagement" meaning didn't fit — blue's "expert/org verification" meaning
does. The artifact itself still shows pink for this section; treat the
artifact as superseded on this one point, same as any other place this doc
says to prefer written decisions over the artifact once they diverge.

**Contrast rule for the accent colors — apply everywhere `blue`/`pink` get
used as text color, not just where the plan calls it out explicitly:**
raw `blue` (#1E4FEB) passes WCAG AA (4.5:1) for text at any size in both
themes, but raw `pink` (#F0197E light / bordering-adequate in dark) does
**not** at normal text sizes in light mode (4.08:1, needs 4.5:1) — it only
clears AA at large-text/UI-component sizes (18px+/14px-bold, 3:1
threshold). Concretely: use `pink` for large headline text, borders,
fills, dots, and top-rules; use `pink-ink` (#99075A, 8.29:1) for pink text
below that size — the artifact's own CTA link color and vote-button hover
color used raw `pink` at ~11px, which is exactly this bug. Same logic for
`blue`/`blue-ink`, though raw `blue` happens to already clear AA — use
`blue-ink` anyway for anything sitting on a tinted background
(`blue-soft`), where the lower-contrast background changes the math.

### 1.2 Type scale (approximate — tune against the artifact, don't treat these as exact)

| Role | Size | Weight | Notes |
|---|---|---|---|
| Hero h1 | `clamp(3.1rem, 7.8vw, 6.6rem)` | 800 | letter-spacing -0.035em |
| Section h2 (main title) | `clamp(1.7rem, 3.2vw, 2.5rem)` | 800 | uppercase, letter-spacing +0.01em |
| Sub-head (e.g. Explainer subsection title) | ~1.28rem | 500 | *italic*, color ink-soft — deliberately quieter than h2, see §2 note below |
| Body | ~1.02–1.06rem | 400–500 | line-height 1.7 |
| Mono labels/eyebrows | 0.6–0.72rem | 600 | uppercase, letter-spacing 0.04–0.1em |

The main-title vs. sub-head distinction (uppercase/heavy/full-ink vs.
italic/medium/ink-soft) was a specific fix requested mid-review — don't
let them converge back to "same weight, different size," that was the bug.

### 1.3 Shared components to build once, in `components/ui/` or
`app/briefs/[slug]/`

- **`SectionHeader`** — already exists (`section-content.tsx`), already
  has the numbered-divider shape (`num` + rule). Restyle it, don't
  rewrite it: drop the `EX.`-style prefix if present anywhere, bare
  two-digit numbers only (`01`, `02`...), and make sure the number itself
  is visible starting from the very first section a reader sees — don't
  let the sequence appear to start at 02 with no visible 01 anywhere on
  the page.
- **`Chip`** — already exists as `HeaderChip`. Extend with `tone: 'blue' |
  'pink' | 'default'` instead of the current `'live' | 'default'`.
- **`Carousel`** (new, client component) — Quotes and Related Briefs
  currently render as a static CSS grid, not a horizontally-scrollable
  row. Build it as a **compound component with a shared provider**
  (`composition-patterns`: lift the scroll-position state into a provider
  rather than a single monolithic component taking a pile of config
  props — `showButtons`/`fadeColor`/`itemWidth`-style boolean/prop
  proliferation is exactly what that skill flags):

  ```tsx
  const CarouselContext = createContext<{
    trackRef: React.RefObject<HTMLDivElement | null>
    atStart: boolean
    atEnd: boolean
  } | null>(null)

  function CarouselProvider({ children }: { children: React.ReactNode }) { /* owns trackRef + atStart/atEnd state, one passive scroll listener */ }
  function CarouselTrack({ children, fadeColor }: { children: React.ReactNode; fadeColor: string }) { /* scrollable row + edge fade masks in fadeColor */ }
  function CarouselPrevButton() { /* use(CarouselContext), disabled+hidden when atStart */ }
  function CarouselNextButton() { /* same, atEnd */ }

  export const Carousel = { Provider: CarouselProvider, Track: CarouselTrack, PrevButton: CarouselPrevButton, NextButton: CarouselNextButton }
  ```

  Consumer (e.g. Quotes): `<Carousel.Provider><Carousel.PrevButton
  /><Carousel.NextButton /><Carousel.Track
  fadeColor="var(--color-paper-sunken-blue)">{quotes.map(...)}</Carousel.Track></Carousel.Provider>`
  — each section passes its own `fadeColor` (Quotes:
  `paper-sunken-blue`, Covered By: `coverage-bg`, everything else:
  `paper`) instead of the component hardcoding one background.

  Requirements, sourced from `web-design-guidelines`' interaction
  checklist — treat all of these as acceptance criteria for Part 0, not
  optional polish:
  - Hidden native scrollbar (`scrollbar-width: none` + WebKit
    equivalent).
  - Prev/next buttons: `aria-label="Previous"`/`"Next"` (icon-only
    buttons need one), visible `focus-visible` ring (never
    `outline: none` without a replacement), and `touch-action:
    manipulation` so a tap doesn't wait out the double-tap-zoom delay.
  - The track itself needs to be keyboard-scrollable, not just
    button-scrollable — a native `overflow-x: auto` div is already
    arrow-key-scrollable once it's a focusable element (`tabIndex={0}`
    if it isn't focusable by default); don't build a carousel that only
    a mouse/touch user can move.
  - Scroll-position tracking (`scrollLeft`) hides the left fade/button
    at the very start and the right fade/button at the very end — this
    must be correct from initial render, not just after the user
    scrolls; a `Carousel.Track` that never mounted inside a
    `Carousel.Provider` should fail loudly (throw if `use(CarouselContext)`
    is null) rather than silently show a fade with nothing to reveal —
    that exact bug happened once already in the mock.
  - One passive scroll listener per carousel instance
    (`client-passive-event-listeners` — `{ passive: true }`), not one
    per card.
  - Respect `prefers-reduced-motion` on the `scrollBy({ behavior:
    'smooth' })` call the buttons trigger (fall back to instant jump).
- **Dark-band section wrapper** — a small utility (`bg-coverage-bg
  text-paper-raised` or similar) for Covered By. Fixed dark in *both*
  themes — don't build it from the `ink` token, `ink` inverts between
  light/dark mode and this band should not.
- **Duotone placeholder graphic** — Covered By has no real photography
  yet. Build a small deterministic component that takes a stable key
  (e.g. the coverage row's id) and renders an abstract SVG (simple
  shapes — circles/rings/polygons, not hand-authored path data) in a
  blue-or-pink gradient plus a faint halftone-dot overlay
  (`mix-blend-mode: multiply`), so the "no photo yet" state looks
  designed rather than empty. Swap for real images later without
  changing the card layout.

All new client components (`Carousel`, the FAQ/Q&A accordions, vote/
endorse buttons) target React 19 (this app is on Next.js 16): no
`forwardRef` — `ref` is a regular prop — and `use(SomeContext)` instead of
`useContext(SomeContext)` wherever a component reads a provider
(`composition-patterns`' `react19-no-forwardref` rule).

### 1.4 Accessibility and interface conventions (apply across every part)

Curated from `web-design-guidelines`' Web Interface Guidelines checklist —
not the full 100+-rule list, just the ones that are either easy to miss or
specific to what this plan actually builds. Re-run the full checklist via
that skill once real component code exists; don't treat this subset as
exhaustive.

- **Focus states**: every interactive element (`Carousel` buttons,
  accordion triggers, vote/endorse buttons, chip-styled toggles, the CTA/
  Coverage "propose" buttons) needs a visible `focus-visible` ring — never
  a bare `outline: none`. Use `:focus-visible`, not `:focus` (don't ring
  on mouse click).
- **`aria-live="polite"`** on anything that updates a count in place
  without navigation: the reviewed/endorsed badge after the toggle in
  §2's mechanism, Q&A vote/endorsement counts (Part 5). The carousel's
  at-start/at-end button visibility doesn't need this — it's affordance,
  not content — but a submitted CTA/Coverage row moving from "submitted"
  to "pending review" in the UI does.
- **Semantic elements, not `<div onClick>`**: accordion triggers are real
  `<button>` (already true in the mock); CTA/Coverage outbound links are
  real `<a>`, not button-styled onClick handlers.
- **Forms** (Parts 5-7's "Ask a question" / "Suggest a call to action" /
  "Add coverage" flows — new submission surfaces this plan adds, unlike
  the mostly-read-only sections in Parts 1-4): every input needs a
  `<label>`, correct `type`/`autocomplete`, must not block paste, submit
  button stays enabled until the request starts (spinner during, not
  disabled-then-nothing), and validation errors render inline next to the
  field with focus moved to the first error on a failed submit — follow
  `ProposeCorrectionModal`'s existing form conventions, which already do
  most of this, rather than inventing a new pattern per part.
- **User-generated content needs container handling**: CTA descriptions,
  coverage titles, and Q&A question/answer text are the first genuinely
  unpredictable-length author-facing content in this plan (existing
  sections are all admin-authored, so their length is implicitly
  controlled). Give these `line-clamp-*`/`truncate`/`break-words` as
  appropriate and `min-w-0` on any flex ancestor, and design for the
  empty state (zero CTAs, zero coverage, zero questions) explicitly
  rather than letting an empty array render broken UI — the existing
  Quotes/Media near-empty-state handling is the pattern to copy.
- **`touch-action: manipulation`** on anything tappable that isn't
  already a native `<button>`/`<a>` with browser defaults, and
  `-webkit-tap-highlight-color` set intentionally rather than left at
  the (frequently ugly) browser default.
- **`color-scheme`**: set `color-scheme: light dark` (or the per-theme
  equivalent) on `<html>` once Part 0's dark tokens exist, so native form
  controls (any new CTA/Coverage form `<select>`, the existing role
  `<select>` if one still exists) don't render a light-on-light or
  dark-on-dark mismatch against the surrounding theme.
- **Reduced motion**: every animation this plan adds (carousel smooth-
  scroll, accordion expand/collapse, the entrance animations already in
  `BriefView.tsx`) must respect `prefers-reduced-motion` — the mock's CSS
  already does this pattern consistently, carry it into real components
  rather than dropping it during the port.
- **Numbers**: keep `font-variant-numeric: tabular-nums` wherever digits
  sit in a fixed-width context (vote counts, read-time, section numbers —
  already used via the existing `.num` class, extend it rather than
  reintroducing ad hoc number styling).

### Prompt for next session — Part 0

```
Read docs/design/brief-feature/two-ink-bold-plan.md in full before doing
anything else — this is the first part, so there's no prior part's work to
orient against yet, but §0's context (what's superseded, what stays) still
matters before you touch anything.

Build the Two-Ink Bold design system foundation for the Brief page
(docs/design/brief-feature/two-ink-bold-plan.md §1). This replaces the
current "Punchy Media Brand" theme in app/globals.css entirely.

1. Replace the @theme inline block in app/globals.css with the tokens in
   §1.1 (light + dark via prefers-color-scheme; check whether the app has
   a manual theme toggle before also wiring [data-theme] selectors).
2. In app/layout.tsx, swap the next/font/google imports from
   Anton/Source_Serif_4/DM_Mono to IBM_Plex_Sans (weights 400/500/600/
   700/800) and IBM_Plex_Mono (weights 400/500/600), matching the
   existing variable: pattern.
3. Restyle (don't rewrite) SectionHeader and HeaderChip in
   app/briefs/[slug]/section-content.tsx per §1.1's semantic color
   mapping and §1.3.
4. Build the shared Carousel as a compound component per §1.3's exact
   shape (Provider/Track/PrevButton/NextButton via context, not a single
   component with a pile of config props — see the composition-patterns
   skill if the reasoning isn't obvious from the spec). Hidden scrollbar,
   discreet inset prev/next buttons with aria-label and focus-visible
   rings, edge-color-matched fade masks, correct at-start/at-end tracking
   from initial render, keyboard-scrollable track, touch-action:
   manipulation, reduced-motion-safe smooth scroll.
5. Build the dark-band wrapper and the duotone placeholder graphic
   component per §1.3, even though nothing consumes them yet (Part 7
   will).
6. Use `blue`/`pink` vs. `blue-ink`/`pink-ink` per §1.1's contrast rule
   everywhere you reach for an accent as a text color in this part's
   restyle of SectionHeader/HeaderChip — don't just copy colors from the
   artifact's CSS verbatim, it has at least one instance of this exact
   mistake (the CTA link color).

This part touches shared CSS/fonts/components only — no section content
changes yet, so the existing page will look broken/half-migrated until
Parts 1+ land. That's expected. Verify: bunx tsc --noEmit && bun run lint
clean; spot-check in the browser that the token swap didn't produce
invisible-text bugs (check both a light-background and the future
dark-band area); run the web-design-guidelines skill against the new
Carousel/Chip/SectionHeader components specifically (small enough surface
area to review as code at this stage, before it's buried in five
sections' worth of usage). If the AccessLint MCP server (`accessibility-
scan`) gets installed before this part starts, run it against a throwaway
page rendering the new components — the static accessibility skills
installed so far are methodology references, not a substitute for an
actual scan. Get the user's sign-off on the raw token/type feel before
starting Part 1 — this is the one part where a wrong call is expensive to
unwind later.
```

---

## 2. Content sections and where their data comes from

| # | Section | Ink | Data source | New schema? |
|---|---|---|---|---|
| — | Masthead + hero + header chips | neutral | existing (`briefs`, `brief_contributions` via `getEndorsementBarCounts`) | No |
| 1 | TL;DR | neutral | existing `brief_sections` (`type='tldr'`) — **content format changes**, see Part 1 | No |
| 2 | Quotes | blue | existing (`content_posts` by `topic_tag`) | No |
| 3 | Explainer (+ Sources) | blue | existing `brief_sections` (`type='explainer'`, multiple rows) + reused `brief_contributions` for reviewed/endorsed badges | `brief_sections.title` column |
| 4 | FAQ | blue | existing `brief_sections` (`type='faq'`, `Q:`/`A:` parsed) | No |
| 5 | Community Q&A | pink asks / blue answers | existing `questions` table, extended | Yes — votes + endorsements |
| 6 | Calls to Action | blue (changed from pink, see §1.1's deviation note) | new | Yes — `brief_ctas` |
| 7 | Covered By | pink, dark band | new | Yes — `brief_coverage` (+ likes) |
| 8 | Related Briefs | neutral | existing (`briefs.topic_tag`) | No |

Dropped from the old IA entirely, per the decision in §0: Use This,
Featured News, Where Experts Stand, Going Deeper (its *sources*-parsing
logic is kept — see Part 3). The `brief_section_type` enum in Postgres
still contains `use_this` / `featured_news` / `where_experts_stand` /
`going_deeper` values (enums can't drop values without a full type swap,
same reason migration 017 didn't do it additively) — leave them, just stop
authoring new rows of those types and retire their bespoke renderers in
Part 10's cleanup pass.

### Reusing `brief_contributions` for reviewed/endorsed badges

Both the hero's "Reviewed by N experts" chip (already built, currently
dead — nothing writes to `brief_contributions` because the review-pass
screen was never built) and the new per-Explainer-subsection "✓ Reviewed ·
N" badge should read the **same** signal. Rather than inventing a second
mechanism, Part 1 and Part 3 add a minimal write path:

- A simple two-button control (`Mark as reviewed` / `Endorse`, endorse
  disabled until reviewed — same labels as the old design doc's §11
  decision, still good advice even though the doc is otherwise
  superseded: don't rename "Looks right"-style casual language to
  something formal) visible to `expert`/`organisation` users, per
  Explainer subsection and once at brief level for the hero chip.
- On click, upsert a row into the existing `brief_contributions` table:
  `type='review'` or `'endorsement'`, `section_id` (or null for
  brief-level), `section_version` = the section's current
  `content_version`, `status='published'` immediately (binary trust
  signals don't need moderation — this part of the old design doc's §5.4
  logic still holds even though the rest of that flow doesn't exist).
  The existing partial unique indexes already enforce one row per
  (user, target) — this is an `upsert`, not a plain insert.
- Do **not** build: the checklist screen, the note/comment field, the
  brief-level "confirm as a whole" as a separate flow, staleness display,
  or the reconfirmation email. Since nothing in this plan ever bumps
  `content_version` (the "substantive change" toggle from the old plan
  isn't being built either), every row stays current forever — the
  existing `getEndorsementBarCounts` staleness comparison in
  `lib/data/contributions.ts` still runs but will always evaluate to
  "current," which is exactly the simplification we want. **Do not
  refactor that function** — it already does the right thing for this
  reduced scope.

---

## 3. Part-by-part build order

### Part 1 — Masthead, hero, and TL;DR

Restyle the existing masthead/hero (`BriefView.tsx`) with the tokens from
Part 0. Add the reviewed/endorsed toggle at brief level (see §2) so the
header chip has real data to show. Split TL;DR out of the hero into its
own numbered section, and change its authored format: instead of one
paragraph, the admin authors 3–5 short bullet lines, each optionally
starting with a **bold lead term** followed by an em-dash (e.g. `**Compute
race** — governments vs. governments...`). Parse this the same way
`parseFAQ`/`parseSources` already parse structured text out of a single
`content` field — don't move to a JSON content model for this, it doesn't
match the rest of the codebase's conventions.

#### Prompt for next session — Part 1

```
Read docs/design/brief-feature/two-ink-bold-plan.md in full before doing
anything else — §0 for context, §1 for the design system Part 0 already
built (tokens, semantic color rules, the accessibility checklist in §1.4),
§2 for the brief_contributions reuse mechanism this part implements, §4
for engineering conventions. Don't skip straight to the numbered steps
below.

Build Part 1 of the Two-Ink Bold Brief page rebuild
(docs/design/brief-feature/two-ink-bold-plan.md §3, Part 1). Requires
Part 0 done first (design tokens/fonts/shared components).

1. Restyle the masthead and hero in app/briefs/[slug]/BriefView.tsx with
   the new tokens — neutral ink, no blue/pink tint (§1.1). Bump the hero
   h1 to the larger scale in §1.2.
2. Split TL;DR out of the hero into its own section with a SectionHeader
   (num "02", label "TL;DR"). Change the authoring format to short bullet
   lines with an optional **bold lead term** — write a small parser
   (pattern-match app/briefs/[slug]/section-content.tsx's parseFAQ) and
   update app/admin/briefs/[id]/EditBriefScreen.tsx's TLDR field with
   helper text telling authors to write one bullet per line.
3. Add the brief-level "Mark as reviewed" / "Endorse" control per §2's
   "Reusing brief_contributions" section — visible to expert/organisation
   users only, upserts into brief_contributions (type review/endorsement,
   section_id null, section_version = max content_version across the
   brief's sections, status published immediately). The header chip's
   count needs `aria-live="polite"` on the element that changes, since it
   updates in place without navigation (§1.4) — this is the first place
   this pattern appears in the rebuild; Part 3 repeats it at section
   scope and can point back here instead of re-deriving it. Verify the existing
   header chip (already built, in BriefView.tsx) now shows a real count
   after you use the control as a logged-in expert.

Do not touch content_version, staleness comparison logic, or
getEndorsementBarCounts — they already do the right thing for this scope,
see §2. Verify: bunx tsc --noEmit && bun run lint clean, browser-check as
both a logged-out visitor and a logged-in expert (use
playwright/.auth/expert.json cookie injection per past sessions' pattern).
```

### Part 2 — Quotes

Restyle the existing Quotes band. Convert from the current static grid to
the shared Carousel (Part 0), with the `paper-sunken-blue` background
tint. Existing data source (`content_posts` by `topic_tag`) is unchanged.

#### Prompt for next session — Part 2

```
Read docs/design/brief-feature/two-ink-bold-plan.md in full before doing
anything else — §0 for context, §1 for the design system (especially the
Carousel spec in §1.3 this part consumes and the checklist in §1.4), §4
for engineering conventions. Don't skip straight to the numbered steps
below.

Build Part 2 (docs/design/brief-feature/two-ink-bold-plan.md §3, Part 2).
Requires Part 0.

Restyle the Quotes band in app/briefs/[slug]/BriefView.tsx /
section-content.tsx: apply the paper-sunken-blue section background,
restyle QuoteCard per the artifact's blue-accented quote card (blue top
border or equivalent, blue avatar), and replace the current static grid
with the shared Carousel component from Part 0. No data-layer changes —
lib/data/posts.ts's getQuotesByTopicTag stays as-is.

Verify: bunx tsc --noEmit && bun run lint clean, browser-check the
carousel's edge-fade/button behavior specifically (this is the section
most likely to have few enough quotes that the carousel never actually
needs to scroll — check the near-empty-state design doc note still
applies and looks right with 1-2 quotes, not just with a full carousel).
```

### Part 3 — Explainer (+ Sources)

The biggest content-model change. Each Explainer subsection becomes its
own titled `brief_sections` row (`type='explainer'`) with a "✓ Reviewed ·
N" badge (reusing the mechanism from §2/Part 1 — same control, scoped to
`section_id`). Add inline keyterm tooltips using a lightweight authoring
convention (e.g. `{{term|definition}}` in the content field, parsed like
`parseFAQ`). Fold the existing `going_deeper`/Sources rendering
(`sources.tsx` — `parseSources`/`SourcesGrid`) into the end of the
Explainer section as its final subsection, since its existing look is
already close to the artifact's Sources treatment — restyle it, don't
rebuild it.

#### Prompt for next session — Part 3

```
Read docs/design/brief-feature/two-ink-bold-plan.md in full before doing
anything else — §0 for context, §1 for the design system, §2 for the
brief_contributions reuse mechanism (you're copying Part 1's brief-level
pattern to section scope), §4 for engineering conventions. Don't skip
straight to the numbered steps below.

Build Part 3 (docs/design/brief-feature/two-ink-bold-plan.md §3, Part 3).
Requires Parts 0-1 (needs the reviewed/endorsed control pattern from
Part 1 to copy at section scope).

1. Add a nullable `title` column to brief_sections (new migration,
   018_brief_sections_title.sql, following the numbering/RLS conventions
   in supabase/017_brief_feature_schema.sql). Update
   lib/database.types.ts (bunx supabase gen types...) and
   lib/admin/brief-actions.ts's BriefSection type.
2. Update app/admin/briefs/[id]/EditBriefScreen.tsx to let the author add/
   reorder/title multiple explainer subsections (the existing "multiple
   rows per section_type" support in BriefView.tsx already renders every
   matching row — reuse that, don't add new looping logic).
3. Add the "✓ Reviewed · N" / "★ Endorsed · N" badge per subsection,
   reusing Part 1's brief_contributions upsert control scoped to that
   section_id instead of brief-level.
4. Add inline keyterm tooltips: parse `{{term|definition}}` out of
   explainer content (pattern-match parseFAQ in section-content.tsx),
   render as a blue-underlined span with a hover/focus tooltip (see the
   artifact's .keyterm/.tip CSS for the exact interaction). The artifact's
   CSS-only hover/focus reveal is keyboard-reachable (`:focus` as well as
   `:hover`) but the tooltip text itself needs to be exposed to
   assistive tech too, not just visually — use `aria-describedby`
   pointing at the tooltip's id (or an accessible-name pattern of your
   choice), don't rely on the visual reveal alone.
5. Move going_deeper's existing Sources rendering (app/briefs/[slug]/
   sources.tsx) to render as the last subsection of Explainer instead of
   its own top-level section. Restyle its existing source-card look with
   the blue accent per the artifact, don't rewrite parseSources/
   SourcesGrid's logic.

Verify: bunx tsc --noEmit && bun run lint clean, browser-check as a
logged-in expert that per-section review/endorse writes a row scoped to
the right section_id (check brief_contributions in the Supabase dashboard
if the UI count doesn't update as expected — a wrong section_id there is
an easy silent bug). Get the user's sign-off on the keyterm-tooltip
authoring convention specifically before considering this done — it's a
new pattern content authors will need to learn.
```

### Part 4 — FAQ

Restyle the existing `Q:`/`A:`-parsed FAQ into an accordion (currently
renders both question and answer always-expanded as stacked blocks). Blue
accent. The artifact's "more answers" nested-reveal (additional expert
answers per FAQ item) has **no existing data representation** — skip it
for v1 rather than inventing a new content shape for it; flag it as a
stretch item if the user wants it back later.

#### Prompt for next session — Part 4

```
Read docs/design/brief-feature/two-ink-bold-plan.md in full before doing
anything else — §0 for context, §1 for the design system and §1.4's
accessibility checklist (accordions are explicitly called out there), §4
for engineering conventions. Don't skip straight to the numbered steps
below.

Build Part 4 (docs/design/brief-feature/two-ink-bold-plan.md §3, Part 4).
Requires Part 0.

Convert the existing FAQ rendering (FAQBlock / parseFAQ in
app/briefs/[slug]/section-content.tsx) from always-expanded stacked Q/A
blocks to an accordion — collapsed by default, click to expand, blue
accent (chevron/plus icon color, left-border accent on the expanded
panel). Reuse parseFAQ's existing Q:/A: parsing unchanged.

Do not build the "more answers" nested-reveal from the artifact — there's
no data source for multiple expert answers per FAQ item in this schema.
Confirm with the user whether that's wanted before inventing one; treat it
as out of scope for this part either way.

Verify: bunx tsc --noEmit && bun run lint clean, browser-check keyboard
accessibility of the accordion (focus-visible state, Enter/Space to
toggle) per the web-design-guidelines skill.
```

### Part 4b — FAQ: multiple expert answers (stretch, deferred)

**Status: requested by the user 2026-08-12, explicitly deferred to its own
part rather than folded into Part 4.** Part 4 built the FAQ accordion but
intentionally left out the artifact's "more answers" nested-reveal —
where a FAQ item shows one primary answer, plus an optional expandable
list of additional expert answers underneath. At the time Part 4 shipped
there was no data source for this; this part adds one.

**Ground truth from the artifact** (fetched 2026-08-12 — the artifact
builds this section client-side into an empty `<div id="faqList">`, not
as static markup, so read the JS, not just the CSS in §1). The exact data
shape and render logic:

```js
var FAQ = [
  {
    q: 'Is the U.S. actually losing the AI race?',
    a: 'Depends which race. On installed compute capacity, no. ...',
    answers: [
      {name:'Amara Voss', role:'Meridian AI Lab', when:'3 Aug 2026', text:'The metric that matters for capability is usable compute per training run...'},
      {name:'Delft Public Policy Lab', role:'Organisation', when:'1 Aug 2026', text:'We track this quarterly. The gap narrowed through 2026 but has not closed.'}
    ]
  },
  // ...one item has answers: [] — the "More answers" link/panel simply
  // doesn't render for that item. Not every FAQ item needs extra answers.
];
```

Render logic (`toggleMore`/`toggleAcc` in the artifact, adapted to React
state rather than class-toggling in the real build):
- If `item.answers.length > 0`, render a `.more-answers-link` button below
  the primary answer: `More answers (N) ▾` (▾ becomes ▴ when open — in
  the real build this is just the chevron/rotation treatment already used
  elsewhere, not literal glyph-swapping text).
- Clicking it reveals a `.more-answers-panel` — a `grid gap-[0.7rem]` of
  `.answer-card` elements, each: `background:var(--paper-raised);
  border:1px solid var(--line); border-left:3px solid var(--blue);
  padding:0.9rem 1rem;` containing an avatar-initials circle, the
  answerer's name (font-display, weight 800, 0.82rem) + role/date meta
  line (font-mono, 0.6rem, ink-faint), then the answer paragraph
  (0.88rem). Blue accent throughout — this is FAQ (blue ink), not Q&A
  (which reuses the identical `.answer-card`/`.more-answers-link` pattern
  but in pink — that's Part 5's territory, don't touch it here).

**The schema problem this part actually solves:** FAQ items aren't rows —
they're `Q:`/`A:` pairs parsed out of one `brief_sections.content` text
blob (`parseFAQ` in `section-content.tsx`), so there's no stable id to
hang a "many additional answers" foreign key off. Recommended approach,
consistent with this codebase's established preference for text-parsing
over new JSON/structured content models (see Part 1's TL;DR rationale):
**don't** turn FAQ items into their own `brief_sections` rows (that's a
bigger, unrequested restructuring) — instead add a new table keyed by
`(brief_id, question)`:

```sql
create table brief_faq_answers (
  id uuid primary key default gen_random_uuid(),
  brief_id uuid not null references briefs(id) on delete cascade,
  question text not null,  -- exact match against the parsed Q: line
  author_user_id uuid not null references users(id),
  body text not null,
  status text not null default 'pending',  -- pending/published, same as brief_ctas
  created_at timestamptz not null default now()
);
```

This is deliberately fragile in one specific way: if an admin edits the
question's wording in the FAQ section's free text, previously-submitted
answers under the old wording become orphaned (no longer match). That's
an accepted tradeoff for this part, not a bug to solve — flag it in the
admin editor's FAQ field helper text ("renaming a question detaches its
expert answers") rather than building reconciliation UI for it. If a
future session decides this fragility is unacceptable, promoting FAQ
items to real rows (title-column style, like Part 3 did for Explainer
subsections) is the alternative — that's a bigger call than this part
should make unilaterally.

**Moderation:** unlike Part 1/3's review/endorse toggle (binary trust
signal, publishes immediately), these are free-text answers — follow
Part 6/7's propose/moderate pattern (`status` pending → admin approves via
the existing admin moderation screen) instead of publishing immediately.

#### Prompt for next session — Part 4b

```
Read docs/design/brief-feature/two-ink-bold-plan.md in full before doing
anything else — §0 for context, §1 for the design system, Part 4b's own
section above for the artifact's exact FAQ-answers data shape/render
logic and the recommended schema (already researched, don't re-fetch the
artifact for this unless something here is ambiguous), §4 for engineering
conventions. Don't skip straight to the numbered steps below.

Build Part 4b (docs/design/brief-feature/two-ink-bold-plan.md, the
"Part 4b" section between Part 4 and Part 5). Requires Part 4 (FAQ
accordion) done first — this extends FAQBlock, it doesn't replace it.

1. New migration: brief_faq_answers (brief_id, question text,
   author_user_id, body, status pending/published, created_at) — check
   supabase/'s highest-numbered file first, don't assume a number (this
   plan has already hit one accidental collision at 019, see
   [[brief_two_ink_bold_plan]] memory for the unresolved
   fix/renumber-019-collision branch — confirm that's merged before
   picking your number). RLS: public/members read split on
   status='published' (same shape as brief_ctas in the Part 6 migration),
   expert/organisation insert their own pending rows, admin publishes via
   service role.
2. Extend FAQBlock (app/briefs/[slug]/section-content.tsx) to fetch and
   render each question's published brief_faq_answers rows as a
   "More answers (N)" toggle beneath the primary A: text, matching the
   artifact's .answer-card treatment (blue-left-border card, avatar +
   name/role/date meta, answer text) — reuse this app's existing
   Avatar/RoleBadge components (components/ui/) rather than hand-rolling
   initials circles like the artifact's static HTML does. Independent
   toggle state from the parent accordion item's open/closed state (the
   artifact keeps these as two separate toggles, not one).
3. An "Add an answer" flow for expert/organisation users on FAQ items
   they're viewing (expanded accordion item only), following
   ProposeCorrectionModal's existing propose-then-pending pattern per
   §1.4's forms checklist (labels, submit-disabled-until-request, inline
   errors). Submits question text (verbatim, to match against) + body.
4. Admin moderation: extend the existing admin moderation screen
   (app/admin/AdminScreen.tsx + lib/admin/actions.ts) with an approve/
   dismiss tab for brief_faq_answers pending rows, following the
   brief_ctas moderation pattern from Part 6.
5. Seed mock data for the demo brief (ai-alignment-core-problem) — at
   least one FAQ question with 2+ published answers and at least one FAQ
   question with zero (to confirm the "More answers" link correctly does
   not render at all when there are none, matching the artifact's 4th
   item). Bare-minimum "[Placeholder]"-prefixed content per this plan's
   seed policy — don't write elaborate fabricated-sounding expert answers.

Verify: bunx tsc --noEmit && bun run lint clean, browser-check the full
loop (expert adds an answer → doesn't show yet → admin approves → appears
under "More answers" with correct count), confirm the "More answers"
toggle's expand/collapse is independent of the parent FAQ item's own
open/closed state (collapsing the parent should also visually hide it,
but opening the parent shouldn't auto-open it), and confirm keyboard/
focus-visible behavior on both toggle levels per §1.4.
```

### Part 5 — Community Q&A

Restyle to the artifact's asked/answered visual separation (pink "asked
by" line, blue-bordered answer card) and add votes + expert endorsement.
Needs schema: the existing `questions` table gets extended.

#### Prompt for next session — Part 5

```
Read docs/design/brief-feature/two-ink-bold-plan.md in full before doing
anything else — §0 for context, §1 for the design system, §1.4's forms
and aria-live conventions (this part adds real submission surfaces), §4
for engineering conventions. Don't skip straight to the numbered steps
below.

Build Part 5 (docs/design/brief-feature/two-ink-bold-plan.md §3, Part 5).
Requires Part 0.

1. New migration (019_question_votes_endorsements.sql, check Part 3
   didn't already claim 018): add `answered_by uuid references users(id)`
   to questions if not already present (check migration 011 first — it
   may already cover this), plus two new small tables:
   question_votes (question_id, user_id, unique(question_id, user_id))
   and question_endorsements (question_id, user_id, unique(question_id,
   user_id), insert restricted by RLS to expert/organisation role — same
   pattern as brief_contributions' insert policy in migration 017).
2. Convert app/briefs/[slug]/qa.tsx's QuestionCard to an accordion:
   trigger = the question (as today), expanded panel = a pink-accented
   "Asked by" line followed by a blue-left-bordered answer block
   containing the answer text and an "Answered by" line, then a vote
   button (any logged-in member) and an "Endorse" button (expert/org
   only, disabled if no answer yet).
3. Wire vote/endorse buttons to server actions that upsert into the new
   tables and re-render the counts. Mark the count text
   `aria-live="polite"` (§1.4) — same pattern as Part 1's header chip.
   The answer/question text is user-submitted and unpredictable in
   length (§1.4's content-handling note) — give it `line-clamp-*` inside
   the collapsed trigger and `break-words` in the expanded panel, and
   verify the accordion still looks right with both a one-line and a
   several-paragraph answer.

Verify: bunx tsc --noEmit && bun run lint clean, browser-check the vote/
endorse buttons as both a regular member and an expert (endorse should be
hidden or disabled for non-experts, matching the existing role-gating
pattern already used elsewhere in this app, e.g. canContribute in
BriefView.tsx).
```

**Status: built 2026-08-13, then redesigned twice the same day against
user feedback** — first against the reference artifact directly (a pink
left border on "Asked by", not just tinted text — the artifact's
`.qa-attrib.asked` rule), then again against a LinkedIn-comments-inspired
layout the user asked for instead. The final shape differs substantially
from the prompt above, which is kept only for history:

- Votes are split by voter segment — pink (creator/journalist) vs. blue
  (expert/organisation) counts, not one number. A single "▲" button casts
  the vote (no separate pink/blue buttons — the voter's own role decides
  which bucket it lands in); hovering the count reveals the pink/blue
  breakdown as a tooltip; clicking it opens a "who voted" modal (avatar +
  name + affiliation + role per person, fetched on demand). All of this
  lives in `app/briefs/[slug]/qa-votes.tsx` (`VoteButton`, `EndorseButton`,
  `VoteCountBadge`, the voter modal) and the `getVoters` action in
  `lib/briefs/actions.ts`.
- A question now has a **flat list of answers** (`question_answers` table,
  migration 024), not a single `answer_text`/`answered_by` pair — no
  threading, an answer can't itself be replied to. Each answer gets its
  own vote ("helpful", any member) and endorsement ("accurate", expert/org
  only) — see `app/briefs/[slug]/qa-answers.tsx`.
- The question card itself is **always fully visible** — question text,
  vote count, answer count (👬 icon, click to expand/collapse), date, and
  who asked it (avatar + name + role + affiliation) all render without
  interaction. Only the answers list collapses/expands, not the whole
  card — this is not an accordion the way FAQ (Part 4) is.
- `questions.answer_text` / `questions.answered_by` (migration 022) were
  dropped in migration 024 — they never had a real write path (see Part
  5b below), so there was no data to preserve.

### Part 5b — Community Q&A: answer submission + moderation (deferred)

**Status: explicitly deferred by the user 2026-08-13.** Every part of Part
5 above assumes questions and answers already exist — but there has never
been a way for anyone to actually attach an answer to a question through
this app's UI. (`approveQuestion` in `lib/admin/actions.ts` only flips a
question's own `status` to `approved`; it doesn't touch answers.) All
verification of Part 5's UI so far has used answers seeded directly via a
service-role script, not a real submission path.

The user's own framing, worth carrying forward rather than re-deciding:
*"since a great part of the Brief gets built by submissions, all of this
work should be done with a completely different development plan"* — i.e.
this may not belong as a small follow-up part bolted onto this doc. A
future session should treat that as an open question, not a settled one:
either (a) build it as a small Part 5b exactly like Part 4b was (the
mechanism below is already the right shape for that), or (b) treat it as
the seed of a broader "how do submissions get moderated across this whole
app" plan that would also touch questions, FAQ answers, correction
proposals, CTAs, and coverage — several of which already independently
reinvent the same pending → admin-approves shape. Don't assume (a) just
because it's the smaller diff.

If built as a Part 5b, the mechanism is well-understood and mirrors Part
4b's `brief_faq_answers` pattern closely:

1. Migration: add a `status text not null default 'pending' check (status
   in ('pending', 'published'))` column to `question_answers` (next
   migration number — check `supabase/`'s highest file first). Update the
   table's read policy to gate on `status = 'published'` for the general
   member-read case, plus an "authors can read their own pending rows"
   policy and an expert/organisation-only insert policy restricted to
   `status = 'pending'` — same three-policy shape as
   `brief_faq_answers` in migration 021.
2. A submission form for expert/organisation users, following
   `AddAnswerForm` in `app/briefs/[slug]/faq-answers.tsx` almost exactly
   (propose-then-pending, §1.4's forms checklist) — the one difference is
   it submits against a real `question_id`, not FAQ's text-matched
   question line, so no "renaming detaches answers" fragility applies
   here.
3. Admin moderation: a new pending-answers tab, following
   `FaqAnswerCard/getPendingFaqAnswers/approveFaqAnswer/dismissFaqAnswer`
   in `app/admin/faq-answer-card.tsx` and `lib/admin/actions.ts` almost
   exactly.
4. `lib/data/question-answers.ts`'s `getQuestionAnswers` already filters
   nothing by status today (the table has no such column yet) — once (1)
   ships, add `.eq('status', 'published')` there, mirroring
   `getPublishedFaqAnswers`.

### Part 6 — Calls to Action (new feature)

New section (blue, not pink — see §1.1's deviation note, decided during
this part's build). Follow the existing `brief_correction_proposals`
propose/moderate pattern (`ProposeCorrectionModal`, admin moderation tab)
rather than inventing a new submission flow.

**Deviation from the schema below, decided post-launch (2026-08-13):** the
`link_label` column (the prompt's step 1 has the original "Read"/"Watch"/
"Download" rationale) was dropped in migration 027. The card's link
button was changed to an icon-only arrow, so the author-chosen label was
never actually displayed — it was removed from the submission form, the
row shape, and the schema rather than left as unused dead weight. The
arrow's accessible name (`aria-label`) now comes from the CTA's own
`title` instead.

#### Prompt for next session — Part 6

```
Read docs/design/brief-feature/two-ink-bold-plan.md in full before doing
anything else — §0 for context, §1 for the design system, §1.4's forms
and content-length conventions (this is a new feature with real user
submissions), §4 for engineering conventions. Don't skip straight to the
numbered steps below.

Build Part 6 (docs/design/brief-feature/two-ink-bold-plan.md §3, Part 6).
Requires Part 0.

1. New migration: brief_ctas (id, brief_id, author_user_id nullable —
   null when authored by Tell The World editorially rather than a
   specific expert/org, title, description, link_url, link_label e.g.
   "Read"/"Watch"/"Download", status pending/published, created_at).
   RLS: public/members read split on status='published' (same shape as
   brief_contributions in migration 017), expert/org insert their own
   pending rows, admin publishes via service role.
2. A "Suggest a call to action" flow for expert/organisation users,
   following ProposeCorrectionModal's existing pattern exactly (same
   modal-form-then-pending-row shape) — that pattern already covers most
   of §1.4's forms checklist (labels, submit-disabled-until-request,
   inline errors), confirm it still does rather than assuming. This is
   also the first genuinely unpredictable-length author-facing content in
   the plan (title/description), so give the rendered card
   `line-clamp-*`/`break-words` per §1.4, and design the zero-CTAs empty
   state explicitly (don't render an empty carousel shell).
3. Admin moderation: extend the existing admin moderation screen
   (app/admin/AdminScreen.tsx + lib/admin/actions.ts) with an approve/
   dismiss tab for brief_ctas pending rows, following the
   brief_correction_proposals moderation pattern already in that file.
4. Render the CTA carousel in BriefView.tsx (pink accent, shared Carousel
   component from Part 0) — only published rows, for the brief's
   own id.

Verify: bunx tsc --noEmit && bun run lint clean, browser-check the full
loop (expert submits → shows nowhere yet → admin approves → appears on
the brief).
```

### Part 7 — Covered By (new feature, dark band)

New pink section, but rendered on the fixed dark band from Part 0. No real
photography yet — use the duotone placeholder graphic.

#### Prompt for next session — Part 7

```
Read docs/design/brief-feature/two-ink-bold-plan.md in full before doing
anything else — §0 for context, §1 for the design system (specifically
§1.3's dark-band wrapper and duotone placeholder graphic), §1.4 for forms/
content-length conventions, §4 for engineering conventions. Don't skip
straight to the numbered steps below.

Build Part 7 (docs/design/brief-feature/two-ink-bold-plan.md §3, Part 7).
Requires Part 0 (specifically the dark-band wrapper and duotone
placeholder graphic component) and Part 6 (reuses its moderation pattern).

1. New migration: brief_coverage (id, brief_id, outlet_name, title, url,
   published_date, submitted_by uuid references users(id), score numeric
   nullable — set by admin at approval time, not a separate UI, status
   pending/published, created_at), plus brief_coverage_likes
   (coverage_id, user_id, unique) for de-duplicated liking. Same RLS
   shape as Part 6's brief_ctas.
2. A "+ Add coverage" flow, same propose/moderate pattern as Part 6 (any
   logged-in member can submit — this one isn't expert/org-gated, per the
   artifact's design; confirm that's still right with the user since it's
   a deliberate change from Part 6's gating, not an oversight). Same
   forms-checklist and content-length caveats as Part 6 apply here too
   (outlet name and article title are external, arbitrary-length text).
3. Render on the dark band (§1.3's wrapper), cards using the duotone
   placeholder graphic (keyed by the coverage row's id) unless a future
   image_url field is added — leave room for that column but don't build
   image upload now. Include the like button (any member, toggles
   brief_coverage_likes) and the score badge (blue, only shown if an
   admin set one).
4. Make sure the "+ Add coverage" button is visibly styled against the
   dark background by default, not just on hover — this exact bug (button
   inheriting a light background against light text, invisible until
   hover) happened once already during the mockup phase, double check it
   doesn't happen here too.

Verify: bunx tsc --noEmit && bun run lint clean, browser-check both
themes specifically for the dark band (§1.1's coverage-bg token is fixed
across themes on purpose — confirm it doesn't accidentally invert).
```

### Part 8 — Related Briefs

No new schema. Query briefs sharing the same `topic_tag`, excluding the
current brief.

#### Prompt for next session — Part 8

```
Read docs/design/brief-feature/two-ink-bold-plan.md in full before doing
anything else — §0 for context, §1 for the design system, §4 for
engineering conventions. Don't skip straight to the steps below.

Build Part 8 (docs/design/brief-feature/two-ink-bold-plan.md §3, Part 8).
Requires Part 0.

Add a getRelatedBriefs query to lib/data/briefs.ts: briefs sharing the
current brief's topic_tag (excluding itself), most recent first, limit 3,
respecting the same public/members visibility rules as the rest of that
file. Render as a neutral-ink carousel (shared Carousel component) at the
bottom of BriefView.tsx. Handle the null-topic_tag case (no related
briefs) by simply not rendering the section, same convention as the
existing Quotes/Media near-empty-state handling.

Verify: bunx tsc --noEmit && bun run lint clean, browser-check with a
brief that has no topic_tag set (section should not render, not render
empty).
```

### Part 9 — Admin editor + seed script updates

Sweep pass: make sure `EditBriefScreen.tsx` can author everything the new
sections need (explainer subsection titles from Part 3, TLDR bullets from
Part 1, CTA/Coverage moderation from Parts 6-7 if not already folded into
their own parts). Update `scripts/seed-test-brief.ts` to cover the new
section shapes — per the existing seed-content policy (memory:
`[[brief_feature_v2_progress]]`), keep it to bare-minimum
`[Placeholder ...]`-prefixed content, one row per new field, never
elaborate fabricated-sounding copy.

#### Prompt for next session — Part 9

```
Read docs/design/brief-feature/two-ink-bold-plan.md in full before doing
anything else — §0 for context, §2's section table for what every part
authors, §4 for the seed-script content policy and engineering
conventions. Don't skip straight to the steps below.

Build Part 9 (docs/design/brief-feature/two-ink-bold-plan.md §3, Part 9).
Requires Parts 1, 3 done (needs their new fields to exist).

Audit app/admin/briefs/[id]/EditBriefScreen.tsx against every new
authored field introduced in Parts 1-7 (TLDR bullet format, explainer
subsection titles, keyterm authoring convention) and add UI for anything
missing. Update scripts/seed-test-brief.ts to seed at least one row
exercising each new shape (a titled explainer subsection, a TLDR with
2-3 bullet lines) — follow the existing bare-minimum
"[Placeholder ...]"-prefixed content policy, don't write elaborate
fabricated copy. Do not touch scripts/seed-test-briefs.ts (plural) —
that's a separate fixture used by tests/briefs.spec.ts and
tests/security.spec.ts.

Verify: bunx tsc --noEmit && bun run lint clean, run the full seed script
against a local/dev DB and confirm every new field round-trips through
the admin editor.
```

### Part 9b — Playwright admin auth fixture (testing infrastructure, stretch)

**Status: DONE (2026-08-17).** The mechanism (fixture generation, the
`TEST_ADMIN_EMAIL` env var, `tests/two-ink-bold-11f-admin.spec.ts`) had
already landed earlier, bundled into PR #42 ("Part 11f: admin") rather
than as its own dedicated pass — a later audit (2026-08-17) found two of
this part's original requirements still open despite that, both now
closed:
- **CI never actually ran admin tests.** `ADMIN_EMAIL` was never pointed
  at `TEST_ADMIN_EMAIL` anywhere, including in CI, so every
  admin-authenticated test silently skipped on every PR/push. Fixed:
  added a `TEST_ADMIN_EMAIL` repo secret and repointed
  `.github/workflows/ci.yml`'s `ADMIN_EMAIL` to it — this only affects
  the throwaway dev server that job spins up, never a real deployment or
  your local `.env.local`. Admin tests now run for real in CI. Also added
  a dedicated inverse smoke test, `tests/security.spec.ts`'s "Admin
  routes — admin session" block (`/admin loads instead of redirecting to
  /login`), next to the existing logged-out-visitor block it mirrors.
- **`tests/faq-answers.spec.ts` never used the fixture once it existed.**
  Its own header comment still said "no admin auth fixture yet" and every
  test bypassed moderation via direct service-role seeding. Added a new
  `FAQ answer moderation — full loop` test that drives the real thing:
  submits as expert, clicks the actual Approve button in the admin UI
  (not a DB write), confirms the answer appears under "More answers" for
  a logged-out visitor. Skips itself with an explanatory message if
  `admin.json` isn't available, same pattern as the other two admin
  specs.

Verified: `bunx tsc --noEmit` / `bun run lint` clean, full local
`bunx playwright test` run (81 passed, 1 opt-in skip) with
`ADMIN_EMAIL=<TEST_ADMIN_EMAIL value>` — including the new moderation-loop
test and the admin-session smoke test.

Original framing, kept for history: this isn't a page feature — it's the
recurring test-infrastructure gap
that's shown up at every admin-adjacent checkpoint in this plan so far:
pt.3 and pt.4's shared-component work couldn't be interactively verified
as an admin (memory: `[[brief_two_ink_bold_plan]]`), pt.5's admin
pagination shipped without a browser-verified admin session, and Part 4b's
new admin FAQ-answers moderation tab was only tested via `expert.json` +
direct service-role seeding (`tests/faq-answers.spec.ts`) rather than
clicking the actual Approve/Dismiss buttons — because no `admin.json`
Playwright fixture exists. Parts 6 and 7 (Calls to Action, Covered By)
will hit the exact same wall when they add their own admin moderation
tabs. Building the fixture once here unblocks all of them retroactively
and for whatever comes after.

**Mechanism — this is a small, well-understood addition, not a redesign:**
`tests/global-setup.ts` already does everything needed for `creator.json`/
`expert.json` (admin `generateLink()` → `verifyOtp()` → cookie injection —
no email delivery involved, see the file's own doc comment). Admin auth in
this app is a single email-equality check, not a role column
(`app/admin/page.tsx` and `lib/auth/require.ts` both do
`user.email !== process.env.ADMIN_EMAIL`) — simpler than the expert/
creator role check in one sense, but it means the *value* of `ADMIN_EMAIL`
in whatever environment the tests run against has to actually match the
fixture account's email for the check to pass.

**The one real decision this part has to make:** don't reuse the real
`ADMIN_EMAIL` (presumably a real person's actual account) as the
Playwright fixture identity — that's the same reasoning that led to
dedicated `TEST_CREATOR_EMAIL`/`TEST_EXPERT_EMAIL` accounts instead of
authenticating as real users. Introduce a `TEST_ADMIN_EMAIL` env var
pointing at a dedicated pre-approved test account, and set `ADMIN_EMAIL`
to that same value in whatever environment runs this suite (local
`.env.local` for local runs; the CI secret for the GitHub Actions run).
Since this project has one Supabase project shared across dev and CI
(no separate staging), flag this env-value decision to the user rather
than silently repointing `ADMIN_EMAIL` — that variable also gates the
real `/admin` route in whatever environment it's set in.

#### Prompt for next session — Part 9b

```
Read docs/design/brief-feature/two-ink-bold-plan.md in full before doing
anything else — this section (Part 9b) has the full mechanism and the one
real decision point already worked out, §4 for engineering conventions.
Don't skip straight to the steps below.

Build Part 9b (docs/design/brief-feature/two-ink-bold-plan.md, the
"Part 9b" section between Part 9 and Part 10). No dependency on other
parts — this is test infrastructure, buildable any time.

1. Confirm with the user what TEST_ADMIN_EMAIL should be and whether
   ADMIN_EMAIL needs to be (re)pointed at it in .env.local / CI secrets —
   don't assume, this is the one real decision in this part (see the
   section above for why).
2. Add a third authenticateUser() call in tests/global-setup.ts, mirroring
   the existing creator/expert calls exactly, writing
   playwright/.auth/admin.json.
3. Add an admin-authenticated smoke check to tests/security.spec.ts (or a
   new tests/admin.spec.ts) confirming /admin loads instead of redirecting
   to /login when using the admin fixture — the inverse of the existing
   "Admin routes — logged-out visitor" describe block there.
4. Go back and actually exercise Part 4b's admin FAQ-answers moderation
   tab end-to-end with this fixture (tests/faq-answers.spec.ts currently
   stops short of clicking the real Approve/Dismiss buttons — see that
   file's own doc comment) — submit as expert, approve as admin, confirm
   it appears under "More answers" as a logged-out visitor. This is the
   fixture's first real payoff, not optional polish.

Verify: bunx tsc --noEmit && bun run lint clean, bunx playwright test runs
the new admin-authenticated tests green, confirm admin.json doesn't leak
into git (playwright/.auth/ should already be gitignored — verify it, don't
assume).
```

### Part 10 — Cleanup and final verification

**Status: DONE, but delivered piecemeal rather than as its own pass —
confirmed and documented 2026-08-17.** Every item below happened, just
scattered across other parts' PRs instead of one dedicated "Part 10"
commit, which is why this section went undocumented for a while (unlike
every other part in this doc) and why a later session had to reconstruct
what had actually landed:
1. Dead `use_this`/`featured_news`/`where_experts_stand` renderers: gone.
   Retired inside PR #46 (Part 9's own PR), whose commit explicitly notes
   it's "pulling that slice of Part 10's cleanup forward at the user's
   request." `going_deeper` correctly still exists, folded into Explainer
   per Part 3, as expected — not a miss.
2. `contested_points` and the `take`/`comment` `brief_contributions`
   types: confirmed untouched. `contested_points` appears only in
   migration 017, generated types, and docs; `take`/`comment` appear only
   in the generated enum — no app code reads or writes either beyond what
   Parts 1/3 already do for `review`/`endorsement`.
3. Full verification pass: confirmed green. `tsc`/lint clean, and CI's
   full Playwright suite passed on the current `master` tip
   (`Brief header parity...`, PR #48, 2026-08-17T06:34:53Z).
4. "Final sign-off across the whole page" as its own deliberate close-out
   moment: this is the one sub-item that genuinely never happened as
   written — there's no dedicated commit/PR and this doc's own status
   note was never added, unlike Parts 0–9b and 11a–11h which all got one
   once built. Retroactively, items 1–3 above constitute the substance of
   what that pass would have verified; treat this note as that sign-off
   rather than opening a new dedicated PR for it, per the user's own
   framing when this was audited ("for 10 is only a matter of
   documentation").

Original scope, kept for history: retire the dead `use_this` /
`featured_news` / `where_experts_stand` / `going_deeper` (now folded into
Explainer) renderers from `section-content.tsx` and `BriefView.tsx`'s
`SECTION_ORDER`/`SECTION_META` if nothing still references them. Full
regression pass.

#### Prompt for next session — Part 10

```
Read docs/design/brief-feature/two-ink-bold-plan.md in full before doing
anything else — §0 for context (specifically "What happens to the old
schema," which this part verifies), §4 for the full verification checklist.
Don't skip straight to the steps below.

Build Part 10 (docs/design/brief-feature/two-ink-bold-plan.md §3, Part
10) — final cleanup, do this last.

1. Confirm nothing still renders use_this/featured_news/
   where_experts_stand as top-level sections (going_deeper's rendering
   should already have moved into Explainer in Part 3). If any admin UI
   still offers creating rows of those types, decide with the user
   whether to remove that option or leave it as a harmless no-op in the
   public page.
2. Confirm contested_points and brief_contributions' take/comment types
   are genuinely untouched (git diff against the state before this
   plan started, on those specific tables/files) — this plan's explicit
   decision was to leave them alone, not delete or repurpose them beyond
   what Parts 1/3 already do with review/endorsement.
3. Full verification pass: bunx tsc --noEmit, bun run lint, and the full
   Playwright suite (bunx playwright test). Browser-check the whole brief
   page top to bottom in both light and dark, as a logged-out visitor, a
   logged-in creator/journalist, and a logged-in expert/org.
4. Get the user's final sign-off across the whole page, not just
   part-by-part — check that section-to-section transitions (background
   color changes, the numbered divider sequence) read coherently as one
   page, not nine independently-shipped fragments.
```

---

### Part 11 — Sitewide Two-Ink Bold migration (deferred, separate branch)

**Status: explicitly deferred by the user 2026-08-13.** Not part of the
original scope — §0 was explicit that Two-Ink Bold applies to the public
Brief page only — but the user wants the rest of the site unified onto
the same design system eventually, as its own dedicated piece of work
rather than folded into whichever part happens to touch a given file.

**Why this exists as a part at all:** while fixing an unrelated regression
(Part 0's `@theme` replacement left every non-Brief-page screen — admin,
landing, login, home, profile, directory, the apply flow, and the shared
`RoleBadge`/`Pagination` components — referencing retired tokens with no
CSS emitted for them, i.e. invisible text/backgrounds), the fix applied
was a **compat shim**: the old `base`/`warm`/`dark`/`text`/`soft`/`live`/
`edge`/`card` tokens and `font-serif` were restored in `app/globals.css`
at their original pre-Part-0 values (the amber/cream "Punchy Media
Brand" look). That shim un-breaks those screens but does **not** move
them onto Two-Ink Bold — it just restores their old appearance. This part
is the follow-up that actually does the migration and lets that shim be
deleted.

**Scope — every file still authoring against the legacy tokens:**
`app/page.tsx` (landing), `app/login/page.tsx`, `app/home/page.tsx`,
`app/apply/page.tsx` + `form-fields.tsx` + `rejected/page.tsx` +
`pending/page.tsx`, `app/profile/[id]/ProfileView.tsx` + `RoleDetails.tsx`
+ `cards.tsx`, `app/directory/DirectoryView.tsx` + `UserCard.tsx` +
`QuoteCard.tsx`, `app/admin/AdminScreen.tsx` + `cards.tsx` +
`faq-answer-card.tsx` + (by then, presumably) `cta-card.tsx` +
`briefs/[id]/EditBriefScreen.tsx`, and the shared `components/ui/
RoleBadge.tsx` + `Pagination.tsx`. Re-grep before starting — this list is
current as of Part 6 but new admin surfaces (Parts 6/7's moderation tabs)
may add more call sites in the meantime.

**Not a mechanical rename.** Most old→new token swaps are direct
(`bg-base`→`bg-paper`, `bg-warm`→`bg-paper-raised`, `text-dark`→
`text-ink`, `text-soft`→`text-ink-soft`, `border-edge`→`border-line`,
`bg-card`→`bg-paper-raised`, `font-serif`→ likely `font-body`, since
Two-Ink Bold uses one grotesk family rather than a serif/sans split, see
§1.1). But `text-live` — the old theme's single amber accent, used for
links, highlights, and brand marks everywhere — has **no 1:1 equivalent**:
Two-Ink Bold splits accent color by meaning, not by "the brand color"
(§1.1 — blue = expert/org verification, pink = creator/journalist
engagement). Every `text-live`/`bg-live`/`border-live`/`ring-live` call
site needs a real per-instance judgment call on which it becomes (or
whether it should be neutral `ink` instead), not a find-and-replace.
Apply §1.1's contrast rule (`blue`/`pink` vs. `-ink` suffixed variants)
to each one as it's converted, same as Part 0 did for the Brief page.

**Status update (2026-08-13):** the file list above was confirmed stale,
as predicted. A live re-grep this session (`bg|text|border|ring|from|to|
via|divide|outline|decoration|fill|stroke|placeholder|caret|accent`
combined with `-(base|warm|dark|text|soft|live|edge|card)` plus
`font-serif`, across `app/` and `components/`) found the list above still
holds, **plus**: `app/admin/cta-card.tsx` and `app/admin/faq-answer-card.tsx`
(new admin moderation cards from Parts 4b/6, exactly the "new admin
surfaces" the note above predicted), and four files not in the original
scope at all — `components/ui/Avatar.tsx`, `components/ContactModal.tsx`,
`components/ProposeBriefModal.tsx`, `components/PostModal.tsx`.

It also surfaced something the doc didn't anticipate: **the Brief page
itself still has legacy-token remnants**, even though Parts 0-6 were
supposed to have fully migrated it — `app/briefs/[slug]/BriefView.tsx`'s
logged-out "Members Only" gate banner and footer border, `app/briefs/
[slug]/qa.tsx`'s "Ask a question" modal, and `app/briefs/[slug]/
loading.tsx`'s skeleton. One more hit, `MediaCard` in `app/briefs/[slug]/
section-content.tsx`, turned out to be dead code (not imported or
rendered anywhere — a leftover from the dropped "Featured News"/"Use
This" sections) — that belongs to Part 10's cleanup (delete it), not this
part's (migrate it), so it's explicitly excluded from every subtask
below.

Given the size (12 files across 6 screens, plus 4 shared components, plus
3 small Brief-page fixes), this part is split into lettered subtasks
below — same convention as Part 4b/5b/9b, but nested here since each
subtask is a slice of the same migration rather than a distinct feature.

**Suggested order:** 11a (shared components) first, since every other
screen embeds at least one of them and settling their color calls early
avoids re-deciding the same question per screen. 11b-11g (the individual
screens/areas) have no hard dependency on each other and can be done in
any order, including out of session order or by different sessions in
parallel. **11h (final sweep) must be last** — it re-greps for zero
remaining legacy references and deletes the compat shim, which only
makes sense once every other subtask has landed. Get the user's sign-off
after each subtask, not just at the end — same process convention as
every other part in this doc.

#### Part 11a — Shared components

Files: `components/ui/Avatar.tsx`, `components/ui/RoleBadge.tsx`,
`components/ui/Pagination.tsx`, `components/ContactModal.tsx`,
`components/ProposeBriefModal.tsx`, `components/PostModal.tsx`.

```
Read docs/design/brief-feature/two-ink-bold-plan.md in full before doing
anything else — §0 for why this was out of the original scope, §1.1 for
the token/semantic-color rules and contrast rule this part applies
retroactively, Part 11's intro for the text-live judgment-call warning
and the 2026-08-13 status update, Part 11a itself for this subtask's file
list. Don't skip straight to the steps below.

Build Part 11a (docs/design/brief-feature/two-ink-bold-plan.md, the "Part
11a" section) on its own branch, separate from the Two-Ink Bold Brief-page
work — this migrates the shared components consumed by every other
screen (Avatar, RoleBadge, Pagination, ContactModal, ProposeBriefModal,
PostModal) from the legacy base/warm/dark/text/soft/live/edge/card tokens
and font-serif onto the Two-Ink Bold tokens (§1.1).

1. Grep each of the 6 files listed above for the legacy token classes
   (bg-/text-/border-/ring-/etc + base/warm/dark/text/soft/live/edge/card,
   plus font-serif) to get each file's exact call sites.
2. Apply the direct mechanical swaps (bg-base→bg-paper, bg-warm→
   bg-paper-raised, text-dark→text-ink, text-soft→text-ink-soft,
   border-edge→border-line, bg-card→bg-paper-raised, font-serif→
   font-body).
3. For every text-live/bg-live/border-live/ring-live site, make a real
   per-instance call: blue (expert/verification-flavored), pink
   (creator/engagement-flavored), or neutral ink. RoleBadge in particular
   already has per-role color logic elsewhere in the app (see how role
   colors are handled on the Brief page's badges) — check whether that
   logic should inform this component's colors rather than picking fresh.
   Apply the blue/pink vs. blue-ink/pink-ink contrast rule (§1.1) to each.
4. These are the most widely-reused components in the scope — check every
   call site (grep each component's name) renders correctly after the
   change, not just one usage.

Verify: bunx tsc --noEmit && bun run lint clean, browser-check each
component in a page that uses it (directory for UserCard/QuoteCard's
Avatar+RoleBadge usage, admin for Pagination, a brief page for the three
modals) in both light and dark.
```

#### Part 11b — Landing, login, and home

Files: `app/page.tsx`, `app/login/page.tsx`, `app/home/page.tsx`.

```
Read docs/design/brief-feature/two-ink-bold-plan.md in full before doing
anything else — §0, §1.1, Part 11's intro (status update + judgment-call
warning), Part 11b itself for this subtask's file list. Don't skip
straight to the steps below.

Build Part 11b (docs/design/brief-feature/two-ink-bold-plan.md, the "Part
11b" section) on its own branch. Migrates the three public entry screens
(landing, login, home) from legacy tokens to Two-Ink Bold (§1.1). If Part
11a already landed, these screens should already be picking up its
updated Avatar/RoleBadge/Pagination — verify that's true rather than
re-doing that work here.

1. Grep the 3 files for legacy token classes (bg-/text-/border-/ring-/etc
   + base/warm/dark/text/soft/live/edge/card, plus font-serif).
2. Apply direct mechanical swaps per Part 11's mapping table.
3. Every text-live/bg-live/border-live/ring-live site needs a real
   per-instance call (blue/pink/neutral ink) — these screens are the
   site's front door and have no admin/expert framing, so lean toward
   neutral ink unless a specific element is clearly verification-flavored
   (blue) or engagement-flavored (pink); don't force every accent into
   one of the two brand colors.
4. app/page.tsx's hero and CTA buttons currently use text-live/bg-live
   heavily (brand accent) — this is the single highest-visibility
   judgment call in this subtask, flag your reasoning to the user
   explicitly rather than just shipping a choice.

Verify: bunx tsc --noEmit && bun run lint clean, browser-check all three
screens in both light and dark, logged-out and logged-in where relevant.
```

#### Part 11c — Apply flow

Files: `app/apply/page.tsx`, `app/apply/form-fields.tsx`,
`app/apply/rejected/page.tsx`, `app/apply/pending/page.tsx`.

```
Read docs/design/brief-feature/two-ink-bold-plan.md in full before doing
anything else — §0, §1.1 (especially §1.4's forms checklist — this
screen has real form inputs), Part 11's intro, Part 11c itself for this
subtask's file list. Don't skip straight to the steps below.

Build Part 11c (docs/design/brief-feature/two-ink-bold-plan.md, the "Part
11c" section) on its own branch. Migrates the application flow (form +
its two outcome pages) from legacy tokens to Two-Ink Bold (§1.1).

1. Grep the 4 files for legacy token classes (bg-/text-/border-/ring-/etc
   + base/warm/dark/text/soft/live/edge/card, plus font-serif).
2. Apply direct mechanical swaps per Part 11's mapping table.
   form-fields.tsx's focus-ring classes (focus:ring-live/30
   focus:border-live/50) are the most-repeated pattern in this
   subtask — convert once, confirm every input picks up the same
   treatment rather than converting each occurrence independently and
   risking drift.
3. Every text-live/bg-live/border-live/ring-live site needs a real
   per-instance call (blue/pink/neutral ink) — the submit button and any
   "required" markers are the most visible ones here.
4. Don't touch the form's validation logic, honeypot, or submission
   behavior (lib/applications/actions.ts) — this is a pure styling pass.

Verify: bunx tsc --noEmit && bun run lint clean, browser-check the form
(including an error state and the required-field markers), the pending
page, and the rejected page, in both light and dark.
```

#### Part 11d — Profile

Files: `app/profile/[id]/ProfileView.tsx`, `RoleDetails.tsx`,
`cards.tsx`.

```
Read docs/design/brief-feature/two-ink-bold-plan.md in full before doing
anything else — §0, §1.1, Part 11's intro, Part 11d itself for this
subtask's file list. Don't skip straight to the steps below.

Build Part 11d (docs/design/brief-feature/two-ink-bold-plan.md, the "Part
11d" section) on its own branch. Migrates the profile screen (view +
role-specific detail sections + activity cards) from legacy tokens to
Two-Ink Bold (§1.1). If Part 11a already landed, this screen's
Avatar/RoleBadge usage should already reflect it — verify rather than
re-converting.

1. Grep the 3 files for legacy token classes (bg-/text-/border-/ring-/etc
   + base/warm/dark/text/soft/live/edge/card, plus font-serif).
2. Apply direct mechanical swaps per Part 11's mapping table.
3. Every text-live/bg-live/border-live/ring-live site needs a real
   per-instance call. RoleDetails.tsx renders different content per role
   (creator/expert/organisation/journalist) — check whether any
   role-specific section has an obvious blue (expert/org) or pink
   (creator/journalist) framing before defaulting to neutral ink.
4. This is the same MOCK_PROFILES hardcoded-data caveat noted elsewhere
   in memory (mock-expert, mock-creator) — don't try to fix that as part
   of this styling pass, out of scope here.

Verify: bunx tsc --noEmit && bun run lint clean, browser-check a profile
of each of the 4 roles (or as many as test fixtures allow) in both light
and dark, plus the Edit Profile modal if it renders any of these files'
classes.
```

#### Part 11e — Directory

Files: `app/directory/DirectoryView.tsx`, `UserCard.tsx`, `QuoteCard.tsx`.

```
Read docs/design/brief-feature/two-ink-bold-plan.md in full before doing
anything else — §0, §1.1, Part 11's intro, Part 11e itself for this
subtask's file list. Don't skip straight to the steps below.

Build Part 11e (docs/design/brief-feature/two-ink-bold-plan.md, the "Part
11e" section) on its own branch. Migrates the directory (search/filter
header, people band, quotes band, both card types) from legacy tokens to
Two-Ink Bold (§1.1). If Part 11a already landed, UserCard/QuoteCard's
Avatar/RoleBadge usage should already reflect it.

1. Grep the 3 files for legacy token classes (bg-/text-/border-/ring-/etc
   + base/warm/dark/text/soft/live/edge/card, plus font-serif).
2. Apply direct mechanical swaps per Part 11's mapping table. Note
   DirectoryView.tsx's own comment at the "People band" div
   (`bg-warm` — update the comment text along with the class, it'll be
   stale otherwise).
3. Every text-live/bg-live/border-live/ring-live site needs a real
   per-instance call. QuoteCard.tsx is functionally the same card as the
   Brief page's already-migrated blue-accented quote card (Part 2) — check
   that component/its styling first and match its blue treatment here
   rather than inventing a new one, since these should look like the same
   card in two contexts.
4. The role-colored left border on UserCard (ROLE_BORDER) already exists
   as per-role logic — leave that mechanism alone, just confirm its color
   values are Two-Ink Bold tokens after the swap, not legacy ones.

Verify: bunx tsc --noEmit && bun run lint clean, browser-check the
directory with filters applied (both tabs: people and quotes) in both
light and dark.
```

#### Part 11f — Admin

Files: `app/admin/AdminScreen.tsx`, `app/admin/cards.tsx`,
`app/admin/cta-card.tsx`, `app/admin/faq-answer-card.tsx`,
`app/admin/briefs/[id]/EditBriefScreen.tsx`.

```
Read docs/design/brief-feature/two-ink-bold-plan.md in full before doing
anything else — §0, §1.1, Part 11's intro (specifically the 2026-08-13
status update noting cta-card.tsx and faq-answer-card.tsx are new since
the doc's original scope), Part 11f itself for this subtask's file list.
Don't skip straight to the steps below.

Build Part 11f (docs/design/brief-feature/two-ink-bold-plan.md, the "Part
11f" section) on its own branch. Migrates every admin screen (main
dashboard + all moderation card types + the brief editor) from legacy
tokens to Two-Ink Bold (§1.1). This is the largest subtask by file count —
consider whether it needs its own sign-off checkpoints per tab rather
than one at the end.

1. Re-grep app/admin/ specifically first (not just the 5 files listed —
   confirm no further admin surfaces were added since this subtask was
   written) for legacy token classes (bg-/text-/border-/ring-/etc +
   base/warm/dark/text/soft/live/edge/card, plus font-serif).
2. Apply direct mechanical swaps per Part 11's mapping table. cards.tsx,
   cta-card.tsx, and faq-answer-card.tsx share a near-identical card shell
   (border border-edge bg-card px-5 py-4) — convert that shared shape
   consistently across all three rather than three independent
   conversions that could drift.
3. Every text-live/bg-live/border-live/ring-live site needs a real
   per-instance call — admin is entirely internal/staff-facing, so most
   of these should probably land on blue (verification/moderation-
   flavored) or neutral ink rather than pink; flag any you think should
   be pink so the user can confirm that's intentional.
4. EditBriefScreen.tsx is the brief authoring UI, not the public brief
   page — its inputs/labels are admin chrome, style them accordingly
   (don't try to make them look like the public Two-Ink Bold brief
   sections).

Verify: bunx tsc --noEmit && bun run lint clean, browser-check
AdminScreen's every tab (applications, questions, contributions, brief
proposals, CTAs, FAQ answers — whatever's present) and the brief editor,
in both light and dark, using the admin test fixture if Part 9b has
landed (playwright/.auth/admin.json) or manual admin login otherwise.
```

#### Part 11g — Brief-page leftover remnants

Files: `app/briefs/[slug]/BriefView.tsx` (the logged-out "Members Only"
gate banner and the footer border only — not the rest of the file, which
is already Two-Ink Bold), `app/briefs/[slug]/qa.tsx` (the "Ask a
question" modal only), `app/briefs/[slug]/loading.tsx` (the skeleton).
**Explicitly excludes** `MediaCard` in `app/briefs/[slug]/
section-content.tsx` — that's dead code slated for deletion in Part 10,
not conversion here.

```
Read docs/design/brief-feature/two-ink-bold-plan.md in full before doing
anything else — §0, §1.1, Part 11's intro (specifically the 2026-08-13
status update explaining why the Brief page — supposedly already fully
migrated by Parts 0-6 — still has legacy remnants, and why MediaCard is
excluded), Part 11g itself for the exact scope. Don't skip straight to
the steps below.

Build Part 11g (docs/design/brief-feature/two-ink-bold-plan.md, the "Part
11g" section) on its own branch. Unlike 11a-11f, this subtask touches the
Brief page itself — three small, specific leftover spots that Parts 0-6
missed, not a new screen.

1. In app/briefs/[slug]/BriefView.tsx: convert the logged-out "Members
   Only" gate banner (the bg-dark card with the "Apply to Join" button,
   currently using text-live/bg-live) and the footer's border-edge to
   Two-Ink Bold tokens. The gate banner already sits on a dark background
   by design (bg-dark) — check whether that should become the Part 0
   dark-band wrapper/coverage-bg token instead of staying a one-off
   bg-dark, for consistency with Part 7's dark band if that's landed, or
   flag the question if Part 7 hasn't landed yet.
2. In app/briefs/[slug]/qa.tsx: convert the "Ask a question" modal
   (bg-base container, border-edge divider, text-live labels, the
   focus:ring-live/30 textarea, the bg-dark submit button) to Two-Ink
   Bold tokens.
3. In app/briefs/[slug]/loading.tsx: convert the skeleton's bg-edge
   pulse blocks and border-edge header rule to Two-Ink Bold tokens
   (paper-raised/line, matching whatever the loaded BriefView actually
   renders in those positions).
4. Do NOT touch MediaCard in section-content.tsx — leave it exactly as
   is, it's Part 10's job to delete it, not this subtask's job to migrate
   it.
5. Confirm via grep that these three files have zero remaining legacy
   token references when done (this subtask's scope is small enough to
   fully clear, unlike the larger screen subtasks which just need to be
   internally consistent).

Verify: bunx tsc --noEmit && bun run lint clean, browser-check the
Members Only gate as a logged-out visitor, the Ask a question modal as a
logged-in member, and the loading skeleton (throttle network or add a
temporary artificial delay to see it) — all in both light and dark.
```

#### Part 11h — Final sweep and shim removal

No new files of its own — this closes out the whole Part 11 migration.

```
Read docs/design/brief-feature/two-ink-bold-plan.md in full before doing
anything else — §0, §1.1, Part 11's intro and all of 11a-11g for what
should already be done. Don't skip straight to the steps below.

Build Part 11h (docs/design/brief-feature/two-ink-bold-plan.md, the "Part
11h" section) on its own branch. Requires 11a-11g all merged first — this
is the closing sweep, not parallelizable with the others.

1. Re-run the full-repo grep for legacy token classes (bg-/text-/border-/
   ring-/from-/to-/via-/divide-/outline-/decoration-/fill-/stroke-/
   placeholder-/caret-/accent- + base/warm/dark/text/soft/live/edge/card,
   plus font-serif) across app/ and components/. It should come back
   empty except for MediaCard in app/briefs/[slug]/section-content.tsx
   (dead code, Part 10's responsibility) — if MediaCard has already been
   deleted by the time this runs, the grep should be fully empty. Any
   other hit means a subtask missed something; fix it before proceeding,
   don't ship the shim removal with known stragglers.
2. Delete the compat shim block from app/globals.css (the base/warm/dark/
   text/soft/live/edge/card color tokens and the font-serif entry
   restored in PR #35) — confirm nothing outside app/ and components/
   (e.g. tests, scripts) references these class names first.
3. Full verification pass: bunx tsc --noEmit, bun run lint, and the full
   Playwright suite (bunx playwright test).
4. Browser-check the entire site — every screen touched across 11a-11g —
   in both light and dark, confirming nothing regressed to invisible-text
   territory (the original bug this whole part exists to fix).
5. Get the user's final sign-off across the whole site, not just
   part-by-part, same as Part 10 does for the Brief page.

Verify: as above — this subtask's own verification steps ARE the final
verification for all of Part 11.
```

---

## 4. Engineering conventions (apply throughout, not just once)

### General

- **Bun only** — `bun run lint`, `bunx tsc --noEmit`, `bunx playwright
  test`, never npm/npx/node (project CLAUDE.md).
- **RLS conventions**: match migration 017's shape exactly for every new
  table — public/members read split, service-role bypass for admin
  moderation, `updated_at` trigger via the existing `update_updated_at()`
  function, partial unique indexes where "one row per user per target"
  matters.
- **Migration numbering**: next is `018`. Check `supabase/`'s
  highest-numbered file before assuming a number — a parallel session may
  have already claimed it.
- **Regenerate `lib/database.types.ts`** after every migration:
  `bunx supabase gen types typescript --project-id kofimpjhjpgjotjanglq
  --schema public > lib/database.types.ts`.
- **Verify in-browser before calling any part done** — dev server via the
  `run` skill or `preview_start`. If a second session's dev server is
  already running against this repo directory, see the dev-server
  port-lock workaround in memory (`[[build_plan_dev_server_lock]]`)
  rather than assuming the feature is broken.
- **Every part needs the user's explicit sign-off, not just green
  CI** — this was an explicit process change requested mid-build on the
  original v2 rebuild and still applies here.

### react-best-practices (Vercel)

- **Parallelize independent queries** with `Promise.all` (already the
  pattern in `app/briefs/[slug]/page.tsx` — keep it that way as Parts
  2-8 add more queries; don't let a new per-section or per-part query
  turn into a sequential `await` chain — `async-parallel`).
- **`React.cache()` for repeated server-side lookups within one
  request** (`server-cache-react`) — this plan specifically creates a
  case for it: Part 1's brief-level review/endorse toggle and Part 3's
  per-section review/endorse toggle both need a section's current
  `content_version` to pin at write time, and the page render already
  fetched that same section data. Wrap the lookup (not the whole page
  query) in `cache()` so a toggle's server action doesn't re-query data
  the render already has, and be careful not to pass a fresh object
  literal as the cache key (shallow-equality gotcha — pass the section id
  as a primitive, not `{ sectionId }`).
- **Server components by default**; only mark a file `'use client'` when
  it genuinely needs interactivity (`Carousel`, the accordions, vote/
  endorse buttons, the CTA/Coverage submission forms — not the page shell
  around them).
- **Don't define components inside components**
  (`rerender-no-inline-components`) — worth calling out because the
  Carousel/accordion compound-component pattern in §1.3-§1.4 involves
  several small subcomponents; define `CarouselTrack`,
  `CarouselPrevButton`, etc. as top-level module exports, never as
  closures inside `CarouselProvider` to "access" its state (that's what
  the context is for).
- **Passive scroll listeners** on the Carousel
  (`client-passive-event-listeners`); one listener per carousel instance,
  not one per card.

### composition-patterns (Vercel)

- **Compound components over config-prop monoliths** — this is §1.3's
  Carousel spec, and applies again to the FAQ/Q&A accordion (Part 4-5)
  and any multi-piece CTA/Coverage card (Parts 6-7): if a component
  starts accumulating boolean or mode props to handle different contexts
  (`showVotes`/`showEndorse`/`isDark` etc.), that's the signal to split
  into explicit composed pieces instead, not add another prop.
- **Explicit variants over a growing prop surface** on any component that
  ends up needing genuinely different rendering per context (e.g. if the
  FAQ accordion and Q&A accordion turn out not to share enough to be one
  component with a `variant` prop) — prefer two small, clearly-named
  components over one component with several interacting props.
- **A single closed-set variant prop is fine for leaf/presentational
  components** — `Chip`'s `tone: 'blue' | 'pink' | 'default'` (§1.3) is
  not the anti-pattern the above two bullets warn about; that rule is
  about composite components accumulating *combinatorial* boolean state,
  not a simple one-of-three style switch on a presentational leaf.
- **Lift shared state into a provider**, not into the top of a component
  tree via prop-drilling or a ref passed down for children to read from
  — this is why the Carousel spec uses `CarouselProvider` +
  `use(CarouselContext)` rather than a `carouselRef` prop threaded
  through Prev/Next buttons.
- **React 19: no `forwardRef`, `use()` not `useContext()`** — see the
  note at the end of §1.3.

### Accessibility (AccessLint skills + web-design-guidelines)

- §1.4 above is the curated checklist — apply it as you build, not as a
  retrofit at the end.
- The AccessLint skills installed so far (`accessibility-audit`,
  `-scan`, `-inspect`, `-fix`, `-diff`) are the **static methodology and
  checkpoint references only** — the MCP server that actually drives a
  live rule engine and a real Chrome instance (`@accesslint/mcp`) is
  **not installed**. Don't reference `accessibility-scan`/`-inspect` as
  something a session can just run; check first whether the MCP server
  has been added since this doc was written (ask the user), and if not,
  do a manual pass against §1.4 and the `web-design-guidelines` skill
  instead.
- The contrast fix in §1.1 (`ink-faint`, and the `blue`/`pink` vs.
  `-ink` text-color rule) was computed by hand against the WCAG 2.1
  contrast formula specifically because the live tool wasn't available —
  re-verify it with `accessibility-scan` once that server exists, rather
  than trusting hand-computed numbers indefinitely.

### frontend-design (Anthropic) — a guardrail, not new work

This skill already did its job in the mock (avoiding generic-AI-default
aesthetics — no Inter, no purple gradients, no rounded-lg-everywhere).
Its relevance to *this* plan is narrower: don't let individual parts
regress toward those defaults while porting the mock into real
components — e.g. don't fall back to a system sans-serif stack if
`IBM_Plex_Sans` fails to load correctly in Part 0, fix the font loading
instead; don't "simplify" the Carousel's edge-fade/duotone-placeholder
treatment away because it's more code than a plain grid, that
distinctiveness was a deliberate, reviewed decision.
