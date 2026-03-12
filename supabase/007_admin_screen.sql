-- =============================================================
-- Tell The World — Admin screen supporting policies
-- =============================================================
-- The admin screen server actions use the Supabase service-role
-- key, which bypasses RLS entirely. No new RLS policies are
-- required for the admin screen to function.
--
-- This migration adds policies so that when the admin user is
-- authenticated via their normal session (e.g. in the Supabase
-- dashboard SQL editor), they can still read and update all
-- applications and users rows using the helper below.
--
-- Helper function: returns true if the calling user is the admin.
-- The admin email is stored in a Supabase Vault secret named
-- 'admin_email'. Alternatively, hard-code the email here if Vault
-- is not configured.
-- =============================================================

-- Allow the admin (identified by email) to read all applications.
create policy "Admin can read all applications"
  on applications
  for select
  to authenticated
  using (auth.email() = current_setting('app.admin_email', true));

-- Allow the admin to update application status (approve / reject).
create policy "Admin can update applications"
  on applications
  for update
  to authenticated
  using (auth.email() = current_setting('app.admin_email', true));

-- Allow the admin to read all users.
create policy "Admin can read all users"
  on users
  for select
  to authenticated
  using (auth.email() = current_setting('app.admin_email', true));

-- Allow the service role (and admin) to insert users.
-- Service role bypasses RLS so no policy is needed for server actions.
-- This policy covers direct inserts by the admin JWT if ever needed.
create policy "Admin can insert users"
  on users
  for insert
  to authenticated
  with check (auth.email() = current_setting('app.admin_email', true));

-- To activate these policies, run the following in your Supabase
-- SQL editor to set the admin email for the current session:
--
--   select set_config('app.admin_email', 'you@example.com', false);
--
-- Or configure it as a database parameter in Supabase > Settings >
-- Database > Connection Pooler > pool_mode session parameters.
-- For most purposes the service-role approach in the server actions
-- is sufficient and these policies are supplementary.
