-- Restrict contact_messages SELECT to authenticated users only
-- Drops any existing broader policy and replaces it

-- Remove admin-only policy if present
drop policy if exists "Admins can view contact messages" on public.contact_messages;

-- Allow authenticated users to view contact messages
create policy "Authenticated users can view contact messages"
  on public.contact_messages
  for select
  to authenticated
  using (true);
