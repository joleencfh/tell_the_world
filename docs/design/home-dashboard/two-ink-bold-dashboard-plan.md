# Home dashboard — Two-Ink Bold rebuild: development plan

**Status: draft, not started.** Brings `app/home/` up to the same Two-Ink
Bold visual language as the Brief page, and adds two new sections
(Highlighted, This Week) that didn't exist before. Purely additive to the
design system — no new tokens, no new color, no new fonts. If any part
below finds itself needing a new token or a third accent color, stop and
confirm with the user first; that was an explicit constraint during design
(see §0).

## How to use this

Same convention as `two-ink-bold-plan.md` and `brief-page-part2-plan.md`:
each part is independently buildable and has a ready-to-paste "prompt for
next session" block. Parts are ordered so nothing depends on a part that
comes after it. **Part 0 is a hard prerequisite for Parts 2–5** (shared
primitives). Every part needs the user's explicit sign-off before being
considered done, not just green `tsc`/lint — same process as both prior
plans.

---

## 0. Where this comes from

Designed 2026-08-30 across one conversation, entirely as a mockup — no
app code was touched. The process: build a static HTML mock reusing the
Brief page's real tokens/components, publish it as an Artifact, iterate
with the user round by round. That artifact is the **canonical visual
reference** for this plan, same role the "AI Race — Brief (Two-Ink Bold)"
artifact played for the original Brief page rebuild:

- **Visual reference (build against this):** "Two-Ink Bold Dashboard", a private claude.ai artifact.
  Ask the user for the current link.
- Decisions transcribed below so a session doesn't strictly need the
  artifact to start, but the artifact is the tie-breaker for anything
  ambiguous, especially exact spacing/sizing (the mock's CSS values are
  literal enough to read off directly).

### What's actually wrong today (confirmed by live comparison, not guessed)

`app/home/page.tsx` is the only major screen that never went through the
Two-Ink Bold migration (`two-ink-bold-plan.md` Part 11's sitewide sweep
covered Directory, Profile, Admin — Home's Story on that epic was marked
done for *token* migration only, not layout). Concretely, today's Home
page:

- Uses `rounded-xl`/`rounded-full` on every card and chip. Two-Ink Bold
  uses sharp corners everywhere except pills that are semantically a
  badge, avatar, or icon button.
- Uses raw Tailwind stock colors for status/type chips
  (`bg-amber-100`, `bg-red-100`, `bg-green-100`, `bg-purple-100`,
  `bg-blue-100`) — zero uses of the real tokens (`blue`/`blue-soft`/
  `blue-ink`, `pink`/`pink-soft`/`pink-ink`) anywhere in the file.
- Has no numbered/tone-colored section markers, no top-accent-color
  borders, no carousels (Active Briefs and Recent Posts are static CSS
  grids), no entrance animation (`anim-rise` exists sitewide, unused
  here).
- Has only two real sections beyond the hero (Active Briefs, Recent
  Posts) plus two small ones (Your Proposals, Recently Joined) — thin
  compared to the rest of the site, and the user explicitly asked for
  more to look at.

### What this plan adds, and why each piece is shaped the way it is

- **Highlighted module.** A single featured brief pulled forward with
  its own selected quotes and press coverage attached, instead of
  making the reader go find them — three subsections (Overview /
  Selected Quotes / Covered By) behind a tab bar that **slides** between
  them (a real sliding track, translateX-based, not a crossfade), all
  three sharing one background so the slide never jumps color. Chrome:
  **Shadow Block** — a solid blue rectangle offset behind the frame,
  poster-style — was chosen by the user from three options shown (Blue
  Frame, Blue Card, Shadow Block) specifically to make this module
  "pop" more than a plain bordered card would. One label only: a blue-
  filled "Spotlight" chip sits as the section's eyebrow (replacing the
  plain "Highlighted" text) — the redundant duplicate tag that
  originally sat inside the card was removed.
- **Covered By cards inside Highlighted have no score badge.** The
  Brief page's own `CoverageCard` (`app/briefs/[slug]/coverage.tsx`)
  already dropped its score display in `brief-page-part2-plan.md` Part
  9 — `brief_coverage.score` still exists as an admin-set data column,
  it's just never rendered. Match that: if Part 3 below reuses
  `CoverageCard` directly, this is already true with no extra work; if
  it builds a dashboard-local card instead, explicitly do not add a
  score element to it.
- **This Week.** One chronological river mixing internal items (new/
  updated briefs, quotes) with external items (press coverage, posts
  linking out) instead of splitting them into separate feeds — each row
  tagged (Brief/Quote/Coverage/External) with the same square mono chip
  language used elsewhere, plus a small thumbnail on external/coverage
  rows.
- **No numbered section markers on the dashboard**, unlike the Brief
  page. Deliberate: on the Brief page, sections are read in a fixed
  narrative order, so `01`/`02`/`03` communicates real sequence.
  Dashboard modules are scanned independently — numbering them would
  imply an order that isn't real. Keep the family resemblance (mono
  eyebrow, hairline rule, tone-colored square dot, 4px top-accent
  border) without the numerals.
- **Personalized hero line** ("Two briefs you're following were updated
  this week, and a new mention of your beat landed in Wired.") needs a
  real query, detailed in Part 2 — there is no "follow a brief" feature
  today, so this is built off signals that already exist
  (`brief_contributions`, `questions`, `brief_proposals`), not a new
  table.
- **Mock "attached images."** The user asked for cover images on cards,
  especially external/coverage ones, since real photos aren't wired up
  anywhere in this schema yet. The mock uses deterministic gradient
  tiles — same idea as the site's existing `DuotonePlaceholder`
  (`components/ui/DuotonePlaceholder.tsx`), just applied to more card
  types. Part 0 below turns this into a proper shared component instead
  of copy-pasted inline gradients.
- **No em dashes** in any dashboard copy (titles, subtitles, section
  descriptions, mock body text) — matches the sitewide copy convention
  already in place since the Privacy Policy/Contact Form work (2026-08-
  30). Applies to user-visible strings only, not code comments.

### Explicitly out of scope for this plan

- **A real "follow a brief/topic" feature.** Part 2's hero personalization
  uses existing engagement signals as a proxy (see that part). Building
  a dedicated follow/bookmark feature is a separate, larger decision —
  flag it to the user if the proxy signals feel too thin once this ships,
  don't scope-creep it in here.
- **A third accent color.** Every "more color" request during design was
  resolved by using `blue`/`pink` more fully (full-strength fills, the
  `paper-sunken-blue` wash, gradient thumbnails), specifically so this
  plan doesn't have to make a sitewide color-system decision. If a
  future session wants to open that question, that's a deliberate,
  separate call — not something to slip in while building a part below.
- **Real outlet/post photography.** The gradient thumbnails (Part 0)
  are the whole answer for now — no image upload/CDN work here.

---

## 1. Engineering conventions

Identical to `two-ink-bold-plan.md` §4 and `brief-page-part2-plan.md`
§1 — re-read both, don't assume you remember them. What matters most for
this plan specifically:

- **Bun only.**
- **Migration numbering**: next is `057` as of this writing (highest on
  `origin/master` is `056_user_role_comms_specialist_and_other.sql`).
  Check the actual highest-numbered file in `supabase/` right before
  opening a PR — this repo has hit real numbering collisions before from
  a stale assumption not being re-checked at PR time.
- **Regenerate `lib/database.types.ts`** after any migration:
  `bunx supabase gen types typescript --project-id kofimpjhjpgjotjanglq --schema public > lib/database.types.ts`.
- **This page is a server component today** (`app/home/page.tsx` fetches
  via `Promise.all` server-side, no client-side data fetching). Keep it
  that way for the new sections — Highlighted and This Week are both
  read-only for v1, no reason to introduce client fetching. The sliding
  tab track and carousel buttons are the only client-side pieces, same
  split the Brief page already uses (server-rendered content, small
  client islands for interaction).
- **Reuse before rebuilding.** Several pieces this plan needs already
  exist and should not be duplicated: `components/ui/Carousel.tsx`
  (compound component, Provider/Track/PrevButton/NextButton),
  `components/ui/Avatar.tsx`, `components/ui/RoleBadge.tsx`,
  `components/ui/DuotonePlaceholder.tsx`, the Brief page's
  `SectionHeader`/`HeaderChip` (`app/briefs/[slug]/section-content.tsx`),
  and its data layer (`lib/data/briefs.ts`, `lib/data/posts.ts`,
  `lib/data/coverage.ts`, `lib/data/contributions.ts` — see Part 3/4 for
  exactly which functions). Read the existing component/function before
  writing a new one; only add what's genuinely missing.
- **Verify in-browser before calling any part done.** If a second
  session's dev server is already running against this repo directory,
  see `[[build_plan_dev_server_lock]]` memory rather than assuming a
  feature is broken. The cookie-injection technique from
  `playwright/.auth/*.json` (used throughout the Two-Ink Bold rebuild to
  get an authenticated session in the preview browser) works here too.
- **Every part needs the user's explicit sign-off, not just green CI.**
- **This is a shared working directory.** Check `git status`/
  `git branch --show-current` before assuming the tree matches what you
  last saw.

---

## 2. Part-by-part build order

### Part 0 — Shared primitives

**Depends on:** nothing. **Blocks:** Parts 2–5 (all of them use at least
one piece built here).

Small, mechanical, no design judgment — the artifact already answers
every visual question, this part just turns the artifact's inline CSS
into real components/utilities.

1. **`Thumb` / cover-image component** (new, `components/ui/`, or extend
   `DuotonePlaceholder.tsx` in place — read that file first and prefer
   extending it over creating a sibling component if its API can take a
   `variant` prop cleanly). Deterministic gradient tile keyed by a
   stable id (brief id, post id, coverage id), 4–5 gradient variants
   mixing only `blue`/`pink`/`ink` (see the artifact's `.thumb-a`
   through `.thumb-e` for the exact gradient stops), plus the existing
   halftone-dot overlay treatment. Needs to render at multiple sizes
   (full-width card header ~90px, square row icon ~36px, coverage-card
   icon ~56px) — a `className`/`style` passthrough is enough, don't
   over-engineer a size-variant prop system for three call sites.
2. **Card "open" icon button** (new, small — a `CardGoLink` component or
   just a shared class if this codebase prefers Tailwind-only patterns
   for something this small, check `components/ui/` for precedent
   either way). A square icon-only link, `→` for internal navigation,
   `↗` for external, `aria-label` required (no visible text) — see the
   artifact's `.card-go` for exact sizing/border/hover treatment. Used
   on Active Briefs cards and From Your Network cards (Part 5).
3. **Dashboard section header** (new — a lighter sibling to the Brief
   page's `SectionHeader`, not a modification of it: this one has no
   numeral, since dashboard sections aren't a narrative sequence — see
   §0's note above). Props: `label` (mono eyebrow text), `tone`
   (`'ink' | 'blue' | 'pink'`, colors the small square dot and the
   section's 4px top border), `title`, `description?`, `action?`
   (trailing button/link slot, mirrors the Brief page pattern). Read the
   artifact's `.dash-head`/`.eyebrow` for the exact markup shape.
4. **Blue "Spotlight" chip** (new, tiny — could be a `tone="blue"` fill
   variant on the Brief page's existing `HeaderChip`
   (`section-content.tsx`) rather than a new component; check whether
   `HeaderChip` can take a filled-background variant cleanly before
   building a separate one). Solid `blue` background, `paper` text,
   mono, small, star glyph before the text. Used once, as the
   Highlighted section's eyebrow (Part 3) — not inside the card.
5. **Shadow-block frame utility** (new — a wrapper `div`/class, not a
   full component, this is pure CSS). A relatively-positioned wrapper
   with a `::before` pseudo-element offset `translate(10px, 10px)` in
   solid `blue`, sized to match its sibling frame via `inset: 0`, plus
   `padding: 0 10px 10px 0` on the wrapper itself so the offset block
   doesn't collide with whatever follows it in the page. See the
   artifact's `.spotlight-wrap.variant-shadow` for the exact rule —
   this is the only chrome variant being built (Blue Frame and Blue
   Card were comparison options during design, not shipped).
6. **Sliding tab track** (new, client component — small, this doesn't
   need the full `Carousel` compound-component machinery since it's
   button-driven, not scroll/drag-driven). A `flex` track with children
   at `flex: 0 0 100%`, `overflow: hidden` on its wrapper, transform-
   based `translateX` on tab click, `transition: transform` respecting
   `prefers-reduced-motion` (drop the transition, not the transform, so
   reduced-motion users still land on the right pane instantly). See
   the artifact's `.spot-viewport`/`.spot-track`/`.spot-pane` and its
   `wireCarousel`-adjacent tab-click JS for the reference implementation
   — this is a fairly direct port, the mock's version already works
   correctly including the reduced-motion case.

#### Prompt for next session — Part 0

```
Read docs/design/home-dashboard/two-ink-bold-dashboard-plan.md in full
before doing anything else — §0 for context and the visual reference
artifact link, §1 for engineering conventions. Also open the artifact
("Two-Ink Bold Dashboard"; ask the user for the current link) and read its
source directly for exact CSS values — this plan describes the shapes,
the artifact has the literal numbers.

Build Part 0 (docs/design/home-dashboard/two-ink-bold-dashboard-plan.md
§2, Part 0) — five small shared primitives, no page changes yet.

1. Extend components/ui/DuotonePlaceholder.tsx (read it first) or add a
   sibling Thumb component: deterministic gradient tile keyed by a
   stable id, 4-5 variants mixing only the blue/pink/ink tokens (match
   the artifact's .thumb-a through .thumb-e gradient stops exactly),
   halftone-dot overlay like the existing component already has. Must
   render cleanly at ~36px, ~56px, and full-card-width ~90px-tall sizes.
2. Add a small icon-only "card open" link/button: -> for internal, ->
   (arrow variant) for external, aria-label required, no visible text.
   Match the artifact's .card-go sizing/border/hover treatment. Check
   components/ui/ for an existing similar pattern before adding a new
   file.
3. Add a dashboard-specific section header (do not modify the Brief
   page's SectionHeader in section-content.tsx — this is a sibling with
   no numeral). Props: label, tone ('ink'|'blue'|'pink'), title,
   description (optional), action (optional trailing slot). Tone colors
   both a small square dot and the section's 4px top border.
4. Check whether HeaderChip (section-content.tsx) can take a filled
   variant (solid blue background, paper text) — if yes, extend it
   rather than adding a new component; if the coupling is too tight,
   add a small standalone chip. This is used exactly once, as the
   Highlighted section's eyebrow.
5. Add the shadow-block frame CSS utility (wrapper + ::before offset
   block in solid blue) per the artifact's .spotlight-wrap.variant-
   shadow rule.
6. Build a small client component for a sliding tab track (flex
   children at flex:0 0 100%, overflow:hidden wrapper, translateX on
   tab click, transition respecting prefers-reduced-motion). Port the
   artifact's .spot-viewport/.spot-track logic directly rather than
   redesigning it — it already handles the reduced-motion case
   correctly.

This part has no page to browser-check yet (nothing wires these in).
Verify: bunx tsc --noEmit && bun run lint clean. Get the user's sign-off
on component APIs/props before Parts 2-5 start consuming them, since a
prop-shape change later would touch multiple call sites at once.
```

---

### Part 1 — Data layer: featured brief, and the This Week feed

**Depends on:** nothing structurally, but do this before Parts 3/4 since
they consume it directly.

Two genuinely new pieces of data-plumbing. Neither existed before this
plan — everything else the dashboard needs (`getRecentBriefs`,
`getUserBriefProposals`, `getPostsByAuthors`, `getEndorsementBar`,
`getQuotesForBrief`, `getPublishedCoverage`) already exists in
`lib/data/` and should be reused as-is in Parts 2–5, not rebuilt.

1. **How the Highlighted brief gets chosen.** No "featured brief"
   concept exists anywhere in the schema today (checked — the only
   near-hits are the unrelated `featured_news` legacy section type from
   migration 017, and `brief_ctas.display_order` which is a different
   table entirely). Two real options:
   - **(a) Admin-curated** — a new nullable `briefs.dashboard_featured`
     boolean (partial unique index enforcing at most one `true` row),
     admin toggles it from the existing brief editor
     (`app/admin/briefs/[id]/EditBriefScreen.tsx`). Simple, predictable,
     matches the existing pattern of admin-set editorial fields
     (`brief_coverage.score`, `brief_ctas.display_order`).
   - **(b) Personalized** — pick per-user from briefs matching the
     user's engaged topics (same signal source as Part 2's hero line),
     most-recently-updated first. More relevant per-user, more complex,
     and every user with no engagement history yet needs a fallback
     anyway (probably falling back to (a) regardless).
   - **Recommendation: build (a) for v1**, and treat (b) as a documented
     future upgrade rather than blocking this part on it — but confirm
     with the user before committing, this is exactly the kind of call
     the two prior plans flag rather than silently pick.
2. **This Week feed.** No existing table shape fits — `analytics_events`
   (migration 053) was checked and rejected: it's an admin-only user-
   behavior log (logins, clicks, views), not a content-publish log, and
   it's RLS-gated to service-role reads only. Build a new data-layer
   function instead, e.g. `getThisWeekActivity(db, limit)` in a new
   `lib/data/activity.ts`, that queries the existing tables directly and
   merges results by `created_at`:
   - New briefs: `briefs` where `created_at` within the window.
   - Updated briefs: `briefs` where `updated_at` within the window and
     `updated_at` is meaningfully after `created_at` (avoid a
     brand-new brief showing up twice as both "new" and "updated").
   - New quotes/posts: `content_posts` where `status = 'published'` and
     `created_at` within the window — `url` present distinguishes an
     "External" row from an internal "Quote" row (matches the artifact's
     two tag types).
   - New coverage: `brief_coverage` where `status = 'published'` and
     `created_at` within the window (reuse `getPublishedCoverage`'s
     query shape from `lib/data/coverage.ts` rather than re-deriving the
     visibility rule).
   Merge and sort by `created_at` descending in application code (four
   small queries + an in-memory merge is simpler and clearer than one
   `UNION` across differently-shaped tables), cap to `limit` after
   merging. Pick a window (7 days matches the section's "This Week"
   label — don't silently pick a different number).

#### Prompt for next session — Part 1

```
Read docs/design/home-dashboard/two-ink-bold-dashboard-plan.md in full
before doing anything else — §0 for context, §1 for engineering
conventions.

Build Part 1 (docs/design/home-dashboard/two-ink-bold-dashboard-plan.md
§2, Part 1) — no UI changes, data layer only.

1. Ask the user to confirm option (a) from this part's write-up
   (admin-curated dashboard_featured boolean) before building — don't
   silently assume. Once confirmed: migration adding a nullable
   dashboard_featured boolean to briefs, with a partial unique index
   (`where dashboard_featured`) so at most one brief can be true at a
   time. Add a toggle to app/admin/briefs/[id]/EditBriefScreen.tsx (read
   its existing field patterns first) and a getFeaturedBrief(db) query
   to lib/data/briefs.ts returning the brief_id (or null if none set —
   Part 3 needs to handle that gracefully, not crash or render an empty
   module).
2. New file lib/data/activity.ts: getThisWeekActivity(db, limit). Query
   briefs (new + updated, distinguishing the two per this part's write-
   up), content_posts (published, within a 7-day window, url presence
   distinguishes External from Quote), and brief_coverage (reuse
   getPublishedCoverage's visibility shape from lib/data/coverage.ts)
   each within the same 7-day window, merge by created_at descending in
   application code, cap to `limit`. Return a discriminated-union type
   (kind: 'brief_new' | 'brief_updated' | 'quote' | 'external' |
   'coverage') so the UI in Part 4 can render each row type without
   re-deriving what it is from raw fields.

Verify: bunx tsc --noEmit && bun run lint clean. No browser check yet
(nothing renders this until Parts 3/4) — instead, write a throwaway
script or a quick check against scripts/seed-mock-data.ts's seeded data
to confirm getThisWeekActivity returns a sensibly-ordered, correctly-
typed mixed feed, then delete the throwaway check before merging.
```

---

### Part 2 — Hero

**Depends on:** Part 0 (none of its primitives, actually — this part is
independent of Part 0 too; listed after it only for numbering
continuity). **Depends on Part 1:** no.

1. **Remove** the "Member Since Mar 2026" meta text from the hero's
   right-aligned eyebrow slot entirely (the user's call — it belongs on
   the profile page, not repeated here). Remove the right-aligned slot
   altogether rather than leaving it empty; the eyebrow is just the
   dot + "Dashboard" label now.
2. **Remove** the "View All Briefs" secondary link from the hero CTA
   row. Keep the solid "Browse Directory" button.
3. **Personalized digest line**, replacing the current absence of any
   dynamic hero subtext. Build `getHeroDigest(db, userId)` in
   `lib/data/home.ts` (new file, or add to an existing one if a home-
   specific data file already exists by the time this is built — check
   first):
   - "Which briefs count as yours": briefs the user has a
     `brief_contributions` row on (reviewed/endorsed — reuse
     `getMyContributionStatus`'s query shape from
     `lib/data/contributions.ts`), has asked a `questions` row about, or
     has a `brief_proposals` row for. No new table.
   - "What counts as updated": a `brief_sections`, `brief_coverage`, or
     `brief_ctas` row on one of those briefs with `created_at`/
     `updated_at` newer than a 7-day rolling window (there is no
     `users.last_seen_at` to compare against yet — don't add one just
     for this, the rolling window is an accepted approximation).
   - Compose the sentence with a small template function, not a single
     hardcoded string — and handle every count, not just the "some
     updates" case shown in the mock:
     - Zero engaged briefs → no specific claim, just "Welcome back" (no
       second sentence) — never fabricate activity that didn't happen.
     - One or two updates → name them, roughly the mock's phrasing
       ("Two briefs you're following were updated this week...").
     - Many updates → a rollup ("5 things changed since your last
       visit") instead of naming all of them.
   - The "landed in Wired"-style flourish is optional color, not a
     load-bearing claim: only include it when there's an actual
     `brief_coverage` row in the window on one of the user's engaged
     briefs; drop that clause entirely otherwise rather than reaching
     for a generic filler phrase.

#### Prompt for next session — Part 2

```
Read docs/design/home-dashboard/two-ink-bold-dashboard-plan.md in full
before doing anything else — §0 for context, §1 for engineering
conventions.

Build Part 2 (docs/design/home-dashboard/two-ink-bold-dashboard-plan.md
§2, Part 2) — app/home/page.tsx's hero block.

1. Remove the hero eyebrow's right-aligned "Member Since..." text and
   its wrapping slot.
2. Remove the "View All Briefs" link from the hero CTA row, keep
   "Browse Directory".
3. Add getHeroDigest(db, userId) — check for an existing lib/data/
   home.ts before creating one. Determine engaged briefs via
   brief_contributions (mirror getMyContributionStatus's query shape in
   lib/data/contributions.ts), questions, and brief_proposals (no new
   tables). Determine "updated" via a 7-day window on brief_sections/
   brief_coverage/brief_ctas created_at or updated_at for those briefs.
   Compose the hero subtext with a template function handling: zero
   updates (no second sentence, don't fabricate), one-two updates (name
   them), many updates (a rollup count instead of naming all). Only add
   an outlet-name flourish when a real brief_coverage row exists in the
   window - never a generic filler phrase.

Verify: bunx tsc --noEmit && bun run lint clean, browser-check with a
seeded user who has zero engagement (confirm no fabricated claims), one
with a couple of recent updates (confirm correct phrasing), and if
feasible seed a user with 5+ updates to confirm the rollup phrasing
triggers correctly rather than listing everything.
```

---

### Part 3 — Highlighted module

**Depends on:** Part 0 (all six primitives), Part 1 step 1 (featured
brief selection).

1. **Section wrapper**: use Part 0's dashboard section header
   (`label="Highlighted"`... no — re-check the artifact: the label text
   itself is the blue "Spotlight" chip, there is no separate mono
   eyebrow line above it for this one section, unlike every other
   section on the page. Pass the chip as this section's header content
   directly rather than trying to force it through the generic eyebrow
   slot built in Part 0 step 3 — the artifact's markup literally
   replaces the eyebrow with the chip for this section only, it isn't a
   `tone` variant of the same slot.) `title="This brief is worth your
   time"`, `description="One brief, pulled forward with the quotes and
   press coverage already attached, instead of asking you to go find
   them."` (no em dash — already fixed in the artifact, don't
   regress it when transcribing).
2. **Data**: call `getFeaturedBrief` (Part 1). If none is set, do not
   render the Highlighted section at all — same "additive, no empty-
   state chip" convention the Brief page already uses for Quotes/
   Related Briefs when there's nothing to show. If one is set, fetch in
   parallel: the brief's TL;DR content (reuse
   `getBriefWithSectionsBySlug`'s shape or a lighter query if that one
   over-fetches for this context — your call, but don't duplicate the
   TL;DR-parsing logic that already exists for the real Brief page),
   `getEndorsementBar` (reviewed/endorsed counts), `getQuotesForBrief`
   (limit 2, matches the mock), `getPublishedCoverage` (limit 2).
3. **Frame**: Part 0's shadow-block wrapper. Inside it: brief title,
   the reviewed/endorsed + read-time + topic-tag meta chips (reuse the
   Brief page's `HeaderChip` styling, not new markup), a "Read full
   brief →" link to `/briefs/[slug]`.
4. **Tabs**: Overview / Selected Quotes / Covered By, driving Part 0's
   sliding track. Overview renders the TL;DR bullets (same list markup
   as the real TL;DR section, reused not rebuilt). Selected Quotes
   renders up to 2 `QuoteCard`s — check whether `QuoteCard`
   (`section-content.tsx`) can be imported and reused directly before
   building a dashboard-local copy; it's the same visual card in the
   mock. Covered By renders up to 2 coverage cards — same reuse check
   against `CoverageCard` (`app/briefs/[slug]/coverage.tsx`).
   **Whichever way this goes (reused component or dashboard-local
   copy), the rendered card must not show a score badge** — `
   CoverageCard` already omits it (Part 9 of `brief-page-part2-plan.md`
   removed it there), so reuse gets this for free; a dashboard-local
   copy must deliberately leave it out.
5. All three panes render on the section's one shared background (no
   per-pane wash/dark-band — that was explicitly removed during design
   so the slide never jumps color). Quote/coverage cards keep their own
   accent borders (blue top-border for quotes, pink top-border for
   coverage) for at-a-glance differentiation instead.

#### Prompt for next session — Part 3

```
Read docs/design/home-dashboard/two-ink-bold-dashboard-plan.md in full
before doing anything else — §0 for context and the artifact link, §1
for engineering conventions. Confirm Part 0 and Part 1 step 1 have
landed first.

Build Part 3 (docs/design/home-dashboard/two-ink-bold-dashboard-plan.md
§2, Part 3) — new Highlighted section in app/home/page.tsx (or a new
app/home/highlighted.tsx if the file is getting long — check line count
against this repo's max-lines lint rule before deciding).

1. Call getFeaturedBrief — if null, render nothing for this section
   (same convention as the Brief page's empty-state handling for
   Quotes/Related Briefs, no placeholder chip).
2. If set, fetch in parallel: TL;DR content, getEndorsementBar counts,
   getQuotesForBrief (limit 2), getPublishedCoverage (limit 2).
3. Render inside Part 0's shadow-block frame: title, meta chips (reuse
   HeaderChip styling), "Read full brief ->" link. The section's own
   header is the blue filled "Spotlight" chip from Part 0 step 4 -
   there's no separate plain-text eyebrow above it for this section,
   check the artifact's markup before assuming the generic dashboard
   section header slot fits here unchanged.
4. Wire Part 0's sliding tab track to three panes: Overview (TL;DR
   bullets), Selected Quotes (up to 2 cards - check whether QuoteCard
   from section-content.tsx can be imported directly before building a
   dashboard-local version), Covered By (up to 2 cards - same reuse
   check against CoverageCard in app/briefs/[slug]/coverage.tsx). All
   three panes share one background, no per-pane color wash.
5. Confirm whichever coverage card path you took does not render a
   score badge - CoverageCard already omits it (see this plan's §0), a
   dashboard-local copy must deliberately leave it out too.

Verify: bunx tsc --noEmit && bun run lint clean, browser-check: a user
with no dashboard_featured brief set sees no Highlighted section at all,
a seeded brief with quotes+coverage shows the full module, tab clicks
slide smoothly between panes (and jump instantly under
prefers-reduced-motion), no score is visible anywhere in the Covered By
pane.
```

---

### Part 4 — This Week

**Depends on:** Part 0 (Thumb component), Part 1 step 2
(`getThisWeekActivity`).

1. Section wrapper: Part 0's dashboard section header, `tone="pink"`,
   `label="This Week"`, `title="What moved since Monday"`,
   `description="Brief updates and outside coverage, in the order they
   happened, not split into separate feeds."` (no em dash).
2. Render `getThisWeekActivity`'s rows as a list (not a carousel — this
   one reads top-to-bottom, matches the mock). Each row: date (mono,
   tabular-nums), a type chip (Brief/Quote/Coverage/External, square
   mono, colors per the artifact's `.week-tag` rules), title + optional
   one-line description, and for External/Coverage rows only, a small
   Thumb (Part 0) at ~36px. Brief/Quote rows get no thumbnail (no
   external media attached to purely-internal editorial content — this
   is a deliberate distinction, not a missing feature).
3. Row background: a faint tint by type (`blue` wash for Quote rows,
   `pink` wash for External/Coverage rows, no tint for Brief rows) per
   the artifact's `--blue-wash`/`--pink-wash` low-opacity tokens — these
   are new CSS custom properties the artifact defines
   (`rgba(30,79,235,.05)` / `rgba(240,25,126,.05)`), not existing site
   tokens; add them to `app/globals.css`'s token block alongside the
   rest rather than inlining raw `rgba()` values in this component.
4. Each row links out: internal rows (Brief/Quote) go to `/briefs/
   [slug]`, External/Coverage rows open the source `url` in a new tab
   (real `<a>`, not a `<button onClick>` — matches the Brief page's
   existing external-link convention).
5. Empty state: if `getThisWeekActivity` returns zero rows, don't
   render the section (same convention as Highlighted/Quotes/Related
   Briefs elsewhere).

#### Prompt for next session — Part 4

```
Read docs/design/home-dashboard/two-ink-bold-dashboard-plan.md in full
before doing anything else — §0 for context, §1 for engineering
conventions. Confirm Part 0 and Part 1 step 2 have landed first.

Build Part 4 (docs/design/home-dashboard/two-ink-bold-dashboard-plan.md
§2, Part 4) — new This Week section in app/home/page.tsx.

1. Add --blue-wash/--pink-wash tokens to app/globals.css's token block
   (rgba(30,79,235,.05) / rgba(240,25,126,.05) per the artifact) rather
   than inlining raw rgba values in the component.
2. Render getThisWeekActivity's rows as a plain top-to-bottom list
   (not a carousel). Each row: tabular-nums date, a square mono type
   chip colored per kind (match the artifact's .week-tag rules exactly
   for brief/quote/coverage/external), title + optional description,
   and — External/Coverage rows only — a ~36px Thumb from Part 0. Tint
   each row's background by type per this part's write-up.
3. Internal rows (brief_new/brief_updated/quote) link to /briefs/
   [slug]; external rows (external/coverage) render a real <a
   target="_blank" rel="noopener noreferrer"> to the source url.
4. If getThisWeekActivity returns zero rows, render nothing for this
   section.

Verify: bunx tsc --noEmit && bun run lint clean, browser-check: mixed
feed renders in the right chronological order, external links open in a
new tab with noopener/noreferrer, a brand-new brief with no updates yet
shows correctly as brief_new only (not double-counted as updated too —
this was flagged as an edge case in Part 1, confirm it's actually
handled here).
```

---

### Part 5 — Restyle the existing sections

**Depends on:** Part 0 (Thumb, card-go icon button, dashboard section
header).

Restyle, not redesign — every section below already exists and works,
this part only changes its visual treatment to match Two-Ink Bold.

1. **Active Briefs**: convert the static grid to `components/ui/
   Carousel.tsx` (compound component, already built and used elsewhere
   — don't build a second carousel implementation, Part 0 step 6's
   sliding track is a different, simpler thing for exactly-3-fixed-
   panes and isn't a substitute for this variable-length list). Cards
   get sharp corners, a neutral (`ink`) top-accent border, a Thumb
   header image, and end in Part 0's card-go icon button (`→`, internal)
   instead of a "Read brief →" text link.
2. **From Your Network** (currently "Recent Posts"): same carousel
   conversion, `blue` top-accent border, wrap the whole carousel in the
   `paper-sunken-blue` wash (existing token, mirrors the Brief page's
   own Quotes band treatment — this section is expert/org content,
   which is blue's established meaning sitewide). Two of three cards
   get a Thumb (not all — the mock deliberately left one text-only,
   since not every post has an attached image), all three end in the
   card-go icon button (`↗`, external, `tone="blue"`).
3. **Community** (currently "Recently Joined"): swap the pill-shaped
   chips for square ones with a left color-accent bar — `blue` for
   expert/organisation, `pink` for creator/journalist (matches the
   existing `RoleBadge` semantic split, just extended to the chip's
   border).
4. **Your Proposals**: keep its current small/conditional treatment,
   just square off the corners and swap `bg-amber-100`-style status
   chips for the neutral bordered mono chip style used elsewhere (no
   new semantic color needed — pending/approved/declined is a status
   axis, not a role axis, so it doesn't need to borrow blue/pink).
5. **Profile-not-set-up notice**: currently `border-amber-200 bg-amber-
   50 rounded-xl` — square the corners and move off the stock amber
   palette onto a neutral ink-bordered treatment (thicker border for
   visual weight, since this is a "needs attention" notice, without
   reaching for a stock warning color the rest of the site doesn't use).
6. Add `anim-rise` entrance animation to every section (already used
   sitewide, just missing on this page) with staggered `--d` delays
   matching the artifact's timing.

#### Prompt for next session — Part 5

```
Read docs/design/home-dashboard/two-ink-bold-dashboard-plan.md in full
before doing anything else — §0 for context, §1 for engineering
conventions. Confirm Part 0 has landed first.

Build Part 5 (docs/design/home-dashboard/two-ink-bold-dashboard-plan.md
§2, Part 5) — restyle app/home/page.tsx's existing sections. Read the
whole current file first; this part touches most of it.

1. Convert Active Briefs to components/ui/Carousel.tsx. Sharp corners,
   ink top-accent border, a Thumb header image per card, end each card
   in Part 0's card-go icon button (internal arrow) instead of the
   current "Read brief ->" text.
2. Convert Recent Posts ("From Your Network") to the same Carousel,
   blue top-accent border, wrapped in a paper-sunken-blue background
   panel (existing token). Two of three cards get a Thumb, all three
   end in the card-go icon button (external arrow, tone="blue") instead
   of "View source ->" text.
3. Recently Joined ("Community"): square chips with a left color-accent
   bar (blue for expert/organisation, pink for creator/journalist),
   replacing the current rounded-full pill chips.
4. Your Proposals: square corners, replace amber/green/gray stock-color
   status pills with neutral bordered mono chips.
5. Profile-not-set-up notice: square corners, move off amber onto a
   thicker neutral ink border.
6. Add anim-rise (already defined in app/globals.css, used sitewide)
   with staggered --d delays to every section on this page.

Verify: bunx tsc --noEmit && bun run lint clean, browser-check every
section restyled correctly, carousels scroll and their prev/next
buttons disable correctly at each end, entrance animation plays once on
load and respects prefers-reduced-motion (confirm via OS-level or
DevTools emulation, not just code review).
```

---

### Part 6 — Cleanup and final verification

Do this last, after every part above has shipped and been signed off
individually.

1. Full regression pass: `bunx tsc --noEmit`, `bun run lint`, full
   `bunx playwright test` run. Add or update `tests/` coverage for the
   new sections if the existing home-page test fixtures don't already
   exercise them (check `tests/` for a `home`/`dashboard` spec first —
   if none exists, this plan is a reasonable point to add one rather
   than shipping the redesign with zero test coverage on the page).
2. Browser-check the whole Home dashboard top to bottom, as: a
   brand-new user with no engagement history at all (confirm the hero
   digest and Highlighted/This Week empty-states all degrade
   gracefully, not just the happy path), a user with real engagement
   history, and as admin.
3. Sweep the whole page's rendered copy one more time for em dashes —
   check any content that flows through `getHeroDigest`'s template
   function specifically, since that's assembled from multiple string
   fragments and an em dash could slip in through a fragment this plan
   didn't anticipate.
4. Get the user's final sign-off across the whole page as one coherent
   whole, not just part-by-part — same convention as both prior plans'
   own final part.

#### Prompt for next session — Part 6

```
Read docs/design/home-dashboard/two-ink-bold-dashboard-plan.md in full
before doing anything else — §0 for context, §1 for engineering
conventions.

Build Part 6 (docs/design/home-dashboard/two-ink-bold-dashboard-plan.md
§2, Part 6) — final cleanup, only once every other part has shipped.

1. Full verification: bunx tsc --noEmit, bun run lint, bunx playwright
   test. Check tests/ for existing home-page coverage; add a spec for
   the new Highlighted/This Week sections if none exists.
2. Browser-check the whole dashboard as: a brand-new user with zero
   engagement (confirm every empty-state degrades gracefully — no
   fabricated hero claims, no empty Highlighted/This Week shells), a
   user with real history, and admin.
3. Re-sweep all rendered copy for em dashes, especially anything
   composed by getHeroDigest's template function.
4. Get the user's final sign-off on the whole page as one coherent
   redesign, not section-by-section.
```
