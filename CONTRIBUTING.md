# Contributing to Tell The World

Thanks for helping build the platform. This guide covers how the project is
laid out, the conventions that keep it secure and maintainable, and how to get
a change reviewed.

## Getting started

This project uses [Bun](https://bun.com) — not npm, npx, or node.

```bash
bun install            # install dependencies
bun run dev            # start the dev server on http://localhost:3000
bun run lint           # ESLint — must be error-free before opening a PR
bunx tsc --noEmit      # type-check
bun run test           # Playwright end-to-end suite
```

### Environment

Copy the required variables into `.env.local` (ask an existing maintainer for
values — never commit this file):

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public (RLS-enforced) client key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role — server-only, bypasses RLS |
| `RESEND_API_KEY` | Transactional email |
| `EMAIL_FROM` | From address for outgoing email |
| `ADMIN_EMAIL` | The single admin account's email |

## Tech stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Supabase
(Postgres + Auth) · Resend (email). Middleware lives in `proxy.ts` (the Next 16
filename), not `middleware.ts`.

## Project structure

```
app/                 Routes (App Router). Each screen: page.tsx (server) + a View component (client)
  <route>/page.tsx   Server component: auth check + data fetch
  <route>/*View.tsx  Client component: rendering
components/          Shared client components (modals, and — going forward — ui/ primitives)
lib/
  supabase/          Three clients: client (browser), server (RSC/RLS), admin (service role, server-only)
  auth/              Auth actions + requireAdmin() guard
  admin/             Admin-only server actions (applications, briefs, moderation)
  applications/      Public application submission action
  briefs/ messages/ posts/  Member-facing server actions
  directory/         Directory search queries
  email/             Resend templates (server-only)
  types.ts           Shared domain enums — single source of truth
supabase/            Numbered SQL migrations, run manually in the SQL Editor
tests/               Playwright specs
```

## Security conventions

These are non-negotiable — most of them close holes we have already had to fix.

- **Every admin server action must call `requireAdmin()` (from `lib/auth/require.ts`)
  as its first line.** A `'use server'` function is a public HTTP endpoint; the
  page-level admin check protects only the UI, never the action.
- **Email and service-role modules are `import 'server-only'`, never `'use server'`.**
  `'use server'` on a helper would expose it as a callable endpoint (e.g. an open
  email relay). Files under `lib/email/` and `lib/supabase/admin.ts` follow this.
- **Never fetch members-only content with the service-role client on a public
  page.** Visibility is enforced by RLS; the brief page uses the RLS client so
  the database — not the UI — decides what a logged-out visitor receives.
- **Validate and sanitize all untrusted input server-side.** Client-side checks
  are UX only. Search terms fed into PostgREST `.or()` filters are sanitized
  (see `lib/directory/queries.ts`).

## Database migrations

Migrations are numbered SQL files in `supabase/` (e.g. `016_search_indexes.sql`).
Add the next number, and run it manually in the Supabase SQL Editor — there is no
automated migration runner yet. Note in your PR that a migration needs applying.

## Code style

- Keep it simple and readable over clever.
- Prefer client components unless a server component is clearly better.
- Reuse the shared enums in `lib/types.ts` instead of re-declaring union types.
- **File size:** aim to keep files under ~500 lines. ESLint warns past that. If a
  view grows large, split it into section components rather than letting it sprawl
  (several screens still need this — a warning is a nudge, not a blocker).

## Opening a pull request

1. Branch off `master` (`feature/…`, `security/…`, `chore/…`).
2. Make sure `bun run lint` is error-free, `bunx tsc --noEmit` passes, and the
   Playwright suite is green.
3. Open the PR against `master` with a short description and a note of any
   migration that must be applied.
4. End commit messages with a `Co-Authored-By:` trailer if paired with an AI tool.
