create table book_ratings (
  id uuid primary key default uuid_generate_v4(),
  book_id uuid references books_library(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  rating int check (rating between 1 and 5),
  created_at timestamptz default now()
);

alter table book_ratings
add constraint one_rating_per_user unique (book_id, user_id);
