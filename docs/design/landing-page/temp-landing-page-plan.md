# Temp Landing Page — Silent Launch

**Status: draft, not started.** This plan replaces the current homepage
(`app/page.tsx`) with a minimal "silent launch" page (per Y Combinator's
silent-launch concept: domain, name, short description, contact info,
one call to action — nothing else) while the real product isn't ready
for public traffic yet. It also closes a real security gap in OAuth
sign-in that this work surfaced.

This is explicitly **temporary**. The current landing page (briefs
teaser grid, trust strip, full "Apply to join" flow) is not deleted —
it's preserved in the codebase so it can be brought back once a
longer-term landing page is designed. This plan only changes what
renders at `/`.

## How to use this

Same convention as `brief-page-part2-plan.md`: each part below has a
ready-to-paste "prompt for next session" block. Parts are ordered —
**Part 0 (design proposals) must be signed off before Part 3
(implementation) starts.** Parts 1, 2, and 4 have no dependency on Part
0 and can be built in any order relative to it. Every part needs the
user's explicit sign-off before being considered done, not just green
CI/lint/tsc.

---

## 0. Where this comes from

The user wants to do a silent launch: a landing page stating what Tell
The World is, with a single "Join Waitlist" call to action leading to a
form that collects enough information to reach out to people later —
without exposing the full, still-unfinished product or the detailed
role-specific application flow.

Requirements gathered directly from the user, plus decisions made
answering follow-up questions during scoping (2026-08-23):

- **Old landing page content is not deleted.** `app/page.tsx` currently
  has real, fairly built-out content (mock briefs teaser grid, an
  experts/orgs trust strip, a full "Apply to join" flow) — it's not
  discarded, just moved out of the way so a future, more permanent
  landing page can reuse it.
- **Waitlist data lives in its own new table**, separate from
  `applications`. The fields differ enough (role labels, LinkedIn/site,
  a freeform "anything else" field) and the review need is lighter
  (just a list to glance at, not the existing multi-stage
  approve/reject pipeline) that reusing `applications` would mean
  bending its shape rather than fitting it.
- **Waitlist roles reuse the existing `user_role` enum**
  (`creator`/`expert`/`organisation`/`journalist`) rather than a
  separate set of options — the UI label for `expert` reads "AI safety
  expert interested in comms," but the stored value stays `expert` so a
  waitlist row is directly convertible into a real `users` row later
  without a manual mapping step.
- **OAuth sign-in gap, found while scoping this**: `proxy.ts` only
  checks "is there a Supabase auth session," not "is this an approved
  member." Magic-link sign-in already blocks unknown emails
  (`shouldCreateUser: false` in `lib/auth/actions.ts`), but Google/
  LinkedIn OAuth has no equivalent gate — anyone can complete OAuth and
  land on `/home` today, session-valid, with no `users` row. The user
  confirmed this needs fixing as part of this plan: an OAuth sign-in
  from an email with no `users` row should be signed out immediately
  with a clear message, not let through.
- **Design proposals first.** The user explicitly wants a few visual
  directions for the new page (as Artifacts) to choose from before any
  implementation starts — same design-first sequencing this codebase
  already uses for other visual-judgment items (see
  `brief-page-part2-plan.md` Part 4 step 6 and Part 11).
- **Copy tone.** The user was explicit: copy must not read as
  AI-written. No em dashes. Avoid overused LLM tells — "quietly,"
  "genuinely," rule-of-three constructions ("X, Y, and Z" used as a
  rhetorical flourish), and similar. Write plainly, the way a person
  who works here would write it.

**Reference material to read before starting any part:**
- `two-ink-bold-plan.md` §1 (design tokens/components) and §4
  (engineering conventions) — this plan reuses both. The existing
  design system (Segoe UI display font, `paper`/`ink`/`pink`/`blue`
  color tokens, mono uppercase eyebrow/label treatment, `border-line`
  card style) is the visual language the new page must stay inside —
  this is not a from-scratch redesign, it's the existing system applied
  to a much smaller page.
- `app/page.tsx`, `app/login/page.tsx`, `lib/auth/actions.ts`,
  `app/auth/callback/route.ts`, `proxy.ts` — read these before touching
  auth or the landing route; this doc gives deltas, not full specs.
- `lib/applications/actions.ts` — the pattern to mirror for the
  waitlist's honeypot + rate-limit + validation shape (Part 2).

---

## 1. Engineering conventions

Identical to `two-ink-bold-plan.md` §4 / `brief-page-part2-plan.md` §1 —
re-read those, don't assume you remember them. Specific to this plan:

- **Bun only.**
- **Migration numbering**: next is `039` as of this writing (highest
  existing is `038` — note there are currently *two* files both
  numbered `038`, `038_content_posts_moderation_and_likes.sql` and
  `038_brief_timeline_events.sql`, a numbering collision like the one
  documented in the project's `019` incident. Not this plan's job to
  fix, but re-check the actual highest number on `origin/master` right
  before naming a new migration — don't just trust `039` blindly if
  time has passed).
- **Regenerate `lib/database.types.ts`** after every migration:
  `bunx supabase gen types typescript --project-id kofimpjhjpgjotjanglq --schema public > lib/database.types.ts`.
- **RLS conventions**: match `supabase/034_brief_feedback.sql`'s shape
  for the new waitlist table — enable RLS, add only the policies
  actually needed (anon insert), no select policy (admin reads via the
  service-role client in `lib/supabase/admin.ts`).
- **Verify in-browser before calling any part done.** Check
  `[[build_plan_dev_server_lock]]` memory if a second session's dev
  server is already bound to this repo.
- **Every part needs the user's explicit sign-off, not just green CI.**
- **This is a shared working directory** — check `git status`/
  `git branch --show-current` before assuming the tree matches what you
  last saw.

---

## 2. Part-by-part build order

### Part 0 — Design proposals (design-first, do this before Part 3)

**Depends on:** nothing. **Blocks:** Part 3.

Produce 2–3 distinct visual directions for the new landing page, as
Claude Code Artifacts, before writing any page component. Each
direction should cover:

- The hero: eyebrow label, headline, one short subhead paragraph, the
  "Join Waitlist" primary button.
- What (if anything) sits below the fold — the reference screenshot the
  user shared shows a bare, single-viewport page; a direction may add a
  minimal secondary element (e.g. a one-line "what this is" restatement
  near the footer) but should stay close to the silent-launch brief:
  domain/name, short description, contact info, one call to action.
  Don't reintroduce the briefs grid or trust strip here — that's
  explicitly deferred.
- The "Join Waitlist" modal/form itself: role selector (four options,
  labeled per §0 above), email, full name, affiliation, LinkedIn/
  personal site URL, and an "Anything else?" freeform field.
- All copy, written in the user's actual final wording (or close to
  it) — not lorem ipsum, not placeholder AI-sounding filler. Apply the
  §0 copy-tone rules to the copy in the mockups themselves, not just to
  the eventual real page.

Use the existing design tokens exactly (`app/globals.css`'s
`--color-paper`/`--color-ink`/`--color-pink`/`--color-blue`, the Segoe
UI display font, mono uppercase micro-labels) so the directions read as
genuinely "the same product," not a detour into a new visual system.

Share the directions with the user and get explicit sign-off on one
(or an explicit hybrid of pieces from more than one) before starting
Part 3.

#### Prompt for next session — Part 0

```
Read docs/design/landing-page/temp-landing-page-plan.md in full before
doing anything else — §0 for context, §1 for engineering conventions.
Also skim app/globals.css for the exact design tokens and
docs/design/brief-feature/two-ink-bold-plan.md §1 for how they're meant
to be used.

Build Part 0 (docs/design/landing-page/temp-landing-page-plan.md §2,
Part 0) — design proposals only, no app code changes.

Produce 2-3 distinct visual directions for the new silent-launch landing
page as Claude Code Artifacts. Each should show: the hero (eyebrow,
headline, short subhead, "Join Waitlist" button), any minimal below-the-
fold content (stay close to a bare silent-launch page — don't
reintroduce the briefs grid or trust strip), and the Join Waitlist
modal/form (role selector: Creator / Journalist / AI safety expert
interested in comms / Organisation, email, full name, affiliation,
LinkedIn or personal site URL, "Anything else?" freeform field).

Use real final-feeling copy in the mockups, not placeholder text. Follow
the copy-tone rules in §0 exactly: no em dashes, avoid "quietly,"
"genuinely," and rule-of-three rhetorical constructions — write plainly.
Match the existing design tokens in app/globals.css (paper/ink/pink/blue
colors, Segoe UI display font, mono uppercase micro-labels, border-line
card style) so it reads as the same product, not a new visual system.

Present the directions to the user and get explicit sign-off on one (or
a named hybrid) before Part 3 starts. Do not proceed to Part 3 in this
same session unless the user explicitly signs off first.
```

---

### Part 1 — Waitlist schema + admin view

**Depends on:** nothing. **Blocks:** Part 2 (needs the table to insert
into).

1. **Migration `039_waitlist_signups.sql`**: new table
   `waitlist_signups` — `id` (uuid pk, `gen_random_uuid()`), `role`
   (`user_role` enum, not null — reuses the existing enum per §0),
   `email` (text, not null), `full_name` (text, not null),
   `affiliation` (text, nullable), `linkedin_or_website_url` (text,
   nullable), `additional_info` (text, nullable), `created_at`
   (timestamptz, not null, default `now()`). Add a unique index on
   `lower(email)` so the same person can't be inserted twice — the
   submit action (Part 2) should turn a constraint violation into a
   friendly "you're already on the list" message, not a raw DB error.
   RLS: enable it, one insert policy for `anon, authenticated` (mirror
   `003_applications_rls.sql`'s shape — no `with check` restriction
   needed here since there's no status field to protect), no select
   policy (admin reads via the service-role client, same convention as
   `brief_feedback`).
2. Regenerate `lib/database.types.ts`. Add a `WaitlistSignupRow` alias
   in `lib/types.ts` next to the other `Tables<...>` aliases.
3. **Admin view**: add a new `'waitlist'` entry to `AdminScreen.tsx`'s
   `Tab` type and tab bar, a `getWaitlistSignups(db, page)` paginated
   query in `lib/data/admin.ts` (follow `getPendingApplications`'s
   shape exactly — `ADMIN_PAGE_SIZE`, `count: 'exact'`, `.range(...)`),
   and a `requireAdmin()`-gated wrapper export in `lib/admin/
   actions.ts`. Render as a simple read-only list/table (email, name,
   role, affiliation, LinkedIn/site link, additional info, submitted
   date) — no approve/reject workflow in this part; converting a
   waitlist row into a real `users` row is a manual/future step, not
   built here.

#### Prompt for next session — Part 1

```
Read docs/design/landing-page/temp-landing-page-plan.md in full before
doing anything else — §0 for context, §1 for engineering conventions.
Confirm the actual highest migration number on the current branch before
naming this one (last checked as 039, but re-verify).

Build Part 1 (docs/design/landing-page/temp-landing-page-plan.md §2,
Part 1) — schema + admin view, no public-facing form yet (that's Part
2).

1. Migration: create waitlist_signups (id uuid pk default
   gen_random_uuid(), role user_role not null, email text not null,
   full_name text not null, affiliation text, linkedin_or_website_url
   text, additional_info text, created_at timestamptz not null default
   now()). Unique index on lower(email). Enable RLS; one insert policy
   for anon + authenticated (mirror supabase/003_applications_rls.sql's
   shape, no with check needed); no select policy (service-role only,
   same convention as supabase/034_brief_feedback.sql).
2. Regenerate lib/database.types.ts. Add WaitlistSignupRow = Tables<
   'waitlist_signups'> to lib/types.ts.
3. Add a read-only "Waitlist" tab to app/admin/AdminScreen.tsx (Tab type
   + tab bar entry + panel), a paginated getWaitlistSignups(db, page) in
   lib/data/admin.ts (copy getPendingApplications's shape exactly), and
   a requireAdmin()-gated wrapper in lib/admin/actions.ts. Render email,
   name, role, affiliation, LinkedIn/site (as a link if present),
   additional info, and submitted date. No approve/reject actions in
   this part.

Verify: bunx tsc --noEmit && bun run lint clean, regenerate
lib/database.types.ts, browser-check: manually insert a test row (SQL
Editor or Management API) and confirm it shows up correctly in the new
admin Waitlist tab, paginated correctly once past 20 rows if you seed
that many.
```

---

### Part 2 — Waitlist join modal + form + submit action

**Depends on: Part 1** (needs `waitlist_signups` to exist) and **Part
0's sign-off** for the form's exact visual shape and copy (the fields
themselves are already specified below regardless of which direction
is chosen).

1. **`lib/waitlist/actions.ts`** (`'use server'`):
   `submitWaitlistSignup(form)`. Mirror `lib/applications/actions.ts`'s
   shape: a honeypot field (silently "succeed" if filled), an in-memory
   per-IP rate limit (reuse the same `WINDOW_MS`/`MAX_PER_WINDOW`
   constants unless the user wants this more permissive — waitlist
   submissions are lower-stakes than full applications, flag this to
   the user rather than silently picking a different number),
   validation (valid email; `role` must be one of the four `user_role`
   values; `full_name` required; URL field validated the same way
   `isValidUrl` does in the applications action; length caps on
   free-text fields). On the unique-email constraint violation, return
   a friendly "You're already on the waitlist" message rather than a
   raw Postgres error. Insert through the normal RLS client (not the
   admin client) — the anon insert policy from Part 1 is what makes
   this safe.
2. **`components/landing/WaitlistModal.tsx`** (client component): the
   modal/form matching Part 0's signed-off direction. Fields: role
   selector (four options, `expert` labeled "AI safety expert
   interested in comms" per §0), email, full name, affiliation,
   LinkedIn or personal site URL, "Anything else?" freeform textarea.
   Follow an existing modal's open/close + submit-then-success-screen
   pattern (e.g. `ContactModal` or `ProposeBriefModal` — check
   `components/` for the closest match) rather than inventing a new
   modal shape.
3. **No confirmation email in this part.** Applications send one via
   Resend; the waitlist doesn't need to yet — ask the user if they want
   one before adding it rather than assuming either way, since it's a
   small addition either direction (same `lib/email/send.ts` pattern)
   but changes scope.

#### Prompt for next session — Part 2

```
Read docs/design/landing-page/temp-landing-page-plan.md in full before
doing anything else — §0 for context, §1 for engineering conventions.
Confirm Part 1 has landed and Part 0 has a signed-off design direction
before starting — read whatever the user confirmed for the modal's
exact look before building it from scratch.

Build Part 2 (docs/design/landing-page/temp-landing-page-plan.md §2,
Part 2) — lib/waitlist/actions.ts and components/landing/
WaitlistModal.tsx.

1. lib/waitlist/actions.ts ('use server'): submitWaitlistSignup(form).
   Mirror lib/applications/actions.ts's honeypot + in-memory per-IP rate
   limit + validation shape. Validate: valid email, role is one of
   creator/expert/organisation/journalist, full_name required, URL
   fields valid if present, reasonable length caps on free text. Turn a
   duplicate-email unique-constraint error into a friendly "You're
   already on the waitlist" message. Insert via the normal RLS client
   (lib/supabase/server.ts), not the admin client.
2. components/landing/WaitlistModal.tsx: build the modal per Part 0's
   signed-off direction. Fields: role selector (Creator / Journalist /
   AI safety expert interested in comms / Organisation — labels only,
   values map to the user_role enum), email, full name, affiliation,
   LinkedIn or personal site URL, "Anything else?" textarea. Follow
   ContactModal or ProposeBriefModal's existing open/close +
   submit-then-success pattern (check components/ for whichever is the
   closer match) rather than a new modal shape from scratch.
3. Ask the user whether a confirmation email should be sent on
   submission before adding one — don't assume either way.

Verify: bunx tsc --noEmit && bun run lint clean, browser-check: submit
the form end to end with a temporary trigger point (a button anywhere is
fine for this part, Part 3 wires the real one), confirm the row appears
in the admin Waitlist tab (Part 1), confirm a second submission with the
same email gets the friendly duplicate message instead of a crash,
confirm the honeypot field silently no-ops when filled.
```

---

### Part 3 — The new landing page

**Depends on: Part 0's sign-off** (visual direction) and **Part 2**
(needs `WaitlistModal` to wire the button to). Do this last among
Parts 0–3.

1. **Preserve the current landing page, don't delete it.** Move
   `app/page.tsx`'s entire current contents (the `MEMBERS`/`BRIEFS`
   mock data, the illustration helpers, `PublicBriefCard`/
   `LockedBriefCard`, the full page JSX) into a new, non-routed file —
   `components/landing/LegacyLandingPage.tsx` — exporting a single
   component with the exact same output as today. Leave a short comment
   at the top pointing back to this plan doc, so a future session
   building the permanent landing page knows where to find it and why
   it moved. Nothing about `/apply` or `/briefs` changes — they keep
   working, they're just no longer linked from the homepage.
2. **Build the new `app/page.tsx`** per Part 0's signed-off direction:
   header (keep the existing `Logo` + "Sign in" link, unchanged),
   hero (eyebrow, headline, short subhead, "Join Waitlist" button
   opening `WaitlistModal`), whatever minimal below-the-fold content
   the signed-off direction includes, footer (reuse the existing
   `Footer` component). Use the real copy from the signed-off design,
   re-checked one more time against the §0 copy-tone rules before
   committing it.
3. Confirm `bun run build` still succeeds with `/apply` and `/briefs`
   present but unlinked (they should — nothing about their own code
   changes, only what points to them).

#### Prompt for next session — Part 3

```
Read docs/design/landing-page/temp-landing-page-plan.md in full before
doing anything else — §0 for context, §1 for engineering conventions.
Confirm Part 0 has a signed-off design direction and Part 2 has landed
(WaitlistModal must exist) before starting.

Build Part 3 (docs/design/landing-page/temp-landing-page-plan.md §2,
Part 3) — app/page.tsx and components/landing/LegacyLandingPage.tsx.

1. Move app/page.tsx's entire current contents verbatim into
   components/landing/LegacyLandingPage.tsx (same MEMBERS/BRIEFS data,
   illustration helpers, card components, full JSX) as a single exported
   component. Add a short comment at the top noting it was moved here by
   this plan and is not currently routed anywhere, kept for reuse when
   building the permanent landing page. Don't touch /apply or /briefs.
2. Write the new app/page.tsx per Part 0's signed-off direction: header
   (Logo + existing Sign in link), hero with the Join Waitlist button
   wired to components/landing/WaitlistModal.tsx, whatever minimal
   below-the-fold content was signed off, Footer. Use the exact copy
   from the signed-off direction, re-checked against this plan's §0
   copy-tone rules (no em dashes, no "quietly"/"genuinely", no
   rule-of-three flourishes) before finalizing.
3. Run bun run build and confirm it succeeds with /apply and /briefs
   still present but unlinked from the new homepage.

Verify: bunx tsc --noEmit && bun run lint clean && bun run build,
browser-check the new homepage matches the signed-off design, Join
Waitlist opens the modal and a real submission lands in the admin
Waitlist tab, /apply and /briefs/[a-real-slug] still load correctly when
visited directly.
```

---

### Part 4 — OAuth sign-in gating fix

**Depends on:** nothing (independent of Parts 0–3, can be built any
time, but worth doing before or alongside Part 3 since the silent
launch is exactly the moment this gap matters most — a "Sign in" link
sitting on a low-traffic pre-launch page is still a real door).

The security gap: `proxy.ts` only checks "is there a valid Supabase
auth session," not "is this an approved member." Magic-link sign-in
already blocks unknown emails via `shouldCreateUser: false`
(`lib/auth/actions.ts`), but Google/LinkedIn OAuth has no equivalent —
completing OAuth always succeeds at the Supabase Auth level regardless
of whether the person has a `users` row, and today that's enough to
reach `/home`.

1. **`app/auth/callback/route.ts`**: after
   `exchangeCodeForSession(code)` succeeds, look up the authenticated
   user's email in the `users` table using the service-role client
   (`lib/supabase/admin.ts` — this must bypass RLS since the anon/RLS
   client can't read arbitrary emails). If no matching row exists, call
   `supabase.auth.signOut()` to clear the session, then redirect to
   `/login?error=not_approved` instead of `next`. If a matching row
   exists, proceed exactly as today.
2. **`app/login/page.tsx`**: handle the new `error=not_approved` param
   with its own message — something like "This account isn't an
   approved member yet." — distinct from the existing generic
   `error=auth` message, using the same error-banner UI already there.
3. **Don't touch `lib/auth/actions.ts`'s `signInWithMagicLink`** — its
   `shouldCreateUser: false` gate is already correct, this part is
   OAuth-only.
4. **Note for the user, not something to silently paper over**: this
   only blocks *new* unapproved OAuth sign-ins going forward. Anyone
   who already completed OAuth before this fix ships and still has an
   active session isn't retroactively signed out by this change — flag
   that explicitly rather than implying full retroactive coverage.

#### Prompt for next session — Part 4

```
Read docs/design/landing-page/temp-landing-page-plan.md in full before
doing anything else — §0 for context (specifically why this gap exists
and what magic link already does right), §1 for engineering
conventions.

Build Part 4 (docs/design/landing-page/temp-landing-page-plan.md §2,
Part 4) — app/auth/callback/route.ts and app/login/page.tsx.

1. In app/auth/callback/route.ts, after exchangeCodeForSession succeeds,
   look up the authenticated user's email in the users table via the
   service-role client (lib/supabase/admin.ts). If no row exists, call
   supabase.auth.signOut() and redirect to `${origin}/login?error=
   not_approved` instead of `next`. Leave the existing success and
   error-code=auth paths unchanged.
2. In app/login/page.tsx's LoginForm, add handling for
   searchParams.get('error') === 'not_approved' with a distinct message
   ("This account isn't an approved member yet." or similar — you can
   refine the exact wording), using the existing error banner UI.
3. Do not modify lib/auth/actions.ts's signInWithMagicLink — its
   shouldCreateUser:false gate is already correct and out of scope here.

Verify: bunx tsc --noEmit && bun run lint clean, browser-check: an
existing approved member's OAuth sign-in still works end to end and
lands on /home. For the unapproved case, since real Google/LinkedIn
OAuth can't be faked in an automated test, either (a) temporarily point
the callback logic at a manually-triggered auth.users row you create and
then delete via the Supabase dashboard to simulate "authenticated but no
users row," or (b) clearly document for the user that this specific path
needs a manual check with a real, non-approved Google account before
being considered verified — don't claim it's browser-verified if it
wasn't actually exercised with a real unapproved identity.
```

---

### Part 5 — Cleanup and final verification

Do this last, after Parts 0–4 have shipped and been signed off.

1. Full regression pass: `bunx tsc --noEmit`, `bun run lint`,
   `bun run build`.
2. Browser-check the new homepage end to end as a logged-out visitor:
   Join Waitlist submits correctly, a duplicate email is rejected with
   the friendly message, the admin Waitlist tab shows the new row.
3. Re-read every piece of copy on the new homepage and in the waitlist
   modal against §0's copy-tone rules one final time (no em dashes, no
   "quietly"/"genuinely," no rule-of-three flourishes) — this is easy
   to drift on across multiple editing passes.
4. Confirm `/apply` and `/briefs/[slug]` still work when visited
   directly, and that `components/landing/LegacyLandingPage.tsx` isn't
   accidentally routed anywhere.
5. Confirm Part 4's manual OAuth check (an actual non-approved Google
   or LinkedIn account attempting sign-in) has been done, not just
   code-reviewed.
6. Get the user's final sign-off across the whole thing as one coherent
   piece of work, not just part-by-part.

#### Prompt for next session — Part 5

```
Read docs/design/landing-page/temp-landing-page-plan.md in full before
doing anything else.

Build Part 5 (docs/design/landing-page/temp-landing-page-plan.md §2,
Part 5) — final cleanup, only once every other part has shipped.

1. bunx tsc --noEmit, bun run lint, bun run build — all clean.
2. Browser-check the full waitlist flow end to end as a logged-out
   visitor, including the duplicate-email case and the admin Waitlist
   tab showing the new row.
3. Re-read all homepage and waitlist-modal copy against this plan's §0
   copy-tone rules one more time.
4. Confirm /apply and /briefs/[slug] still work by direct URL, and that
   components/landing/LegacyLandingPage.tsx has no route pointing at it.
5. Confirm Part 4's OAuth gating was actually tested with a real,
   non-approved account — ask the user to confirm this if it wasn't done
   in-session, don't assume it from code review alone.
6. Get the user's final sign-off on the whole silent-launch page as one
   coherent piece of work.
```
