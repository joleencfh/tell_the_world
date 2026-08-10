# Brief feature v2 — build plan & session prompts

**Status: in progress.** Step 1 done, step 2 partial, steps 3–7 not started.
Companion to [`brief-feature-design.md`](brief-feature-design.md) (the spec)
and the two wireframe files. This doc tracks build-order (§10) progress across
sessions and gives a ready-to-paste prompt for each remaining step.

Schema and code from step 1 / partial step 2 shipped in
[PR #18](https://github.com/joleencfh/ttw/pull/18) (branch
`feature/brief-v2-schema` → `master`) — **check whether it's merged before
starting the next step**; if it's still open, branch off `feature/brief-v2-schema`
instead of `master` so you're not missing the schema.

## How to use this

Each step below has a "Prompt for next session" block — paste it into a fresh
Claude Code session to pick up that step. They're written to stand alone (no
memory of this conversation assumed), but they do assume PR #18 has landed —
i.e. migration `017` is live and the code in this repo already reflects it.

---

## Step 1 — Schema migration ✅ DONE

Migration `supabase/017_brief_feature_schema.sql`, run against the live DB.
Covers: `briefs` amendments (`subtitle`, `last_reviewed_at`, `topic_tag`,
`pinned_media_post_id`; `tldr` column dropped), `brief_sections` enum swap to
the new 7-value `section_type` + `content_version`, new `contested_points`
table, new polymorphic `brief_contributions` table (review/endorsement/take/
comment) with RLS and the two partial unique indexes from design doc §3.3
rule 1. The old free-text `brief_contributions` table was renamed to
`brief_correction_proposals` to free up the name, with matching renames
across ~9 TS files.

No further work needed here unless a later step's prompt below calls out a
schema gap.

---

## Step 2 — Brief page restructure ⚠️ PARTIAL

**Done:** section rendering (`app/briefs/[slug]/section-content.tsx`,
`BriefView.tsx`) moved to the new 7-type order; the admin editor
(`lib/admin/brief-actions.ts`, `EditBriefScreen.tsx`) authors all 7 section
types; TLDR sources from its own section instead of the retired
`briefs.tldr` column; a content-loss bug (multiple rows sharing one section
type only rendering the first) was fixed.

**Not done — what design doc §2 still calls for:**
- Quotes section still pulls globally-recent quotes (`lib/data/posts.ts
  getRecentQuotes`), not filtered by the brief's `topic_tag` against
  `content_posts.topic_tags`.
- No Media section exists at all (auto-pulled + one `pinned_media_post_id`
  pick, per §2 row 8).
- `use_this`, `featured_news`, `explainer`, `where_experts_stand` sections
  render as plain paragraphs — none of the wireframe's bespoke layouts
  (three-column "Use This", dated featured-news items, numbered explainer
  subsections) exist. This may be an acceptable v2-MVP fallback; it's a
  design judgment call, not a bug.
- Header has no endorsement bar, read time, or "last reviewed" chip (§2 row 1,
  §8). Read time and last-reviewed-date don't depend on contributions data
  and can be built now; the endorsement bar's *counts* will legitimately read
  zero until step 4 (review-pass) produces real review/endorsement rows —
  that's fine, build it to read live from `brief_contributions` regardless.
- `subtitle`, `topic_tag`, `pinned_media_post_id` columns exist but have no
  admin UI to set them.

### Prompt for next session

```
Continue the brief feature v2 build (design doc: docs/design/brief-feature/brief-feature-design.md,
wireframes: docs/design/brief-feature/brief-wireframes.html and brief-wireframes-mobile.html,
progress tracker: docs/design/brief-feature/build-plan.md). This is build-order §10 step 2,
finishing the part that wasn't done yet:

1. Wire the Quotes section (app/briefs/[slug]/BriefView.tsx, lib/data/posts.ts) to the
   brief's topic_tag instead of pulling globally-recent quotes — filter content_posts by
   post_type='quote' and topic_tags @> [briefs.topic_tag].
2. Build the Media section (§2 row 8): auto-pulled content_posts by the same topic_tag
   (non-quote types), with the brief's pinned_media_post_id item shown first as
   "Start here". Add admin UI in EditBriefScreen.tsx to set topic_tag and pick a
   pinned_media_post_id.
3. Add the header chip bar to BriefView.tsx's hero: read time (computed from authored
   section text only — tldr, use_this, featured_news, explainer, going_deeper, faq;
   exclude annotations/takes/quotes/Q&A per design doc §11) and a "Last reviewed"
   chip from briefs.last_reviewed_at. Add an endorsement-bar chip that queries
   brief_contributions for published, current review/endorsement counts per design
   doc §8 — it'll correctly show zero until step 4 exists; that's expected, not a bug.
4. Add a subtitle field to EditBriefScreen.tsx and render it in the BriefView hero
   next to the title (design doc §2 row 1, §11: "one sentence, allowed a point of view").

Read the design doc §2, §8, and §11 before starting. Verify in the browser (dev server via
the run skill or preview_start) against the seeded "AI Alignment" brief, and run
bunx tsc --noEmit && bun run lint clean before calling it done.
```

---

## Step 3 — Annotation layer ⛔ NOT STARTED

Design doc §6.1–6.2. Three states per explainer/FAQ section: collapsed chip
strip (counts only), expanded inline panel (people + notes, no margin/hover),
amber "stale" chip after a substantive edit. Reads `brief_contributions`
scoped to `section_id`, comparing `contribution.section_version` against the
section's current `content_version` (design doc §4 — compute at render time,
never store a flag). The chip counts will be low/zero until step 4 exists to
generate real data; build against the live table regardless — no mocking.

### Prompt for next session

```
Continue the brief feature v2 build (design doc: docs/design/brief-feature/brief-feature-design.md,
wireframes: docs/design/brief-feature/brief-wireframes.html and brief-wireframes-mobile.html,
progress tracker: docs/design/brief-feature/build-plan.md). This is build-order §10 step 3:
the annotation layer on explainer and FAQ sections.

Build, per design doc §6.1–6.2:
1. A collapsed chip strip under each explainer/FAQ section: "✓ N reviewed · ★ N endorsed ·
   💬 N note[s]" — query brief_contributions filtered by section_id, type, and
   status='published'. Split reviewed vs endorsed counts (endorsers aren't double-counted
   as reviewers, per §8).
2. Staleness is computed at render time, never stored: a contribution row is stale when
   its pinned section_version < the section's current content_version (brief-level rows
   compare against the max content_version across the brief's sections). Stale rows drop
   out of the current counts and instead surface as one amber chip: "N reviews predate
   latest edit" (§6.2 — amber, never red, no top-of-page banner).
3. An expanded inline panel on chip click (accordion, never a modal/bottom sheet — design
   doc §9 mobile note) with two zones: People (avatar, name, affiliation, Reviewed/Endorsed
   badge, per-person "reviewed vN · current is vN" when stale) and Notes (published comments
   only). Add an "Add a note" button, visible to expert/organisation roles only, that inserts
   a comment-type brief_contributions row pinned to the section's current content_version,
   status='pending' (admin publishes later — that's step 7, don't build moderation UI here,
   just the insert).

Read design doc §4 (staleness semantics — this is load-bearing, don't turn it into a stored
flag) and §6 in full before starting. This will mostly show empty/zero states until step 4
(review-pass) exists to populate real review/endorsement rows — that's expected. Verify in
the browser and run bunx tsc --noEmit && bun run lint clean before calling it done.
```

---

## Step 4 — Review-pass screen ⛔ NOT STARTED

Design doc §7 + wireframe section 3 (desktop) / section 2 (mobile). New
route, single-screen checklist covering every reviewable section (explainer
subsections, FAQ, TLDR) plus an optional brief-level "confirm as a whole"
row. One submit writes everything at once. This is the main way
`brief_contributions` gets populated in volume, so steps 3/5's chip counts
will start reflecting real data once this ships.

### Prompt for next session

```
Continue the brief feature v2 build (design doc: docs/design/brief-feature/brief-feature-design.md,
wireframes: docs/design/brief-feature/brief-wireframes.html section 3 and
brief-wireframes-mobile.html section 2, progress tracker: docs/design/brief-feature/build-plan.md).
This is build-order §10 step 4: the review-pass screen, described as "the single most
important flow for participation" (§7).

Build a new route (e.g. app/briefs/[slug]/review/page.tsx), gated to logged-in expert/
organisation users, reached via a "Review this brief" button (persistent in the rail per
§11's Variant A layout decision — add it to BriefView.tsx too).

Per design doc §7 exactly:
1. Verbatim or close to the top: "Only confirm sections within your expertise — skipped
   sections simply won't list you as a reviewer."
2. One row per reviewable section (every explainer subsection, FAQ, TLDR): title + first
   line of content, a "Looks right" checkbox, an "Endorse" toggle (disabled until "Looks
   right" is ticked — labels are load-bearing per §11, do not rename to "Verified"/"Accurate"),
   an optional note field.
3. One submit writes everything at once (a single server action, not one per row):
   - Ticked rows → review (or endorsement, if the toggle was on) rows in brief_contributions,
     status='published' immediately (§5.4 — binary signals, no moderation), section_version
     pinned to the section's current content_version.
   - Note field filled in → a comment row, status='pending' (§5.4 — comments moderate).
   - Blank rows → no row at all. This is the load-bearing "silence = no claim" rule from
     §5.2 — never write a row for an unticked section, never interpret it as disapproval.
   - This needs upsert semantics, not plain insert: the two partial unique indexes from
     migration 017 (one row per user per section, one per user per brief) mean a second
     submission must UPDATE the existing row (reconfirm — bumps section_version and
     updated_at, per §3.3 rule 3) rather than erroring on conflict.
4. Optional final row: "Confirm the brief as a whole" → one brief-level row (both
   section_id and contested_point_id null) pinning the *max* content_version across the
   brief's sections (§3.3 rule 2).

Read design doc §5.1–5.2 and §7 in full — the blank/pass semantics and the review vs.
endorsement distinction are the two easiest things to get subtly wrong here. Verify in the
browser as a logged-in expert (playwright/.auth/expert.json can be cookie-injected the same
way past sessions verified auth'd pages), and run bunx tsc --noEmit && bun run lint clean
before calling it done.
```

---

## Step 5 — "Where experts stand" contested-point cards ⛔ NOT STARTED

Design doc §6.3 + wireframe section 4 (desktop) / section 3 (mobile). The
`contested_points` table exists (migration 017) but nothing reads or writes
it yet. Needs: admin UI to create points (author-only, per §3.2), a
"Write a take" flow for experts/orgs, and the card rendering itself
(chronological, equal visual weight — no ranking by seniority).

### Prompt for next session

```
Continue the brief feature v2 build (design doc: docs/design/brief-feature/brief-feature-design.md,
wireframes: docs/design/brief-feature/brief-wireframes.html section 4 and
brief-wireframes-mobile.html section 3, progress tracker: docs/design/brief-feature/build-plan.md).
This is build-order §10 step 5: contested-point cards inside the "Where experts stand" section.

The contested_points table already exists (migration 017, brief_id/question/display_order) —
nothing reads or writes it yet. Build:

1. Admin UI to create/reorder contested points on a brief (points are author-created only,
   per design doc §3.2 — experts never create points, only takes on them). Add this to
   EditBriefScreen.tsx or a dedicated sub-screen.
2. Card rendering in BriefView.tsx's where_experts_stand section: question as title, takes
   stacked below in chronological order with equal visual weight — no ordering by seniority,
   no "official" answer (§6.3 — this is explicitly load-bearing: "the moment one take looks
   privileged, minority-position experts stop contributing"). Only published takes render.
3. A "Write a take" button per card, visible to expert/organisation roles only, opening a
   plain text field (~100 words, question as the prompt per the wireframe) that inserts a
   brief_contributions row: type='take', contested_point_id set, section_id null, body
   required, section_version null (takes don't pin a version — design doc §3.3 table),
   status='pending' (admin publishes — step 7 builds the moderation UI, don't build it here).

Read design doc §6.3 and the "take" row of the §3.3 shape-rules table before starting —
takes are the one contribution type that doesn't pin section_version and requires
contested_point_id instead of section_id/brief_id. Verify in the browser and run
bunx tsc --noEmit && bun run lint clean before calling it done.
```

---

## Step 6 — Reconfirmation email + one-click re-pin ⛔ NOT STARTED

Design doc §7.1. Weekly digest (never per-edit), one-line author-written
change summary per section, a magic-link "Still looks right" action that
bulk re-pins all of that expert's stale rows on a brief in one click, plus a
secondary (less prominent) link to review section-by-section or withdraw.
This depends on step 7's "substantive change" toggle existing to produce the
change-summary text — check whether step 7 has landed before starting this
one, or build the summary field as part of this step if not.

### Prompt for next session

```
Continue the brief feature v2 build (design doc: docs/design/brief-feature/brief-feature-design.md,
progress tracker: docs/design/brief-feature/build-plan.md). This is build-order §10 step 6:
the reconfirmation email and one-click re-pin flow (design doc §7.1).

Check docs/design/brief-feature/build-plan.md's step 7 status first — the change-summary
line this email needs is written by the "substantive change" toggle from step 7. If step 7
hasn't landed, add a minimal change_summary text field wherever content_version gets bumped
so this step has something to send; step 7 can take over that UI properly later.

Build:
1. A weekly digest job (this repo has no existing scheduled-job infra — check for one before
   assuming you need to add cron/a scheduled task; Resend is already wired via lib/email/,
   follow the pattern in lib/email/send-approval.ts) that, per expert with stale
   review/endorsement rows on a brief, sends one email: "N sections you reviewed in
   <brief title> were updated", body listing the one-line change summary per stale section.
2. A magic-link primary action, "Still looks right", that re-pins ALL of that expert's stale
   rows on that brief in one click — bulk update section_version to each section's current
   content_version (or the brief's max, for brief-level rows) and bump updated_at. No new
   rows, nothing deleted (§3.3 rule 3).
3. A secondary, less prominent link/flow to review changes section-by-section, or withdraw a
   review (sets status='archived' on that row).

Read design doc §7.1 in full — the "never instant per-edit emails, weekly digest only" rule
and the "one click total" framing for reconfirm are both explicit design decisions, not
suggestions. Run bunx tsc --noEmit && bun run lint clean before calling it done; email sends
are hard to verify in a browser preview, so check the Resend dashboard or logs instead of
guessing it works.
```

---

## Step 7 — Admin moderation + "substantive change" toggle ⛔ NOT STARTED

Design doc §5.4 (moderation), §4 (versioning). Two independent pieces: (a) an
admin tab to publish/archive pending `comment`/`take` rows, following the
exact pattern already built for `brief_correction_proposals` moderation; (b)
a toggle in `EditBriefScreen.tsx` that, only when explicitly flagged as a
substantive edit, bumps the changed section(s)' `content_version` and
requires a one-line change-summary (consumed by step 6's email).

### Prompt for next session

```
Continue the brief feature v2 build (design doc: docs/design/brief-feature/brief-feature-design.md,
progress tracker: docs/design/brief-feature/build-plan.md). This is build-order §10 step 7:
admin moderation of pending comments/takes, and the "substantive change" toggle in the brief
editor.

Part A — moderation tab. Follow the existing brief_correction_proposals moderation pattern
exactly (lib/admin/actions.ts getPendingCorrectionProposals/approveCorrectionProposal/
dismissCorrectionProposal, lib/data/admin.ts, app/admin/AdminScreen.tsx + cards.tsx tab) but
for brief_contributions rows where type in ('comment','take') and status='pending'. Approve
sets status='published'; dismiss sets status='archived'. Design doc §3.3 rule 4 also wants a
way for the admin to archive a *published* comment once its correction has been addressed
(manual, no automation) — add that action too, not just the pending-queue approve/dismiss.

Part B — substantive change toggle. In app/admin/briefs/[id]/EditBriefScreen.tsx, add a
per-save toggle ("substantive change" vs. typo/formatting fix) and, when on, a required
one-line change-summary text field. On save (lib/admin/brief-actions.ts saveBrief), only
increment content_version on sections whose content actually changed AND only when the
toggle was on — typo fixes must save without bumping the version (design doc §4: "the
pressure valve... if reviewers complain their reviews were invalidated by trivial edits, the
toggle was misused, not the model"). Persist the change-summary somewhere step 6's
reconfirmation email can read it per section (check whether a change_summary field already
exists from step 6 having run first — if step 6 already added one, use it instead of adding
a duplicate).

Read design doc §4 and §5.4 in full before starting — content_version must stay purely
author-controlled via this toggle, never auto-bumped by any other code path (no trigger, no
"any edit counts" fallback). Run bunx tsc --noEmit && bun run lint clean before calling it
done.
```

---

## Suggested order

The design doc's own framing: steps 1–3 make the page trustworthy, 4–5 make
it participatory, 6–7 make it maintainable. Practically:

1. Finish **step 2** (auto-wiring + header chips) — cheap, no new UI surfaces,
   makes the page structurally complete.
2. **Step 4** (review-pass) before step 3 (annotation layer) is worth
   considering even though the doc lists them in the other order — step 3's
   chip UI is much easier to build and verify against real data if step 4
   already exists to produce it, rather than staring at permanent zero-states.
3. **Step 3** once step 4 exists.
4. **Step 5** (contested points) — independent of 3/4, can slot in anytime
   after step 1.
5. **Step 7** before **step 6** — step 6's email needs step 7's change-summary
   field to say anything meaningful.
