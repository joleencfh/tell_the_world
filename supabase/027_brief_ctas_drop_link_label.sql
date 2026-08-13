-- =============================================================
-- Tell The World — drop brief_ctas.link_label
-- Run this in the Supabase SQL Editor.
--
-- Two-Ink Bold plan Part 6 follow-up (2026-08-13): the CTA card's link
-- button was changed to an icon-only arrow, so the author-chosen label
-- ("Read"/"Watch"/"Download") is never displayed anymore — the arrow's
-- accessible name now comes from the CTA's own title instead
-- (app/briefs/[slug]/ctas.tsx). The "Button text" field was removed from
-- the submission form since it no longer does anything visible, and this
-- drops the now-unused column rather than leaving dead schema around.
-- =============================================================

alter table brief_ctas drop column link_label;
