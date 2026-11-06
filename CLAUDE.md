This project uses Bun. Use bun instead of npm, npx, or node for all package management, running scripts, and testing.

## Commands

```bash
bun install
bun run dev                # http://localhost:3000
bun run lint
bunx tsc --noEmit          # type check
bun run build              # runs varlock env validation first (prebuild)
bun run test               # Playwright end-to-end suite
bun run migrate:check      # offline migration numbering check
```

Do not invent scripts that are not in package.json. There is no unit test runner and no `format` script.

## Environments

`.env.local` holds the real Supabase keys (never commit it; variables are declared in `.env.schema`). The Playwright suite and the seed scripts write throwaway rows to whatever Supabase project `.env.local` points at, so never run them against production. Prefer letting CI run the suite. Unattended agent runs verify with lint, `tsc` and build, not Playwright.

Lint baseline: `bun run lint` reports one error in the generated, gitignored `env.d.ts` and many warnings from vendored `.claude/skills` and `.github/skills` scripts. Judge a change by new problems in the files it touched.
