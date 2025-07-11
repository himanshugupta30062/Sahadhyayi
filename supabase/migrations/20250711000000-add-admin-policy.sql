-- Adds admin check function and restricts contact_messages SELECT to admins

create or replace function public.is_admin()
returns boolean
language sql stable
as $$
  select auth.role() = 'authenticated' and (auth.jwt() ->> 'role') = 'admin';
$$;

-- Drop previous authenticated SELECT policy if it exists
drop policy if exists "Authenticated can select contact messages" on public.contact_messages;

-- New policy allowing only admins to view contact messages
create policy "Admins can view contact messages"
  on public.contact_messages
  for select
  using (public.is_admin());
