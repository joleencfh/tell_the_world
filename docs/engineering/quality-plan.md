# Engineering quality plan

**Status: not started.** Written 2026-10-08 after a review of the repo's CI,
tests, tooling and docs. Each step is a standalone PR with its own Notion
Story under the epic "Engineering Quality Foundations". Steps are ordered so
that each one makes the next one safer.

Out of scope on purpose: Sentry / error monitoring (no users yet; it stays in
Phase 4 of the [architecture cleanup roadmap](../design/architecture-cleanup/build-plan.md)).

## How to use this

Each step has a "Prompt for Claude Code" block. Paste it into a fresh session
(from a branch off `master`). The prompts do not assume any memory of the
conversation that produced this plan. Steps marked **(manual)** need an action
from you in a dashboard; the prompt tells Claude to stop and ask for it.

| # | Step | Size | Depends on |
| --- | --- | --- | --- |
| 1 | Migration tracking and runner | M | none |
| 2 | Staging Supabase project and CI against it | L | 1 |
| 3 | CI runs E2E against the production build | S | 2 (safer after) |
| 4 | Dependabot and dependency audit | S | none |
| 5 | PR template with test-expectation checklist | S | none |
| 6 | Prettier, lint-staged and pre-commit hook | S | none |
| 7 | Unit tests with `bun test` for pure logic | M | none |
| 8 | Accessibility checks (axe) in Playwright | M | 3 |
| 9 | `docs/engineering/` (environments, deploy, runbook, ADRs) | M | 2 |

Why migrations come before staging: a fresh staging database needs all 60+
migrations applied in order, and a tracked runner is what makes that
repeatable.

## What exists today (so prompts do not redo it)

- Migrations are already applied programmatically through the Supabase
  Management API (`POST /v1/projects/{ref}/database/query` with
  `SUPABASE_ACCESS_TOKEN`), but nothing records which files have been applied.
  `supabase db push` does not work here (no `config.toml`, no DB password).
- `supabase/` has duplicate numbers 038 and 043. The
  [architecture cleanup build plan](../design/architecture-cleanup/build-plan.md)
  Step 1 covers renaming them.
- CI (`.github/workflows/ci.yml`): gitleaks, lint, `tsc --noEmit`, build,
  Playwright against `bun run dev` and the live Supabase project.
- Playwright lives in `tests/` (`*.spec.ts`, 2.8k lines), with
  `tests/global-setup.ts` creating sessions through the admin API.
- Package manager is Bun only. Never use npm, npx or node.

---

## Step 1: Migration tracking and runner

**Goal:** a `schema_migrations` table plus `scripts/migrate.ts` so applying
migrations is one idempotent command, and CI can detect problems.

### Prompt for Claude Code

```
Read CLAUDE.md, CONTRIBUTING.md and docs/design/architecture-cleanup/build-plan.md
(Step 1 about the 038/043 collisions). We apply supabase/NNN_*.sql migrations
through the Supabase Management API (POST
https://api.supabase.com/v1/projects/<ref>/database/query with
SUPABASE_ACCESS_TOKEN from .env.local). Nothing tracks what has been applied.

Build a small migration runner:
1. scripts/migrate.ts (run with bun). It reads the project ref from
   NEXT_PUBLIC_SUPABASE_URL, uses SUPABASE_ACCESS_TOKEN, and reads every
   supabase/*.sql file sorted by filename.
2. It creates a table public.schema_migrations (filename text primary key,
   applied_at timestamptz default now(), checksum text) if missing, with RLS
   enabled and no policies (service role / management API only).
3. Commands: `bun scripts/migrate.ts status` (list applied/pending/changed
   checksum), `bun scripts/migrate.ts up` (apply pending files in order, each
   in its own request, record it only after success, stop on first failure),
   `bun scripts/migrate.ts baseline` (mark every current file as applied
   WITHOUT running it; needed once for the live DB, which already has them
   all). Add a `--project-ref` override flag so the same script can target
   staging later.
4. `bun scripts/migrate.ts check` runs offline: fails on duplicate numeric
   prefixes, gaps are only a warning, and filenames not matching
   ^\d{3}_[a-z0-9_]+\.sql$. Known legacy duplicates 038 and 043 go in an
   explicit allowlist inside the script with a comment pointing at the
   cleanup plan, so the check passes today and fails for any NEW collision.
5. Add `check` as a step in the `checks` job of .github/workflows/ci.yml. It
   must not need secrets.
6. Add package.json scripts `migrate:status`, `migrate:up`, `migrate:check`.
7. Update CONTRIBUTING.md "Database migrations" (it still says to paste SQL
   in the SQL Editor) to describe the runner, and remind that
   lib/database.types.ts must be regenerated after each migration.

Do NOT run `up` or `baseline` against the live project without telling me
first and getting a yes; run `status` and `check` only, and show me output.
Once I approve, run `baseline` on the live project. Keep code style
consistent with scripts/seed-test-briefs.ts. Do not use em dashes in docs or
PR text. Open a PR against master.
```

---

## Step 2: Staging Supabase project and CI against it **(manual)**

**Goal:** CI and local E2E never touch the real project's data.

### Prompt for Claude Code

```
Read CLAUDE.md, .github/workflows/ci.yml, playwright.config.ts,
tests/global-setup.ts, tests/helpers/*, scripts/seed-test-briefs.ts and
scripts/migrate.ts (the runner from the previous step).

Today CI runs the Playwright suite against the live production Supabase
project. I want a separate staging Supabase project used by CI and by local
test runs.

Part A (manual, stop and ask me): I need to create a second Supabase project
(free tier allows two) named tell-the-world-staging. Ask me for: project ref,
URL, publishable key, service role key, and a note that SUPABASE_ACCESS_TOKEN
works for both projects. Never print these values back in chat or commit them.

Part B (you):
1. Using scripts/migrate.ts with the staging ref, apply all migrations to the
   empty staging DB. Some old migrations may not replay cleanly on a fresh
   database (seed data, storage buckets, enum edits, the 038/043 duplicates).
   Fix replay problems by making the minimum change necessary and report each
   one to me; never edit a migration in a way that would change the live DB.
   Also verify storage buckets (avatars, coverage images) and auth settings
   exist on staging; list what must be configured by hand in the dashboard
   (Auth Site URL / redirect allow-list, magic link settings) and tell me.
2. Create the pre-approved test users on staging (admin, creator, expert,
   matching what tests/global-setup.ts expects) via a script
   scripts/seed-staging.ts that is idempotent and refuses to run if the target
   URL equals the production URL in a PRODUCTION_SUPABASE_URL guard variable.
3. Run scripts/seed-test-briefs.ts against staging.
4. Add a safety guard in tests/global-setup.ts: if CI is set, or
   STAGING_ONLY=1, abort when NEXT_PUBLIC_SUPABASE_URL matches the production
   URL (kept in a repo variable / env, not hardcoded secrets).
5. Update ci.yml to read the staging values from new GitHub secrets (tell me
   the exact secret names to add; do not add secrets yourself). Resend:
   make sure CI cannot send real emails to real people; use a no-op or the
   Resend test address mechanism if the suite triggers emails.
6. Add .env.staging.example (names only) and document the local workflow:
   how to run the suite against staging vs. production-safe read-only.
7. Run the full Playwright suite locally against staging and report results.

Open a PR against master. No em dashes in docs or PR text.
```

---

## Step 3: CI runs E2E against the production build

**Goal:** test what ships. CI builds the app and then tests `next dev`.

### Prompt for Claude Code

```
Read playwright.config.ts and .github/workflows/ci.yml. CI runs `bun run
build` and then Playwright starts `bun run dev`, so the build output is never
tested.

Change playwright.config.ts so that when CI is set the webServer command is
`bun run start` (reusing the .next output from the build step) with
reuseExistingServer false and a 60s timeout; local runs keep `bun run dev`.
Make sure env vars the build needs at build time are present in the build
step. Check whether any spec relies on dev-only behavior (error overlays,
unminified text, slower compile timeouts) and fix flakes you find. Run the
whole suite locally in production mode (`bun run build` then
PLAYWRIGHT_PROD=1 or the CI flag you add) and report pass/fail counts and
the duration difference. Also add `bun --bun varlock load` behaviour check:
confirm prebuild still works in CI. Open a PR against master.
No em dashes in docs or PR text.
```

---

## Step 4: Dependabot and dependency audit

### Prompt for Claude Code

```
Add .github/dependabot.yml for two ecosystems: "bun" if supported by
Dependabot today (check the current docs; if not, use "npm" ecosystem with
the bun.lock caveat explained in a comment) and "github-actions". Weekly
schedule, grouped minor+patch updates per ecosystem, open PR limit 5, label
"dependencies". Ignore major bumps of next, react and react-dom (we upgrade
those deliberately).

Also add a CI step that audits dependencies. Use `bun audit` if available in
the installed bun version; set it to fail on high and critical severity only,
and make it a separate non-blocking job first if it fails on existing
findings today; report the current findings to me and propose which to fix.
Do not bump any dependency in this PR. Open a PR against master. No em dashes.
```

---

## Step 5: PR template with test-expectation checklist

**Goal:** make "did you add a test?" a habit instead of memory.

### Prompt for Claude Code

```
Create .github/PULL_REQUEST_TEMPLATE.md with these sections: Summary, What
changed, How I verified it, and a checklist:
- [ ] Tests: added/updated a Playwright spec or unit test, OR explained below
      why none is needed (pure refactor, copy change, docs)
- [ ] Bug fix? A regression test that fails without the fix is included
- [ ] New or changed server action calls requireAdmin() where required
- [ ] New migration: number re-checked against origin/master, applied to
      staging, lib/database.types.ts regenerated
- [ ] lint, tsc and tests pass locally
- [ ] No secrets or real user data in the diff
Keep it short enough that people actually read it. Add a short "Pull
requests" section to CONTRIBUTING.md that states the test expectations:
bug fixes need a regression test, new user-facing flows need an E2E spec,
pure logic gets a unit test. Open a PR against master. No em dashes.
```

---

## Step 6: Prettier, lint-staged and pre-commit hook

### Prompt for Claude Code

```
Add Prettier with a minimal config that matches the existing code style
(check the dominant style in app/ and lib/ first: quotes, semicolons,
trailing commas, print width) so the first format pass produces as small a
diff as possible. Add eslint-config-prettier to eslint.config.mjs so they
do not conflict. Add scripts `format` and `format:check`.

Add husky and lint-staged (use bun; check whether husky works with bun's
install on Windows here; if not, use a simple git hook installed via a
`prepare` script) so commits run prettier --write and eslint --fix on staged
files only. The hook must be fast and must not run tsc or tests.

Split the work into two commits: (1) tooling and config, (2) the one-time
repo-wide format pass, with a .git-blame-ignore-revs entry for commit 2.
Exclude lib/database.types.ts, supabase/*.sql, docs/design/*.html and
generated files via .prettierignore. Add `format:check` to the CI checks job.
Verify lint, tsc and a quick Playwright smoke still pass after the format
pass. Open a PR against master. No em dashes.
```

---

## Step 7: Unit tests with `bun test`

**Goal:** cheap, fast tests for pure logic, without a browser.

### Prompt for Claude Code

```
We have Playwright E2E tests only. Add unit tests using Bun's built-in
runner (`bun test`). Constraint: Playwright's default testMatch also picks up
*.test.ts, but its testDir is ./tests, so put unit tests next to the code
under lib/ (e.g. lib/clarity/clarity.test.ts) and never inside tests/.

Find and test the pure, high-value logic. Start by reading lib/clarity,
lib/links, lib/richtext, lib/waitlist, lib/directory/queries.ts
(sanitizeSearchTerm), lib/applications/actions.ts (validation helpers and the
in-memory rate limiter) and lib/types.ts. If validation or rate limiting is
buried inside a 'use server' file, extract it into a plain module (NOT
exporting non-async values from a 'use server' file, that crashes at
runtime) and import it back. Cover: the clarity/jargon detector (hits,
misses, edge cases), search term sanitizing against PostgREST filter
injection (commas, parentheses, wildcards), URL/link validation, application
validation and honeypot, rate-limit window behaviour (use injectable clock).

Add `"test:unit": "bun test"` to package.json, keep `test` as Playwright,
add a unit test step to the CI checks job BEFORE the build step, and update
CONTRIBUTING.md. Aim for meaningful cases, not coverage numbers. Report what
you tested and what you deliberately skipped. Open a PR against master.
No em dashes.
```

---

## Step 8: Accessibility checks (axe) in Playwright

### Prompt for Claude Code

```
Add automated accessibility checks to the Playwright suite using
@axe-core/playwright (pin an exact version). Create tests/a11y.spec.ts that
scans the key public and logged-in pages (landing, /apply, /login, /privacy,
/contact, a public brief, /home as creator, /directory) in the default
theme, with tags wcag2a, wcag2aa, wcag22aa. Fail on serious and critical
violations; log moderate and minor ones to the test output without failing.

Run it, then triage: fix cheap real violations in the same PR (labels, alt
text, contrast tokens only if the fix is a one-line token change that does
not alter the design system; otherwise list them). Anything not fixed goes
into a documented, narrow allowlist inside the spec, each entry with a
reason and a link or TODO to a follow-up. Give me a table of what you found,
fixed and deferred. Do not redesign anything. Open a PR against master.
No em dashes.
```

---

## Step 9: `docs/engineering/`

**Goal:** the knowledge that currently lives only in memory and chat.

### Prompt for Claude Code

```
Create docs/engineering/ with these files, based on the real repo state
(verify everything against the code, CI and docs; do not guess):

1. README.md: index and the one-page "how we work" (branching off master,
   PR rules, test expectations, migration flow).
2. environments.md: production vs. staging vs. local; which env vars are
   used where (names only), how CI maps secrets, and the safety guards.
3. deploy.md: how the app is deployed and rolled back. I have not written
   this down; ASK ME which host is used (and about branch protection and
   preview deploys) before writing it. Mark anything unknown as TODO.
4. runbook.md: restore a paused Supabase project (DNS NXDOMAIN symptom), rotate
   each key, apply a migration, regenerate DB types, recover from a failed
   migration, rotate the test accounts.
5. adr/0001-template.md plus ADRs for decisions already made. Look in
   docs/ and git history to confirm the reasoning for each: Lexical over
   TipTap; no password auth (magic link, Google, LinkedIn); single users
   table for all roles; content_posts unified table; Bun only; migrations
   via Management API runner; Playwright-first testing.
Link the folder from README.md and CONTRIBUTING.md, and add a row to
docs/architecture/README.md explaining how it relates to the snapshots.
Open a PR against master. No em dashes.
```

---

## Deferred

- Sentry or other error monitoring: revisit before real users onboard
  (architecture roadmap Phase 4).
- Lighthouse / performance budget in CI: revisit after Step 3.
- Coverage thresholds: not useful until the unit suite has grown.
