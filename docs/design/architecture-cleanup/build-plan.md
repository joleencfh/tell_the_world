# Architecture cleanup — build plan

**Status: not started.** Five independent cleanup items surfaced by the
[2026-09-17 architecture snapshot](../../architecture/2026-09-17.md)'s "Known
gaps" section. Unlike the brief-feature build plan, these aren't sequential
steps toward one feature — each is a standalone fix and can be branched,
built, and merged on its own. Ordered below cheapest/lowest-risk first.

No separate design spec for this one; the scope of each item is small enough
that this build plan *is* the spec. Once an item ships, update its status
below rather than deleting the row — and update the architecture snapshot's
"Known gaps" section (or note it'll be corrected in the next dated snapshot).

## How to use this

Each step has a "Prompt for next session" block — paste it into a fresh
Claude Code session to pick up that step. They're written to stand alone (no
memory of this conversation assumed).

| # | Item | Status |
| --- | --- | --- |
| 1 | Migration numbering collisions (038, 043) | ⛔ NOT STARTED |
| 2 | `brief_contributions` naming history — document, don't rename | ⛔ NOT STARTED |
| 3 | Dead `/briefs` list route → build a minimal list page | ⛔ NOT STARTED |
| 4 | `/home` page→View composition consistency | ⛔ NOT STARTED |
| 5 | `max-lines` lint decomposition debt (13 warnings, 7 files) | ⛔ NOT STARTED |

---

## Step 1 — Migration numbering collisions (038, 043)

Two filename collisions exist in `supabase/`, both already applied to the
live DB, both harmless in practice (different tables, no functional
conflict) — but they break the sequential-numbering convention this repo
otherwise follows, and the project has hit this before: a prior `019`
collision was fixed by **renaming the later-authored file** to the next
unused number, in a follow-up PR, without touching the live DB. Same fix
here, same reasoning: this repo applies migrations manually via the
Supabase Management API rather than a tracked migration-runner, so a file
rename is purely a repo-readability change — it does not need to be
re-applied.

Checked landing order via `git log --diff-filter=A` on each file:

| Pair | Keep as-is (landed first) | Rename (landed second) | New number |
| --- | --- | --- | --- |
| 038 | `038_content_posts_moderation_and_likes.sql` (2026-08-22 20:14) | `038_brief_timeline_events.sql` (2026-08-22 22:37) | → `062_brief_timeline_events.sql` |
| 043 | `043_question_answers_submission.sql` (2026-08-25 15:56 — itself a prior renumber, see its own commit message) | `043_brief_ctas_display_order.sql` (2026-08-25 17:53) | → `063_brief_ctas_display_order.sql` |

New numbers pick up at the tail of the current sequence (highest applied is
`061`), matching how the `019` fix was done.

**What to do:**
1. `git mv supabase/038_brief_timeline_events.sql supabase/062_brief_timeline_events.sql`
2. `git mv supabase/043_brief_ctas_display_order.sql supabase/063_brief_ctas_display_order.sql`
3. Grep the repo for any hardcoded reference to either old filename (docs,
   comments, scripts) and update it — check `docs/design/brief-feature/*.md`
   and `scripts/seed-test-briefs.ts` in particular, since both migrations
   touch features those files reference.
4. No DB change needed — the SQL content and the live schema are unaffected.
5. Update the architecture snapshot's "Known gaps" line about this (or leave
   it as history in the 2026-09-17 snapshot per its own "don't edit old
   snapshots" rule, and just note it's fixed in the next dated snapshot
   whenever one is next written).

### Prompt for next session

```
Fix the two migration-numbering collisions documented in
docs/design/architecture-cleanup/build-plan.md Step 1:

1. git mv supabase/038_brief_timeline_events.sql supabase/062_brief_timeline_events.sql
2. git mv supabase/043_brief_ctas_display_order.sql supabase/063_brief_ctas_display_order.sql

Both migrations are already applied to the live DB — this is a filename-only
change for repo readability, matching how a prior 019 collision was fixed
(see project memory / CONTRIBUTING.md). Do NOT re-run these migrations
against Supabase.

After the renames, grep the repo for any reference to the old filenames
(docs/design/brief-feature/*.md, scripts/seed-test-briefs.ts, any other
.md/.ts file) and update them. Run bunx tsc --noEmit && bun run lint to
confirm nothing broke, then check `git status` shows clean renames (not
delete+add, which would lose history — use git mv, not rm+Write).
```

---

## Step 2 — `brief_contributions` naming history (document, don't rename)

This isn't a live bug. Checked `lib/types.ts:59-60` — the two current tables
already have clearly distinct TypeScript aliases:
`BriefContributionRow = Tables<'brief_contributions'>` and
`BriefCorrectionProposalRow = Tables<'brief_correction_proposals'>`. No code
today actually confuses the two. The confusion is purely for a *human*
reading migration `017_brief_feature_schema.sql` cold: it renames the old
free-text "propose a correction" table away from the name
`brief_contributions`, then in the same migration creates a *new*, unrelated
polymorphic table (review/endorsement/take/comment) and calls it
`brief_contributions` too. That's a legitimate trap for anyone doing
archaeology in the migration history — worth a pointer, not a rename (a
rename now would be pure churn: it'd touch live schema, generated types,
and every call site for zero functional benefit).

**What to do:**
1. Add a short header comment to `supabase/017_brief_feature_schema.sql`
   (comment-only edit — doesn't change the SQL that already ran) explaining
   the rename-and-reuse explicitly, so a reader hits the explanation at the
   exact point of confusion rather than needing to already know to look
   elsewhere.
2. That's it — no code changes, no re-migration. The architecture snapshot
   and project memory already carry this note going forward
   (`architecture_snapshot_docs.md` memory file); this step just closes the
   loop at the source.

### Prompt for next session

```
Add a clarifying comment to the top of
supabase/017_brief_feature_schema.sql explaining that this migration renames
the old free-text "propose a correction" table from brief_contributions to
brief_correction_proposals, and then reuses the name brief_contributions for
a new, unrelated polymorphic table (review/endorsement/take/comment) later
in the same file. Comment-only change — do not alter any executable SQL in
this file, and do not re-run it against Supabase (it's already applied).
This is docs/design/architecture-cleanup/build-plan.md Step 2.
```

---

## Step 3 — Dead `/briefs` list route → build a minimal list page

Confirmed three dead links (`BriefView.tsx`'s nav, `ProfileView.tsx`'s nav,
`app/home/page.tsx`'s "View all →" and header nav) all point at `/briefs`,
which has no `page.tsx`. Decision (confirmed with the user): build a real,
minimal list page rather than just removing the links.

**Scope, deliberately small:** a paginated list of published briefs — title,
subtitle/TL;DR excerpt, topic tags — nothing else. No search/filter UI (the
Directory page already covers cross-entity search; this is just "browse
everything"). No new design system needed — reuse existing primitives.

**What to build:**

1. **Data layer** — `lib/data/briefs.ts` already has `getRecentBriefs(db,
   limit)` (unpaginated, used by Home). Add a paginated sibling,
   `getBriefsPaged(db, page, pageSize)`, following the same `PagedResult<T>`
   shape already used by `lib/directory/queries.ts` and `lib/data/admin.ts`
   (the architecture snapshot notes this type is currently duplicated
   between those two files rather than unified — if you're touching this
   area anyway, consider promoting `PagedResult<T>` to `lib/types.ts` and
   having the third call site import it too, but that's optional polish,
   not required for this step). Query shape: same
   `briefs.select('id, title, slug, subtitle, topic_tags, created_at,
   brief_sections!inner(content)').eq('brief_sections.section_type',
   'tldr')` pattern as `getRecentBriefs`, plus `.range()` for paging and a
   `count: 'exact'` head query for the total.
2. **Route** — `app/briefs/page.tsx`, server component: parse `?page=`,
   call `getBriefsPaged` with the RLS client (brief metadata is
   world-readable per migration `013_public_brief_read.sql`, same as
   `getRecentBriefs` already assumes — this page can be public, logged in or
   not). Render cards + `components/ui/Pagination.tsx` (same
   `page`/`pageSize`/`total`/`buildHref(page)` props Directory already
   uses).
3. **Card** — a small new presentational component (e.g.
   `app/briefs/BriefListCard.tsx`) rendering title, topic-tag chips, and a
   trimmed TL;DR excerpt, linking to `/briefs/[slug]`. Check whether
   `app/home/highlighted.tsx` or `app/directory/QuoteCard.tsx` already has a
   close-enough visual pattern to crib from before inventing new styling.
4. **`proxy.ts` — required change, easy to miss.** The public-route check
   is `pathname.startsWith('/briefs/')` (note the trailing slash) — this
   matches `/briefs/[slug]` but **not** the bare `/briefs` list route, so
   without a change the new page would incorrectly force a login redirect
   for logged-out visitors. Add `'/briefs'` to the `PUBLIC_ROUTES` set
   alongside `/privacy`/`/contact`.
5. **Wire up the 3 existing dead links** — they already point at `/briefs`;
   once the route exists they just work. Spot-check `BriefView.tsx`,
   `ProfileView.tsx`, and `app/home/page.tsx` to confirm none of them need
   an href change (they shouldn't).
6. **Test** — add a short Playwright spec or extend `tests/briefs.spec.ts`:
   `/briefs` loads logged out, shows published briefs, pagination works,
   each card links to a real brief page.

### Prompt for next session

```
Build the minimal /briefs list page described in
docs/design/architecture-cleanup/build-plan.md Step 3. Three existing nav
links (app/briefs/[slug]/BriefView.tsx, app/profile/[id]/ProfileView.tsx,
app/home/page.tsx) already point at /briefs and currently 404 — this closes
that gap.

1. Add getBriefsPaged(db, page, pageSize) to lib/data/briefs.ts, modeled on
   the existing getRecentBriefs in the same file but paginated (PagedResult<T>
   shape — see lib/directory/queries.ts or lib/data/admin.ts for the existing
   pattern; feel free to promote it to lib/types.ts if convenient, not
   required).
2. Add app/briefs/page.tsx (server component, public — briefs metadata is
   world-readable per migration 013), rendering a small new
   app/briefs/BriefListCard.tsx (title, topic tags, TL;DR excerpt) plus
   components/ui/Pagination.tsx for paging via ?page=.
3. IMPORTANT: add '/briefs' (exact, no trailing slash) to proxy.ts's
   PUBLIC_ROUTES set — the existing check only matches '/briefs/' with a
   trailing slash (i.e. /briefs/[slug]), so without this the new list route
   would incorrectly redirect logged-out visitors to /login.
4. Confirm the 3 existing '/briefs' links (BriefView.tsx nav, ProfileView.tsx
   nav, app/home/page.tsx nav) now resolve — no href changes should be
   needed, just verify.
5. Add Playwright coverage (extend tests/briefs.spec.ts or add a new spec):
   /briefs loads logged out, lists published briefs, pagination works, cards
   link through to real brief pages.

Verify in the browser (dev server) before calling it done, and run
bunx tsc --noEmit && bun run lint clean.
```

---

## Step 4 — `/home` page→View composition consistency

Every other screen in the app follows the same convention (documented in
`CONTRIBUTING.md` and every architecture snapshot): a `page.tsx` server
component does the auth check + data fetch, then hands off to a client
`*View.tsx` that owns rendering. `app/home/page.tsx` is the one exception —
it renders most of the dashboard's JSX directly in the server component,
delegating only specific sections (`dashboard-carousel.tsx`, `highlighted.tsx`,
`this-week.tsx`) to client children. This isn't a functional bug, but it's
an inconsistency a new contributor will trip over when they go looking for
`HomeView.tsx` and it doesn't exist.

**What to do:** extract the JSX `app/home/page.tsx` currently renders
directly into a new `app/home/HomeView.tsx` client component, matching the
Directory/Profile/Brief/Admin pattern exactly:
1. `page.tsx` keeps the auth check and all the data fetching
   (`getUserBasic`, `getRecentBriefs`, `getRecentUsers`, `getExpertOrgIds`,
   `getUserBriefProposals`, `getHeroDigest`, `getThisWeekActivity`,
   `getPostsByAuthors`, `getHighlightedSectionData`), then passes the
   results as props to `<HomeView ... />`.
2. `HomeView.tsx` (new, `'use client'`) owns the JSX currently in
   `page.tsx`, composing `DashboardCarousel`, `Highlighted`, `ThisWeek`,
   `dashboard-section-header.tsx` exactly as today — this is a pure
   move, not a rewrite. Don't change any rendering logic or data shape
   while moving it.
3. **This is behavior-preserving refactor, not a redesign** — the bar for
   "done" is that the page looks and behaves identically before and after.
4. Regression-check against `tests/home-dashboard.spec.ts` (already covers
   the Highlighted module and This Week feed) plus a manual pass in the
   browser (logged in, check the full dashboard: hero, briefs carousel,
   Highlighted, This Week, Your Proposals, Active Briefs, From Your Network,
   Community).

**Judgment call worth stating up front:** if whoever picks this up reads
`page.tsx` and concludes the split doesn't cleanly separate (e.g. some JSX
needs data fetched partway through what's currently a monolithic render),
it's fine to leave this specific inconsistency documented rather than force
an awkward split — the point is consistency for its own sake, not a
functional requirement. Downgrade to "left as a documented exception in
CONTRIBUTING.md" if the extraction turns out messier than expected.

### Prompt for next session

```
Refactor app/home/page.tsx to follow the same page.tsx (server, auth+fetch)
→ *View.tsx (client, render) split every other screen in this app uses
(Directory, Profile, Brief, Admin) — see
docs/design/architecture-cleanup/build-plan.md Step 4 for the rationale.
Currently app/home/page.tsx renders most of the dashboard JSX directly
instead of handing off to a HomeView.tsx.

1. Create app/home/HomeView.tsx ('use client'), move the JSX app/home/page.tsx
   currently renders directly into it (hero/welcome header, briefs carousel,
   Your Proposals, Active Briefs, network posts, Community chips), composing
   DashboardCarousel / Highlighted / ThisWeek / dashboard-section-header.tsx
   exactly as today.
2. Keep all data fetching (getUserBasic, getRecentBriefs, getRecentUsers,
   getExpertOrgIds, getUserBriefProposals, getHeroDigest, getThisWeekActivity,
   getPostsByAuthors, getHighlightedSectionData) and the auth check in
   page.tsx; pass the fetched data down as props to <HomeView ... />.
3. This must be a pure move, not a rewrite — no rendering logic or data
   shape changes. If the split turns out genuinely awkward (some JSX
   depends on fetches interleaved in a way that resists a clean split),
   stop and document it as an accepted exception in CONTRIBUTING.md instead
   of forcing it — don't fight the code to satisfy a stylistic convention.

Verify with tests/home-dashboard.spec.ts plus a manual pass in the browser
(logged in, exercise the full dashboard). Run bunx tsc --noEmit && bun run
lint clean before calling it done.
```

---

## Step 5 — `max-lines` lint decomposition debt

`bun run lint` currently reports **13 warnings** (0 errors) — the
architecture snapshot's "13 warnings" figure includes more than just
`max-lines`. Ran it directly to get the real breakdown:

- **7 files over the 500-line `max-lines` threshold** (the actual
  decomposition debt):

  | File | Lines | Suggested split |
  | --- | --- | --- |
  | `app/briefs/[slug]/explainer-engagement.tsx` | 1,069 | Split along the 3 mechanisms the architecture doc already documents separately: `explainer-usefulness.tsx` (plain like), `explainer-comments.tsx` (comments + 1-level replies + likes), `explainer-contentious-points.tsx` (flag/moderate/like/reply). Keep a thin `explainer-engagement.tsx` that composes the three, so `BriefView.tsx`'s import doesn't need to change. |
  | `lib/admin/actions.ts` | 801 | Split by moderation domain, continuing the precedent already set by `lib/admin/brief-actions.ts` and `lib/admin/explainer-actions.ts` being split out. Candidates: `lib/admin/content-actions.ts` (FAQ answers, CTAs, coverage, flagged content_posts) and `lib/admin/queue-actions.ts` (applications, questions, correction proposals, brief feedback, waitlist reads, brief reviews, brief proposals) — or split however the actual export groupings fall out; `requireAdmin()`-first must be preserved on every export in every resulting file. |
  | `lib/briefs/actions.ts` | 638 | 21 exports across many features — split by domain similarly, e.g. `lib/briefs/coverage-actions.ts` (`submitCoverage`, `likeCoverage`, `submitCoverageComment`, `voteCoverageComment`, `getCoverageDetail`) and `lib/briefs/qa-actions.ts` (`submitQuestion`, `voteQuestion`, `voteAnswer`, `submitAnswer`, `endorseAnswer`, `getVoters`), leaving correction proposals / FAQ / CTAs / quotes / feedback / brief proposals / reviews in the original file (or split those too if it's still over threshold). |
  | `app/briefs/[slug]/BriefView.tsx` | 544 | Closest to threshold — a small extraction should clear it. Candidate: pull the hero/header block (title, chips, `SectionNav`, contribute menu trigger) into its own `hero.tsx`, since it's visually and logically distinct from the section-rendering loop below it. |
  | `app/admin/AdminScreen.tsx` | 613 | Split by tab group — e.g. isolate the tab-bar/pagination shell from the 15 individual tab-content render blocks, or group the "moderation queue" tabs vs. the "read-only report" tabs (analytics, waitlist, reviews) into separate files the shell composes. |
  | `app/admin/briefs/[id]/EditBriefScreen.tsx` | 517 | Marginal (17 lines over). Smallest fix: extract the brief-level settings block (`visibility`, `dashboardFeatured`, `pinnedMediaPostId`, `explainerTitle`, `tldrTeaser`) into a small `brief-settings-fields.tsx`, matching the pattern the 4 existing sub-editors already use. |
  | `scripts/seed-mock-data.ts` | 717 | **Reconsider before splitting.** This is a dev-only seed script, not shipped app code — splitting it into multiple files just to satisfy a line-count rule intended for component/module decomposition doesn't obviously improve anything. Cheaper, arguably more correct fix: exclude `scripts/**` from the `max-lines` rule in `eslint.config.mjs` (the rule's own stated intent, per the architecture snapshot, is nudging *app* files toward smaller components — a seed script isn't that). Flag this framing to whoever picks up the step; don't auto-split it without reconsidering the rule's scope first. |

- **5 `@next/next/no-img-element` warnings** (`app/admin/coverage-card.tsx`,
  `app/briefs/[slug]/coverage-modals.tsx`, `app/briefs/[slug]/coverage.tsx`,
  `app/home/dashboard-coverage-card.tsx`, `components/ui/Avatar.tsx`) — not
  part of what was flagged in the snapshot, but trivial to fold in here
  since lint is already the focus. **Caveat:** these images come from
  user-controlled sources (Supabase Storage buckets, scraped coverage
  images, external avatar URLs) — swapping to `next/image` requires
  configuring `images.remotePatterns` in `next.config.ts` for every
  external domain in play, not just adding the `<Image />` import. Worth
  doing, but budget time for that config step, not just the JSX swap.
- **1 `@typescript-eslint/no-unused-vars`** (`components/PostModal.tsx:109`,
  `currentUserId`) — trivial, delete the unused destructured prop/param (or
  wire it up if it was meant to be used — check the diff/blame before
  assuming it's dead).

**Recommended order:** do the 6 non-`max-lines` warnings first (fast,
mechanical, no design judgment) in one small PR, then tackle the 7
`max-lines` files as separate PRs — each is independent, so don't feel
obligated to do all 7 in one sitting. `explainer-engagement.tsx` is the
highest-value one (worst offender by a wide margin); the others can be
picked off opportunistically whenever that file is next touched anyway.

### Prompt for next session (quick wins — non-max-lines warnings)

```
Fix the 6 non-max-lines lint warnings from `bun run lint`
(docs/design/architecture-cleanup/build-plan.md Step 5):

1. components/PostModal.tsx:109 — 'currentUserId' is defined but never used.
   Check git blame/the surrounding code to see if it was meant to be wired
   up somewhere; if genuinely dead, remove it.
2. 5x @next/next/no-img-element warnings: app/admin/coverage-card.tsx,
   app/briefs/[slug]/coverage-modals.tsx, app/briefs/[slug]/coverage.tsx,
   app/home/dashboard-coverage-card.tsx, components/ui/Avatar.tsx. Convert
   each raw <img> to next/image's <Image />. These render user/external
   content (Supabase Storage avatars, scraped coverage images) — check
   next.config.ts's images.remotePatterns and add any external domains
   these images can come from (Supabase storage origin, and whatever
   domains brief_coverage.image_url / avatar URLs can point at) before
   assuming the swap "just works".

Run bunx tsc --noEmit && bun run lint clean after — should drop from 13
warnings to 7 (the max-lines ones, tracked separately).
```

### Prompt for next session (explainer-engagement.tsx split — highest value)

```
Split app/briefs/[slug]/explainer-engagement.tsx (currently 1,069 lines, by
far the worst max-lines lint offender — see
docs/design/architecture-cleanup/build-plan.md Step 5) along its 3 existing,
well-documented mechanisms:

1. explainer-usefulness.tsx — the plain "was this useful" like
   (creator/journalist/admin roles).
2. explainer-comments.tsx — open comments, one-level replies, likes.
3. explainer-contentious-points.tsx — expert/org/admin flagging, admin
   moderation, likes, replies.

Keep explainer-engagement.tsx itself as a thin composing wrapper so
BriefView.tsx's existing import doesn't need to change. Move each
mechanism's rendering + local state + the calls into
lib/briefs/explainer-engagement-actions.ts (already split out, unchanged)
into its respective new file. Don't change any behavior — this is a pure
split, verified by the file being visually/functionally identical before
and after in the browser, plus tsc/lint passing clean.
```

---

## After all 5 steps

Once these land, the architecture snapshot's "Known gaps" section for
`docs/architecture/2026-09-17.md` will be stale in a good way — note that in
whichever session writes the *next* dated snapshot (don't edit
`2026-09-17.md` itself; it stays as a point-in-time record per
`docs/architecture/README.md`'s own rule).
