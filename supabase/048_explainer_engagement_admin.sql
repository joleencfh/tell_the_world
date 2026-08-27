-- =============================================================
-- Tell The World — Explainer engagement: admin parity
-- Applied via the Supabase Management API (see
-- [[supabase_management_api_sql]] memory).
--
-- Follow-up to 047_explainer_engagement.sql: admin should be able to flag
-- contentious points and cast a usefulness vote too, same as every other
-- engagement mechanism on the Explainer (comments and the private feedback
-- channel were already open to admin — no role gate on either). Widens the
-- two role-restricted insert/update policies to include 'admin' rather than
-- routing admin through a separate service-role bypass (submitCta's
-- pattern) — both tables require a real, non-null author_user_id (unlike
-- brief_ctas' nullable one), so an "editorial/anonymous" admin path doesn't
-- fit the same way; admin's own submissions go through the same tables and
-- queues as everyone else's.
-- =============================================================

drop policy "Experts and orgs can flag their own contentious points" on explainer_contentious_points;

create policy "Experts, orgs, and admin can flag their own contentious points"
  on explainer_contentious_points
  for insert
  to authenticated
  with check (
    auth.uid() = author_user_id
    and status = 'pending'
    and exists (
      select 1 from users
      where id = auth.uid()
        and role in ('expert', 'organisation', 'admin')
    )
  );

drop policy "Creators and journalists can cast a useful vote" on explainer_useful_votes;
drop policy "Creators and journalists can change their own useful vote" on explainer_useful_votes;

create policy "Creators, journalists, and admin can cast a useful vote"
  on explainer_useful_votes
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from users
      where id = auth.uid()
        and role in ('creator', 'journalist', 'admin')
    )
  );

create policy "Creators, journalists, and admin can change their own useful vote"
  on explainer_useful_votes
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from users
      where id = auth.uid()
        and role in ('creator', 'journalist', 'admin')
    )
  );
