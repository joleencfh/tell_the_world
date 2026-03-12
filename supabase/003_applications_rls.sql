-- Allow unauthenticated (anon) users to submit applications.
-- The with check ensures they cannot self-approve — only 'pending' is allowed on insert.

create policy "Anyone can submit an application"
  on applications
  for insert
  to anon, authenticated
  with check (status = 'pending');
