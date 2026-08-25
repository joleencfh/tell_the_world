-- =============================================================
-- Tell The World — brief_faq_answers.rich_content
-- Run this in the Supabase SQL Editor.
--
-- Brief page Part 2 (docs/design/brief-feature/brief-page-part2-plan.md
-- §2, Part 6 step 2): expert-submitted FAQ answers get the same Lexical
-- rich-text support Explainer subsections already have (migration 033) —
-- additive alongside the existing plain-text `body`, which stays the
-- not-null plain-text mirror (AddAnswerForm writes both).
-- =============================================================

alter table brief_faq_answers add column rich_content jsonb;
