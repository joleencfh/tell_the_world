---
name: Tell The World (landing page)
description: A warm-paper reading surface in two audience colors, rose for creators and journalists, cobalt for researchers and organisations, with shadows only on framed artifacts.
colors:
  parchment: "#F7F4EE"
  bone: "#F0EEE6"
  vellum: "#FBFAF6"
  card-rose: "#F5E8EA"
  card-cobalt: "#E8ECF6"
  band-pale: "#EFF2F9"
  band-soft: "#E5EAF6"
  disabled: "#E4E1D8"
  umber: "#26251E"
  umber-hover: "#3A3931"
  umber-body: "#3F3E37"
  umber-soft: "#5E5D56"
  umber-deep: "#4A4943"
  field-line: "#7A786E"
  rule: "#DEDBD3"
  window-line: "#DAD6CA"
  rose: "#B80F5A"
  rose-deep: "#9E0B4D"
  rose-bright: "#F0197E"
  rose-wash: "#FBDDE8"
  cobalt: "#1D3AA6"
  cobalt-deep: "#162E85"
  cobalt-bright: "#2150E8"
  cobalt-wash: "#DCE5FB"
  violet: "#6B21A8"
  white: "#FFFFFF"
typography:
  display:
    fontFamily: "EB Garamond, Georgia, serif"
    fontSize: "clamp(2.375rem, 1.45rem + 3.9vw, 4.75rem)"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "EB Garamond, Georgia, serif"
    fontSize: "clamp(1.875rem, 1.1rem + 3.2vw, 3.5rem)"
    fontWeight: 400
    lineHeight: 1.03
    letterSpacing: "-0.025em"
  headline-sm:
    fontFamily: "EB Garamond, Georgia, serif"
    fontSize: "clamp(1.75rem, 1.2rem + 2.2vw, 2.875rem)"
    fontWeight: 400
    lineHeight: 1.05
    letterSpacing: "-0.025em"
  statement:
    fontFamily: "EB Garamond, Georgia, serif"
    fontSize: "clamp(1.75rem, 1.2rem + 2.3vw, 2.75rem)"
    fontWeight: 400
    lineHeight: 1.12
    letterSpacing: "-0.02em"
  lead:
    fontFamily: "EB Garamond, Georgia, serif"
    fontSize: "1.4375rem"
    fontWeight: 400
    lineHeight: 1.42
  card:
    fontFamily: "EB Garamond, Georgia, serif"
    fontSize: "1.5625rem"
    fontWeight: 400
    lineHeight: 1.3
  prose:
    fontFamily: "EB Garamond, Georgia, serif"
    fontSize: "1.3125rem"
    fontWeight: 400
    lineHeight: 1.5
  message:
    fontFamily: "EB Garamond, Georgia, serif"
    fontSize: "1.1875rem"
    fontWeight: 400
    lineHeight: 1.4
  ui:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 500
    lineHeight: 1.5
  ui-sm:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "IBM Plex Mono, ui-monospace, monospace"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "0.07em"
rounded:
  tag: "2px"
  control: "4px"
  full: "9999px"
spacing:
  unit: "4px"
  gutter: "40px"
  gutter-mobile: "20px"
  section: "88px"
  section-mobile: "56px"
  page: "1080px"
components:
  button-primary:
    backgroundColor: "{colors.umber}"
    textColor: "{colors.parchment}"
    typography: "{typography.ui}"
    rounded: "{rounded.control}"
    padding: "0 22px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.umber-hover}"
  button-rose:
    backgroundColor: "{colors.rose}"
    textColor: "{colors.white}"
    typography: "{typography.ui}"
    rounded: "{rounded.control}"
    padding: "0 22px"
    height: "44px"
  button-rose-hover:
    backgroundColor: "{colors.rose-deep}"
  button-cobalt:
    backgroundColor: "{colors.cobalt}"
    textColor: "{colors.white}"
    typography: "{typography.ui}"
    rounded: "{rounded.control}"
    padding: "0 22px"
    height: "44px"
  button-cobalt-hover:
    backgroundColor: "{colors.cobalt-deep}"
  button-header:
    backgroundColor: "{colors.umber}"
    textColor: "{colors.parchment}"
    typography: "{typography.ui-sm}"
    rounded: "{rounded.control}"
    padding: "0 14px"
    height: "36px"
  audience-card-rose:
    backgroundColor: "{colors.card-rose}"
    textColor: "{colors.umber}"
    rounded: "{rounded.control}"
    padding: "20px 22px 22px"
  audience-card-cobalt:
    backgroundColor: "{colors.card-cobalt}"
    textColor: "{colors.umber}"
    rounded: "{rounded.control}"
    padding: "20px 22px 22px"
  framed-window:
    backgroundColor: "{colors.vellum}"
    textColor: "{colors.umber}"
    rounded: "{rounded.control}"
  answer-card:
    backgroundColor: "{colors.card-cobalt}"
    textColor: "{colors.umber}"
    rounded: "{rounded.control}"
    padding: "16px 20px"
  role-label-rose:
    textColor: "{colors.rose}"
    typography: "{typography.label}"
    rounded: "{rounded.tag}"
    padding: "1px 6px"
  role-label-cobalt:
    textColor: "{colors.cobalt}"
    typography: "{typography.label}"
    rounded: "{rounded.tag}"
    padding: "1px 6px"
  form-field:
    backgroundColor: "{colors.white}"
    textColor: "{colors.umber}"
    rounded: "{rounded.control}"
    padding: "10px 12px"
    height: "44px"
  role-chip-selected-creator:
    backgroundColor: "{colors.rose-wash}"
    textColor: "{colors.umber}"
    typography: "{typography.ui-sm}"
    rounded: "{rounded.control}"
    height: "44px"
  flag-panel:
    backgroundColor: "{colors.rose-wash}"
    textColor: "{colors.umber}"
    typography: "{typography.ui-sm}"
    rounded: "{rounded.control}"
    padding: "12px 14px"
  modal:
    backgroundColor: "{colors.vellum}"
    textColor: "{colors.umber}"
    rounded: "{rounded.control}"
    padding: "32px"
---

# Design System: Tell The World (landing page)

Derived 2026-10-07 from the SHIPPED page: `app/landing-theme.css`, `app/(landing)/*`, `components/landing/*` (master `937e969`, tag `landing-before-ai-tells-cleanup`). `docs/design/landing-page/design-system.md` (v0.1, 2026-10-01) was read as a second source; every place the two disagree is listed in **Drift** at the end instead of being resolved here. Where this file states a value, it is what the code does.

Scope: the landing route `/` only. The rest of the app still runs on the older Two-Ink Bold tokens in `app/globals.css`, which are not described here. `components/landing/LegacyLandingPage.tsx` is unrouted and ignored.

## Overview

**Creative North Star: "The Reading Room"** (proposed from design-system.md principle 1, "a reading surface, not a product chrome"; not yet confirmed by the owner)

Warm paper and one warm ink, with serif for everything meant to be read. The page is flat: hairlines and fills separate things, and shadow appears only on the framed artifacts (the two demo windows and the waitlist modal). Two audience colors carry all meaning. Rose is creators and journalists, cobalt is researchers and organisations, and the overlap of the two circles is violet. Color shows up as text, small marks, buttons and faint tints, never as a large saturated surface; the one exception in scale is the bright circle pair, which is graphic only and carries no text.

Density is open and unhurried: wide section padding, a single 1080px column, long serif sentences at 19 to 23px. Display type is quiet (weight 400, tight tracking) and gets its emphasis from a rose italic phrase rather than weight. Sans is reserved for controls and captions; mono for short uppercase metadata labels.

The product is a persuade surface for a vetted, invite-only network, so credibility is a visual rule as well as a copy rule: the demos are always captioned as illustrative, and nothing on the page imitates proof that does not exist.

**Key Characteristics:**
- Parchment canvas, umber ink, two audience colors used sparingly.
- Serif for reading, Inter for controls, IBM Plex Mono for short uppercase labels.
- Flat by default; elevation only on framed artifacts.
- 4px corners, 2px tags, circles for dots and avatars; no pills.
- One action everywhere: join the waitlist.
- Two pale bands only, between hairline rules.

## Colors

A warm neutral ground with a rose and a cobalt that each come in three jobs: readable text and button fill, a deep variant for hover and small labels on tints, and a bright variant that is graphic only.

### Primary
- **Umber Ink** (`#26251E`): all primary text and the primary button fill. Hover is **Umber Hover** (`#3A3931`).

### Secondary
- **Creator Rose** (`#B80F5A`): creators and journalists. Accent phrases, eyebrows on pale bands, rose button fill. **Deep Rose** (`#9E0B4D`) is for rose labels on tints, error text and rose hover. **Rose Wash** (`#FBDDE8`) is the selected chip and the flagged-term panel.
- **Researcher Cobalt** (`#1D3AA6`): researchers and organisations. Eyebrows, Endorsed counts, cobalt button fill. **Deep Cobalt** (`#162E85`) is cobalt hover. **Cobalt Wash** (`#DCE5FB`) is the selected chip and the text-selection highlight in the quote demo.

### Tertiary (graphic only, never text)
- **Bright Rose** (`#F0197E`), **Bright Cobalt** (`#2150E8`), **Violet** (`#6B21A8`): the circle pair, legend dots and the flagged-term underline. Bright Rose on parchment is 3.7:1 and Bright Cobalt 5.7:1, so neither is cleared for text.

### Neutral
- **Parchment** (`#F7F4EE`): page canvas.
- **Bone** (`#F0EEE6`): neutral hover fill and the selected chip for roles with no side.
- **Vellum** (`#FBFAF6`): framed artifacts, the demo windows and the modal.
- **Card Rose** (`#F5E8EA`) and **Card Cobalt** (`#E8ECF6`): the two audience cards, and the answer cards inside the Q&A demo.
- **Pale Band** (`#EFF2F9`): "Why this matters now". **Soft Band** (`#E5EAF6`): the closing band and footer.
- **Soft Umber** (`#5E5D56`): secondary text and labels, AA on every surface above. **Body Umber** (`#3F3E37`): long serif text on the pale band. **Deep Umber** (`#4A4943`): small text on the closing band.
- **Field Line** (`#7A786E`): input and chip borders (4.0 to 4.4:1, needs 3:1). **Rule** (`#DEDBD3`): section hairlines. **Window Line** (`#DAD6CA`): hairlines inside windows. **Disabled** (`#E4E1D8`): disabled or pending fill.
- **Scrim** (`rgba(38, 37, 30, 0.55)`): behind the modal and behind the quote form inside its demo.

Contrast was recomputed on 2026-10-07 for every pairing in design-system.md's table and for the extra pairings the shipped page uses (soft umber on both bands, on vellum, on white and on bone; deep rose on rose wash; cobalt and rose on vellum). All clear AA.

### Named Rules
**The Graphic-Only Rule.** Bright Rose, Bright Cobalt and Violet never carry text. Anything a reader must read uses Creator Rose, Researcher Cobalt or their deep variants.

**The Hand-Tuned Tint Rule.** Card Rose, Card Cobalt and the two bands were tuned by eye to about 25% strength while keeping hue. Never recompute them by mixing with paper; a plain mix turns grey.

**The Two Bands Rule.** Exactly two full-bleed bands exist (pale, soft). Do not add a third.

## Typography

**Reading Font:** EB Garamond (400, with italic), then Georgia
**Control Font:** Inter (400, 500, 600), then system-ui
**Label/Mono Font:** IBM Plex Mono (400), inherited from the app root, not loaded again

**Character:** A bookish serif for everything the visitor reads, a neutral sans that stays out of the way on controls, and a small mono that reads as filing metadata. The serif is quiet, not showy.

### Hierarchy
- **Display** (400, clamp 38 to 76px, line 1, -0.03em): the hero h1 only. A rose italic phrase carries emphasis.
- **Headline** (400, clamp 30 to 56px, 1.03, -0.025em): "Why this matters now".
- **Headline Small** (400, clamp 28 to 46px, 1.05, -0.025em): the artifact-section h2s.
- **Statement** (400, clamp 28 to 44px, 1.12, -0.02em): the closing line.
- **Lead** (23px, 1.42; 21px under md): hero sub.
- **Card** (25px, 1.3; 23px under md): the one sentence per audience card.
- **Prose** (21px, 1.5; 20px under md): section body, max about 28em in the hero.
- **Message** (19px, 1.4): serif text inside the demo windows.
- **UI** (15px, 1.5, weight 500 on buttons): buttons, nav, form text. **UI Small** (14px, 1.5): captions, trust line, footer, header links.
- **Label** (12px, 1.4, +0.07em, uppercase): mono eyebrows, window tabs, role labels, Endorsed counts.

### Named Rules
**The Serif-For-Reading Rule.** Serif is for anything read; never for controls. Sans for controls and captions only. Mono for short labels, never sentences.

**The Quiet Display Rule.** Large type stays at weight 400 with tight tracking; hierarchy comes from size and the single italic rose phrase, not from bold. Line-height under 1.3 is allowed only on large, short text.

## Layout

Single centered column, `max-width` 1080px, side padding 40px from md up and 20px below (the header uses 16px below md). Vertical section padding is 88px from md up and 56px below. Breakpoint is `md` (768px), viewport-based. A 4px base unit.

- **Hero:** two columns from md (text, then a 230px circle-pair column), single column below with the pair at 132px beside its legend. The two audience cards sit side by side from md and stack below. The trust line follows.
- **Pale band:** two columns (1.15fr / .85fr, 72px gap) from md; a heading and a paragraph that is offset down.
- **Artifact sections:** text left (.78fr), framed window right (1.22fr), 64px gap; stacked on mobile with 32px gap. Hairline above, no band.
- **Closing band:** statement and button, with a cropped circle pair bleeding off the bottom right.
- **Header:** sticky, 1px rule below. Below md, Blog and Sign in move into a hamburger menu so the logo and the waitlist button fit.

Rhythm is a steady sequence of equal-weight sections separated by hairlines.

## Elevation & Depth

Flat by default. The canvas has no shadow at all; cards use a 1px hairline ring instead. Elevation is reserved for framed artifacts, so depth reads as "this is a thing you are looking at inside the page".

### Shadow Vocabulary
- **Hairline** (`0 0 0 1px rgb(38 37 30 / 0.13)`): audience cards and answer cards.
- **Window** (`0 28px 70px rgb(0 0 0 / 0.14), 0 14px 32px rgb(0 0 0 / 0.10), 0 0 0 1px rgb(38 37 30 / 0.12)`): the two demo windows.
- **Modal** (`0 28px 70px rgb(0 0 0 / 0.28), 0 14px 32px rgb(0 0 0 / 0.16), 0 0 0 1px rgb(38 37 30 / 0.14)`): the waitlist dialog and the quote form inside the demo.

### Named Rules
**The Framed-Only Rule.** Shadow belongs to framed artifacts only. (The mobile menu currently breaks this with Tailwind's default `shadow-lg`; see Drift.)

## Shapes

Quiet geometry. Buttons, cards, inputs, windows and the modal all use a 4px radius (`control`). Small tags use 2px (`tag`). Circles are used for dots, author initials (people), the two-circle brand mark and its legend dots. An organisation's initial is a square with the control radius, so people and organisations differ by shape as well as color. There are no pills.

The recurring motif is the two overlapping circles: bright rose left, bright cobalt right, violet where they overlap, drawn once in `CirclePair`. It is the logo, the hero graphic, the closing-band crop and the modal confirmation mark.

## Components

### Buttons
- **Shape:** 4px radius, 2px transparent border, Inter 500 15px, single line.
- **Primary (umber):** umber fill, parchment text, 44px high, 22px side padding. Hover umber-hover.
- **Rose / Cobalt:** white text on Creator Rose or Researcher Cobalt. Hover is Deep Rose or Deep Cobalt. They appear only on the audience cards and on the modal submit that matches the chosen role.
- **Header size:** 36px high, 14px side padding, 14px text from md; 8px side padding and 13px text below md.
- **Focus:** 2px umber outline, 2px offset. Transition is color only, 150ms.
- The label is always "Join the waitlist". The early-tester path uses "Count me in" on submit.

### Text link
Inline, 1px underline at 5px offset, inherits color; hover thickens to 2px. Used for "Become an early tester". Header and footer links are not underlined at rest and underline on hover.

### Header and mobile menu
Parchment, 1px rule below, sticky. Logo (two-circle mark plus "Tell The World") left. From md: Blog, Sign in as 14px soft-umber links with 44px-high hit areas, then the small primary button. Below md: the button plus a 44px hamburger that opens a 176px popover with Blog and Sign in (44px rows, Escape and outside click close it).

### Eyebrow label
Mono 12px uppercase +0.07em. Color by meaning: soft umber (neutral), rose (creator-side topic, "Why this matters now"), cobalt (expert-side topic, the artifact sections).

### Audience card
Card Rose or Card Cobalt, 4px radius, hairline ring. A header row (a 10px dot plus a mono label in Deep Rose or Cobalt) over a 15%-umber hairline, then one serif sentence (max 17em), then the matching button. Two card shapes are identical; they differ only by color and copy.

### Framed window
Vellum, 4px radius, Window shadow, clipped. Chrome row: three Window Line dots (md and up), a 13px soft-umber title (centered md and up, left below), and a Pause/Play button with a 1px field-line border (label shown from md, icon only below; 44px target below md). The interior is `aria-hidden` and the window is announced once through its `aria-label`. A caption "Illustrative example, sample content" sits below, right-aligned.

### Author and role label
A filled initial (36px, 28px small) then the name in Inter 600 15px with a role label beside it, and the affiliation on its own line (Inter 13px, soft umber). Rose-deep circle for a creator, cobalt circle for an expert, square deep-cobalt for an organisation. The role label is a 1px bordered mono label at 40% of the role color, 2px radius, no fill, no hover.

### Answer card (Q&A demo)
The question is a mono label, an Author, then serif text. Answers are indented (16px, 32px from md) on Card Cobalt with the hairline ring, each labelled "Answer", and end with a hairline and a cobalt "Endorsed · n" mono count.

### Quote form and clarity flag (quote demo)
A vellum form on a scrim inside the window. A white text area with a Field Line border; the flagged term gets a 3px Bright Rose underline on Rose Wash. Below it a Rose Wash panel carries a Deep Rose mono "1 term flagged" label, the plain meaning, and "Try: ...". The primary action cycles Publish quote, Review flags, Submitting, Published. Typing and a cursor drive the loop.

### Form fields (modal)
44px high, 4px radius, 1px Field Line border on white, Inter 16px. Focus: umber border and a 2px umber outline at 1px offset. Error: 2px Deep Rose border, with an icon and a message (never color alone). Disabled: Disabled fill. Labels sit above in Inter 500 13px.

### Role chips (modal)
A `radiogroup` of six, 3 columns from md and 2 below, 44px min, 4px radius, 1px Field Line border, Inter 500 14px. Selected: 2px umber border, a leading filled dot, and a tint by side (Rose Wash for Creator and Journalist, Cobalt Wash for Researcher/Expert and Organisation, Bone for Communications Specialist and Other). Arrow keys move selection.

### Modal
Vellum, 4px radius, Modal shadow, max 520px, 32px padding from md. Below md it is a bottom sheet (20px side padding, flat bottom corners). 44px close button top right. Labelled by its heading, focus moves to the heading on open and each step, Tab is trapped, Escape and scrim click close it. Steps: early-tester intro (only from "Become an early tester"), form, confirmation (circle-pair mark, "You're on the list", Close).

### Footer
Hairline above, 14px Deep Umber text inside the closing band. Left: "Tell The World · © year". Right: Privacy Policy, Contact (and Blog below md), each with a 44px-high hit area.

## Do's and Don'ts

### Do:
- **Do** keep Bright Rose, Bright Cobalt and Violet to graphics (circles, dots, underline, borders); put all text in Creator Rose, Researcher Cobalt or their deep variants.
- **Do** use serif for anything read, Inter for controls and captions, and mono only for short uppercase labels.
- **Do** separate content with hairlines (`rule`, `window-line`) and the 1px `hairline` ring; reserve real shadow for framed artifacts.
- **Do** keep every action named "Join the waitlist" (early-tester path excepted) and use the audience-colored buttons only where they match the audience.
- **Do** label anything illustrative as "Illustrative example, sample content" and keep demos free of invented proof.
- **Do** make meaning survive without color: role labels carry text, selected chips carry a dot and a heavier border, errors carry an icon and text.
- **Do** keep touch targets at 44px, with a visible umber 2px focus outline.

### Don't:
- **Don't** recompute the card and band tints by mixing with paper.
- **Don't** add pills, a third band, a gradient, or a saturated full-width color surface.
- **Don't** put shadow on the canvas, on cards, or on small controls.
- **Don't** use serif for buttons, nav or form text, or set mono labels as sentences.
- **Don't** use em dashes in user-facing copy (PRODUCT.md brand commitment).
- **Don't** let demo windows contribute headings or focusable controls other than Pause/Play.

## Drift

Where the shipped page and `docs/design/landing-page/design-system.md` disagree. Nothing below has been resolved; each row says what each side says and where the shipped side lives. "Type" only describes the shape of the disagreement: **doc-lags** (the code has something the doc does not describe), **doc-claims** (the doc describes something the code does not do), **off-spec** (the code departs from a rule the doc states), **unused** (a defined token nothing consumes).

| # | Area | design-system.md says | Shipped page does | Type |
|---|---|---|---|---|
| 1 | Header button touch size | Small button is 36px on desktop, "still 44px on touch" (`WaitlistButton.tsx:20` repeats this in a comment) | `size="sm"` is `min-h-9` at every width (`WaitlistButton.tsx:27`), so 36px on phones too. No touch-specific rule exists. | off-spec |
| 2 | Pause button size | 44px minimum on touch | 44px below md, 32px from md up (`DemoWindow.tsx:35`, `md:min-h-8`). Keyed to viewport width, not input type. | off-spec |
| 3 | Mobile menu | Not described. Header is "Logo left; Blog (desktop only), Sign in, Join" | Sign in is also hidden below md; Blog and Sign in live in a hamburger popover (`MobileMenu.tsx`, added in #117). | doc-lags |
| 4 | Elevation | "Nothing else has a shadow" beyond hairline, window, modal | The mobile menu uses Tailwind's default `shadow-lg` (`MobileMenu.tsx:51`), a fourth, untokenized shadow. | off-spec |
| 5 | Header sticky | "Not sticky blur" | Sticky, no blur (`LandingHeader.tsx:12`, `sticky top-0 z-20`). Doc is ambiguous about sticky itself. | doc-lags |
| 6 | Header spacing | 12px vertical padding, 40px / 20px gutter | `py-2 px-4` (8px / 16px) below md, `md:py-3 md:px-gutter` from md (`LandingHeader.tsx:13`). Mobile gutter is 16px, not 20px. | off-spec |
| 7 | Diff panel | A diff panel with removed line (`diff-removed`), added line (`cobalt-wash`), `+`/`-` markers; "the diff has +/- markers"; quote-demo rest frame is "the diff" | No diff panel exists. The quote demo edits text inside a text area and shows a Rose Wash flag panel plus "Try:" suggestion (`AddQuoteDemo.tsx:206-264`). The rest frame is the flagged state (`REST_T = 9000`, `AddQuoteDemo.tsx:48`). | doc-claims |
| 8 | Unused tokens | `diff-removed`, `--duration-fast` (150ms), `--duration-demo-step` (600ms) are documented tokens | Nothing in `app/` or `components/` consumes them (grep, 2026-10-07). Components use literal `duration-150`, `duration-[600ms]`, so the reduced-motion override of those two variables (`landing-theme.css:123-126`) changes nothing. | unused |
| 9 | Motion vocabulary | "Default transitions: 150ms standard ease. Nothing else animates"; demo beats 600ms | Also present: modal and step animations with their own curves (`app/globals.css:167-179`, 160 to 220ms, `ease-out`, `ease-in` and `cubic-bezier(0.16, 1, 0.3, 1)`), cursor travel 0.7s `cubic-bezier(0.65,0,0.35,1)` (`AddQuoteDemo.tsx:291`), fades of 300, 400 and 500ms (`AddQuoteDemo.tsx:164,188,193,254,268`), typing and a scale press. Only some of these use the documented `ease-standard` curve. | doc-lags |
| 10 | Newly published quote | "A newly published quote gets a 3px cobalt edge for the length of its entrance only" | No such edge. Publishing shows a "Quote published." banner in the flag slot (`AddQuoteDemo.tsx:267-271`) and fades the list. | doc-claims |
| 11 | Pause state semantics | Paused state is `aria-pressed=true` | Uses a swapping `aria-label` ("Play/Pause the animated example"), no `aria-pressed` (`DemoWindow.tsx:31-36`). Label text is hidden below md (icon only). | off-spec |
| 12 | Focus ring | "Focus is always a visible 2px umber outline with offset" | Applied on `WaitlistButton`, `EarlyTesterLink`, modal fields, chips. Not applied on header links, the hamburger and its menu items, or footer links (`LandingHeader.tsx:14,26,32`, `MobileMenu.tsx:38,57,62`, `Closing.tsx:31,39,42`); `app/globals.css` has no global `:focus-visible` rule, so those fall back to the browser default. The modal close button has the outline without an offset (`WaitlistModal.tsx:218`). | off-spec |
| 13 | Form field hover | Hover: border `umber-soft` | `fieldCls` has no hover state (`WaitlistModal.tsx:62`). | off-spec |
| 14 | Submit button hover | Rose / cobalt hover is `rose-deep` / `cobalt-deep` | Modal submit uses `hover:brightness-90` for every role (`WaitlistModal.tsx:416`). | off-spec |
| 15 | Text link | Used for "Become an early tester", footer, nav; underlined 1px at 5px offset, thicker on hover | Only "Become an early tester" matches (`EarlyTesterLink.tsx:13`). Nav uses hover-only underline at 3px offset (`LandingHeader.tsx:26`); footer uses plain `hover:underline` (`Closing.tsx:35`). | off-spec |
| 16 | Type scale coverage | A 11-step scale; "sizes under md" only for lead, card, prose | Component code repeats the under-md sizes as literals (`text-[1.3125rem]`, `text-[1.25rem]`, `text-[1.4375rem]`) and uses 12 distinct arbitrary sizes: three restate scale tokens as literals (0.9375rem = ui, 1.1875rem = message, 1.3125rem = prose) and the rest are off-scale (13px with 6 uses, 15px with 3, 13.5px, 11px, 1.375rem, and the modal headings 1.875rem / 2.125rem). The doc's scale does not list the modal heading, the quote-card text or the "Quotes" list heading. | off-spec |
| 17 | Mono labels | `text-label` is "always uppercase" | The tag chips in the quote form render lowercase (`AddQuoteDemo.tsx:245`, "ai safety", "frontier labs"). | off-spec |
| 18 | Hairline colors | Hairlines are `rule` and `window-line` | Audience-card header, answer-card footer and demo borders use `border-umber/15` (`Hero.tsx:26`, `QACommunityDemo.tsx:43`); the mobile menu uses `bg-rule/40` as hover (`MobileMenu.tsx:7,38`) where the doc specifies `bone`. Opacity-derived colors are not tokens. | off-spec |
| 19 | Breakpoint model | "`md` (768px). Components switch by container width where they live in frames." | Everything switches on viewport `md`; no container queries are used. | doc-claims |
| 20 | Circle pair sizes | Hero 230px wide with a two-line legend below | 230px column from md only. Below md it is 132px with the legend beside it (`Hero.tsx:58-59`). | doc-lags |
| 21 | Font weights | Serif 400 | `layout.tsx:11` loads EB Garamond 400 and 500, but no component uses serif weight 500. | unused |
| 22 | Heading outline | "One h1; sections are h2; demo windows contribute no headings" | True for the page. The modal's heading is an `h3` with no `h2` ancestor in the dialog (`WaitlistModal.tsx:228,243,276`), and the audience-card labels are `h2` elements that read as labels. Not in the doc. | doc-lags |
| 23 | Color scheme | Dark mode is "deliberately not included" | The root sets `color-scheme: light dark` (`app/globals.css:89`). The landing sets no dark tokens, so native controls and defaults can render dark under a light page for dark-mode visitors. | off-spec |
| 24 | Tokens file location | `docs/design/landing-page/landing-theme.css` | Byte-identical to `app/landing-theme.css` today; two copies can drift. | doc-lags |
| 25 | Open items | "Font loading: add EB Garamond and Inter via next/font on the landing route only"; demos show no source link | Fonts are done (`app/(landing)/layout.tsx`). The source-link item is still open. | doc-lags |

**Checked and consistent (no drift):** every color token value; all type-scale tokens and clamps; radii; spacing tokens; the contrast table (recomputed); button variants and default state; chip, checkbox, modal, author, role-label and answer-card specs; footer; the 40% in-view rule (extended for tall demos); two-bands rule.
