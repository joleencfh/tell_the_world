-- Allow users to update their own profile row.
--
-- Note: this policy does NOT prevent updating role, email, or id at the DB level.
-- Those fields are protected at the application layer in the server action (updateProfile),
-- which strips them from the payload before writing. Column-level security (CLS) is a
-- Postgres Enterprise feature not available on the Supabase free tier.

create policy "Users can update own profile"
  on users for update
  using (auth.uid() = id)
  with check (auth.uid() = id);
