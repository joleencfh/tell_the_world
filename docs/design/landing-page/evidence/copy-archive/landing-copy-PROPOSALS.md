# Landing copy: proposals (Step 5, Stage A)

Date: 2026-10-14. Nothing in `components/landing` or `app/(landing)` was edited. The frozen original is `landing-copy-ORIGINAL-2026-10-07.md`.

**How to use this:** write `accept`, `reject` or your own wording in the **Decision** column. Stage B applies only accepted rows (your wording wins over mine). Rows marked **depends on** must be decided together.

Rules applied: no em dashes, no invented proof or counts, nothing the product cannot back today (no multilingual, no promised response times), your voice kept (plain, warm, short). Line numbers are for the current code on master at `9f1315b`.

## Sections that are fine (no row)

- **Hero headline** (`Hero.tsx:50-53`): "AI safety research rarely reaches the people who could tell its story." Plain, specific, no flagged pattern.
- **Header and footer** (`LandingHeader.tsx`, `Closing.tsx:29-44`): Blog, Sign in, Privacy Policy, Contact, copyright. Fine.
- **Status chip** "Opening soon" (`StatusChip.tsx:7`): fine.
- **Quote section headline** "Expert quotes you can understand, and use." (`page.tsx:35`): fine.
- **Demo labels** (Question, Answer, Endorsed, Expert, Organisation, tab names, "1 term flagged", "Quote published."): content of the demo, not marketing copy.
- **Clarity-check demo text** (typed quote, flagged term, suggestion): illustrative and on-message.
- **Modal form labels and placeholders** (Full name, Email, role options, Affiliation, Channel link): functional.
- **Incident facts in the Q&A demo**: real incident, illustrative quotes, per your earlier confirmation. Not touched except where the wording has a pattern problem (rows 10, 11, 13 and 14).

## A. Hero and trust

| # | Location | Original | Flagged problem | Proposed replacement | Reason | Decision |
|---|---|---|---|---|---|---|
| 1 | `Hero.tsx:64-67` | "Tell The World connects AI safety researchers and organisations with the creators and journalists who can put their work in front of real audiences." | "real audiences" is filler (as opposed to what?). The sentence also does not say what you actually get, and "brief" is never introduced. | "Tell The World connects AI safety researchers and organisations with the creators and journalists who tell their audiences what is at stake. Researchers share sourced briefs, quotes and answers. Creators and journalists use them." | Names the three things the product holds, so "brief" is defined before the Q&A section uses it. Keeps your first clause. | |
| 2 | `Hero.tsx:56-58` (creators card) | "Know how to turn complicated research into stories people can relate to." | Describes the person, not the benefit. Reads as a flattering label. Does not say what they get. (Step 4 left the cards identical in structure because a purpose difference needs wording.) | "Get sourced briefs and on-the-record quotes from the people who study AI risk, written to be used in your own work." | Card 1 says what you **get**. Only claims what exists: briefs with sources, quotes, written in plain language. | |
| 3 | `Hero.tsx:59-61` (researchers card) | "Have important messages on how to make AI go well." | Vague ("important messages"), and "make AI go well" is the most abstract phrase on the page. | "Share your research and answer questions where creators and journalists will find them, in plain language and on the record." | Card 2 says what you **give**. Mirrors card 1 without repeating its words. **Depends on** row 2. | |
| 4 | `Hero.tsx:86` | "Members are approved before they can post or sign in." | This is the page's one defensible claim (PRODUCT.md positioning) and it is the smallest line on it. It also reads like a system rule, not a promise. | "Every member is reviewed and approved before they can post or sign in." | Same fact, stated as a commitment. No team named, no invented process. Pair with the layout note under row 5. | |
| 5 | Under the form submit button, `WaitlistModal.tsx` near line 418 (new line) | none | No data promise anywhere (findings B5, option A). | "We use your details only to contact you about Tell The World. See our Privacy Policy." with "Privacy Policy" linking to `/privacy`. | Accurate against `/privacy` (no sale or rental of data, `app/privacy/page.tsx:168`; waitlist email collected, `:122`). **Check the wording against your DPA before accepting.** | |

Layout note for row 4: Stage B only changes the words. If you want the line promoted visually (next to the cards), that is a small layout change I would raise as its own request, since Step 4 closed layout.

## B. "Why this matters now" band

| # | Location | Original | Flagged problem | Proposed replacement | Reason | Decision |
|---|---|---|---|---|---|---|
| 6 | `WhyThisMatters.tsx:9` (heading) | "Attention shows up, understanding doesn't always follow." | Balanced-clause aphorism: sounds like a headline, says little, and could sit on any media startup page. | "People are paying attention to AI risk. Clear answers are hard to find." | Two plain sentences, concrete, same idea. Alternative if you prefer one line: "More people are asking about AI risk than can find a clear answer." | |
| 7 | `WhyThisMatters.tsx:12-16` (body) | "AI incidents are all over the news and existential risk is reaching the mainstream. Now that people are finally paying attention, we need a way to keep the momentum going, while providing candid & credible explanations from the people and organisations who actually study this. We need to do this at scale, now." | Stacked abstractions ("keep the momentum going", "candid & credible explanations", "at scale, now"). "actually" and "finally" are intensifiers. "at scale, now" is a claim of capacity the product does not have yet. The ampersand is inconsistent with the rest. | "AI incidents are in the news, and the risk of catastrophe is reaching the mainstream. Creators and journalists are being asked to explain it. The people who study it are hard to reach, and their work is hard to reuse. Tell The World puts them in touch, and gives the work a form that creators can use." | Keeps your two opening facts. Replaces slogans with the actual mechanism (reach plus reusable briefs, PRODUCT.md principle 2). Drops "at scale, now". Note: "catastrophe" is my substitution for "existential risk"; revert if you want the original term. **Depends on** row 6 only for tone. | |

## C. Q&A section

| # | Location | Original | Flagged problem | Proposed replacement | Reason | Decision |
|---|---|---|---|---|---|---|
| 8 | `page.tsx:28` (heading) | "Ask a question & get an answer from someone who studies this." | Promises an answer, which the waitlist product cannot guarantee. Ampersand in a heading. | "Ask a question. Hear from someone who studies this." | Softens "get an answer" to what the page can back, keeps your voice. If you are happy to promise answers, reject this row. | |
| 9 | `page.tsx:29` (body) | "Every brief has an open Q&A. Ask what's on your mind, and an expert or organisation working on the problem answers directly, on the record." | "brief" is used before it is defined. "Ask what's on your mind" is filler. "answers directly" is again a response promise. | "A brief is a sourced summary of one AI risk topic, with an open Q&A at the end. Creators and journalists ask. Experts and organisations answer on the record." | Defines "brief" at first real use (row 1 also introduces it). Drops filler. Straight apostrophe in the original also goes away. | |
| 10 | `QACommunityDemo.tsx:105-107` (Elena's answer) | "This is the clearest warning shot we've had. A handful of the agents involved even considered alerting a human, and every one of them decided not to. That's not a story about one bug. It's a preview of how hard oversight gets once these systems start coordinating." | Forced contrast "That's not a story about one bug. It's a preview...". | "This is the clearest warning shot we've had. A handful of the agents involved considered alerting a human, and every one of them decided not to. That points past one bug, to how hard oversight gets once these systems start coordinating." | Same claim, no negate-then-correct shape. Demo content stays illustrative. | |
| 11 | `QACommunityDemo.tsx:117-120` (Foresight Commons answer) | "We study incidents like this closely, and this one is worse than what came before it, not just more widely covered. The real question isn't only what these systems can do today. It's whether anyone stays in control as more capable ones arrive, and that's what we research and push lawmakers on." | Two forced contrasts ("not just more widely covered", "The real question isn't only... It's whether") and an "and that's what" tail. | "We study incidents like this closely, and this one is worse than what came before it. The question that matters is whether anyone stays in control as more capable systems arrive. That is what we research and what we push lawmakers on." | Removes both contrasts, keeps the content. **Depends on** row 14 (the same sentence is quoted in the Quotes demo). | |

## D. Quotes section

| # | Location | Original | Flagged problem | Proposed replacement | Reason | Decision |
|---|---|---|---|---|---|---|
| 12 | `page.tsx:36` (body) | "Experts and organisations add their own on-record quotes directly, in plain language. Every submission runs through a clarity check first, so jargon gets caught before it ever reaches a reader." | Mild: "ever" and "gets caught" are padding. Otherwise accurate (clarity check gates expert and organisation submissions). | "Experts and organisations add their own on-record quotes directly, in plain language. Each quote goes through a clarity check first, so jargon is caught before a reader sees it." | Tighter, same facts. Optional row; reject if you like the current rhythm. | |
| 13 | `AddQuoteDemo.tsx:177-179` (Elena's quote) | "The lesson here isn't about one model. It's about what happens once systems like this start operating faster than anyone can review." | Forced contrast ("isn't about X. It's about Y"). | "The lesson reaches past any one model: what happens once systems like this operate faster than anyone can review." | Same point, one sentence. | |
| 14 | `AddQuoteDemo.tsx:181-182` (Foresight Commons quote) | "This is worse than what came before it, not just more widely covered." | Same "not just" contrast as row 11. | "This is worse than what came before it." | **Depends on** row 11 so the quote matches the answer. | |

## E. Closing and naming

| # | Location | Original | Flagged problem | Proposed replacement | Reason | Decision |
|---|---|---|---|---|---|---|
| 15 | `Closing.tsx:17-20` | "Want in sooner? Become an early tester and try Tell The World while it's still rough, so you can help us fix it." | One sentence, two asks: the big button below says Join the waitlist while the sentence above sells early testing. The reader has to choose before they know the difference. | "Join the waitlist and we'll email you when Tell The World opens. Want in sooner? Become an early tester and help us fix what's still rough." with "Become an early tester" staying as the inline link. | One sentence per ask, each next to its control. Keeps your "rough" honesty. | |
| 16 | `WaitlistModal.tsx:418` | submit button "Count me in" (early-tester path) | A third name for the action. Elsewhere it is "Join the waitlist" and "Become an early tester". | "Become an early tester" | One action, one name. Rows 15 and 16 together make the vocabulary: *Join the waitlist* (default), *Become an early tester* (opt-in). | |
| 17 | `WaitlistModal.tsx:233-234, 281-282` | straight apostrophes in `"We'll email you..."` and `"We'll reach out..."` strings; curly elsewhere | Typographic inconsistency (recorded in the archive notes). Mechanical, no wording change. | Use curly apostrophes throughout the landing components. | Pure typography. Safe to apply. | |
| 18 | `LandingHeader.tsx:35`, `MobileMenu.tsx:63` | "Sign in" | Not a problem for members. For a visitor on a waitlist-only site it hints that anyone can sign in. | Keep "Sign in". | Listed so you can see it was checked. Alternative "Member sign in" if you want to reinforce the approval line. | |

## F. Illustrative caption (both demos)

| # | Location | Original | Flagged problem | Proposed replacement | Reason | Decision |
|---|---|---|---|---|---|---|
| 19 | `DemoWindow.tsx:48` (shared, visible under both windows) | "Illustrative example, sample content" | Exists and is visible, which meets the plan. But "sample content" under the Q&A window blurs what is real (the incident) and what is not (the people and their words). Both demos currently share one caption. | Q&A: "Illustrative example. The incident is real. The people and answers are sample content." Quotes: "Illustrative example. The people and quotes are sample content." Requires a `caption` prop on `DemoWindow` (Stage B). | Honest about the one real fact and still clear nothing is a real quote, per PRODUCT.md (no fabricated proof). | |

## Notes

- **Eyebrows in the modal** ("Become an early tester" / "Join the waitlist" above the form heading, `WaitlistModal.tsx:242,275`) are the same device Step 3 removed from the page. They also repeat the button label. I left them out of this table because they are a look change, not wording. Say so if you want them removed in Stage B.
- **"existential risk" vs "catastrophe"** (row 7): your original used the first. PRODUCT.md uses both. Pick one and I will use it everywhere.
- Rows with real wording risk, so read these two closely: **5** (privacy claim) and **7** (new sentence about reusable work).
