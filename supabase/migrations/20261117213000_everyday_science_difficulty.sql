-- Add difficulty metadata without rewriting the original assessment migration.
alter table public.everyday_science_attempts
  add column if not exists difficulty text not null default 'beginner'
  check (difficulty in ('beginner', 'intermediate', 'advanced'));

create index if not exists everyday_science_attempts_user_difficulty_created_idx
  on public.everyday_science_attempts (user_id, difficulty, created_at desc);
