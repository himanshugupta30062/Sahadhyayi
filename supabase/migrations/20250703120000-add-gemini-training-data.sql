-- Create table to store Gemini training samples
create table if not exists public.gemini_training_data (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  prompt text not null,
  completion text not null,
  created_at timestamp with time zone not null default now()
);

alter table public.gemini_training_data enable row level security;

create policy "Allow insert own training data" on public.gemini_training_data
  for insert with check (auth.uid() = user_id);

create policy "Select own training data" on public.gemini_training_data
  for select using (auth.uid() = user_id);
