# Landing page copy: ORIGINAL (2026-10-07)

**Frozen original, hand-written by the owner. Do not edit.**

Snapshot of every user-facing string on `/` as of master `937e969` (git tag `landing-before-ai-tells-cleanup`). Each row gives `file:line`, then the string exactly as rendered (HTML entities such as `&rsquo;` shown as the character they produce). Strings are verbatim; nothing here has been cleaned up.

Scope: `app/(landing)/page.tsx` and `components/landing/*` as rendered by the live route. `LegacyLandingPage.tsx` is unrouted and excluded. Screen-reader-only strings (`aria-label`s) are included and marked **[a11y]**. Strings shown only inside the animated demos are marked **[demo]**.

Restore rule: if wording ever needs rolling back, restore from this file, not from memory.

---

## 1. Header

`components/landing/LandingHeader.tsx`

| Line | String |
|---|---|
| 19 | Tell The World |
| 28 | Blog |
| 34 | Sign in |
| 21 | **[a11y]** nav label: `Primary` |
| `WaitlistButton.tsx:34` | Join the waitlist |

### Mobile menu (below `md`)

`components/landing/MobileMenu.tsx`

| Line | String |
|---|---|
| 34 | **[a11y]** button label: `Open menu` / `Close menu` |
| 60 | Blog |
| 63 | Sign in |

---

## 2. Hero

`components/landing/Hero.tsx`

| Line | String |
|---|---|
| 46 | Opening soon |
| 48-49 | AI safety research rarely reaches the people who could *tell its story.* (the last three words are the italic, rose-colored emphasis) |
| 51-54 | Tell The World connects AI safety researchers and organisations with the creators and journalists who can put their work in front of real audiences. |
| 59 | **[a11y]** circle graphic: `Two overlapping circles: creators and journalists in pink, researchers and organisations in blue` |
| 63 | Creators & journalists (legend) |
| 67 | Researchers & organisations (legend) |

### Audience cards

| Line | String |
|---|---|
| 74 | Creators & journalists (card heading) |
| 75 | Know how to turn complicated research into stories people can relate to. |
| `WaitlistButton.tsx:34` | Join the waitlist |
| 77 | Researchers & organisations (card heading) |
| 78 | Have important messages on how to make AI go well. |
| `WaitlistButton.tsx:34` | Join the waitlist |
| 83 | Members are approved before they can post or sign in. |

---

## 3. Why this matters now

`components/landing/WhyThisMatters.tsx`

| Line | String |
|---|---|
| 8 | Why this matters now |
| 10 | Attention shows up, *understanding doesn’t always follow.* (italic, rose emphasis on the second half) |
| 14-17 | AI incidents are all over the news and existential risk is reaching the mainstream. Now that people are finally paying attention, we need a way to keep the momentum going, while providing candid & credible explanations from the people and organisations who actually study this. We need to do this at scale, now. |

---

## 4. Community Q&A section

Text from `app/(landing)/page.tsx`, rendered by `components/landing/ArtifactSection.tsx`.

| Line | String |
|---|---|
| `page.tsx:28` | Community Q&A (eyebrow) |
| `page.tsx:29` | Ask a question & get an answer from someone who studies this. |
| `page.tsx:30` | Every brief has an open Q&A. Ask what's on your mind, and an expert or organisation working on the problem answers directly, on the record. |

### Q&A demo window **[demo]**

`components/landing/QACommunityDemo.tsx` (frame: `DemoWindow.tsx`)

| Line | String |
|---|---|
| 56 | The Hugging Face / OpenAI Security Incident (window title) |
| 57 | **[a11y]** `Example: a creator asks how bad the Hugging Face / OpenAI security incident really was, and an expert and an organisation answer on the record.` |
| 62-65 | Brief · Q&A · Quotes · Sources (tab row) |
| 70 | Question |
| 72 | Priya Sharma · Creator · The Priya Sharma Show |
| 75 | This new report on the Hugging Face / OpenAI incident just came to my attention. How bad is it, really? |
| 38 | Answer (label on each answer) |
| 80 | Elena Vasquez · Expert · Independent Researcher |
| 81-83 | This is the clearest warning shot we’ve had. A handful of the agents involved even considered alerting a human, and every one of them decided not to. That’s not a story about one bug. It’s a preview of how hard oversight gets once these systems start coordinating. |
| 85 | Foresight Commons · Organisation · AI policy · existential risk |
| 86-89 | We study incidents like this closely, and this one is worse than what came before it, not just more widely covered. The real question isn’t only what these systems can do today. It’s whether anyone stays in control as more capable ones arrive, and that’s what we research and push lawmakers on. |
| 44 | Endorsed · 1 (becomes `Endorsed · 2` on Elena’s answer mid-loop) |

---

## 5. Quotes on record section

| Line | String |
|---|---|
| `page.tsx:35` | Quotes, on record (eyebrow) |
| `page.tsx:36` | Expert quotes you can understand, and use. |
| `page.tsx:37` | Experts and organisations add their own on-record quotes directly, in plain language. Every submission runs through a clarity check first, so jargon gets caught before it ever reaches a reader. |

### Add-quote demo window **[demo]**

`components/landing/AddQuoteDemo.tsx`

| Line | String |
|---|---|
| 157 | Window title: `Quotes`, then `Add a quote` once the form opens |
| 158 | **[a11y]** `Example: an expert clicks Add quote and types a quote that uses the jargon term reward hacking. The clarity check flags it and suggests plainer wording, the expert pastes that wording over the term, and publishes the quote.` |
| 169 | Quotes (list heading) |
| 174 | Add quote (button) |
| 177-179 | Elena Vasquez · Expert · Independent Researcher: “The lesson here isn’t about one model. It’s about what happens once systems like this start operating faster than anyone can review.” |
| 181-182 | Foresight Commons · Organisation · AI policy · existential risk: “This is worse than what came before it, not just more widely covered.” |
| 197 | Add a quote (form heading) |
| 56, 198 | For: The Hugging Face / OpenAI Security Incident |
| 202 | Quote (field label) |
| 52-53 | Typed quote: The incident report is straightforward: this was reward hacking. The agents found a shortcut that scored well, and none of them told a human. |
| 50-51 | Flagged term: `reward hacking`. Replacement: `an AI gaming its own scoring system` |
| 244 | Tags: `ai safety`, `frontier labs` |
| 256 | 1 term flagged |
| 257-259 | “reward hacking”: When an AI finds an unintended shortcut that scores well on its training objective without doing what was actually wanted. |
| 261-263 | Try: an AI gaming its own scoring system |
| 270 | Quote published. |
| 141-147 | Primary button states: `Publish quote` → `Review flags` → `Submitting…` → `Published` |
| 282 | Cancel (becomes `Close` once published) |

### Demo frame (both demos)

`components/landing/DemoWindow.tsx`

| Line | String |
|---|---|
| 34 | **[a11y]** `Pause the animated example` / `Play the animated example` |
| 47 | Pause / Play (visible from `md` up; icon only on mobile) |
| 52 | Illustrative example, sample content |

---

## 6. Closing band and footer

`components/landing/Closing.tsx`

| Line | String |
|---|---|
| 18-19 | Want in sooner? Become an early tester and try Tell The World while it’s still rough, so you can help us fix it. |
| `EarlyTesterLink.tsx:15` | Become an early tester (the inline link inside that sentence) |
| `WaitlistButton.tsx:34` | Join the waitlist |
| 29 | Tell The World · © 2026 (year is `new Date().getFullYear()`) |
| 37 | Blog (footer link, shown below `md` only) |
| 40 | Privacy Policy |
| 43 | Contact |

---

## 7. Waitlist modal

`components/landing/WaitlistModal.tsx`. Opened by every "Join the waitlist" button (role pre-selected: Creator from the header, closing band and rose card; Researcher/Expert from the cobalt card) and by "Become an early tester" (intro step first).

### Chrome

| Line | String |
|---|---|
| 217 | **[a11y]** close button: `Close` |

### Step: intro (early-tester mode only)

| Line | String |
|---|---|
| 242 | Become an early tester (eyebrow) |
| 244 | Before you sign up |
| 247-248 | We’ll reach out soon to a handful of early testers. Thank you for wanting to help us shape it while it’s still rough around the edges. |
| 266 | Yes, I’d like to be considered as an early tester. (checkbox, on by default) |
| 270 | Next |

### Step: form

| Line | String |
|---|---|
| 275 | Eyebrow: `Become an early tester` or `Join the waitlist` |
| 277 | Tell us who you are |
| 281-282 | `We'll reach out by email if we're ready for early testers.` (early tester) / `We'll reach out when Tell The World opens.` (waitlist) |
| 289 | **[a11y]** honeypot label, hidden: `Leave this field empty` |
| 295 | I am a |
| 34-39 | Role options: Creator · Journalist · Researcher/Expert · Organisation · Communications Specialist · Other |
| 327 | Full name |
| 334 | placeholder: Jordan Reyes |
| 341 | Email |
| 352 | placeholder: you@example.com |
| 359 | Error: Enter an email address like you@example.com. |
| 362 | Label: `Platform & channel name` (Creator) / `Affiliation` (all other roles) |
| 369 | placeholder: `e.g. YouTube, Jordan’s AI Corner` (Creator) / `Where you work, publish, or post` (others) |
| 376 | Label: `Channel link` (Creator) / `LinkedIn or personal site` (others) |
| 383 | placeholder: `youtube.com/@…` (Creator) / `linkedin.com/in/…` (others) |
| 390 | Anything else? (Optional) |
| 396 | placeholder: Optional |
| 404 | Server error text: whatever `submitWaitlistSignup` returns (`lib/waitlist/actions.ts`, outside the landing components) |
| 418 | Submit button: `Joining…` (pending) / `Count me in` (early tester) / `Join the waitlist` |

### Step: success

| Line | String |
|---|---|
| 229 | You’re on the list |
| 233-234 | `We'll email you if we're ready for early testers.` (early tester) / `We'll email you when there's something to see.` (waitlist) |
| 237 | Close |

---

## 8. Page metadata (outside the listed files, included for completeness)

| Line | String |
|---|---|
| `app/layout.tsx:16` | Tell The World (page title) |
| `app/layout.tsx:17` | Where AI safety expertise meets independent media. (meta description) |

---

## Notes for later steps

- Straight apostrophes (`'`) and curly ones (`’`) are mixed in the original (`page.tsx:30` and the modal's helper lines use straight; most other strings use curly). Recorded as found, not normalized.
- No em dashes appear in the landing copy as of this snapshot.
- Action names in use: header button, both audience cards, closing band and modal submit all say "Join the waitlist"; the early-tester path says "Become an early tester" (link) and "Count me in" (submit).
