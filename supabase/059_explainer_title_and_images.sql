-- Explainer main title (brief-page-part2-plan.md follow-up, 2026-09-02): a
-- single title shown once above a brief's Explainer subsections, distinct
-- from the section band's own "Explainer" label and from each subsection's
-- own title (brief_sections.title).
alter table briefs add column explainer_title text;

-- Storage bucket for images inserted inline into Explainer rich text
-- (lib/richtext/editor.tsx's new image toolbar button, admin-only). Mirrors
-- 058_coverage_image_storage.sql's public-read bucket, but skips an insert
-- policy: unlike coverage images (submitted by any logged-in member),
-- explainer images are only ever written by uploadExplainerImage
-- (lib/admin/brief-actions.ts), which runs behind requireAdmin() using the
-- service-role client — RLS is bypassed there, so a client-facing insert
-- policy would just be unused surface area.
insert into storage.buckets (id, name, public)
values ('explainer-images', 'explainer-images', true)
on conflict (id) do nothing;

create policy "Explainer images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'explainer-images');
