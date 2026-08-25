# Profile page — Rework plan

**Status: draft, not started.** This plan is the Profile-page counterpart
to `brief-feature/brief-page-part2-plan.md` — same convention, same
part-by-part build order, same sign-off process. It currently has one
fully-scoped part (below), seeded from a gap found while building Brief
Part 2. More parts will be added here as more Profile-page issues get
identified, the same way the Brief plan grew from a single read-through
of the live page.

## How to use this

Same convention as the Brief page plans: each part below is
independently buildable and has a ready-to-paste "prompt for next
session" block. Every part needs the user's explicit sign-off before
being considered done, not just green CI/lint/tsc.

Tracking: no Notion epic exists for this plan yet (unlike the Brief
plans, which track status in a Notion Epic/Story pair). Until one is
created, track status in this doc — mark a part's heading `[DONE]` once
it ships and is signed off.

---

## 0. Where this comes from

Found 2026-08-25 while building Brief Part 2's Community Q&A
answer-submission flow (`brief-page-part2-plan.md` §2, Part 7): the user
asked whether an expert who submits a Q&A/FAQ answer sees it as pending,
then approved/rejected, on their own profile — and if so, whether that
status is visible only to them and admins. It isn't visible anywhere at
all today (Part 1 below). This is Profile-page work, not Brief-page
work — the fix lives in `app/profile/[id]/`, not `app/briefs/[slug]/` —
so it's split out into its own plan rather than folding into Brief
Part 2.

**Reference material to read before starting any part:**
- `brief-feature/two-ink-bold-plan.md` §4 and `brief-feature/brief-page-part2-plan.md`
  §1 — this plan's own §1 below adapts the same general conventions
  (Bun, migration numbering, sign-off process) for Profile-page work;
  skim those for the fuller rationale rather than assuming this doc
  repeats it all.
- `app/profile/[id]/*.tsx` — read the specific files each part touches
  before editing; this doc gives you the delta, not a full component
  spec, since `ProfileView.tsx`/`cards.tsx` already exist and already
  contain the pattern Part 1 extends.

---

## 1. Engineering conventions

- **Bun only** — `bun run lint`, `bunx tsc --noEmit`, `bunx playwright
  test`, never npm/npx/node (project `CLAUDE.md`).
- **Migration numbering**: check `supabase/`'s actual highest-numbered
  file immediately before opening a PR, not just when you start — this
  repo has hit real numbering collisions between parallel branches more
  than once (see `brief-page-part2-plan.md` §1 and its own migration
  history for two examples). Apply new migrations via the Supabase
  Management API (`SUPABASE_ACCESS_TOKEN` in `.env.local`,
  `POST /v1/projects/kofimpjhjpgjotjanglq/database/query`), not the
  dashboard SQL Editor.
- **Regenerate `lib/database.types.ts`** after every migration:
  `bunx supabase gen types typescript --project-id kofimpjhjpgjotjanglq
  --schema public > lib/database.types.ts`.
- **RLS conventions**: match the existing shape for "own pending item
  private, approved item public" — `012_brief_contributions.sql`'s
  two-policy split (`"Members can read approved contributions"` +
  `"Contributors can read own contributions"`) is the reference
  implementation; Part 1 below reuses this exact shape rather than
  inventing a new one.
- **Verify in-browser before calling any part done.** If a second
  session's dev server is already running against this repo directory,
  see `[[build_plan_dev_server_lock]]` memory rather than assuming a
  feature is broken when your own `preview_start` won't bind. If the
  Browser pane's click/screenshot tooling stalls (a `document.hidden`
  compositing issue observed repeatedly during Brief Part 7's
  verification — see that session's notes), fall back to direct
  server-rendered `curl` checks with an injected session cookie rather
  than burning time forcing a live click-through.
- **Every part needs the user's explicit sign-off, not just green CI.**
- **This is a shared working directory.** Branches and file contents
  have changed mid-session before from other concurrent activity —
  check `git status`/`git branch --show-current` before assuming the
  tree matches what you last saw.

---

## 2. Part-by-part build order

### Part 1 — Private submission-status history (FAQ & Q&A answers)

**Depends on:** nothing.

**The gap.** An expert/organisation who submits an answer — either to a
brief's FAQ (`brief_faq_answers`, migration 021) or to a Community Q&A
question (`question_answers`, migration 043) — gets a one-time inline
confirmation in the submission form itself ("Answer submitted for
review — it will appear here once approved") and then nothing. There is
no persistent place to check whether it's still pending, was approved,
or was rejected. Both tables already have an `"Authors can read their
own answers"`-shaped RLS policy (author can read their own row
regardless of status) — the DB access exists, nothing in the app queries
it.

**The existing precedent.** Two other submission types on this same
profile page already solve this correctly — copy their shape rather
than inventing a new one:
- **Correction proposals** (`brief_correction_proposals`, migration
  012): RLS split into `"Members can read approved contributions"`
  (status = `'approved'`, visible to any authenticated member) and
  `"Contributors can read own contributions"` (`auth.uid() = user_id`,
  no status filter — the owner additionally sees their own
  pending/dismissed rows). Data layer: `getUserCorrectionProposals` in
  `lib/data/briefs.ts`. UI: a "Correction proposals" section in
  `app/profile/[id]/ProfileView.tsx`, gated to
  `role === 'expert' || role === 'organisation'` and
  `(list.length > 0 || isOwnProfile)`; `CorrectionProposalCard` in
  `app/profile/[id]/cards.tsx` shows a "Pending review" badge only when
  `isOwnProfile && isPending` — so a stranger viewing the profile never
  even receives a pending row from the query, let alone sees its status.
- **Reviews & endorsements** (`brief_contributions`, migration 017):
  same shape, `getUserReviewHistory` in `lib/data/contributions.ts`,
  `ReviewHistoryCard` in `cards.tsx`.

**The wrinkle to resolve before building.** Correction proposals have a
real three-state status (`pending`/`approved`/`dismissed`) — a rejected
one still exists as a row the owner can see. FAQ answers and Q&A answers
don't: both tables are `pending`/`published` only (see
`021_brief_faq_answers.sql` and `043_question_answers_submission.sql`),
and admin's "Dismiss" action is a hard `DELETE`, not a status flip (see
`dismissFaqAnswer`/`dismissQuestionAnswer` in `lib/admin/actions.ts`, and
their own comments: *"No 'dismissed' status exists for this table... —
dismissal just deletes the row"*). So today, a rejected answer doesn't
become visible-as-rejected to its author — it silently disappears. **Ask
the user which behavior they want** before writing code:
1. Keep hard-delete — a rejected submission just vanishes from the
   author's history with no record (matches today's admin-side
   behavior exactly, zero migration work, but the author never learns
   why or that it happened).
2. Add a `'dismissed'` status value to both tables' check constraints
   (mirroring `brief_correction_proposals`'s three-state shape) and
   change `dismissFaqAnswer`/`dismissQuestionAnswer` to soft-delete
   (`update({ status: 'dismissed' })` instead of `.delete()`) — the
   author then sees a "Not approved" (or similar) badge, same place the
   "Pending review" badge already lives.

**What to build** (once the wrinkle above is resolved):
1. If option 2 above: migrations adding `'dismissed'` to both check
   constraints, and updating `dismissFaqAnswer`/`dismissQuestionAnswer`
   to soft-delete. Regenerate `lib/database.types.ts`.
2. Data layer: `getUserFaqAnswers(db, userId)` (new, in
   `lib/data/faq-answers.ts`) and `getUserQuestionAnswers(db, userId)`
   (new, in `lib/data/question-answers.ts`) — mirror
   `getUserCorrectionProposals`'s shape exactly (`.eq('user_id',
   userId)`, ordered newest-first, no status filter — RLS already
   scopes visibility correctly once run through the regular member
   client, not the admin client). FAQ answers need the brief title/slug
   *and* the parsed `question` text (their own match key); Q&A answers
   need it via the `questions` join (`question_text`, then
   `briefs(title, slug)` through `questions.brief_id`) — same join
   shape `getPendingQuestionAnswers` in `lib/data/admin.ts` already
   uses for the admin moderation tab.
3. Types: `ProfileFaqAnswer` / `ProfileQuestionAnswer` in
   `app/profile/[id]/page.tsx`, alongside the existing
   `ProfileCorrectionProposal`. Fetch both in the same `Promise.all` as
   the existing `getUserCorrectionProposals`/`getUserReviewHistory`
   calls (`react-best-practices`' async-parallel convention — don't
   sequential-await the new queries).
4. UI: two new sections in `ProfileView.tsx`, same gate as Correction
   proposals (`role === 'expert' || role === 'organisation'` —
   confirm whether `admin` should also see these, since Part 7 of the
   Brief plan made admin a submitter for both FAQ and Q&A answers) and
   the same `(list.length > 0 || isOwnProfile)` visibility. Card
   components in `cards.tsx` — either two new small bespoke cards
   mirroring `CorrectionProposalCard`'s granularity (the existing
   precedent: `CorrectionProposalCard` and `ReviewHistoryCard` are
   separate components despite being conceptually close), or one
   shared card parameterized by content type if the duplication turns
   out to be more than cosmetic — judgment call, but lean toward
   matching the existing granularity unless the shared version is
   clearly cleaner once both are drafted.

#### Prompt for next session — Part 1

```
Read docs/design/profile/profile-rework-plan.md in full before doing
anything else — §0 for context, §1 for engineering conventions.

Build Part 1 (docs/design/profile/profile-rework-plan.md §2, Part 1) —
private submission-status history for FAQ and Q&A answers on the
profile page.

0. First, ask the user to resolve "The wrinkle to resolve before
   building" in the plan doc: should a dismissed FAQ/Q&A answer stay a
   hard delete (submitter never sees it was rejected), or should
   dismissFaqAnswer/dismissQuestionAnswer (lib/admin/actions.ts) become
   a soft-delete (new 'dismissed' status value) so the submitter sees a
   "Not approved" badge? Don't assume — this changes the migration and
   admin-action scope.

1. If soft-delete was chosen: migrate both brief_faq_answers.status and
   question_answers.status check constraints to add 'dismissed', update
   dismissFaqAnswer/dismissQuestionAnswer to update() instead of
   delete(), regenerate lib/database.types.ts.

2. Add getUserFaqAnswers (lib/data/faq-answers.ts) and
   getUserQuestionAnswers (lib/data/question-answers.ts) — mirror
   getUserCorrectionProposals's shape in lib/data/briefs.ts exactly
   (.eq('user_id', userId), no status filter, newest-first). Read that
   function and its RLS policy (012_brief_contributions.sql) first —
   this task depends on brief_faq_answers/question_answers already
   having an equivalent "authors can read their own answers regardless
   of status" policy (021_brief_faq_answers.sql,
   043_question_answers_submission.sql), so no new RLS should be needed
   unless step 1 changed the status shape.

3. Add ProfileFaqAnswer/ProfileQuestionAnswer types and fetch both
   lists in app/profile/[id]/page.tsx's existing Promise.all alongside
   getUserCorrectionProposals/getUserReviewHistory — don't sequential-
   await them.

4. Add two sections to app/profile/[id]/ProfileView.tsx, same gating
   pattern as the existing "Correction proposals" section (check
   whether admin should also see these — Brief Part 7 made admin a
   valid submitter for both). Add card components to
   app/profile/[id]/cards.tsx, following CorrectionProposalCard's
   existing shape: a status badge visible only when isOwnProfile (and,
   depending on step 0's answer, distinguishing pending vs.
   dismissed/not-approved, not just pending vs. nothing).

Verify: bunx tsc --noEmit && bun run lint clean. Browser-check: submit a
test FAQ answer and a test Q&A answer as an expert/org test account,
confirm the pending item now shows on that account's own profile with a
private status badge, confirm it is NOT visible on that profile when
viewed as a different logged-in member, confirm it disappears from
"pending" (and shows correctly per step 0's choice) once an admin
approves or dismisses it from /admin.
```

---

## 3. Future parts

Not yet scoped. Add them here the same way Part 1 was found — as
specific gaps get identified on the live Profile page, not speculatively
ahead of time.
