-- Stores the free-text description when an applicant selects "other" as their role.
-- primary_platform and referral_source are plain text columns, so the typed value
-- replaces the "other" sentinel directly. desired_role is an enum, so it needs
-- a dedicated column.

alter table applications add column desired_role_other text;
