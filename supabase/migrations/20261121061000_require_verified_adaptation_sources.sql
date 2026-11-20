-- Public comparison content must have a verified evidence record.
drop policy if exists "Published story differences are readable" on public.adaptation_story_differences;
create policy "Published story differences are readable" on public.adaptation_story_differences
for select to anon, authenticated using (
  status = 'published'
  and source_id is not null
  and exists (select 1 from public.adaptation_sources s where s.id = source_id and s.verification_status = 'verified')
  and exists (
    select 1 from public.book_movie_adaptations a
    join public.adaptation_movies m on m.id = a.movie_id
    where a.id = adaptation_id and a.status = 'published' and m.status = 'published'
  )
);

drop policy if exists "Published character comparisons are readable" on public.adaptation_character_comparisons;
create policy "Published character comparisons are readable" on public.adaptation_character_comparisons
for select to anon, authenticated using (
  status = 'published'
  and source_id is not null
  and exists (select 1 from public.adaptation_sources s where s.id = source_id and s.verification_status = 'verified')
  and exists (
    select 1 from public.book_movie_adaptations a
    join public.adaptation_movies m on m.id = a.movie_id
    where a.id = adaptation_id and a.status = 'published' and m.status = 'published'
  )
);
