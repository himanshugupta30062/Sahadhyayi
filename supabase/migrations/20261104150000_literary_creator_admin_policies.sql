-- Admin-only management for literary creator profiles and associated links/publications.
create policy "Admins manage literary creators"
  on public.literary_creators for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins manage creator social links"
  on public.creator_social_links for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins manage creator publications"
  on public.creator_publications for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());
