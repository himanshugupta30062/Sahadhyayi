-- Keep owner QA IPs in a private, server-managed allowlist.
-- The Edge Function accesses this table with the service-role client only.
create table if not exists public.owner_test_ip_allowlist (
  ip_address inet primary key,
  description text,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.owner_test_ip_allowlist enable row level security;
revoke all on table public.owner_test_ip_allowlist from anon, authenticated;
grant select on table public.owner_test_ip_allowlist to service_role;

comment on table public.owner_test_ip_allowlist is
  'Private allowlist of public IP addresses whose website analytics events are stored only in owner_test_analytics.';
