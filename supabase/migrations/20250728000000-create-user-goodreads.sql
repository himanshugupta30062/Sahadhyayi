create table if not exists user_goodreads (
  id uuid references auth.users(id) primary key,
  goodreads_user_id text not null,
  access_token text not null,
  access_token_secret text not null,
  updated_at timestamptz default now()
);
