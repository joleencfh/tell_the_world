-- Adds "Communications Specialist" and "Other" as first-class user roles.
--
-- Scaffolding only — parity with the existing roles (selectable on the
-- application form, badged, approvable from the admin screen, has a
-- profile) but no bespoke permissions or features yet; those get designed
-- later as real interactions are defined for these two roles.
--
-- `comms_specialist` is new to both enums. `other` already exists on
-- `application_role` (the "I am applying as a... Other" option) but was
-- deliberately left off `user_role` — see 039_waitlist_signups.sql's
-- comment — because approving an "other" application had nowhere to map
-- to. Adding it here also unblocks that approval path (lib/admin/actions.ts
-- currently hard-rejects `desired_role === 'other'` for exactly this
-- reason) and lets the waitlist modal (which stores directly into the
-- `user_role`-typed waitlist_signups.role column) offer both as choices.

alter type user_role add value 'comms_specialist';
alter type user_role add value 'other';

alter type application_role add value 'comms_specialist';
