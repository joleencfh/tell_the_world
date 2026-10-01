# Landing page redesign: running decisions

Updated 2026-10-01. Add to this list, do not relitigate settled items.

## Settled
- D1. One action only: join the waitlist. The header "Apply" link is removed.
- D2. Pink = creators & journalists. Blue = researchers & organisations. Kept as audience coding, not decoration.
- D3. The Hugging Face / OpenAI incident is real. Demo and example brief should link a source (placeholder until supplied).
- D4. No em dashes in copy. No invented testimonials, counts, endorsements or logos; placeholders clearly marked.
- D5. Text/background pairings meet WCAG AA. Mobile-first and responsive.

- D6. Design reference: Cursor only. Say Briefly and Wise both dropped (mood mismatch). Pink/blue stays as audience coding, used as text accent like Cursor uses Ember. Round-1 directions B and C are retired (Wise-influenced); round 2 options D, E, F are in direction-mocks-2.html.

- D7. Mixed direction: E typography (EB Garamond display, paper canvas, hairline rules) + F ledger (two matching audience cards) + framed artifacts (Q&A window, clarity-check diff). Draft in direction-mix.html. Round 2 directions D, E, F are superseded by it.

- D8. "You get" rows removed from the audience cards.
- D9. The two overlapping circles return as the main graphic (hero, closing, tag dots); the overlap is a third colour.
- D10. Colour is allowed as flat pale tints, but dialled to about 25% strength (a slider in direction-mix-3.html runs from the grey version to the previous round). No pink background surface, no gradients, no dark bands. Departure from Cursor, which keeps accents as text only.

- D11. Circles stay compact: about 230px beside the hero with a legend, one small cropped pair at the closing.

- D12. Circle treatment: the compact pair beside the headline with a legend, plus a small cropped pair at the closing (as in direction-mix-3.html).
- D13. The two animated demos are restyled as stylised artifacts in the new system (option A), with a Pause button and an "Illustrative example" label; the Q&A comments beat is removed. Not yet implemented in code.
- D14. Direction settled; final design and design system produced (final-design.html, design-system.md, landing-theme.css, design-system.html). Assumed defaults: creators card keeps its faint pink, "You bring" label dropped, 200,000 section removed, colour at about 25%.

- D15. Dropped the line "We review every request and reply by email" everywhere. Removed the demo source-link placeholder for now (add the real link later).
- D16. The 200,000 / Imagine section is removed (confirmed).
- D17. Built on branch `landing/redesign` (off master), uncommitted: route group `app/(landing)`, new components in `components/landing/`, theme in `app/landing-theme.css`.

## Proposed, awaiting confirmation
- P1. A brief becomes a visible, labelled example on the page.
- P2. The "200,000" projection leaves the landing page.
- P3. Demos get a visible "Illustrative example, sample content" label.
- P4. Copy still suggested: the trust line under the hero ("Members are approved before they can post or sign in.") and the email error message ("Enter an email address like you@example.com.").

## Open
- Whether the mixed draft is settled (see questions in chat).
- Circle treatment: current (0), seam (1), apart-then-together (2), or picker (3), see circle-options.html.
- Where the real incident source link comes from.
