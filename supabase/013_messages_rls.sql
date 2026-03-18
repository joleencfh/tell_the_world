-- ─── Messages RLS policies ────────────────────────────────────────────────
-- Run this in the Supabase SQL editor.

-- Authenticated users can send messages (insert where they are the sender)
create policy "Members can send messages"
  on messages
  for insert
  to authenticated
  with check (auth.uid() = sender_id);

-- Recipients can read messages sent to them
create policy "Recipients can read their messages"
  on messages
  for select
  to authenticated
  using (auth.uid() = recipient_id);

-- Senders can read messages they sent
create policy "Senders can read their own messages"
  on messages
  for select
  to authenticated
  using (auth.uid() = sender_id);
