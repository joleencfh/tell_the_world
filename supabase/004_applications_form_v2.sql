-- =============================================================
-- Tell The World — Applications form v2
-- =============================================================

-- ─── Extend role enum ─────────────────────────────────────────
-- Adds 'other' for applicants who don't fit the four main roles.
-- Note: 'other' is an intake-only value and should never be copied
-- into users.role on approval — assign a proper role manually.

alter type application_role add value 'other';


-- ─── Fix pre-existing missing columns ─────────────────────────
-- job_title and org_size were referenced by the form since launch
-- but were never added to the applications table. Every submission
-- that included these fields has silently dropped them. Adding the
-- columns now fixes future submissions; historical rows will be NULL.

-- org_size uses text (not the org_size enum) to keep applications
-- decoupled from the users enum, whose values may diverge over time.

alter table applications
  add column job_title  text,
  add column org_size   text;


-- ─── New columns for form v2 ──────────────────────────────────

alter table applications
  add column sample_work_url  text,    -- creator/journalist: content sample; expert: publication link
  add column referral_source  text,    -- "how did you find us"
  add column additional_info  text;    -- open "anything else" field
