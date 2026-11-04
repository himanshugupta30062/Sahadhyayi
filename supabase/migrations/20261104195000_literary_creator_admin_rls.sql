-- Secure admin write access for literary creator curation.
-- The UI uses the authenticated Supabase client; RLS is the authorization boundary.
grant select, insert, update, delete on public.literary_creators to authenticated;
grant select, insert, update, delete on public.creator_social_links to authenticated;
grant select, insert, update, delete on public.creator_publications to authenticated;

drop policy if exists "Admins manage literary creators" on public.literary_creators;
create policy "Admins manage literary creators"
  on public.literary_creators for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins manage creator social links" on public.creator_social_links;
create policy "Admins manage creator social links"
  on public.creator_social_links for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins manage creator publications" on public.creator_publications;
create policy "Admins manage creator publications"
  on public.creator_publications for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());
