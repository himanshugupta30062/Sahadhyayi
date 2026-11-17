-- Science Lab media uploads and Gemini feedback.
alter table public.science_experiment_attempts
  add column if not exists ai_feedback jsonb,
  add column if not exists ai_reviewed_at timestamptz;

create table if not exists public.science_experiment_media (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.science_experiment_attempts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null unique,
  media_type text not null check (media_type in ('image','video')),
  mime_type text not null check (mime_type in ('image/jpeg','image/png','image/webp','video/mp4','video/webm')),
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 26214400),
  caption text check (caption is null or char_length(caption) <= 300),
  created_at timestamptz not null default now(),
  constraint science_experiment_media_path_owner check (split_part(storage_path, '/', 1) = user_id::text)
);

create index if not exists science_experiment_media_attempt_idx
  on public.science_experiment_media (attempt_id, created_at);

alter table public.science_experiment_media enable row level security;

drop policy if exists "Users can read their experiment media" on public.science_experiment_media;
create policy "Users can read their experiment media"
  on public.science_experiment_media for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can add their experiment media" on public.science_experiment_media;
create policy "Users can add their experiment media"
  on public.science_experiment_media for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.science_experiment_attempts a
      where a.id = attempt_id and a.user_id = (select auth.uid())
    )
  );

drop policy if exists "Users can delete their experiment media" on public.science_experiment_media;
create policy "Users can delete their experiment media"
  on public.science_experiment_media for delete to authenticated
  using ((select auth.uid()) = user_id);

grant select, insert, delete on public.science_experiment_media to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'science-experiment-media',
  'science-experiment-media',
  false,
  31457280,
  array['image/jpeg','image/png','image/webp','video/mp4','video/webm']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users upload own science experiment media" on storage.objects;
create policy "Users upload own science experiment media"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'science-experiment-media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Users read own science experiment media" on storage.objects;
create policy "Users read own science experiment media"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'science-experiment-media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Users delete own science experiment media" on storage.objects;
create policy "Users delete own science experiment media"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'science-experiment-media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
