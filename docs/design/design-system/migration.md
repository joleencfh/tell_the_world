# Migrating the app to the new design system

Version 1.0, 2026-10-01. Companion to [design-system.md](design-system.md) and [app-theme.css](app-theme.css).

The landing page is already on the new system. This document is the plan for moving everything else. Nothing here has been done in the app yet.

## 1. How the move works

- **Additive, then subtractive.** Every new token name is different from every existing one, so the new theme can be added to the app first without changing a single pixel. Screens move one at a time. When the last screen has moved, the old tokens are deleted.
- **One pull request per phase**, each shippable on its own, each leaving the app consistent (a migrated screen is fully new; an unmigrated screen is fully old). Never half a screen.
- **Shared primitives first.** The app already has shared `Avatar`, `RoleBadge`, `Pagination`, `Footer`, `Logo`, `Carousel` and modal shells. Fixing those once moves many screens at once.
- **Judgement is not scriptable.** Only literal renames (`text-ink` to `text-umber`) can be done by search and replace. Choosing between `parchment`, `vellum` and `bone` for a background, or rose versus neutral for a label, needs a person looking at the screen. Plan for review, not for a codemod.

## 2. Size of the job

Counts of old-token utilities (`paper`, `ink`, `line`, `pink`, `blue`, `coverage`, `font-display`, `font-body`) outside the landing page, measured 2026-10-01:

| Area | Uses | Files | Lines |
|---|---|---|---|
| Brief page (`app/briefs`) | 1,115 | 34 | 8,702 |
| Admin (`app/admin`) | 560 | 27 | 4,063 |
| Directory | 124 | 3 | 779 |
| Home dashboard | 121 | 6 | 1,028 |
| Profile | 112 | 6 | 1,626 |
| Shared UI (`components/ui`) | 75 | 10 | 702 |
| Apply | 58 | 5 | 1,058 |
| Login | 58 | 1 | 298 |
| Privacy | 31 | 1 | 324 |
| Contact | 28 | 1 | 207 |
| Modals (`components/*.tsx`) | 17 | 4 | 836 |

Across the app (excluding landing): about 850 `text-ink`, 550 `font-mono`, 400 `uppercase`, 370 hand-set `tracking-[...]`, 250 `border-line`, 230 `bg-paper`, about 105 uses of stock red, green and amber, and 20 raw hex values. The brief page and admin are about 75% of the work.

## 3. Token map (old to new)

Where the right answer depends on role, the first column says which.

**Colour**

| Old | New | Notes |
|---|---|---|
| `bg-paper` (page canvas) | `bg-parchment` | The page background |
| `bg-paper` (card, input, panel) | `bg-vellum` (card), `bg-white` (input) | Cards sit one step above the canvas |
| `bg-paper-raised` | `bg-vellum` with `shadow-hairline`, or `bg-bone` if it is an inset area | Admin cards, list panels |
| `bg-paper-sunken` / `bg-pink-wash` | `bg-card-rose` for a creators surface, else `bg-bone` | Pink wash |
| `bg-paper-sunken-blue` / `bg-blue-wash` | `bg-card-cobalt` for an experts surface, `bg-band-pale` for a band | Blue wash |
| `text-ink` | `text-umber` | Literal rename |
| `text-ink-soft` | `text-umber-soft` | Literal rename |
| `text-ink-faint` | `text-umber-soft` | **There is no fainter text.** `ink-faint` was a hair above AA; the new system has no text lighter than `umber-soft`. Non-text strokes may use `text-field-line` |
| `border-line` | `border-rule` (between sections), `border-window-line` (inside a card) | |
| `border-line-strong` | `border-field-line` (controls), `border-rule` otherwise | |
| `border-ink`, `border-2 border-ink` | `border border-rule` or no border (use a fill) | The 2px ink frame retires |
| `bg-ink` | `bg-umber` | Primary buttons |
| `text-pink`, `text-pink-ink` | `text-rose` (text), `text-rose-deep` (on a tint) | `pink` as a graphic fill becomes `fill-rose-bright` |
| `bg-pink`, `bg-pink-soft` | `bg-rose-bright` (dot or graphic only), `bg-rose-wash` | |
| `text-blue`, `text-blue-ink` | `text-cobalt` | |
| `bg-blue`, `bg-blue-soft`, `bg-blue-ink` | `bg-cobalt-bright` (graphic only) or `bg-cobalt` (button), `bg-cobalt-wash`, `bg-cobalt-deep` | |
| `bg-coverage-bg` / `text-coverage-fg` | `bg-band-soft text-umber` (recommended) or `bg-inverse text-parchment` | Open decision 1 |
| `bg/text/border-red-*` | `brick`, `brick-deep`, `brick-wash` | Errors and destructive actions. Includes `bg-red-600` buttons and `text-red-700` error text |
| `green-*` | `moss`, `moss-wash` | Success |
| `amber-*` | `ochre`, `ochre-wash` | Warning |
| `purple-*`, `sky-*`, `emerald-*`, `amber-700` (avatars, post types) | neutral: `bg-bone text-umber-soft` for category chips; role fills for avatars | Hues retire |
| `gray-*` | `umber-soft`, `bone`, `rule` | |
| `bg-black/50` (modal backdrop) | `bg-scrim` | |
| raw `#RRGGBB` | the matching token | 20 occurrences to find and replace |

**Type**

| Old | New |
|---|---|
| `font-display` (Segoe UI, extra bold, often uppercase) | `font-serif` for headings (`text-title`, `text-section`, `text-card-title`); `font-ui font-semibold` for names and buttons |
| `font-body` | `font-ui` for controls and meta; `font-serif` for anything long and read |
| `font-mono` | Unchanged, but only for short labels, min 12px, uppercase by CSS |
| `text-[8px]` to `text-[11px]`, `tracking-[0.1em]` to `[0.3em]` | `text-label` (12px, built-in tracking) |
| `text-xs`, `text-sm`, `text-base` for body | `text-caption`, `text-ui-sm`, `text-ui`; reading text `text-reading` |
| `font-extrabold`, `font-bold` headings | Remove; serif headings are weight 400 |
| `uppercase` on headings and buttons | Remove from headings and buttons; keep on short mono labels |
| `italic` as a style for leads and empty states | Remove (the serif lead is roman); keep italic only for an accent phrase |

**Shape and depth**

| Old | New |
|---|---|
| `rounded`, `rounded-sm`, `rounded-lg`, `rounded-xl` on controls and cards | `rounded-control` |
| `rounded-full` on buttons, tags, pills | `rounded-control` or `rounded-tag`; `rounded-full` only for avatars, circles and dots |
| `shadow-xl`, `shadow-lg` | `shadow-modal`, `shadow-menu`, `shadow-window`; cards use `shadow-hairline` |
| `bg-gradient-to-b ... to-paper` fades | Remove |
| `.shadow-block` offset block | Remove |

**Foundations to remove at the end:** `--color-paper*`, `--color-ink*`, `--color-line*`, `--color-blue*`, `--color-pink*`, `--color-coverage-*`, `--color-*-wash`, `--font-display`, `--font-body` in `app/globals.css`, and the dark-mode reference block.

## 4. Shared components

| Component | Today | Becomes | Size |
|---|---|---|---|
| `Avatar` | Five-hue rotating palette, gray default, blue variant | Role fills (rose-deep, cobalt, cobalt-deep square, umber-soft); same sizes | S |
| `RoleBadge` | Filled pill and outline variants, 8 to 9px | The bordered Role label, 12px, one variant | S |
| `Logo` | Segoe extrabold, 12px multiply circles | Circle pair (rose-bright, cobalt-bright) and Inter 500 wordmark | S |
| `Footer` | Plain and "bold" variants (2px ink rule) | One footer; the bold variant retires with its test | S |
| `Pagination` | Mono uppercase buttons | Secondary `sm` buttons, `aria-current` | S |
| `DarkBand` | Fixed dark section | `band-soft` or `inverse` (decision 1) | S |
| `Carousel`, `Thumb`, `DuotonePlaceholder`, `CardGoLink`, `SignOutButton` | Old tokens | Re-token; duotone becomes `rose-wash` and `cobalt-wash` on `bone` | S |
| `ClarityFlagsPanel` | red-50 alert | Inline alert, danger tone, or the rose-wash flag panel from the demos | S |
| `ContactModal`, `PostModal`, `ProposeBriefModal`, `EditProfileModal`, brief and coverage modals | Seven separate modal shells (`bg-black/50`, `rounded-xl`, some with no focus handling) | **One shared Modal shell** (the landing `WaitlistModal` behaviour: labelled, focus trapped, inert background, focus returned) plus a Confirm dialog | M |
| Form fields (`app/apply/form-fields.tsx` and per-screen copies) | 10px mono uppercase labels, red asterisk, per-screen input classes | One Field set (label, hint, error), "(Optional)" convention | M |
| Buttons | Many per-screen class strings (uppercase mono, tracking-widest) | One Button with variants | M |
| Status and post-type badges | Per-screen stock-hue maps | Status chip (neutral) and Category chip (neutral) | S |
| New: Alert, Toast, Empty state, Skeleton, Locked panel, Menu | Ad hoc or missing | As in design-system.md | M |

Building these primitives once (Phase 1) is what makes the later phases mostly mechanical.

## 5. Phases

Each phase is its own PR with its own tests. A phase is done when its screens use only new tokens and primitives.

**Phase 0: landing page. Done.** Theme, fonts, header, hero, demos, waitlist modal.

**Phase 1: foundations and primitives.**
- Replace `app/landing-theme.css` with `app-theme.css` (it supersedes it).
- Move EB Garamond and Inter from the landing route layout to the root layout (every screen needs them). Keep IBM Plex Mono as is.
- Build the shared primitives: Button, Field set, Role label, Author, Avatar, Status and Category chips, Alert, Toast, Empty state, Skeleton, Modal shell, Confirm dialog, Menu.
- Switch the landing waitlist modal's error colour from `rose-deep` to `brick` and have it use the shared Modal shell.
- Exit: the reference page and one screen of each template render with the primitives; no screen changes yet except landing.

**Phase 2: auth, forms and small pages** (login, apply and its status pages, contact, privacy). Smallest, most visible, lowest risk; proves Field, Button, Alert and Modal in real flows. About 175 old-token uses.

**Phase 3: dashboard, directory, profile** (home, directory, profile and its edit modal). Proves Card, Author, Brief card, Member card, filters, tabs, carousel and pagination. About 360 uses.

**Phase 4: the brief page.** The largest (34 files, about 1,100 uses). Split into sub-PRs: (a) hero, section nav, reading column and explainer; (b) quotes and the Quote card; (c) Q&A and contributions (the thread from the landing demo); (d) sources, timeline, related briefs, coverage; (e) modals (contribute, quote, coverage). Each sub-PR keeps the page whole.

**Phase 5: admin.** 27 files, about 560 uses. Mostly lists, accordion rows, key-value rows and status chips, so it benefits most from the Phase 1 primitives. Settle decision 4 (density) before starting.

**Phase 6: cleanup.** Delete the old tokens and the dark-mode reference block from `app/globals.css`; delete `LegacyLandingPage.tsx` if still unused; remove the old utility classes; run the contrast and review checklist across every screen.

## 6. Tests

Two specs assert the old styling directly and must be rewritten with the screens they cover: `two-ink-bold-11f-admin.spec.ts` (18 style assertions, computed colours of the old tokens) and `two-ink-bold-11g-remnants.spec.ts` (19, including the "bold" footer's 2px ink border and the system font stack). `qa-votes.spec.ts` has 3. Everything else asserts on roles, text and behaviour and should survive; the radio-group and dialog changes already made on the landing page are the pattern for the rest (roles, not classes).

Add, per phase: a smoke test per migrated screen, and a keyboard test for any modal or menu that moves to the shared shells.

## 7. Risks and how to handle them

| Risk | Handling |
|---|---|
| Type floor of 12px makes dense admin and brief screens longer | Expected; decision 4. Re-check admin rows at 390px and 1440px. |
| Replacing mono uppercase labels with a calmer hierarchy changes the product's feel | The Author block and Role label restore hierarchy; review each template in Phase 2 before scaling. |
| Seven modal shells have slightly different behaviour | Port each to the shared shell one at a time and keep its tests; the shared shell is stricter (focus trap, inert), so test keyboard flows. |
| Brief page is 34 files and has the most behaviour (Q&A, votes, endorse, quotes, coverage) | Sub-PRs, behaviour tests before and after, no logic changes in a styling PR. |
| Two systems coexist for months | Tokens do not collide, so this is safe; avoid mixing old and new tokens inside one component. |
| Dropping stock hues (post types, avatars) loses a quick visual cue | Icons and words carry the meaning; admin may use status tones. |
| Landing and app drift apart | The landing page already uses the same tokens; any change goes through `app-theme.css`. |

## 8. Decisions needed before Phase 1

See [design-system.md, section 8](design-system.md#8-open-decisions). Phases 1 to 3 only depend on decisions 5 and 6; decisions 1 to 4 can wait until Phases 4 and 5.
