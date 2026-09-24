# Tell The World

Tell The World is a project aimed at informing the general public worldwide
about AI's catastrophic and existential risks. It's currently under active
development. The platform brings together four types of users: content
creators and journalists on one side, and AI safety researchers and
organisations on the other. The goal is to help the AI safety community
communicate its work and findings to creators and journalists credibly and
at scale, so they can tell their audiences what's really at stake with AI's
biggest risks and transformative power.

## Tech stack

- [Next.js](https://nextjs.org) 16 (App Router), [React](https://react.dev) 19, TypeScript (strict)
- [Tailwind CSS](https://tailwindcss.com) 4
- [Supabase](https://supabase.com) (Postgres, Auth with Google/LinkedIn OAuth + magic link, no passwords, Row Level Security, Storage)
- [Lexical](https://lexical.dev) for the brief rich-text editor
- [Resend](https://resend.com) for transactional email
- [Playwright](https://playwright.dev) for end-to-end tests (no unit test runner)

See exact versions in [package.json](package.json).

## Package manager

This project uses **[Bun](https://bun.com)** (not npm, yarn, or node) for
installs, scripts, and tests.

```bash
bun install
```

## Environment variables

Copy these into `.env.local` (ask a maintainer for real values, never
commit this file):

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public (RLS-enforced) client key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server-only, bypasses RLS) |
| `RESEND_API_KEY` | Transactional email |
| `EMAIL_FROM` | From address for outgoing email |
| `ADMIN_EMAIL` | Grants access to `/admin` |

Playwright's suite additionally reads `TEST_ADMIN_EMAIL`, `TEST_CREATOR_EMAIL`,
and `TEST_EXPERT_EMAIL` for fixture accounts, and `RATE_LIMIT_E2E=1` opts in
to the rate-limit test.

## Running it

```bash
bun run dev            # dev server on http://localhost:3000
bun run build          # production build
bun run lint           # ESLint
bunx tsc --noEmit      # type check
bun run test           # Playwright end-to-end suite
```

## CI

[`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs lint, type check,
build, and the full Playwright suite on every PR and on push to `master`.
There is no staging environment: CI runs against the live Supabase project,
seeding and creating throwaway rows (applications, messages, test briefs) on
each run.

## More

- [`docs/`](docs/): architecture snapshots (what's built) and design docs
  (what's planned)
- [`CLAUDE.md`](CLAUDE.md) and [`CONTRIBUTING.md`](CONTRIBUTING.md): repo
  conventions and how to get a change reviewed
