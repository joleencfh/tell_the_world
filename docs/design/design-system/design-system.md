# Tell The World design system

Version 1.0, 2026-10-01. The landing page's design, generalised so the whole app can adopt it.

- Tokens: [app-theme.css](app-theme.css) (Tailwind 4 `@theme`)
- Rendered reference, with the components in every state and five app screens rebuilt in the system: [design-system.html](design-system.html)
- How to move the existing app onto it, screen by screen: [migration.md](migration.md)
- Where it came from: [../landing-page/design-system.md](../landing-page/design-system.md) (the landing-only v0.1, now superseded) and [../landing-page/design-decisions.md](../landing-page/design-decisions.md)

Nothing in the app has been changed to use this yet. The tokens are additive (every name is new), so the app can adopt them screen by screen.

## 1. Principles

1. **A reading surface, not product chrome.** Warm paper, one warm ink. Serif for anything meant to be read, a clean sans only for controls and short facts, mono only for short labels. The app is mostly reading and deciding, so type does the work.
2. **Two audiences, two colours, used sparingly.** Rose is creators and journalists. Cobalt is researchers and organisations. They appear as text, small marks, buttons and faint tints, never as a large saturated surface. The overlap of the two circles is violet.
3. **Hierarchy before decoration.** Who said it, what they are, and where they work must be told apart at a glance (see Author). Depth comes from fills and hairlines. Only floating things have a shadow.
4. **Credibility over polish.** Every claim traces to a named person or a source. Anything illustrative is labelled. No invented counts or proof, in the UI as in marketing.
5. **Plain language.** Jargon is a defect. Labels are short, errors say what to do, buttons start with a verb, nothing is shouted.
6. **Gate access deliberately.** Locked, pending and approved are first-class states with their own design, not afterthoughts.
7. **Accessible by default.** AA contrast everywhere, 44px touch targets, one visible focus ring, meaning never carried by colour alone, motion that can be paused.

## 2. Foundations

### 2.1 Colour

Colour is named by what it is (`umber`, `parchment`), not where it is used. The tables say what to use it for.

**Surfaces**

| Token | Hex | Use |
|---|---|---|
| `parchment` | `#F7F4EE` | Page canvas |
| `vellum` | `#FBFAF6` | Raised surfaces on parchment: cards, windows, modals, menus |
| `bone` | `#F0EEE6` | Inset or neutral: hover fill, skeleton, secondary button, neutral chip |
| `card-rose` | `#F5E8EA` | Creators and journalists card (faint pink) |
| `card-cobalt` | `#E8ECF6` | Researchers and organisations card (faint blue) |
| `band-pale` | `#EFF2F9` | A quiet pale-blue band |
| `band-soft` | `#E5EAF6` | Closing or footer band |
| `diff-removed` | `#EBE8DE` | Removed line in a diff |
| `disabled` | `#E4E1D8` | Disabled or pending control |
| `scrim` | `rgb(38 37 30 / .55)` | Behind a modal |
| `inverse` / `inverse-soft` | `#26251E` / `#C9C5B8` | The one dark surface. Restricted, see 4.6 |

The faint tints are tuned by hand to about 25% strength and keep their hue. A plain mix with the paper turns grey, so never recompute them by mixing.

**Text and lines**

| Token | Hex | Use |
|---|---|---|
| `umber` | `#26251E` | Primary text, primary button fill |
| `umber-hover` | `#3A3931` | Primary button hover |
| `umber-body` | `#3F3E37` | Long serif text on pale bands |
| `umber-soft` | `#5E5D56` | Secondary text and labels. Passes AA on every surface above |
| `umber-deep` | `#4A4943` | Small text on the closing band |
| `field-line` | `#7A786E` | Input, chip and checkbox borders (4:1, needs 3:1) |
| `rule` | `#DEDBD3` | Hairlines between sections on parchment |
| `window-line` | `#DAD6CA` | Hairlines inside vellum surfaces |

**Audience pair**

| Token | Hex | Use |
|---|---|---|
| `rose` | `#B80F5A` | Creator text, buttons, role label |
| `rose-deep` | `#9E0B4D` | Rose label on a tint, creator avatar fill, rose hover |
| `rose-bright` | `#F0197E` | **Graphic only**: circles, dots. Never text |
| `rose-wash` | `#FBDDE8` | Selected chip, flagged-term panel |
| `cobalt` | `#1D3AA6` | Expert and organisation text, buttons, role label |
| `cobalt-deep` | `#162E85` | Cobalt hover, organisation avatar fill |
| `cobalt-bright` | `#2150E8` | **Graphic only** |
| `cobalt-wash` | `#DCE5FB` | Selected chip, added diff line, info surface |
| `violet` | `#6B21A8` | **Graphic only**: the overlap of the circles |

**Status (new for the app).** Muted, warm, and none is rose or cobalt, so a status can never be mistaken for an audience. A status always carries an icon and words; colour only reinforces.

| Token | Hex | Use |
|---|---|---|
| `brick` / `brick-deep` / `brick-wash` | `#A32A1E` / `#862017` / `#F8E5E1` | Danger: errors, destructive actions |
| `moss` / `moss-wash` | `#2D6A3E` / `#E4F0E6` | Success |
| `ochre` / `ochre-wash` | `#7A4F00` / `#F7EBCB` | Warning |
| `cobalt` / `cobalt-wash` | as above | Info |

**Which colour for what (the rules)**

- Rose and cobalt mean **who**, never **how it went**. Never use them for success or error.
- A role, an author, a quote's source, an audience card: coloured by audience. Everything else (page chrome, links, buttons that are not audience actions) is umber.
- Links are umber and underlined. Only role-coded things use rose or cobalt.
- Primary actions are umber. A button takes rose or cobalt only when it belongs to that audience (an audience card, or the waitlist form for that role).
- No gradients. No dark bands except the single restricted inverse band.
- Categories (post type: video, article, paper, quote, resource) are neutral. They are told apart by an icon and a word, not by hue. The app currently uses five stock hues for these; they retire.

**Contrast (WCAG AA, measured).** Anything below is the floor, not the target.

| Pair | Ratio |
|---|---|
| umber on parchment / vellum | 14.0 / 14.7 |
| umber-soft on parchment / vellum / bone | 6.0 / 6.3 / 5.7 |
| rose on parchment / vellum | 5.9 / 6.2 |
| cobalt on parchment / vellum | 8.7 / 9.1 |
| rose-deep on card-rose | 6.8 |
| cobalt on card-cobalt | 8.0 |
| white on rose / cobalt / rose-deep / cobalt-deep | 6.5 / 9.5 / 8.1 / 11.9 |
| brick on parchment / brick-wash | 6.6 / 6.0 |
| moss on parchment / moss-wash | 5.9 / 5.5 |
| ochre on parchment / ochre-wash | 6.5 / 6.0 |
| white on brick / moss | 7.2 / 6.5 |
| parchment on inverse | 14.0 |
| field-line on parchment / vellum (needs 3:1) | 4.0 / 4.2 |

### 2.2 Typography

Three voices. Use the right one for the job and the screen sorts itself out.

| Family | Utility | Use |
|---|---|---|
| EB Garamond | `font-serif` | Page and section titles, card titles, anything read: briefs, quotes, answers, lead text |
| Inter | `font-ui` | Controls, navigation, forms, captions, table cells, names |
| IBM Plex Mono | `font-mono` | Short uppercase metadata labels only (the app's existing mono) |

| Token (utility) | Size / line / tracking | Family | Use |
|---|---|---|---|
| `text-display` | 38 to 76px / 1 / -0.03em | serif | Marketing hero |
| `text-title` | 32 to 48px / 1.05 / -0.025em | serif | **App page title** (brief, profile, directory) |
| `text-heading` | 30 to 56px / 1.03 | serif | Big section heading |
| `text-heading-sm` | 28 to 46px / 1.05 | serif | Section heading |
| `text-section` | 28px / 1.15 / -0.02em | serif | Sub-section heading in app pages |
| `text-card-title` | 22px / 1.25 / -0.01em | serif | Card and list-item title |
| `text-statement` | 28 to 44px / 1.12 | serif | Pull statement |
| `text-lead` | 23px (21 mobile) / 1.42 | serif | Lead paragraph, TL;DR |
| `text-card` | 25px (23 mobile) / 1.3 | serif | Short audience sentence |
| `text-reading` | 19px / 1.65 | serif | **Long-form body** (brief sections, explainer) |
| `text-prose` | 21px (20 mobile) / 1.5 | serif | Section intro |
| `text-message` | 19px / 1.4 | serif | Text in quotes, answers, windows |
| `text-ui` | 15px / 1.5 | Inter | Buttons, nav, form text |
| `text-ui-sm` | 14px / 1.5 | Inter | Secondary UI, table cells |
| `text-caption` | 13px / 1.4 | Inter | Meta lines, affiliations, helper text |
| `text-label` | 12px / 1.4 / +0.07em | mono | Metadata. **Always uppercase, always short** |

Rules:
1. **Floor is 12px.** The app currently uses 8 to 11px mono in hundreds of places; those all move up to `text-label`.
2. **Mono is for labels, not sentences.** A few words, uppercase through CSS (`uppercase`), never typed in capitals, so the content stays in sentence case.
3. **Serif for reading, sans for controls.** Never set a control or a name in serif; never set a paragraph in mono.
4. Large serif sizes may run at line-height 1 to 1.12 because they are short; reading text never goes below 1.4.
5. Headings in app pages: `h1` is `font-serif text-title`, `h2` is `font-serif text-section`, `h3` is `font-serif text-card-title`, `h4` is `font-ui text-ui font-semibold`. One `h1` per page.
6. Tabular figures (`tabular-nums`) for counts, dates and votes.

### 2.3 Layout

| Token | Value | Use |
|---|---|---|
| `max-w-page` (`--container-page`) | 1080px | Marketing and dashboard pages |
| `max-w-content` (`--container-content`) | 896px | Brief, profile, directory content |
| `max-w-reading` (`--container-reading`) | 704px | Long-form reading column |
| `max-w-narrow` (`--container-narrow`) | 416px | Sign-in card, small forms |
| `px-gutter` | 40px (20px under `md`) | Page side padding |
| `py-section` | 88px (56px under `md`) | Vertical section padding |

- Base unit is 4px (Tailwind default). Common steps: 8, 12, 16, 20, 24, 32, 40, 56, 64, 88.
- Breakpoint: `md` (768px). Design mobile first; components that live in frames switch by container width.
- Sections are separated by a hairline (`border-t border-rule`) and generous space, not by boxes. At most two tinted bands per page.
- Touch targets are 44px minimum under `md`. Desktop dense controls may be 36px.

**Page templates** (all share the header, the footer and the gutters):

| Template | Container | Used by |
|---|---|---|
| Marketing | `page` | Landing |
| Reading | `content` header + `reading` column | Brief |
| Dashboard | `page` | Home |
| List and filter | `content` | Directory |
| Detail | `content` | Profile |
| Form | `narrow` to `reading` | Apply, contact, edit profile |
| Moderation | `page` | Admin |
| Auth | `narrow` card centred | Login, apply status |

### 2.4 Shape, elevation, layers

- Corners: `rounded-tag` 2px for small labels and checkboxes; `rounded-control` 4px for buttons, inputs, cards, windows, modals and menus; `rounded-full` only for circles, dots and avatars. **No pill buttons.**
- The page is flat. Elevation tokens: `shadow-hairline` (card edge), `shadow-window` (demo and artifact windows), `shadow-menu` (dropdowns, popovers, toasts), `shadow-modal`.
- Layers: header 20, dropdown 30, modal 50, toast 60 (`--z-*`).

### 2.5 Motion

- Hover, press and focus: 150ms, `ease-standard`. Menus and disclosures: 250ms. An item appearing (a new row, a demo beat): 600ms fade and 8px rise.
- Nothing loops without a Pause control and without stopping when it leaves view or the tab is hidden.
- With `prefers-reduced-motion`, durations collapse to 0 and any animation shows its rest frame.
- Never animate layout properties (height, width, top). Use opacity and transform.

### 2.6 Iconography and imagery

- Icons: 1.5px stroke, `currentColor`, 16 or 20px, rounded joins. No filled or chromatic icons. An icon never stands alone as the only carrier of meaning.
- No stock photography, no 3D, no AI-risk imagery (no glowing networks, no red alerts). Brief thumbnails and empty states use a duotone of `rose-wash` and `cobalt-wash` on `bone`, or the initial of the thing.
- The two overlapping circles are the brand mark. Use them at logo size, in the hero, in the confirmation state and as one cropped pair on a closing band. Not as wallpaper.

## 3. Components

Each has its recipe (Tailwind classes), variants and states. Recipes use only tokens from `app-theme.css`.

### 3.1 Actions

**Button.** Min height 44px (36px `sm` on desktop only), `rounded-control`, `text-ui font-medium`, 2px transparent border so every variant has the same size.

```
base:     inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-control border-2 border-transparent px-[22px] font-ui text-ui font-medium leading-none transition-colors duration-150 ease-standard focus-ring disabled:cursor-not-allowed disabled:bg-disabled disabled:text-umber-soft
primary:  bg-umber text-parchment hover:bg-umber-hover
rose:     bg-rose text-white hover:bg-rose-deep
cobalt:   bg-cobalt text-white hover:bg-cobalt-deep
secondary:bg-bone text-umber hover:bg-window-line
ghost:    text-umber hover:bg-bone
danger:   bg-brick text-white hover:bg-brick-deep
icon:     size-11 px-0 (secondary or ghost)
sm:       min-h-9 px-3.5 text-ui-sm   (desktop only; keep min-h-11 under md)
```

| State | Look |
|---|---|
| Default | variant fill |
| Hover | the `-hover` or `-deep` fill, no movement |
| Focus-visible | 2px umber outline, 2px offset |
| Pressed | hover fill, `scale-[.97]` for 100ms |
| Disabled | `disabled` fill, `umber-soft` text, no pointer |
| Pending | disabled look plus the present-tense label ("Joining…"), same size |

Rules: at most one primary per view. A primary and a secondary may sit together; never two primaries. Destructive actions are `danger` and always confirm (see 3.7). Labels start with a verb.

**Text link.** Inherits colour (umber), underlined 1px with a 5px offset; hover 2px; focus uses the ring. External links open in a new tab with `rel="noopener noreferrer"`.

### 3.2 Forms

**Field** = label above, optional hint, control, optional error. 44px control, `rounded-control`, white fill, 1px `field-line` border.

```
label:   mb-1.5 block font-ui text-caption font-medium text-umber
hint:    mt-1 text-caption text-umber-soft
control: w-full min-h-11 rounded-control border border-field-line bg-white px-3 py-2.5 font-ui text-base text-umber placeholder:text-umber-soft focus-visible:border-umber focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-umber disabled:border-disabled disabled:bg-disabled disabled:text-umber-soft aria-[invalid=true]:border-2 aria-[invalid=true]:border-brick
error:   mt-1.5 flex items-start gap-1.5 text-caption text-brick  (icon + words, role="alert")
```

| State | Look |
|---|---|
| Default | 1px `field-line` |
| Hover | border `umber-soft` |
| Focus | 1px umber border and a 2px umber outline |
| Error | 2px `brick` border, icon and message below, `aria-invalid` and `aria-describedby` |
| Disabled | `disabled` fill |

- **Required vs optional:** mark optional fields "(Optional)" and leave required ones unmarked. Long forms say "All fields are required unless marked Optional" once at the top. No red asterisk.
- **Textarea, Select, Search:** same control, with `resize-y`, a chevron icon (16px, right, `text-umber-soft`) and a leading search icon respectively.
- **Form section:** a `fieldset` with a `legend` in `text-label uppercase text-umber-soft`, a hairline under it, 24px between fields.
- **Checkbox:** 24px box, 2px umber border, `rounded-tag`, white fill; checked shows a check mark. The whole label row is the target (min 44px).
- **Role chip / choice chip (radio group):** 44px, `rounded-control`, 1px `field-line`. Selected: 2px umber border, a filled dot, and a tint by side (`rose-wash`, `cobalt-wash`, or `bone` for neutral). Implemented as `role="radiogroup"` with arrow-key movement. Used for roles and for filters.
- **Rich text editor (Lexical):** the toolbar uses secondary icon buttons; the editing area is a `reading`-size serif surface on `vellum` with the Field border and focus.

### 3.3 Navigation

**App header.** Parchment, 1px `rule` bottom border, sticky, `z-header`. Container `max-w-page`, 44px targets. Left: logo (circle pair + "Tell The World"). Right: text links in `text-ui-sm text-umber-soft` (hover umber, underlined), the current page `text-umber` with a 2px underline, and the user's avatar menu. No uppercase mono links, no 2px ink rule.

**Page header.** Optional eyebrow (`text-label uppercase`), title (`font-serif text-title`), optional lead (`text-lead text-umber-soft`), optional actions on the right. 56px above, 40px below.

**Tabs.** Underline tabs: `role="tablist"`; tab `py-2.5 text-ui-sm text-umber-soft`, hover umber, selected `text-umber` with a 2px umber underline. The dashboard's sliding tab track keeps its transform animation (250ms).

**Section nav (brief).** A sticky tab row under the header listing the brief's sections, with the current one underlined. Collapses to a horizontal scroller on mobile.

**Pagination.** Secondary `sm` buttons; the current page is `bg-umber text-parchment` with `aria-current="page"`; Previous and Next are labelled, not just arrows.

**Footer.** Hairline above, `text-ui-sm text-umber-deep`, 44px link targets: Privacy Policy, Contact, Blog.

### 3.4 Identity

**Author** (the most important small component). Every person or organisation named anywhere (asker, answerer, quote author, contributor, member card) uses it. Three parts, each in its own place, so none can be mistaken for another:
1. A filled initial.
2. The name in Inter 600, with the **role label** beside it on the same line (wraps under the name on narrow screens).
3. The affiliation on its own line underneath, `text-caption text-umber-soft`.

```
wrapper: flex items-center gap-2.5
name:    font-ui text-[0.9375rem] font-semibold leading-tight text-umber
affil:   mt-0.5 text-caption text-umber-soft
```

**Role label.** A short mono label (`text-label uppercase`) in a thin 1px border at 40% of the role colour, `rounded-tag`, `px-1.5 py-px`. It is a label, not a button: no fill, no hover. Colour by audience: Creator and Journalist rose; Expert and Organisation cobalt; Admin, Communications Specialist, Other neutral (`border-field-line text-umber-soft`).

**Avatar.** Image if present, otherwise the initial in white on a fill: Creator and Journalist `bg-rose-deep` circle, Expert `bg-cobalt` circle, **Organisation `bg-cobalt-deep` square (`rounded-control`)**, Admin, Communications Specialist and Other `bg-umber-soft` circle. The rotating five-hue palette retires. Sizes: `2xs` 18, `xs` 32, `sm` 36, `md` 40, `lg` 44, `xl` 48, `2xl` 56, `3xl` 80 px. Real images keep the same shape.

**Circle pair and logo.** See 2.6.

### 3.5 Data display

**Card.** `rounded-control bg-vellum shadow-hairline` on parchment. Variants: **audience** (`bg-card-rose` or `bg-card-cobalt`, header row with a dot and a mono label); **inset** (`bg-bone`, no shadow). Interactive cards are one link: the title is the link, the whole card is the target, hover is `bg-bone` and underlined title, focus uses the ring. Padding 20 to 24px.

**Brief card.** Thumbnail (duotone) or none, `text-card-title` serif title, `text-ui-sm text-umber-soft` TL;DR (2 lines), a meta row (date, tags), one link.

**Member card.** Author block, a short bio in `text-ui-sm`, and a primary action ("View profile"; "Contact" opens the contact modal).

**List and table rows.** A list is `divide-y divide-rule rounded-control bg-vellum shadow-hairline`. A row is `px-5 py-4`, 44px minimum. Table-like data uses a grid with a `text-label` header row; cells are `text-ui-sm`. Dates and counts are `tabular-nums`.

**Key-value rows** (admin, profile details): a two-column grid, label `text-label uppercase text-umber-soft` (160px), value `text-ui-sm text-umber`, a hairline between rows.

**Accordion row** (admin cards): a button row with a chevron (rotates 90deg, 150ms), the title in `text-ui font-semibold`, a status chip on the right; the panel opens with a 250ms fade.

**Tag and chip.**
- *Tag:* `rounded-tag border border-window-line px-2 py-0.5 font-mono text-label text-umber-soft`.
- *Category chip:* `rounded-tag bg-bone px-2 py-0.5 font-mono text-label uppercase text-umber-soft` plus a 14px icon for the type. No hues.
- *Status chip:* `rounded-tag border border-field-line px-1.5 py-px font-mono text-label uppercase text-umber` plus an icon (pending: clock, approved: check, declined: x). Neutral by default. On admin and other moderation screens, where scanning long lists matters, the chip takes a tone instead: a tinted fill, the status colour for the text, no border (pending `ochre` on `ochre-wash`, approved `moss` on `moss-wash`, declined `brick` on `brick-wash`, all AA). The icon and word remain. Public screens stay neutral. Decided 2026-10-06.
- *Count badge:* `text-label tabular-nums` in a `bone` `rounded-tag` box.

**Quote card.** The quote in `font-serif text-message`, then the Author block (`sm`). A newly published quote has a 3px `cobalt` inset edge for the length of its entrance only.

**Question and answers (Q&A thread).** A labelled **Question** (mono label, Author, serif text) followed by **Answers**, indented 32px (16px on mobile) on `card-cobalt` with a hairline, each labelled "Answer" and ending with a hairline then "Endorsed · n" in cobalt mono. Indentation, surface and label together make an answer unmistakable.

**Section marker.** A mono numeral (`01`, bold, umber), a hairline that fills the row, and a mono label on the right. Used to number a brief's sections.

**Timeline and source list.** Timeline: a vertical `border-l border-rule` with a 10px umber dot per item, date in mono, text in `text-ui-sm`. Sources: numbered list, each with the title as a link, the publisher in `text-caption text-umber-soft`, and the date.

**Diff panel.** Mono 13.5px. Removed line on `diff-removed` with the changed term struck through; added line on `cobalt-wash` with the new wording underlined in cobalt; `-` and `+` markers; then a "1 term flagged" label (`brick`) and the plain meaning.

**Carousel.** A scroll-snap track, scrollbars hidden, 44px secondary icon buttons for previous and next, keyboard reachable.

### 3.6 Feedback

**Inline alert.** `flex gap-3 rounded-control px-4 py-3 text-ui-sm`, text `umber`, a 16px icon in the status colour, an optional bold lead word in the status colour. Tones: info (`cobalt-wash`), success (`moss-wash`), warning (`ochre-wash`), danger (`brick-wash`). `role="status"`, or `role="alert"` for danger. No coloured side stripe.

**Toast.** `vellum`, `shadow-menu`, `rounded-control`, icon in the status colour, message, optional action, close button. Bottom-centre on mobile, bottom-right on desktop, `z-toast`. Success and info dismiss after 6s; errors and anything with an action stay until dismissed. Pauses on hover and focus. `role="status"` (errors `role="alert"`). Email is the notification channel, so toasts are only for immediate feedback on what the user just did.

**Empty state.** A serif line (`text-card-title`) saying what is missing, one `text-ui-sm text-umber-soft` sentence on what to do, and one button. Never a sad illustration.

**Skeleton.** `bg-bone rounded-control motion-safe:animate-pulse`, sized like the real content, so nothing jumps.

**Locked panel** (members-only brief, pending application). A `card` with a serif title ("Members only"), one plain sentence, and the right action: the waitlist or sign in. It names the state, never hides the title.

### 3.7 Overlays

**Modal.** `fixed inset-0 z-modal bg-scrim`; panel `vellum`, `rounded-control`, `shadow-modal`, `max-w-[520px]` (`narrow`, `reading` for large forms), `px-5 py-6 md:px-8 md:py-8`; on mobile a bottom sheet (`rounded-b-none`, full width). Title in serif 30 to 34px, close button 44px top right. Behaviour is part of the component: labelled by its title; focus moves to the title on open and on each step; Tab is trapped; Escape and a click on the scrim close it; the page behind is `inert`; focus returns to the trigger.

**Confirm dialog.** A small modal with a plain-language question ("Delete this brief?"), what happens, and two buttons: the safe one (secondary) first, the action (`danger` for destructive) second. The destructive label repeats the action ("Delete brief"), not "OK".

**Menu / dropdown.** `vellum`, `rounded-control`, `shadow-menu`, `py-1`; item `min-h-11 px-3 text-ui text-umber hover:bg-bone`; a destructive item is `text-brick`. `role="menu"`, arrow keys, Escape closes, focus returns to the trigger.

**Disclosure drawer** (sources drawer): opens in place with a 250ms fade, never over content.

**Framed window** (artifact). `vellum`, `rounded-control`, `shadow-window`; chrome row with three `window-line` dots (hidden on mobile), a centred title, and a Pause button; announced once via `role="group"` and `aria-label`, its animated interior `aria-hidden`.

### 3.8 Editorial

**Reading column.** `max-w-reading`, `font-serif text-reading`, 24px between paragraphs, `text-section` subheads, links underlined, quotes as Quote cards, lists with hanging markers.

**Inverse band** (not used). The app has no dark surface: the "Covered by" block uses `band-soft` with umber text (decision 1, 2026-10-06). `inverse` and `inverse-soft` stay in the theme, but do not use them without a new decision.

## 4. Patterns

- **Forms.** One column. Labels above. Group with fieldsets. Validate on blur (never on every keystroke), show errors inline and summarise in an alert at the top for long forms. The submit button stays enabled until it is pending; show why a required field blocks submit in words. Keep the user's input on error.
- **Moderation (admin).** A filter tab row, a list of accordion rows, key-value details, then actions: approve (primary), decline (secondary), delete (danger, confirms). Status chips show the state; the tone may colour them here.
- **Permissions and states.** Logged out, pending, approved and members-only each have a named state and message (Locked panel). Never show a control the user cannot use without saying why.
- **Destructive actions.** `danger` button, a confirm dialog, the object named in the confirmation, and where possible an undo toast instead of a dialog.
- **Loading.** Skeletons shaped like the content. Buttons go pending in place.
- **Errors.** Say what happened and what to do next, in plain language, near where it happened. Never "Something went wrong" alone.

## 5. Accessibility

- AA contrast for every text and UI pairing (tables above). Graphic-only colours never carry text.
- One focus ring (`focus-ring`: 2px umber, 2px offset) on every interactive element, never removed.
- 44px touch targets under `md`.
- Meaning is never colour alone: role labels have words, chips have a dot and a heavier border, errors have an icon and words, diffs have `+` and `-`, statuses have an icon.
- Dialogs are real dialogs (labelled, trapped, inert background, focus returned). Radio groups are real radio groups with arrow keys.
- Motion respects `prefers-reduced-motion`; anything that loops has Pause and stops off screen.
- Heading order is correct: one `h1`, `h2` for sections, no skipped levels; decorative demo content contributes no headings.
- Forms: every control has a visible label, errors are announced (`role="alert"`) and linked (`aria-describedby`).

## 6. Content and voice

- Plain language. If a term needs explaining, explain it in the interface (the clarity check is the model). No jargon as a badge.
- **No em dashes** in user-facing copy.
- Sentence case everywhere. Uppercase is a CSS style on short mono labels, never typed.
- Buttons start with a verb and say what happens ("Join the waitlist", "Publish quote"). Same action, same words, everywhere.
- Never invent proof: no made-up counts, testimonials, endorsements or logos. Illustrative content is labelled "Illustrative example, sample content".
- Errors: what happened, what to do. Empty states: what is missing, what to do.

## 7. Governance

- **Adding a token.** Name it for what it is, not where it is used. Check AA against every surface it may sit on. Add it to `app-theme.css`, the tables here, and the rendered reference in the same change. No raw hex values in components.
- **Adding a hue.** Not allowed without a written reason. The palette is umber and parchment, rose and cobalt, and the three status colours.
- **Adding a component.** First try a variant of an existing one. If it is new, give it a recipe, every state, and a rendered example in the reference.
- **Review checklist for a screen:** only tokens from the theme; serif for reading and sans for controls; mono only for short uppercase labels at 12px or more; 44px targets; visible focus; no colour-only meaning; one primary action; copy has no em dashes; works at 390px and 1440px; respects reduced motion.
- **Dark mode** is not part of v1. Because components use named roles and not raw values, a dark theme can be added later by remapping the tokens in one place.

## 8. Decisions

These were decided on 2026-10-06 after comparing options side by side ([decision-options.html](decision-options.html)).

1. **"Covered by" block: decided, option A.** Replace the dark band with `band-soft` and umber text. No dark surface remains in the app.
2. **Status chips: decided, option C.** Neutral chips on public screens. On admin and moderation screens, chips take a tone as a tinted fill with the status text colour and no border (`ochre`, `moss`, `brick` on their washes). Icon and word always stay. This replaced the earlier rule (tone on border and text only).
3. **Brief reading font: decided, option A.** Serif at 19px (`text-reading`) for brief sections.
4. **Admin density: decided, option A.** Inter 14px, 44px minimum row height, nothing smaller than 12px.

Still open:

5. **"Apply" inside the app.** The landing page has one action (join the waitlist), but the app still has an apply flow and a "Join the waitlist" or "Apply" link in locked states. Decide the final entry story, then use one verb.
6. **Landing error colour.** The landing waitlist modal uses `rose-deep` for errors (it predates the status colours). In migration step 1 it moves to `brick` so errors are never rose.
