-- =============================================================
-- Tell The World — Waitlist early-tester opt-in
-- Applied via the Supabase Management API (see
-- memory:supabase_management_api_sql), not pasted into the SQL Editor.
--
-- The "Become an early tester" button on the landing page's closing
-- section (components/landing/ClosingSection.tsx) opens the same
-- waitlist form as "Join the waitlist", but first shows an intro step
-- (WaitlistModal.tsx) explaining what early testing means, with a real
-- checkbox for the person to confirm (or decline) — not just inferred
-- from which button they clicked. This column is that explicit choice,
-- so admin can see it directly instead of it being buried in free text.
-- Defaults false so plain waitlist signups (which skip the intro
-- entirely) are unambiguously "no".
-- =============================================================

alter table waitlist_signups
  add column wants_early_access boolean not null default false;
