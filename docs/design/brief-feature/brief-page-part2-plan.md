# Brief page — Part 2: Content & Interaction Gaps

**Status: draft, not started.** This is the second round of Brief page
work, picking up after the Two-Ink Bold visual migration (see
`two-ink-bold-plan.md`, now essentially complete — Parts 0–9, 11a–11h all
merged). This plan does **not** touch visual tokens or layout language;
it fixes bugs, wires up dead buttons, and adds real functionality that
the Two-Ink Bold rebuild deliberately left as visual scaffolding.

## How to use this

Same convention as the Two-Ink Bold plan: each part below is
independently buildable and has a ready-to-paste "prompt for next
session" block. Parts are ordered so nothing depends on a part that comes
after it — **Part 0a/0b/0c are prerequisites** for several later parts
(check each part's own "Depends on" line before starting it out of
order). Every part needs the user's explicit sign-off before being
considered done, not just green CI/lint/tsc — same process as the
Two-Ink Bold build.

Track status in Notion, not this doc: Epic **"Briefs Part 2 — Content &
Interaction Gaps"** (`https://app.notion.com/p/3bf46e44496981269da9c23c08905170`)
has one Story per numbered step below. Update the Story's Status as you
go; don't duplicate that tracking here.

---

## 0. Where this comes from

Scoped 2026-08-17 across several sessions: the user read the live Brief
page section by section, comparing it against the Two-Ink Bold reference
artifact ("The AI Race — Brief",
`https://claude.ai/code/artifact/459ed0f0-4f72-48bd-9a7e-f932ca1d8272`),
and reported issues/missing functionality/new feature requests per
section. Every item below was independently verified against the actual
code (and, where relevant, the artifact's real HTML/CSS) before being
filed — the Notion Story for each item records exactly what was
confirmed, corrected, or found to already exist. Read a Story's Notes
before starting its part; several items turned out smaller than they
first looked (e.g. "no functionality attached" buttons that only needed
a one-line visibility fix), and a couple of the user's assumptions were
corrected during scoping (e.g. "Propose a new brief" already worked end
to end before this plan existed).

**Explicitly out of scope for this plan:** Section 09 (Related Briefs) —
the user reviewed it and had nothing to add; it's admin-managed and
minor. Two items are deliberately **design-first, not build-first** (the
oversized quote-mark treatment, and the jump-to-section nav) — their
parts below produce a design direction to sign off on before code, same
as how the original Two-Ink Bold tokens went through a design-review
pass before implementation.

**Reference material to read before starting any part:**
- `two-ink-bold-plan.md` §1 (design tokens/components) and §4
  (engineering conventions) — this plan reuses both wholesale, see §1
  below.
- `app/briefs/[slug]/*.tsx` — read the specific files each part touches
  before editing; this doc gives you the delta, not a full component
  spec, since the components already exist.

---

## 1. Engineering conventions

Identical to `two-ink-bold-plan.md` §4 — re-read that section, don't
assume you remember it. The points that matter most for this plan
specifically:

- **Bun only.**
- **Migration numbering**: next is `030` as of this writing. Check
  `supabase/`'s highest-numbered file before assuming — this repo has
  hit a real numbering collision before (two branches both claiming the
  same number) because a stale assumption wasn't re-checked at PR time.
- **Regenerate `lib/database.types.ts`** after every migration:
  `bunx supabase gen types typescript --project-id kofimpjhjpgjotjanglq --schema public > lib/database.types.ts`.
- **RLS conventions**: match the existing shape — public/members read
  split, service-role bypass for admin moderation, `updated_at` trigger
  via `update_updated_at()`, partial unique indexes for "one row per
  user per target."
- **Verify in-browser before calling any part done.** If a second
  session's dev server is already running against this repo directory
  (very likely — this repo has had concurrent sessions active
  throughout Part 2's scoping), see `[[build_plan_dev_server_lock]]`
  memory rather than assuming a feature is broken when your own
  `preview_start` won't bind.
- **Every part needs the user's explicit sign-off, not just green CI.**
- **This is a shared working directory.** Branches and file contents
  have changed mid-session before from other concurrent activity — check
  `git status`/`git branch --show-current` before assuming the tree
  matches what you last saw, and don't silently revert changes that
  weren't yours.

---

## 2. Part-by-part build order

### Part 0a — Schema foundations

Three independent, mechanical migrations, bundled because nothing here
needs design/UX judgment — just get the data model right before the UI
work in later parts needs it.

**Depends on:** nothing. **Blocks:** Part 4 (Quotes), Part 3 (TL;DR
partially).

1. **Extend `content_posts`**: add `brief_id` (nullable uuid, FK to
   `briefs`) so a quote/take can be explicitly attached to a specific
   brief, distinct from the existing topic-tag string-matching
   (`getQuotesByTopicTag` in `lib/data/posts.ts` stays as a fallback/
   discovery path, this is additive). Confirm the current schema
   against the original 5-type spec before adding — audit found no
   drift as of this scoping, but re-verify.
2. **`content_usage` table** (new): records when a quote/take's text is
   copied — `id`, `content_post_id`, `user_id` nullable (logged-out copy
   still worth counting), `used_at`. No "published URL" field yet
   despite the Notion Story's name — that half needs a UI for the user
   to report where they published, out of scope for this part; just
   build the copy-event logging.
3. **`briefs.topic_tag` → `briefs.topic_tags`**: migrate the single
   nullable string column to a string array, mirroring
   `content_posts.topic_tags` (already `string[]`, same pattern to
   copy). Write a data migration for existing rows (wrap the single
   value in a one-element array, or null → empty array — decide which
   reads better against `getRelatedBriefs`'s `.eq('topic_tag', ...)`
   equality check, which needs to become a `.overlaps()` or similar
   array-aware query). Update: `lib/data/briefs.ts` (`Brief`/
   `BriefWithSections` types + the select string), `lib/admin/
   brief-actions.ts` (admin brief type + save path), `lib/data/
   posts.ts`'s `getQuotesByTopicTag` (now matching against an array),
   `getRelatedBriefs` (same). Don't touch the hero's tag-row rendering
   yet — that's Part 1's job once this column shape exists.

#### Prompt for next session — Part 0a

```
Read docs/design/brief-feature/brief-page-part2-plan.md in full before
doing anything else — §0 for context, §1 for engineering conventions.
Also skim two-ink-bold-plan.md §4 (same conventions, this plan doesn't
repeat everything). Don't skip straight to the steps below.

Build Part 0a (docs/design/brief-feature/brief-page-part2-plan.md §2,
Part 0a) — three schema migrations, no UI changes.

1. Migration: add content_posts.brief_id (nullable uuid FK to briefs).
   Confirm the current content_posts schema still matches the original
   5-type spec before adding (audit this fresh, don't trust that it's
   unchanged since the last check).
2. Migration: create content_usage table (id, content_post_id FK,
   user_id nullable FK, used_at timestamptz default now()). RLS: insert
   open to anyone (including logged-out), no read policy needed yet
   (nothing reads it in this part).
3. Migration: convert briefs.topic_tag (string) to briefs.topic_tags
   (string[]). Include a data migration for existing rows. Update every
   call site: lib/data/briefs.ts (Brief/BriefWithSections types + select
   string), lib/admin/brief-actions.ts (admin type + save/load), and the
   two topic-tag equality queries in lib/data/posts.ts
   (getQuotesByTopicTag) and lib/data/briefs.ts (getRelatedBriefs) — both
   need to become array-overlap queries instead of string equality.
   Don't change any UI in this part — BriefView.tsx's hero still reads
   the old single-tag shape until Part 1 updates it; keep the app
   compiling by having Part 1 land in the same PR, or leave a
   deliberate, tracked TODO if splitting into two PRs.

Verify: bunx tsc --noEmit && bun run lint clean, regenerate
lib/database.types.ts, confirm existing quote/related-brief matching
still works against seeded data (scripts/seed-mock-data.ts) after the
topic_tag→topic_tags conversion.
```

---

### Part 0b — Rich text: Lexical integration

**Depends on:** nothing (independent of 0a). **Blocks:** Part 5
(Explainer body), Part 6 (FAQ/Q&A answer links).

TipTap was removed from this codebase once already (PR #26) because its
HTML output didn't match the public page's plain-text parsers — the
editor and the renderer were built independently and never reconciled.
User's explicit direction: use a different library this time
(researched during scoping — **Lexical**, MIT-licensed, Meta-backed,
widely used), and avoid HTML entirely rather than trying to sanitize it.
Lexical's `editorState.toJSON()` gives a structured JSON tree, not an
HTML string — the public page renders that JSON with its own React
components, so there's structurally no HTML round-trip to get wrong a
second time.

**Scope**: bold, links (including links to other briefs — `/briefs/
[slug]`), basic formatting. **Not in scope**: images (needs a separate
upload/storage story on top of this one — flag to the user rather than
scope-creeping it in here). **Not in scope**: migrating existing
plain-text content — old `{{term|definition}}` keyterm syntax and plain
paragraphs need to keep rendering; this part adds a new content shape
that coexists, it doesn't replace the old one everywhere in one pass.

#### Prompt for next session — Part 0b

```
Read docs/design/brief-feature/brief-page-part2-plan.md in full before
doing anything else — §0 for context (specifically why TipTap was
removed and what NOT to repeat), §1 for engineering conventions.

Build Part 0b (docs/design/brief-feature/brief-page-part2-plan.md §2,
Part 0b) — Lexical-based rich text for the Explainer body only in this
part (Part 6 wires FAQ/Q&A answers to the same renderer later).

1. Add @lexical/react and core Lexical packages. Build a minimal editor
   config: bold, links (validate internal /briefs/[slug] links resolve
   sensibly), paragraphs. No headings/lists/images in v1 — keep the
   toolbar small.
2. Decide storage shape for app/briefs/[slug]/explainer.tsx's
   ExplainerBody content: likely a new JSONB column alongside (not
   replacing) brief_sections.content, since existing sections use the
   plain-text convention and this is additive. Read
   app/briefs/[slug]/explainer.tsx's current ExplainerBody /
   tokenizeKeyterms first — the existing {{term|definition}} keyterm
   syntax must keep working for content that hasn't been migrated to
   Lexical yet.
3. Build the public-page renderer: walk Lexical's JSON tree, emit plain
   React elements (bold → <strong>, link → <Link> for internal /briefs/
   routes or <a target=_blank> for external) — never
   dangerouslySetInnerHTML, never render a raw HTML string from the
   editor.
4. Wire the admin editor (app/admin/briefs/[id]/EditBriefScreen.tsx) to
   use the Lexical editor for explainer-type sections specifically —
   read that file's SECTION_HELP/PARAGRAPH_HELP first, this only
   replaces the explainer entry, not every section type (FAQ's Q:/A:
   convention, Sources' bullet convention, etc. stay plain textareas for
   now).

Verify: bunx tsc --noEmit && bun run lint clean, browser-check: admin
authors bold text + a link to another brief in an Explainer subsection,
save, confirm it renders correctly (not as literal markup) on the public
page, confirm an un-migrated plain-text Explainer subsection on an
existing seeded brief still renders correctly too (regression check).
```

---

### Part 0c — Shared "send feedback to moderators" mechanism

**Depends on:** nothing. **Blocks:** Part 2 (Contribute menu's feedback
item), Part 3 (TL;DR suggest-changes), Part 5 (Explainer feedback
buttons ×2), Part 6 (FAQ answer feedback).

Five separate parts of this plan want a "send feedback to moderators"
button. Built once here as a shared mechanism instead of five times.

#### Prompt for next session — Part 0c

```
Read docs/design/brief-feature/brief-page-part2-plan.md in full before
doing anything else — §0 for context, §1 for engineering conventions.

Build Part 0c (docs/design/brief-feature/brief-page-part2-plan.md §2,
Part 0c).

1. Decide and build the schema: reuse the existing messages table (used
   today for contact requests, see lib/messages/actions.ts) with a new
   type/category column, or a dedicated brief_feedback table. Shape
   needed either way: brief_id, section reference (nullable — which
   part of the brief this is about: hero, tldr, explainer section id,
   faq question, etc.), sender user_id (nullable if logged-out feedback
   should be allowed — confirm with the user if unclear), free-text
   body, created_at, status (new/reviewed).
2. Build one shared client component: a small modal or inline form
   (follow ProposeCorrectionModal's existing pattern — modal-form-then-
   pending-confirmation shape) that any call site can drop in with a
   context prop (which brief/section it's about).
3. One shared server action (lib/briefs/actions.ts) that inserts a row
   regardless of which call site invoked it.
4. Admin moderation: a new tab or list in app/admin/AdminScreen.tsx
   showing open feedback, following the existing moderation-tab pattern
   (applications/questions/contributions tabs already there) — read
   lib/admin/actions.ts first for the shape to match. Admin sees who
   sent it (when not anonymous) and can mark it reviewed.

Do NOT build the five individual entry points yet (TL;DR button,
Explainer buttons, FAQ answer feedback, Contribute menu item) — those
are each their own part below and just need this mechanism to exist and
be importable.

Verify: bunx tsc --noEmit && bun run lint clean, browser-check the
mechanism directly (a temporary call site is fine for this part, remove
before merge) submits and shows up in the new admin tab.
```

---

### Part 1 — Hero fixes

**Depends on:** nothing for the spacing/chip/bug items. Depends on
**Part 0a** if done in the same pass as the tag-row update (see step 4
below) — otherwise the tag row can stay on the old single-tag shape
until Part 0a lands, this part doesn't strictly require it.

1. **Spacing so the hero fits one viewport on landing.** Confirmed via
   live measurement: hero rendered at 860px in a 720px viewport. The
   `h1` font-size formula already matches the artifact exactly
   (`clamp(3.1rem,7.8vw,6.6rem)`) — don't touch it. The gap is
   `BriefView.tsx`'s hero wrapper padding (`pt-16 pb-20` = 64px/80px vs
   the artifact's `3rem 3.5rem` = 48px/56px) and the eyebrow row's
   `mb-8` (32px vs the artifact's `~0.9rem`/14px). Bring both down to
   match the artifact.
2. **Redesign the Reviewed/Endorsed chips.** Keep two separate chips
   (not the artifact's single combined chip — decided during scoping,
   since the DB genuinely tracks review and endorsement as separate
   states). Make the primary "Reviewed by" chip a real `<button>`
   (`HeaderChip` in `section-content.tsx` is currently a plain `<span>`)
   with a hover tooltip explaining what happens on click, and showing
   who reviewed/endorsed (experts/orgs) and when. Match the artifact's
   `.chip.verified` visual styling otherwise.
3. **Fix the dead `last_reviewed_at` write path.** `briefs.
   last_reviewed_at` exists and `BriefView.tsx` already renders it
   conditionally, but `setReviewStatus` (`lib/briefs/actions.ts`) never
   updates it — traced end to end, confirmed dead. Add the write
   (either directly in `setReviewStatus`, or a DB trigger on
   `brief_contributions` insert/update — trigger is probably cleaner
   since it stays correct regardless of which code path writes a
   review/endorsement row).
4. **Multi-tag row** (only if Part 0a is done): update the hero's tag
   row to map over `briefs.topic_tags` instead of the old single
   `topic_tag`. Consider whether to enforce the user's "minimum 3 tags"
   suggestion at the admin editor level (validation) — flag to the user
   if that should block saving or just warn.

#### Prompt for next session — Part 1

```
Read docs/design/brief-feature/brief-page-part2-plan.md in full before
doing anything else — §0 for context, §1 for engineering conventions.
Check whether Part 0a has landed (git log / Notion Story status) before
deciding whether to include step 4.

Build Part 1 (docs/design/brief-feature/brief-page-part2-plan.md §2,
Part 1) — app/briefs/[slug]/BriefView.tsx's hero block and
app/briefs/[slug]/section-content.tsx's HeaderChip.

1. Reduce hero padding (pt-16 pb-20 → match artifact's 3rem/3.5rem) and
   eyebrow row margin (mb-8 → ~0.9rem). Re-measure in browser afterward
   — don't assume the numbers alone fix it, confirm hero height fits
   viewport height on a real seeded brief with a long title (the
   overflow was worse on long titles than the artifact's 3-word
   example).
2. Turn the "Reviewed by" chip into a <button> with a hover tooltip:
   content = who reviewed/endorsed (avatar/name list, experts and orgs
   separately) + when, plus a short explainer of what clicking does.
   Keep "Endorsed by" as a separate chip, not combined.
3. Fix last_reviewed_at: add the write to setReviewStatus (lib/briefs/
   actions.ts) or a DB trigger on brief_contributions — your call, but
   document which and why. Confirm the existing conditional render in
   BriefView.tsx picks it up with no other changes needed.
4. If Part 0a has landed: update the hero's tag row to render
   briefs.topic_tags (array) instead of the old single topic_tag. Ask
   the user whether a minimum tag count should be enforced at save time
   in the admin editor, rather than assuming.

Verify: bunx tsc --noEmit && bun run lint clean, browser-check hero fits
one viewport on a long-title seeded brief, chip tooltip works via mouse
and keyboard focus, review→endorse flow now populates "Last reviewed."
```

---

### Part 2 — Contribute menu wiring

**Depends on: Part 0c** for step 4 only; steps 1–3 have no dependency.

`ContributeMenu` (`section-content.tsx`) is currently visual-only — no
`onClick` on any item, by design (its own code comment says so). User
decision: every menu item opens a modal, not just a scroll-to-existing-
control.

1. "Endorse this brief" / "Add a review" (expert/org group) → a
   lightweight confirm-style modal wrapping the existing
   `setReviewStatus` action.
2. "Suggest a question" (expert/org) / "Ask a question" (creator/
   journalist) → reuse the existing `QuestionForm` (`qa.tsx`) inside a
   modal, instead of requiring a scroll to Community Q&A.
3. "Add media coverage" / "Suggest a call to action" → trigger the
   already-built `AddCoverageModal` / `SuggestCtaModal`, same modals the
   sections' own "+" buttons already open.
4. "Send feedback on this page" (creator/journalist, new item; admin
   also gets it for free — `ContributeMenu` already previews the whole
   Creator/Journalist group to admin via its existing `isAdmin`
   convenience path, so this item needs no separate admin gate, and
   nothing added here should introduce one) → Part 0c's shared
   mechanism, brief-level context (no specific section).

#### Prompt for next session — Part 2

```
Read docs/design/brief-feature/brief-page-part2-plan.md in full before
doing anything else — §0 for context, §1 for engineering conventions.
Confirm Part 0c has landed before building step 4 below.

Build Part 2 (docs/design/brief-feature/brief-page-part2-plan.md §2,
Part 2) — app/briefs/[slug]/section-content.tsx's ContributeMenu and
ContributeMenuGroup.

1. Wire "Endorse this brief" / "Add a review" to a new lightweight
   confirm modal that calls setReviewStatus (lib/briefs/actions.ts) —
   read review-endorse.tsx's ReviewEndorseControl first, this can likely
   share most of its logic rather than duplicating it.
2. Wire "Suggest a question" / "Ask a question" to a modal wrapping the
   existing QuestionForm (qa.tsx) — don't rebuild the form, just give it
   a modal shell.
3. Wire "Add media coverage" / "Suggest a call to action" to the
   existing AddCoverageModal (coverage.tsx) / SuggestCtaModal (ctas.tsx)
   — these already exist and are fully built, this is only about
   triggering them from a second entry point. BriefView.tsx already has
   the open/close state for both (suggestCtaOpen, addCoverageOpen) —
   reuse it, don't create parallel state.
4. Add "Send feedback on this page" to the Creator/Journalist group's
   `items` array (the same array `ContributeMenuGroup` renders for that
   group), wired to Part 0c's shared feedback mechanism with brief-level
   context (no section reference). Do NOT add an extra role check that
   restricts this item further than the group it's already in —
   `ContributeMenu`'s existing `isAdmin` convenience logic already shows
   admin the whole Creator/Journalist group (same as it already does for
   Expert/Org), so admin must see this item too, same as every other
   item in both groups.

Verify: bunx tsc --noEmit && bun run lint clean, browser-check each of
the 6 menu items actually opens its modal and the action completes,
across an expert/org session, a creator/journalist session, and an
admin session (admin should see all 6 items across both groups, same as
today's visual-only menu already does).
```

---

### Part 3 — TL;DR

**Depends on: Part 0c** for step 2 only.

1. Replace the generic, hardcoded `SECTION_META.tldr.description`
   ("The three-minute version," not even accurate) with a per-brief
   custom teaser. The artifact's actual pattern is a content-specific
   one-liner ("Three races, conflated constantly — the skim version"),
   not a time estimate — this needs a new brief-level content field
   (e.g. `briefs.tldr_teaser`), not a copy edit.
2. Add a "Suggest changes / send comments" button, visible to org/
   expert/admin only, top-right of the TL;DR section header — wire to
   Part 0c's shared feedback mechanism with TL;DR-level context.

#### Prompt for next session — Part 3

```
Read docs/design/brief-feature/brief-page-part2-plan.md in full before
doing anything else — §0 for context, §1 for engineering conventions.
Confirm Part 0c has landed before building step 2.

Build Part 3 (docs/design/brief-feature/brief-page-part2-plan.md §2,
Part 3) — app/briefs/[slug]/BriefView.tsx's TL;DR block and
section-content.tsx's SECTION_META.

1. Migration: add briefs.tldr_teaser (text, nullable). Update
   lib/data/briefs.ts (Brief/BriefWithSections types + select string),
   the admin editor (app/admin/briefs/[id]/EditBriefScreen.tsx — new
   field, plain text, one line). Update BriefView.tsx to render
   brief.tldr_teaser in place of the current hardcoded
   SECTION_META.tldr.description for the TL;DR section. Decide a
   sensible fallback for briefs that don't have one set yet (empty
   description, or keep the old generic string as a fallback — ask the
   user if unclear, don't just guess silently).
2. Add an action slot to the TL;DR SectionHeader (BriefView.tsx doesn't
   currently pass one for this section, unlike FAQ/CTA/Coverage which
   already do) — a button visible only when
   currentUser?.role is 'expert'/'organisation'/'admin', wired to Part
   0c's shared feedback mechanism with { briefId, section: 'tldr' }
   context.

Verify: bunx tsc --noEmit && bun run lint clean, browser-check the new
teaser field displays correctly on a brief that has one set and falls
back sensibly on one that doesn't, feedback button only shows for the
right roles and successfully submits.
```

---

### Part 4 — Quotes

**Depends on: Part 0a** for steps 1 and 3 (needs `content_posts.
brief_id` and `content_usage`).

1. **"+ Add quote" button**, visible org/expert/admin, tied to this
   specific brief via the new `brief_id` column. The quote stays
   searchable/showable sitewide (topic-tag matching keeps working
   unchanged) — this just adds an explicit "added to Brief XYZ"
   association on top.
2. **Click-to-expand detail view** on each quote card: created on, last
   edited on, tags, like button, copy-text button. Explicitly **not**
   in scope: "used by (which creators/journalists) + links to their
   work" — user deferred that as a later feature.
3. **Copy button directly on the carousel card** (not only in the
   detail modal) — records the action via `content_usage`.
4. **Like/upvote button directly on the carousel card** — same
   card-level treatment as the copy button.
5. **Visual**: remove the bold/medium emphasis on quote text (current
   `font-weight:500` exactly matches the artifact — this is a
   deliberate user-requested divergence from the established spec, not
   a bug fix, do it without hesitating over the artifact mismatch).
6. **Design-first**: an oversized opening/closing quote-mark visual
   treatment for the cards. Produce a design direction (a couple of
   options, e.g. as a quick artifact or inline mockup) for the user to
   sign off on **before** writing the component — this item was
   explicitly flagged by the user as needing that sequencing.

#### Prompt for next session — Part 4

```
Read docs/design/brief-feature/brief-page-part2-plan.md in full before
doing anything else — §0 for context, §1 for engineering conventions.
Confirm Part 0a has landed before building steps 1 and 3.

Build Part 4 (docs/design/brief-feature/brief-page-part2-plan.md §2,
Part 4) — app/briefs/[slug]/section-content.tsx's QuoteCard/
QuotesCarousel, and a new quote detail view.

1. Add a "+ Add quote" trigger to the Quotes SectionHeader's action slot
   (visible org/expert/admin), opening a form that creates a
   content_posts row of type quote/take with brief_id set to the
   current brief. Follow the existing submitCta/submitCoverage
   propose-then-pending pattern (lib/briefs/actions.ts) for the
   submission shape. Include a tags field on the form — tags don't need
   to render on the carousel card itself, only in the detail view
   (step 2).
2. Build a quote detail view (modal, opened by clicking anywhere on a
   QuoteCard that isn't another interactive element inside it — follow
   SourceCard's existing click-to-open pattern in sources.tsx for the
   "click card, not a nested button" handling). Show: created_at,
   updated_at, tags, a like button, a copy button. Do not build a "used
   by" section — explicitly out of scope.
3. Add copy and like buttons directly on QuoteCard (not gated behind the
   detail view). Copy inserts a content_usage row (user_id from session
   if logged in, null if not). Like — decide whether this reuses the
   brief_coverage_likes pattern (a new content_post_likes table, same
   shape) or something else; document the choice.
4. Change QuoteCard's quote-text font-weight from 500 to 400 (or the
   value the user confirms on review — don't assume 400 is exactly
   right, just "not medium/bold").
5. Design-first: before writing any component code for the oversized
   quote-mark treatment, produce 2-3 visual directions (inline mockup or
   a small artifact) and get explicit sign-off from the user. Only then
   implement the chosen direction.

Verify: bunx tsc --noEmit && bun run lint clean, browser-check: add-quote
flow end to end, detail view opens/shows correct data, copy button
records a content_usage row, like button toggles correctly.
```

---

### Part 5 — Explainer polish

**Depends on: Part 0b** for nothing directly (typography/timeline/
sources items are independent of rich text) — but do Part 0b first
anyway if both are queued, since Explainer is the one section touched by
both parts and doing them out of order risks merge conflicts on the same
files. **Depends on: Part 0c** for step 6 only.

1. **Typography pass** for long-form readability. Body text currently
   0.95–1.05rem at 1.7 line-height — not egregious, but small for
   long-form reading. This is a visual-iteration item (like the
   original token design review), not a blind number change: propose
   2-3 concrete size/spacing options and confirm with the user before
   committing, same spirit as Part 4's quote-mark item, though less
   strictly design-first since there's less ambiguity here.
2. **Custom event timeline graphic** — confirmed net-new. One reusable
   visual style, per-brief event name/date data. Decide the data shape:
   a new `brief_sections` type (`timeline`, content authored in a
   parseable text convention like the existing FAQ/Sources ones) or a
   small dedicated table (`brief_timeline_events`: brief_id, event_name,
   event_date, display_order). Dedicated table is probably cleaner given
   this is structured data, not prose — but confirm with the user if the
   `brief_sections` convention is preferred for editor consistency.
3. **Expose an admin "Edit brief" entry point on the public page.** The
   existing `/admin/briefs/[id]` editor already covers the right scope
   (TL;DR/Explainer/Sources/FAQ primary text) and already correctly
   excludes quotes/expert-answers/creator-questions — this is purely
   adding a visible link/button (admin-only) from the live page into
   that existing editor, no new editing capability.
4. **Sources: cap to 6, add "show more," reduce card size.**
   `SourcesGrid` currently renders every source with no cap.
5. **Sources: require and display provenance** (org/website name).
   `SourceItem` has no publisher field today — add one to the
   `parseSources` authoring convention and the admin editor's helper
   text, make it mandatory when a source is added.
6. **Explainer feedback buttons (×2)** — was listed as one of Part 0c's
   dependents but never actually specified; filling that gap now rather
   than leaving it for whoever builds this part to rediscover. Mirrors
   the two-tier pattern this plan already uses elsewhere (Part 3's
   TL;DR = restricted "suggest changes," Part 6's FAQ = open "give
   feedback") rather than inventing a third shape:
   - **"Suggest changes"** — visible org/expert/admin only, same
     SectionHeader action-slot placement as TL;DR's (Part 3 step 2),
     wired to Part 0c's shared mechanism with `{ briefId, section:
     'explainer' }` context. Section-level, not per-subsection — a
     reviewer flagging something wrong in the Explainer shouldn't have
     to pick which subsection first.
   - **"Give feedback"** — visible to all logged-in users, no role
     restriction (mirrors FAQ's open trigger). A small text-link-style
     control placed once, after the last subsection in
     `ExplainerSections` — not per-subsection, since a brief's
     subsection count varies and a fixed single trigger avoids an
     unpredictable number of buttons. Wired to the same shared
     mechanism, same `{ briefId, section: 'explainer' }` context as the
     restricted button above (role of the submitter is what
     differentiates the two, not the section key).

#### Prompt for next session — Part 5

```
Read docs/design/brief-feature/brief-page-part2-plan.md in full before
doing anything else — §0 for context, §1 for engineering conventions.

Build Part 5 (docs/design/brief-feature/brief-page-part2-plan.md §2,
Part 5) — app/briefs/[slug]/explainer.tsx and sources.tsx.

1. Propose 2-3 typography options for ExplainerBody (explainer.tsx) —
   larger body font-size (try ~1.125rem/18px as a starting point),
   maybe adjusted paragraph spacing — and confirm with the user before
   committing to one. Stay within the existing sans-serif stack.
2. Decide timeline data shape with the user (new brief_sections type vs.
   dedicated brief_timeline_events table — lean dedicated table unless
   told otherwise) and build: migration, admin editor entry, a new
   TimelineGraphic component (one reusable visual style), rendered
   within ExplainerSections at the appropriate subsection position.
3. Add an "Edit this brief" link/button, admin-only, somewhere sensible
   on the public page (e.g. near the hero or as a persistent small
   control) linking to /admin/briefs/[brief.id]. No new editing
   capability — EditBriefScreen.tsx already covers the right scope.
4. In SourcesGrid (sources.tsx): render only the first 6 items by
   default, add a "Show N more" control to reveal the rest. Reduce
   SourceCard's padding/sizing (currently p-5) to read as smaller/
   thinner — pick a concrete reduction and confirm it still meets touch
   target guidance.
5. Add a provenance field to the parseSources text convention (e.g. a
   new "Publisher:" line, following the existing "Summary:"/"Key
   takeaways:" line-prefix pattern) and to SourceItem/buildSourceItem.
   Update EditBriefScreen.tsx's going_deeper SECTION_HELP instructions
   to document the new required line and make its absence a validation
   error, not a silent gap. Render the publisher name on both SourceCard
   and SourceDrawer.
6. Confirm Part 0c has landed, then add two feedback triggers, both
   wired to Part 0c's shared mechanism with { briefId, section:
   'explainer' } context: a "Suggest changes" button in the Explainer
   SectionHeader's action slot, visible only when currentUser?.role is
   'expert'/'organisation'/'admin' (copy Part 3 step 2's TL;DR button
   verbatim, same slot pattern, just a different section key) — and a
   "Give feedback" text-link-style control rendered once at the end of
   ExplainerSections (after the last subsection), visible to any
   logged-in user with no role check at all.

Verify: bunx tsc --noEmit && bun run lint clean, browser-check: a brief
with 8+ sources shows exactly 6 + a working "show more," a newly-authored
source without a publisher line is rejected by the admin editor, the
timeline renders correctly on a seeded brief with 3+ events, "Suggest
changes" only appears for expert/org/admin sessions while "Give
feedback" appears for every logged-in role including admin, and both
submit successfully.
```

---

### Part 6 — FAQ

**Depends on: Part 0b** for step 3 (answer links) and **Part 0c** for
part of step 1 (the "give feedback" half of the triple-dot menu).

1. **Primary answer attribution.** The TTW-authored primary answer
   (parsed from `Q:`/`A:` content) currently renders with zero byline —
   confirmed, unlike expert-submitted "More answers" which already show
   a full byline correctly. Add a triple-dot menu with two options:
   "info" (written-by TTW staff implicit, collaborating experts/orgs —
   linked user references, feedback-givers — linked user references) and
   "give feedback" (routes into Part 0c's shared mechanism, visible to
   all logged-in users — no role restriction, admin included). Needs new
   structured data: a table linking a brief's FAQ
   question to collaborator/feedback-giver user references (question
   text as the key, same fragile-but-accepted tradeoff as the existing
   `brief_faq_answers` matching).
2. **Support links in answer text** — both the primary answer and
   expert-submitted answers currently render as bare plain text.
   Reuse Part 0b's Lexical-based renderer rather than building a
   separate one-off link parser (this can likely be a much smaller
   subset of Part 0b's editor — links only, no bold needed here unless
   the user wants it — confirm scope before over-building).
3. **Wire "+ Suggest question" to a modal.** Confirmed: the button
   exists with no `onClick` at all. Its visibility restriction (org/
   expert/admin only) is already correct — don't touch that, just add
   the click handler and a submission modal.
4. **Include admin in "Add an answer" visibility.** `AddAnswerForm` is
   already fully built and wired for expert/organisation — just add
   `role === 'admin'` to the visibility check in `faq.tsx`'s
   `canSubmit={canContribute}`, matching the `canSuggestCta` pattern
   already used elsewhere on this page. One-line fix.

#### Prompt for next session — Part 6

```
Read docs/design/brief-feature/brief-page-part2-plan.md in full before
doing anything else — §0 for context, §1 for engineering conventions.
Confirm Part 0b and Part 0c have landed before building steps 1-3 (step
4 has no dependency, do it regardless).

Build Part 6 (docs/design/brief-feature/brief-page-part2-plan.md §2,
Part 6) — app/briefs/[slug]/faq.tsx and faq-answers.tsx.

1. Migration: a table linking (brief_id, question text) to collaborator
   user_ids[] and feedback-giver user_ids[] — mirrors the existing
   brief_faq_answers question-text-matching approach (see that table's
   own migration for the pattern), same accepted fragility if a
   question's wording changes. Build a triple-dot trigger next to the
   primary answer in FAQBlock (faq.tsx), opening a small menu: "info"
   (renders the collaborator/feedback-giver data, each name linking to
   /profile/[id]) and "give feedback" (opens Part 0c's shared mechanism
   with { briefId, section: 'faq', question } context).
2. Reuse Part 0b's Lexical renderer (read-only side) to render links in
   both FAQBlock's primary answer and faq-answers.tsx's AnswerCard body.
   Confirm with the user whether this needs its own lighter-weight
   editor (links only) for authoring, or whether the full Part 0b editor
   is fine reused as-is — don't assume, ask if the scope isn't obvious
   from Part 0b's own notes.
3. Add onClick + a submission modal to the "+ Suggest question" button
   in BriefView.tsx's FAQ SectionHeader action slot — don't touch its
   existing visibility condition, it's already correct.
4. In faq.tsx, change canSubmit={canContribute} to
   canSubmit={canContribute || currentUser?.role === 'admin'} on the
   FAQSection call site in BriefView.tsx.

Verify: bunx tsc --noEmit && bun run lint clean, browser-check: triple-
dot info panel shows correct linked names, give-feedback submits
correctly, a link inside a primary answer renders as a real link (not
plain text), admin now sees "+ Add an answer."
```

---

### Part 7 — Community Q&A

**Depends on:** nothing.

1. **Build a "submit an answer" form**, visible expert/org/admin, for
   Community Q&A questions. Confirmed genuinely missing — unlike FAQ's
   `AddAnswerForm`, `qa-answers.tsx`'s `AnswersList` has no submission
   form at all today, only vote/endorse controls on existing answers.
2. **Show creator platform/channel + journalist affiliation** in the
   author bar. Schema already has `primary_platform` (youtube/podcast/
   instagram/tiktok/other) and `platform_url` on `users` — the author
   bar components never read either, only `affiliation || org_name`.
   No distinct short "channel name" field exists, only the platform
   enum + a raw URL — decide with the user whether that's enough
   (render as e.g. "YouTube" linking to `platform_url`) or whether a
   proper display-name field is worth adding first.

#### Prompt for next session — Part 7

```
Read docs/design/brief-feature/brief-page-part2-plan.md in full before
doing anything else — §0 for context, §1 for engineering conventions.

Build Part 7 (docs/design/brief-feature/brief-page-part2-plan.md §2,
Part 7) — app/briefs/[slug]/qa-answers.tsx and qa.tsx.

1. Add a submit-answer form to qa-answers.tsx's AnswersList, visible
   when the current user's role is expert/organisation/admin, following
   faq-answers.tsx's AddAnswerForm as the pattern to mirror (same
   propose-then-pending shape via a new or existing submitAnswer server
   action — check lib/briefs/actions.ts for whether one already exists
   under a different name before adding a duplicate).
2. Ask the user whether primary_platform/platform_url alone (rendered as
   e.g. "YouTube" linking out) is sufficient, or whether a proper
   channel-name text field should be added to users first — don't
   silently pick one. Once decided: update AuthorBar (qa.tsx) and
   AuthorRow (qa-answers.tsx) to include it, and update
   lib/data/questions.ts's QuestionAuthor query/type to select the new
   field(s) (currently not selected at all).

Verify: bunx tsc --noEmit && bun run lint clean, browser-check: expert/
org/admin can submit an answer to a Community Q&A question end to end,
a creator's author bar now shows their platform info, a journalist's
shows affiliation.
```

---

### Part 8 — Calls to Action

**Depends on:** nothing.

**Admin manual reorder / pin to highlight.** Default ordering is already
correct (`getPublishedCtas`: `created_at` descending, newest first) —
only the admin override/pin capability is missing. Needs a
`display_order` or `pinned` field plus an admin control to set it. One
open question resolved during scoping this session: the user's original
note about CTA hover behavior turned out to be about the "+ New CTA"
button's cursor, already fixed sitewide by the global button-cursor CSS
rule shipped in `fix/brief-cursor-and-propose-brief-button` — nothing
left to do there.

#### Prompt for next session — Part 8

```
Read docs/design/brief-feature/brief-page-part2-plan.md in full before
doing anything else — §0 for context, §1 for engineering conventions.

Build Part 8 (docs/design/brief-feature/brief-page-part2-plan.md §2,
Part 8) — app/briefs/[slug]/ctas.tsx and lib/data/ctas.ts.

1. Migration: add a display_order (int, nullable) or pinned (boolean)
   column to brief_ctas — pick whichever gives the admin the control
   described ("reorder to highlight specific ones," not necessarily a
   single pin) — a nullable display_order that defaults to null (falls
   back to created_at ordering) and can be set to promote specific CTAs
   is probably the more flexible choice, but confirm with the user if
   ambiguous.
2. Update getPublishedCtas (lib/data/ctas.ts) to sort by the new column
   first (nulls last, or however the chosen shape needs), created_at as
   the tiebreaker/fallback.
3. Add an admin control (in the existing CTA moderation area of
   app/admin/AdminScreen.tsx / app/admin/cta-card.tsx) to set the new
   ordering field per CTA.

Verify: bunx tsc --noEmit && bun run lint clean, browser-check: default
order is still newest-first with nothing pinned, admin can promote a
CTA and it now appears first in the carousel.
```

---

### Part 9 — Covered By

**Depends on:** nothing.

1. **Click-through modal**: author (if a TTW user — `brief_coverage.
   submitted_by` already records this, just never selected/joined/
   displayed anywhere, cheap to add), a comment section (each comment
   upvote/downvote-able), and a way to see who liked the coverage item.
   No comment system exists anywhere else in the app to reuse — this is
   genuinely new. Bundle in: `cursor: pointer` on the whole card on
   hover (it becomes the click target) — except the external-link arrow
   button, which keeps its own click behavior (`stopPropagation` already
   exists on that element, confirm it still works once the card itself
   becomes clickable).
2. **Remove the score badge** from cards — confirmed present
   (`coverage.score` rendered via `HeaderChip` when set). Trivial: stop
   rendering it (keep the underlying data/admin-set field for later,
   don't drop the column, this is a display-only removal "for now" per
   the user's own phrasing).

#### Prompt for next session — Part 9

```
Read docs/design/brief-feature/brief-page-part2-plan.md in full before
doing anything else — §0 for context, §1 for engineering conventions.

Build Part 9 (docs/design/brief-feature/brief-page-part2-plan.md §2,
Part 9) — app/briefs/[slug]/coverage.tsx.

1. Migration: brief_coverage_comments (id, coverage_id, user_id, body,
   created_at) and brief_coverage_comment_votes (comment_id, user_id,
   direction up/down, one row per user per comment — partial unique
   index). Update lib/data/coverage.ts to select submitted_by joined to
   users (name/avatar), and to fetch comments + vote tallies for the
   modal.
2. Build the click-through modal: opened by clicking anywhere on
   CoverageCard except the external-link arrow (which must keep its
   existing stopPropagation) and the like button. Show: outlet/title/
   image (reuse what's already on the card), submitting TTW user if
   present, a comment list with per-comment up/down vote buttons, a
   comment submission form (any logged-in member), and a "who liked
   this" list (query brief_coverage_likes joined to users).
3. Add cursor-pointer + a visible hover state to the whole
   CoverageCard div (it currently has no click affordance at all).
4. Remove the score HeaderChip render from CoverageCard — leave
   coverage.score and its admin-set path untouched in the data layer.

Verify: bunx tsc --noEmit && bun run lint clean, browser-check: clicking
a card (not the arrow, not the like button) opens the modal, a comment
can be posted and voted on, the who-liked list is correct, the score
badge no longer renders anywhere, the external link and like button
still work independently of the new card click handler.
```

---

### Part 10 — Propose-a-brief completion

**Depends on: "Admin: convert a brief proposal into a new brief"**
(existing Notion Story, `39846e444969814da66ce3fa228a8daa`, tracked
under the Briefs epic, dual-linked into this one — build it as part of
this part's step 2, it's small enough not to warrant its own separate
plan part).

Correction from scoping: the "Propose a new brief" submission itself
already works end to end — `proposeBrief` action, `brief_proposals`
insert, confirmation email, in-modal success screen all exist and are
wired (the user's original belief that it had "no functionality
attached" was about a styling/affordance issue, already fixed
separately in `fix/brief-cursor-and-propose-brief-button`). What's
actually missing:

1. **Dashboard status card** for the submitter — a card on their home
   dashboard reflecting pending/approved/declined status for any brief
   proposal they've submitted.
2. **Admin approve → link to published brief → notify submitter.**
   Admin converts an accepted proposal into a real brief (or links an
   existing one they wrote based on it), can flag "not too significant
   changes" on the approval, and the submitter gets notified (email,
   matching the existing confirmation-email pattern) with a link to the
   published brief once available.
3. **Section 01 contributors list**, populated from accepted/converted
   proposals — each contributor name links to `/profile/[id]`. Depends
   on step 2 existing first (that's what populates this list).

#### Prompt for next session — Part 10

```
Read docs/design/brief-feature/brief-page-part2-plan.md in full before
doing anything else — §0 for context, §1 for engineering conventions.
Also read the Notion Story "Admin: convert a brief proposal into a new
brief" (https://app.notion.com/39846e444969814da66ce3fa228a8daa) for any
additional detail recorded there beyond what's summarized below.

Build Part 10 (docs/design/brief-feature/brief-page-part2-plan.md §2,
Part 10) — spans app/home (dashboard card), app/admin (conversion flow),
and app/briefs/[slug]/BriefView.tsx (contributors list).

1. Add a status card to the logged-in home dashboard (app/home/
   page.tsx) showing the current user's own brief_proposals rows and
   their status (pending/approved/declined) — read that page's existing
   card patterns first, match the style.
2. Migration: add whatever brief_proposals needs to support the
   approval flow — a published_brief_id (nullable FK to briefs, set on
   conversion/linking), a minor_changes_flag (boolean, admin sets it),
   status enum (pending/approved/declined) if not already present.
   Build the admin UI (app/admin/AdminScreen.tsx's existing proposals
   tab) to convert a proposal into a new brief (pre-fill the admin brief
   editor from the proposal's topic_title/why_it_matters) or link an
   already-existing brief to it, set the minor-changes flag, and send a
   notification email to the submitter (mirror the existing
   sendApprovalEmail-style pattern in lib/email/) once published_brief_id
   is set.
3. Query accepted/converted proposals for a given brief (via
   published_brief_id) and render a "Contributors" list in BriefView.tsx's
   hero — each name a link to /profile/[id]. Only render the section
   when there's at least one contributor (no empty-state chip needed,
   this is a strictly additive list).

Verify: bunx tsc --noEmit && bun run lint clean, browser-check the full
loop: submit a proposal → dashboard shows pending → admin converts it
into a brief → submitter's dashboard updates to approved → new brief
shows the submitter's name in its Contributors list, linking to their
profile.
```

---

### Part 11 — Sticky jump-to-section navigation (design-first)

**Depends on:** nothing structurally, but treat as design-first per the
user's explicit direction — don't write the component until a direction
is signed off.

Confirmed absent entirely: the artifact has both a mobile `.jumpbar`
(tap to open a sheet listing every section) and a desktop sticky `.rail`
sidebar (shows current section, sections before/after). Neither was ever
built on the live page. The user explicitly does **not** want a literal
copy of the artifact's version — they described it as wanting something
less visually obtrusive/less obviously "a scrolling widget" than the
artifact's rail. Produce a design direction first (a couple of options,
inline mockup or small artifact), get sign-off, then build.

#### Prompt for next session — Part 11

```
Read docs/design/brief-feature/brief-page-part2-plan.md in full before
doing anything else — §0 for context, §1 for engineering conventions.
Also open the reference artifact
(https://claude.ai/code/artifact/459ed0f0-4f72-48bd-9a7e-f932ca1d8272)
and look specifically at its .jumpbar (mobile) and .rail (desktop)
implementation as a starting point to deliberately move away from, not
copy.

This part is design-first. Do not write the navigation component until
the user has signed off on a direction.

1. Propose 2-3 visual directions for the sticky section nav — something
   quieter/less prominent than the artifact's persistent left-rail
   sidebar (the user's specific complaint about the artifact's version).
   Consider: a collapsed-by-default indicator that only shows current
   section number/label and expands on interaction, a bottom-edge
   progress bar with tick marks, or a minimal top-bar dropdown (similar
   spirit to the artifact's mobile jumpbar, but offered on desktop too
   instead of a permanent sidebar). Share these with the user (inline
   description is fine, or a quick artifact mockup if that communicates
   better) and get explicit sign-off on one before writing code.
2. Once a direction is chosen: build it. Needs section boundaries/refs
   for every top-level section in BriefView.tsx (hero, tldr, quotes,
   explainer, faq, qa, cta, coverage, related — reuse the existing
   SECTION_META num/label values where applicable rather than inventing
   new labels), scroll-spy logic to track the current section (IntersectionObserver,
   not a scroll listener per react-best-practices' passive-listener
   guidance), and both a mobile and desktop presentation per whatever
   the signed-off direction specifies.

Verify: bunx tsc --noEmit && bun run lint clean, browser-check the nav
correctly tracks scroll position through a full brief page, works on
both mobile and desktop viewport widths, and doesn't visually dominate
the page the way the user flagged the artifact's version as doing.
```

---

### Part 12 — Cleanup and final verification

Do this last, after every part above has shipped and been signed off
individually.

1. Full regression pass: `bunx tsc --noEmit`, `bun run lint`, full
   `bunx playwright test` run.
2. Browser-check the whole Brief page top to bottom, in both light and
   dark (if applicable — confirm dark mode's current status, it was
   disabled by design as of the Two-Ink Bold plan, don't assume it's
   been re-enabled without checking), as a logged-out visitor, a
   logged-in creator/journalist, and a logged-in expert/org, and as
   admin.
3. Confirm every Notion Story under the "Briefs Part 2" epic
   (`https://app.notion.com/p/3bf46e44496981269da9c23c08905170`) is
   marked Done, and that none of the "design-first" items (quote marks,
   jump nav) shipped without the sign-off step actually having happened.
4. Get the user's final sign-off across the whole page as one coherent
   whole, not just part-by-part — same convention as the Two-Ink Bold
   plan's own Part 10.

#### Prompt for next session — Part 12

```
Read docs/design/brief-feature/brief-page-part2-plan.md in full before
doing anything else — §0 for context, §1 for engineering conventions.

Build Part 12 (docs/design/brief-feature/brief-page-part2-plan.md §2,
Part 12) — final cleanup, do this last, only once every other part in
this plan has shipped.

1. Full verification pass: bunx tsc --noEmit, bun run lint, the full
   Playwright suite (bunx playwright test).
2. Browser-check the whole brief page top to bottom as: logged-out
   visitor, logged-in creator/journalist, logged-in expert/org,
   logged-in admin. Confirm current dark-mode status in
   app/globals.css before testing it — it may still be intentionally
   disabled.
3. Query the "Briefs Part 2" Notion epic's Stories
   (collection://39546e44-4969-8093-8e61-000b8cd813ae, filtered to
   Epics containing 3bf46e44-4969-8126-9da9-c23c08905170) and confirm
   every one is Done. Flag any that aren't, rather than silently closing
   this part out with open Stories remaining.
4. Get the user's final sign-off across the whole page as one coherent
   whole — check that section-to-section transitions read consistently,
   not as a pile of independently-shipped fixes.
```
