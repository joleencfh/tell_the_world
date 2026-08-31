-- Storage bucket for re-hosted brief_coverage og:images.
--
-- submitCoverage (lib/briefs/actions.ts) scrapes the submitted article's
-- og:image and re-hosts it here via lib/links/store-image.ts, rather than
-- storing the outlet's own CDN URL directly — the CSP's img-src (next.config.ts)
-- only allow-lists 'self', data:, and the Supabase storage origin, so a
-- hotlinked third-party image_url would silently never render.
--
-- Objects are keyed as "{submitting_user_id}/{uuid}.{ext}" (mirrors
-- 054_avatar_storage.sql's ownership-from-path pattern), though unlike
-- avatars there's no update/delete flow yet — coverage images are written
-- once at submission time and never replaced.

insert into storage.buckets (id, name, public)
values ('coverage-images', 'coverage-images', true)
on conflict (id) do nothing;

create policy "Coverage images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'coverage-images');

create policy "Users can upload coverage images under their own folder"
  on storage.objects for insert
  with check (
    bucket_id = 'coverage-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
