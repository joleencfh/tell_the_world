# Tell The World: landing page design system

Version 0.1, 2026-10-01. Derived from the finished landing page ([final-design.html](final-design.html)), so it contains only what that page uses. It will be extended for the app. Tokens are in [landing-theme.css](landing-theme.css) (Tailwind 4 `@theme`); a rendered sheet of everything below is in [design-system.html](design-system.html).

## Principles (what the system is for)

1. **A reading surface, not a product chrome.** Warm paper, one warm ink, serif for anything meant to be read, sans only for controls, mono only for metadata.
2. **Two audiences, two colours, used sparingly.** Rose = creators & journalists. Cobalt = researchers & organisations. The overlap of the two circles is violet. Colour appears as text, small marks, buttons and faint tints. Never as a large saturated surface.
3. **Flat page, framed artifacts.** Hairlines and fills separate things. Shadow exists only on framed artifacts (the demo windows and the modal).
4. **Plain language.** Display type is quiet (weight 400, tight tracking). Jargon is a defect, so the diff view and the labels teach plain wording.
5. **Credibility.** No invented proof. Anything illustrative is labelled "Illustrative example, sample content". Source slots are visible placeholders until real.

## Relationship to the existing app system

The existing Two-Ink Bold tokens stay untouched. Every name here is new and non-colliding, so adding `landing-theme.css` changes nothing on the Brief page. `--font-mono` (IBM Plex Mono) is reused as-is. When the app migrates, replace old tokens with these and delete the old names.

Rough mapping, for the later migration: `paper` → `parchment`, `ink` → `umber`, `ink-soft` → `umber-soft`, `line` → `rule`, `pink-ink` → `rose`, `blue-ink` → `cobalt`, `pink` / `blue` → `rose-bright` / `cobalt-bright` (graphic only).

## Colour

### Surfaces

| Token | Hex | Use |
|---|---|---|
| `parchment` | `#F7F4EE` | Page canvas |
| `bone` | `#F0EEE6` | Neutral card; hover fill |
| `vellum` | `#FBFAF6` | Framed artifacts (windows, modal) |
| `card-rose` | `#F5E8EA` | Creators & journalists card |
| `card-cobalt` | `#E8ECF6` | Researchers & organisations card |
| `band-pale` | `#EFF2F9` | "Why this matters now" band |
| `band-soft` | `#E5EAF6` | Closing band |
| `diff-removed` | `#EBE8DE` | Removed line in a diff |
| `disabled` | `#E4E1D8` | Disabled or pending button |
| `scrim` | `rgb(38 37 30 / .55)` | Behind the modal |

The tints are tuned by hand to about 25% strength while keeping their hue. A plain 25% mix with the paper turns grey, so do not recompute them by mixing.

### Text and lines

| Token | Hex | Use |
|---|---|---|
| `umber` | `#26251E` | Primary text, primary button fill |
| `umber-hover` | `#3A3931` | Primary button hover |
| `umber-body` | `#3F3E37` | Long serif text on pale bands |
| `umber-soft` | `#5E5D56` | Secondary text, labels |
| `umber-deep` | `#4A4943` | Small text on the closing band |
| `field-line` | `#7A786E` | Input and chip borders |
| `rule` | `#DEDBD3` | Section hairlines |
| `window-line` | `#DAD6CA` | Hairlines inside windows |

### Audience pair

| Token | Hex | Use |
|---|---|---|
| `rose` | `#B80F5A` | Creators: text, buttons |
| `rose-deep` | `#9E0B4D` | Rose labels on tints; error text; rose button hover |
| `rose-bright` | `#F0197E` | **Graphic only** (circles, dots). Never text. |
| `rose-wash` | `#FBDDE8` | Selected chip, flagged-term panel |
| `cobalt` | `#1D3AA6` | Researchers: text, buttons |
| `cobalt-deep` | `#162E85` | Cobalt button hover |
| `cobalt-bright` | `#2150E8` | **Graphic only.** Never text. |
| `cobalt-wash` | `#DCE5FB` | Selected chip, added diff line |
| `violet` | `#6B21A8` | **Graphic only**: the circle overlap |

### Contrast (WCAG AA verified)

| Pair | Ratio | Where |
|---|---|---|
| umber on parchment | 14.0 | body text |
| umber-soft on parchment | 6.0 | secondary text |
| umber-soft on card-rose / card-cobalt | 5.6 | card labels |
| rose on parchment | 5.9 | accent phrase, labels |
| rose-deep on card-rose | 6.8 | card header, flag label |
| cobalt on card-cobalt | 8.0 | card header |
| rose on band-pale | 5.8 | eyebrow |
| umber-deep on band-soft | 7.5 | closing small text |
| white on rose / on cobalt | 6.5 / 9.5 | buttons |
| white on rose-deep / cobalt-deep | 8.1 / 11.9 | button hover |
| parchment on umber-hover | 10.6 | primary hover |
| umber-soft on disabled | 5.1 | disabled / pending button |
| rose-deep on vellum | 7.7 | error text |
| field-line on parchment | 4.0 | input and chip border (needs 3:1) |

The bright rose, bright cobalt and violet are decorative graphics with no text on them.

## Typography

Families: `font-serif` EB Garamond (display and reading), `font-ui` Inter (controls, nav, captions), `font-mono` IBM Plex Mono (metadata). Weights: serif 400, Inter 400/500/600, mono 400.

| Token (utility) | Size | Line | Tracking | Use |
|---|---|---|---|---|
| `text-display` | clamp 38 to 76px | 1 | -0.03em | Hero h1 (serif) |
| `text-heading` | clamp 30 to 56px | 1.03 | -0.025em | "Why this matters now" (serif) |
| `text-heading-sm` | clamp 28 to 46px | 1.05 | -0.025em | Artifact section h2 (serif) |
| `text-statement` | clamp 28 to 44px | 1.12 | -0.02em | Closing line (serif) |
| `text-lead` | 23px (21 under md) | 1.42 | 0 | Hero sub (serif) |
| `text-card` | 25px (23 under md) | 1.3 | 0 | Audience card sentence (serif) |
| `text-prose` | 21px (20 under md) | 1.5 | 0 | Section body (serif) |
| `text-message` | 19px | 1.4 | 0 | Text inside windows (serif) |
| `text-ui` | 15px | 1.5 | 0 | Buttons, nav, form text |
| `text-ui-sm` | 14px | 1.5 | 0 | Trust line, captions, footer |
| `text-label` | 12px | 1.4 | +0.07em | Mono metadata, **always uppercase, short** |

Rules: serif for anything read, never for controls. Mono labels are short (a few words), never sentences. Display and heading sizes may sit at line-height 1 to 1.12 because they are large and short; reading text never goes below 1.4.

## Spacing, layout, shape

- Base unit 4px (Tailwind default). Common steps: 8, 12, 16, 20, 24, 32, 40, 56, 64, 88.
- `spacing-gutter` 40px (20px under md). `spacing-section` 88px (56px under md). `container-page` 1080px.
- Breakpoint: `md` (768px). Components switch by container width where they live in frames.
- Radius: `tag` 2px (small tags), `control` 4px (buttons, cards, inputs, windows, modal); circles and dots use Tailwind's `rounded-full`. No pills. (Named `tag` / `control`, not `sm` / `md`, so the theme never overrides Tailwind's defaults and stays additive.)
- Elevation: `hairline` on cards, `window` on demo windows, `modal` on the dialog. Nothing else has a shadow.
- Touch targets: 44px minimum for anything tappable on mobile. Desktop small buttons are 36px.

## Components and states

### Button
Variants: **primary** (umber), **rose** (creators), **cobalt** (researchers). Height 44px (small 36px on desktop header), radius 4px, Inter 500 15px, 2px transparent border.

| State | Primary | Rose | Cobalt |
|---|---|---|---|
| Default | umber / parchment text | rose / white | cobalt / white |
| Hover | umber-hover | rose-deep | cobalt-deep |
| Focus-visible | 2px umber outline, 2px offset (all) | | |
| Pressed | hover colour, no movement | | |
| Disabled / pending | disabled fill, umber-soft text, no pointer; pending reads "Joining…" at the same size | | |

Rules: at most one primary action per view; the same action (join the waitlist) everywhere. The audience-coloured variants appear only on the audience cards and the modal submit that matches the chosen role.

### Text link
Inline, underlined with 1px, 5px offset, inherits colour. Hover: thicker 2px underline. Focus: same outline as button. Used for "Become an early tester", footer, nav.

### Header
Parchment, 1px rule below, 12px vertical padding. Logo left; Blog (desktop only), Sign in, "Join the waitlist" (small primary) right. Links have 44px tall hit areas. Not sticky blur.

### Eyebrow label
Mono `text-label`, uppercase. Colour by section meaning: umber-soft (neutral), rose (creator-side topics), cobalt (expert-side topics).

### Circle pair
Pink circle left, cobalt circle right, violet overlap (clip-path of the right circle by the left). Always bright rose, bright cobalt, violet. Sizes: logo (28x18), hero (230px wide with a two-line legend below), closing (cropped, 380px, bottom-right). The legend uses `rose` and `cobalt` text with bright dots. When the pair is the only carrier of meaning it has a text label (the legend or an `aria-label`).

### Audience card
`card-rose` or `card-cobalt`, radius 4, hairline shadow. Header row: dot + mono label (rose-deep or cobalt) over a hairline; then one serif sentence (`text-card`); then the matching button. Two sit side by side from md up, stacked below.

### Band
Full-bleed background (`band-pale`, `band-soft`) between hairline rules. Only two bands exist; do not add more.

### Framed window (artifact)
Vellum, radius 4, `shadow-window`. Chrome row: three window-line dots (hidden on mobile), centred title (13px umber-soft), Pause button right. Optional tab strip: mono labels, active tab has a 2px umber underline.
- The window is announced once with `role="group"` and an `aria-label`; its interior is `aria-hidden` and not focusable. Only the Pause button is exposed.

| Pause state | Look |
|---|---|
| Default | outlined 1px field-line, mono "Pause", two-bar icon |
| Hover | bone fill |
| Focus-visible | 2px umber outline |
| Paused (`aria-pressed=true`) | label "Play", triangle icon |

### Role label
A short mono label (`text-label`, uppercase) in a thin 1px border at 40% of the role colour, 2px radius, 6px side padding. Rose for Creator, cobalt for Expert and Organisation. It is a label, not a button: it has no fill and no hover state. Never reuse the dot-only treatment from the earlier round.

### Author
The block that names a person or organisation, used for every asker, answerer and quote author. Three parts, each in its own place so none can be mistaken for another:
1. A filled initial (36px, 28px small). Rose-deep circle for a creator, cobalt circle for an expert, **square** cobalt-deep for an organisation.
2. The name in Inter 600 15px, with the role label beside it on the same line (it wraps below the name on narrow screens).
3. The affiliation on its own line underneath, Inter 13px in umber-soft.

### Message row (inside windows)
A **Question** (mono label, Author, then the text in serif) and its **Answers**. Answers are indented under the question (32px, 16px on mobile) on a `card-cobalt` surface with a hairline, each labelled "Answer" and ending with a hairline then "Endorsed · n" in cobalt mono. Indentation, surface and label together make an answer unmistakable. A newly published quote gets a 3px cobalt edge for the length of its entrance only.

### Diff panel
Mono 13.5px. Removed line: `diff-removed` fill, umber-soft text, the changed term struck through in umber. Added line: `cobalt-wash` fill, the new wording in 500 with a 2px cobalt underline. A "1 term flagged" label (rose-deep mono) and the plain-meaning sentence sit under it.

### Form field
44px high, radius 4, 1px `field-line`, white fill, Inter 16px.

| State | Look |
|---|---|
| Default | 1px field-line |
| Hover | border umber-soft |
| Focus | 1px umber border plus 2px umber outline, 1px offset |
| Error | 2px rose-deep border, message below with an icon and text (never colour alone) |
| Disabled | disabled fill, umber-soft text |

Labels sit above, Inter 500 13px; "(Optional)" in umber-soft.

### Role chip (radio group)
44px min, radius 4, 1px field-line, Inter 500 14px, 3 columns desktop, 2 mobile.

| State | Look |
|---|---|
| Default | transparent |
| Hover | bone |
| Selected | 2px umber border, leading filled dot, tint by side: rose-wash (Creator, Journalist), cobalt-wash (Researcher/Expert, Organisation), bone (Communications Specialist, Other) |
| Focus-visible | 2px umber outline, 2px offset |

Implemented as `role="radiogroup"` with radios; arrow keys move selection. Selection is shown by dot and border weight as well as colour.

### Checkbox
24px box, 2px umber border, radius 2, white fill; checked shows a check mark. Label to its right, whole row is the target.

### Modal (dialog)
Vellum, radius 4, `shadow-modal`, 32px padding, max 520px; scrim behind. Mobile: bottom sheet, full width, 24px 20px padding. Close button 44px, top-right. `aria-labelledby` the heading; focus moves to the heading on open, is trapped, returns to the trigger on close; Escape closes. Steps: early-tester intro (only when opened from "Become an early tester"), form, confirmation (two-circle mark, "You're on the list", Close).

### Footer
Hairline above, 14px umber-deep text, links with 44px hit areas: Privacy Policy, Contact (and Blog on mobile). Sits inside the closing band.

## Motion

- Default transitions: 150ms standard ease (hover, press). Nothing else animates on the page.
- Demos: each beat fades or slides in over 600ms. Loops start only when the window is at least 40% in view and stop when it leaves. A Pause button is always present.
- Reduced motion: demos show their rest frame (Q&A: all three messages; quote: the diff). Transitions are 0ms.

## Accessibility defaults

- All text pairings in the table above are AA or better; bright rose, bright cobalt and violet never carry text.
- Focus is always a visible 2px umber outline with offset.
- 44px minimum targets on touch.
- One `h1`; sections are `h2`; the demo windows contribute no headings.
- Meaning is never carried by colour alone: role labels have text, chips have a dot and border, errors have an icon and text, the diff has `+`/`-` markers.

## Deliberately not included

Dark mode, data tables, charts, avatars, toasts, the brief page, the dashboard and other app components. They will be derived from these tokens when the app migrates.

## Open items

- Real incident source link for the demos and brief.
- Suggested copy still to confirm: the trust line ("Members are approved before they can post or sign in.") and the email error message. "We review every request and reply by email" was dropped by decision.
- The demos currently show no source link. When the real incident report link exists, add it to the Q&A window caption.
- Font loading: add EB Garamond and Inter via next/font on the landing route only.
