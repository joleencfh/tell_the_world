# Design migration: step-by-step prompts

Companion to [migration.md](migration.md) (what changes) and [design-system.md](design-system.md) (the rules). This file is the **how**: one Claude Code prompt per step, in order. Run each in a fresh session, one PR per step.

## Verdict

**Yes, the system can cover the whole app.** It was built for that: it already has app templates (reading, dashboard, list, detail, form, moderation, auth), status colours, forms, modals, menus and the Q&A thread, and every token name is new, so adoption is additive. The migration doc's numbers check out against the code (about 830 `text-ink`, 520 `font-mono`, 440 text sizes under 12px, outside the landing page).

**Effort:** about 15 to 18 Claude Code sessions, roughly 7 PRs plus 5 brief-page sub-PRs, or 2 to 3 weeks of part-time review. The brief page and admin are about 75% of it. Most of the cost is your visual review of each screen, not the code changes.

**Where it is harder than the doc says**

1. **Fonts and body styles are global.** `app/layout.tsx` sets `font-body` and `globals.css` sets the body to white paper. If Phase 1 moves the new fonts and parchment onto `<body>`, every unmigrated screen changes at once, which breaks the rule that a screen is fully old or fully new. So: load the fonts in the root layout but do **not** change `<body>`; each migrated page wraps itself in `bg-parchment text-umber font-ui min-h-screen`. Move that to `<body>` only in the cleanup phase.
2. **There are more modals than "seven shells".** 16 `role="dialog"` uses across 12 files with `fixed inset-0`, most of them inside the brief page. The shared Modal shell needs to be built carefully, and the brief sub-PRs each convert their own.
3. **The 12px floor and 14px admin rows will make dense screens longer.** This is decision 4 in the design system. Expected, not a bug.
4. **You just built the Two-Ink Bold dashboard and brief page.** This replaces them. The old PRs are sunk cost; the doc's token map is the bridge.
5. **Two test files assert old colours directly** (`two-ink-bold-11f-admin.spec.ts`, `two-ink-bold-11g-remnants.spec.ts`, 37 assertions). They get rewritten with the screens they cover.

## Option: do the brief page first

The brief page is the main feature, so it can go first. It is not too complicated, but it cannot skip Phase 1, because 4a to 4e depend on the shared header, Modal, Author, Field and Button. The order becomes:

1. **Phase 1, trimmed.** Theme, fonts, and only the primitives the brief page uses: Button, Field set, RoleLabel, Author, Avatar, CategoryChip, Alert, Toast, EmptyState, LockedPanel, Menu, Modal, ConfirmDialog, plus the app header, Footer and Logo. Skip Skeleton and StatusChip until admin.
2. **Phase 4a to 4e** (the brief page).
3. Then Phases 2, 3, 5 and 6 as written.

What you give up and what to expect:
- For a few weeks the brief page has the new header and footer while login, home, directory and profile keep the old ones. Moving between them will look inconsistent. Mitigation: migrate the header and Footer to all screens right after 4a (a small extra PR), accepting that they sit above old-style page bodies for a while.
- The form primitives get their first real test inside the brief's contribute and quote modals, not on simple forms. Review those carefully before reusing them in Phase 2.
- The brief page is the largest area, so the first visible result arrives later than it would with login first. The upside is that the most important screen is settled and the primitives are shaped by its real needs.

Everything else in the prompts below stays the same. Run Phase 1 as written but tell Claude which primitives to skip.

## Decisions (made 2026-10-06)

A visual comparison of decisions 1 to 4 is in [decision-options.html](decision-options.html).

Decisions 1 to 4 were chosen from the previews. The prompts below use them.

| # | Topic | Decision |
|---|---|---|
| 1 | "Covered by" dark band | Option A: replace with `band-soft` |
| 2 | Status chips | Option C: neutral on public screens; on admin, tinted fill with status text colour (no border) |
| 3 | Brief reading font | Option A: serif 19px (`text-reading`) |
| 4 | Admin density | Option A: Inter 14px, 44px min row height |
| 5 | "Apply" inside the app | Keep the current apply flow and wording as is; do not change flows in a styling PR |
| 6 | Landing error colour | `brick` (done in Phase 1) |

## Before you start

Your working tree has uncommitted work on `design-system/app-wide` (`.impeccable/`, `.claude/skills`, `PRODUCT.md`, `package.json`, `bun.lock`, ...). Commit or stash it, and merge the design-system docs PR (#111) first, so every phase branches from a clean base. Check the PR base with `git` before each PR (project memory says `master`, and `gh pr create` needs `--base master`).

## Standing rules (paste at the top of every prompt below)

```
Project: Tell The World (Next.js 16, Tailwind 4, Bun only; never npm/npx/node).
We are migrating the app to the new design system, one phase per PR.
Read first: docs/design/design-system/design-system.md, migration.md, app-theme.css.

Rules for every phase:
- Use only tokens and utilities from app-theme.css and the shared primitives in components/ui. No raw hex, no stock Tailwind colours (red-*, green-*, gray-*, ...), no text under 12px.
- A migrated screen is fully new: do not mix old tokens (paper, ink, line, pink, blue, coverage, font-display, font-body) with new ones inside one component.
- Styling PRs change no logic, data fetching, routes, copy or behaviour. If you find a bug, note it in the PR description instead of fixing it.
- No em dashes in user-facing copy or the PR description.
- Do not touch <body> styles. Each migrated page root gets: bg-parchment text-umber font-ui min-h-screen.
- Where the token map says judgement is needed (parchment vs vellum vs bone, rose vs neutral), decide per screen using design-system.md, and list the non-obvious choices in the PR description.
- Keep tests that assert roles, text and behaviour. Rewrite tests that assert old colours or classes together with the screen they cover.
- Verify in the browser at 390px and 1440px, and check the console. Run `bun run lint`, `bun run build` and the Playwright specs that touch the screens you changed. Report real results, including failures.
- Branch from the up-to-date base branch, commit in small steps, open one PR, end the PR body with the Claude Code attribution line.
```

---

## Phase 1: Foundations and primitives (1 to 2 sessions, 1 PR)

**Goal:** the new theme and every shared primitive exist and are demonstrable. No visible change anywhere except the landing page's modal.

```
[Standing rules]

Phase 1 of the design migration: foundations and primitives.

1. Replace app/landing-theme.css with the contents of docs/design/design-system/app-theme.css (it supersedes it) and update the import in app/globals.css. Do not remove or edit the old tokens in globals.css.
2. Move EB Garamond and Inter (variables --font-eb-garamond and --font-inter) from the (landing) route layout to app/layout.tsx so every route has them. Self-host them with next/font/local instead of next/font/google: today a failed Google Fonts download at build time breaks the whole build (it failed a Vercel deploy on 2026-10-06), and after this step every page depends on these fonts. Get the latin-subset woff2 files (for example from the @fontsource-variable/eb-garamond and @fontsource-variable/inter packages), commit them under app/fonts, keep the same variable names, weights and display: swap, and note in the PR that both fonts are OFL licensed. Keep IBM Plex Mono as it is. Do NOT change the <body> font class or background; unmigrated screens must look exactly as they do today.
3. Build these primitives in components/ui, one file each, with the recipes and every state from design-system.md section 3: Button (variants primary, rose, cobalt, secondary, ghost, danger, icon, sm; pending state), Field set (Field, TextInput, Textarea, Select, Checkbox, ChoiceChips as a real radiogroup with arrow keys, FormSection), RoleLabel, Author, Avatar (replace the current one; role fills, org is a square), StatusChip (neutral, plus ochre, moss and brick tone variants with tinted fill for admin), CategoryChip, Tag, Alert (4 tones), Toast (provider + hook), EmptyState, Skeleton, LockedPanel, Menu, Modal (labelled, focus trapped, rest of page inert, Escape and scrim close, focus returns to trigger, bottom sheet on mobile), ConfirmDialog.
   Use the existing landing WaitlistModal behaviour as the reference for Modal.
4. Keep the existing component names working: Avatar and RoleBadge keep their current props and are migrated to the new look; keep a thin compatibility mapping so callers do not break. Note which callers now look different in the PR.
5. Switch the landing WaitlistModal to the shared Modal and change its error colour from rose-deep to brick.
6. Add a dev-only route (e.g. app/dev/design-system, excluded from production via notFound() in production) that renders each primitive in every state, so later phases and reviews have one place to look.
7. Add Playwright keyboard tests for Modal, Menu and ChoiceChips.

Exit: build and lint green (the two new fonts load from the repo, not from fonts.googleapis.com), landing page unchanged except the error colour, dev route renders all primitives, other screens visually unchanged (compare screenshots of /login, /home, /directory, a brief page before and after).
```

## Phase 2: Auth, forms and small pages (1 to 2 sessions, 1 PR)

**Goal:** prove Field, Button, Alert and Modal in real flows on the lowest-risk screens. Stop and review before Phase 3.

```
[Standing rules]

Phase 2: migrate login, apply (form and status pages), contact, privacy, and the shared Footer and Logo.

- Use the Auth template for login and apply status (centred max-w-narrow card), the Form template for apply and contact, and a Reading layout for privacy.
- Replace per-screen input and button class strings (app/apply/form-fields.tsx and copies) with the Field set and Button primitives. Follow the "(Optional)" convention and remove red asterisks; add "All fields are required unless marked Optional" once at the top of long forms. Errors use Alert and inline field errors with role="alert" and aria-describedby.
- Migrate Footer (one variant; remove the "bold" variant and update any test that depends on it), Logo (circle pair + Inter wordmark) and the shared header used by these routes.
- Keep every route, server action, validation rule and piece of copy exactly as is, apart from the label convention above. Do not change the apply flow itself (design decision 5).
- Update tests that assert old styling on these screens; keep the rest.

Exit: five screens fully on the new system, no old tokens left in app/login, app/apply, app/contact, app/privacy, components/ui/Footer and Logo (grep to prove it), tests green, screenshots at 390 and 1440 in the PR.
```

## Phase 3: Dashboard, directory, profile (2 to 3 sessions, split into 3a/3b/3c PRs if large)

```
[Standing rules]

Phase 3: migrate the Home dashboard (app/home), Directory (app/directory) and Profile (app/profile/[id], including EditProfileModal), plus the shared Pagination, Carousel, Thumb, DuotonePlaceholder, CardGoLink and SignOutButton.

- Start with the app header (design-system.md 3.3: logo left, text links, avatar Menu on the right, no uppercase mono links, no 2px ink rule). Build it once as a shared component and use it from every screen migrated from now on.
- Dashboard: Dashboard template (max-w-page), Brief card, Member card, underline Tabs (keep the sliding track animation), neutral StatusChip. "Covered by" band becomes band-soft (decision 1).
- Directory: List and filter template, ChoiceChips for filters, Member card with the Author block, Pagination as secondary sm buttons.
- Profile: Detail template, Author block at the top, key-value rows for details, EditProfileModal on the shared Modal. Leave the MOCK_PROFILES behaviour untouched.
- Duotone placeholders become rose-wash and cobalt-wash on bone.
- One PR per screen is fine; each must leave the app consistent.

Exit: three screens fully on the new system, grep shows no old tokens in them, home-dashboard.spec.ts and related tests updated and green.
```

## Phase 4: The brief page (5 to 6 sessions, 5 PRs)

Run in order. Each PR keeps the page whole and working. Add a behaviour smoke test (Q&A, votes, endorse, quotes, coverage) **before** 4a if `tests/briefs.spec.ts` and `qa-votes.spec.ts` do not already cover it.

**4a. Hero, section nav, reading column, explainer**
```
[Standing rules]

Phase 4a: brief page shell. Work in app/briefs/[slug]. First, run the existing brief tests and list which behaviours they cover; add a short behaviour-only smoke test for anything uncovered (Q&A post, vote, endorse, quote, coverage), and commit it before restyling.
Then migrate: the app header (shared), the page header (eyebrow, serif text-title, lead), sticky section nav as underline tabs that scroll horizontally on mobile, section markers, the reading column (max-w-reading, serif text-reading, decision 3), the explainer and its key-term, TL;DR and widgets, and the Locked panel for members-only states. Leave quotes, Q&A, sources and modals on the old styling for now, and do not mix old and new tokens inside a single component: if a component is shared across sub-areas, migrate it fully now.
```

**4b. Quotes**
```
[Standing rules]

Phase 4b: the quotes area of the brief page, including the Quote card (serif text-message + Author block), media posts, source icons and attribution, the quote add/edit modals on the shared Modal, and clarity-check flags (ClarityFlagsPanel becomes the rose-wash flag panel or an Alert). Category chips are neutral with icons. Keep all server actions, the clarity gating and the edit permissions exactly as they are.
```

**4c. Q&A and contributions**
```
[Standing rules]

Phase 4c: Q&A, votes, endorsements, contributions and feedback on the brief page. Build the thread as in design-system.md 3.5 (labelled Question, then Answers indented on card-cobalt with a hairline, "Endorsed · n" in cobalt mono) and reuse the landing page's Q&A demo as the visual reference. Author block everywhere a person is named. Form modals on the shared Modal, destructive actions on ConfirmDialog. Votes and counts use tabular-nums. Do not change qa-votes behaviour; update only style assertions.
```

**4d. Sources, timeline, related briefs, coverage**
```
[Standing rules]

Phase 4d: sources drawer, timeline, related briefs, "Covered by" coverage block (replace the dark band with band-soft, decision 1) and its modals, contentious points and header widgets, and the page footer. After this PR no old token may remain anywhere under app/briefs; prove it with a grep, and list any file you could not fully migrate and why.
```

**4e. Brief editing and remaining modals**
```
[Standing rules]

Phase 4e: the remaining brief-related surfaces: ProposeBriefModal, PostModal, ContactModal (components/*.tsx), brief edit screens under app/admin/briefs/[id] (Lexical editor toolbar as secondary icon buttons, editing area as vellum serif surface), and any leftover bg-black/50 backdrops. Convert each to the shared Modal or Field set. Keyboard-test every converted modal.
```

## Phase 5: Admin (3 to 4 sessions, 3 PRs)

Admin is the second-biggest area but mostly repetition of the same four patterns, so Phase 1's primitives pay off here.

```
[Standing rules]

Phase 5: migrate app/admin using the Moderation template (design-system.md section 4) and decision 4 (Inter 14px rows, 44px minimum height, nothing under 12px).
Split into PRs: (a) admin shell, tab row, applications list and detail; (b) questions, contributions, proposals; (c) brief management, any analytics screens, and remaining admin pieces.
- Accordion rows with chevron, key-value rows, StatusChip with tone on admin (decision 2, option C: tinted fill with the status text colour, no border, e.g. ochre on ochre-wash, moss on moss-wash, brick on brick-wash; always with icon and word), Pagination.
- Destructive actions use danger Button plus ConfirmDialog naming the object.
- Every admin server action keeps its requireAdmin() call untouched; do not edit lib/admin/*.
- Rewrite tests/two-ink-bold-11f-admin.spec.ts to assert roles, text and behaviour instead of computed colours; delete assertions that only pin old colours, and say which in the PR.
- Re-check rows at 390px and 1440px.
```

## Phase 6: Cleanup (1 session, 1 PR)

```
[Standing rules]

Phase 6: remove the old system.
1. Grep the whole repo (excluding docs) for paper, ink, line, pink, blue, coverage, font-display, font-body, bg-gradient, shadow-block, rounded-xl on cards, text-[8..11px], red-/green-/amber-/gray-* and raw hex. Fix every remaining hit or list it with a reason.
2. Delete the old tokens, the dark-mode reference block and the font-display/font-body definitions from app/globals.css, plus unused utility classes. Delete LegacyLandingPage.tsx if unused.
3. Move the page defaults to <body> (bg-parchment text-umber font-ui) and remove the per-page wrappers that are now redundant. Remove html { color-scheme: light dark } unless dark mode is being added.
4. Rewrite tests/two-ink-bold-11g-remnants.spec.ts to the new system (roles and behaviour; keep only meaningful style checks).
5. Run the review checklist from design-system.md section 7 on every route, plus an accessibility pass at 390px and 1440px (keyboard, focus ring, contrast, 44px targets). Report findings as a list; fix material ones.
6. Update docs: mark migration.md complete, update docs/architecture and the project README where they mention old tokens.
```

## Optional polish pass after each phase

After each PR, the installed Impeccable skill is a good second pair of eyes:

```
/impeccable critique the screens changed in this PR against docs/design/design-system/design-system.md, then list only the material issues.
```

## Suggested order of work and checkpoints

| Checkpoint | After | You decide |
|---|---|---|
| A | Phase 1 | Do the primitives in the dev route look right? This is the cheapest place to change the design. |
| B | Phase 2 | Does a real form screen feel right? Adjust the primitives before scaling. |
| C | Phase 3 | Do dashboard, directory and profile feel like the landing page? |
| D | Phase 4a | Is serif reading text right for brief sections (decision 3)? |
| E | Phase 5a | Is admin density acceptable (decision 4)? |
