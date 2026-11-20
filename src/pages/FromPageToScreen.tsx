import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  BookOpen,
  Clapperboard,
  Film,
  Search,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import SEO from '@/components/SEO';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

type AdaptationMovie = {
  id: string;
  title: string;
  slug: string;
  release_year: number | null;
  director: string | null;
  original_language: string | null;
  country: string | null;
  runtime_minutes: number | null;
  poster_url: string | null;
  synopsis: string | null;
  official_trailer_url: string | null;
};

type BookMovieAdaptation = {
  id: string;
  book_library_id: string | null;
  book_title: string;
  book_author: string | null;
  book_publication_year: number | null;
  book_cover_url: string | null;
  genre: string | null;
  language: string | null;
  adaptation_type: string;
  synopsis: string | null;
  is_featured: boolean;
  movie: AdaptationMovie;
};

const GENRES = ['All adaptations', 'Drama', 'Mystery', 'Thriller', 'Fantasy', 'Romance', 'Historical', 'Literary fiction'];

const fetchAdaptations = async (): Promise<BookMovieAdaptation[]> => {
  const { data, error } = await (supabase as any)
    .from('book_movie_adaptations')
    .select('id, book_library_id, book_title, book_author, book_publication_year, book_cover_url, genre, language, adaptation_type, synopsis, is_featured, movie:adaptation_movies!inner(id, title, slug, release_year, director, original_language, country, runtime_minutes, poster_url, synopsis, official_trailer_url)')
    .eq('status', 'published')
    .eq('movie.status', 'published')
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(60);

  if (error) throw error;
  return (data || []) as BookMovieAdaptation[];
};

const Artwork = ({ src, alt, kind }: { src: string | null; alt: string; kind: 'book' | 'movie' }) => (
  <div className={`relative aspect-[3/4] overflow-hidden rounded-lg bg-gradient-to-br ${kind === 'book' ? 'from-amber-100 via-orange-100 to-rose-200 dark:from-amber-950 dark:via-orange-950 dark:to-rose-950' : 'from-slate-200 via-indigo-200 to-violet-300 dark:from-slate-900 dark:via-indigo-950 dark:to-violet-950'}`}>
    {src ? (
      <img src={src} alt={alt} loading="lazy" className="h-full w-full object-cover" onError={(event) => { event.currentTarget.style.display = 'none'; }} />
    ) : (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-2 text-center text-foreground/75">
        {kind === 'book' ? <BookOpen className="h-7 w-7" /> : <Film className="h-7 w-7" />}
        <span className="line-clamp-3 text-xs font-semibold">{alt}</span>
      </div>
    )}
  </div>
);

const FromPageToScreen = () => {
  const [search, setSearch] = useState('');
  const [genre, setGenre] = useState('All adaptations');
  const { data = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['from-page-to-screen', 'published'],
    queryFn: fetchAdaptations,
    staleTime: 1000 * 60 * 5,
  });

  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return data.filter((item) => {
      const matchesSearch = !query || [
        item.book_title,
        item.book_author,
        item.movie?.title,
        item.movie?.director,
        item.genre,
      ].some((value) => value?.toLocaleLowerCase().includes(query));
      const matchesGenre = genre === 'All adaptations' || item.genre?.toLocaleLowerCase() === genre.toLocaleLowerCase();
      return matchesSearch && matchesGenre;
    });
  }, [data, genre, search]);

  const featured = filtered.filter((item) => item.is_featured);
  const otherAdaptations = filtered.filter((item) => !item.is_featured);

  return (
    <>
      <SEO
        title="From Page to Screen | Books Adapted into Movies – Sahadhyayi"
        description="Discover the books behind your favourite films. Explore literary adaptations and compare original stories with their screen versions on Sahadhyayi."
        canonical="https://www.sahadhyayi.com/from-page-to-screen"
        url="https://www.sahadhyayi.com/from-page-to-screen"
      />
      <main className="min-h-screen bg-background text-foreground">
        <section className="relative isolate overflow-hidden border-b border-[#344438] bg-[#101711] text-white">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_78%_20%,rgba(190,145,70,0.32),transparent_42%),radial-gradient(ellipse_at_10%_90%,rgba(36,93,61,0.45),transparent_48%)]" />
          <div className="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:52px_52px]" />
          <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
            <div className="max-w-3xl">
              <Badge className="mb-5 border-[#D5B16D]/40 bg-white/10 text-[#F0D49A] hover:bg-white/10">
                <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Read &amp; Write · Literary cinema
              </Badge>
              <h1 className="font-serif text-4xl font-bold leading-tight tracking-tight text-[#FBF7EF] sm:text-5xl md:text-6xl">
                From Page to Screen
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-white/80 sm:text-lg sm:leading-8">
                Every film has a story. Discover the book behind it — and what changed along the way.
              </p>
              <div className="mt-8 flex max-w-2xl flex-col gap-3 sm:flex-row">
                <div className="relative min-w-0 flex-1">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search by book, author, movie or director…"
                    aria-label="Search book and movie adaptations"
                    className="h-12 rounded-xl border-white/20 bg-white/95 pl-11 text-[#1C201D] placeholder:text-[#778078]"
                  />
                </div>
                <Button
                  variant="outline"
                  className="h-12 rounded-xl border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                  onClick={() => { setSearch(''); setGenre('All adaptations'); }}
                >
                  <SlidersHorizontal className="mr-2 h-4 w-4" /> Clear filters
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9A7736] dark:text-[#D5B16D]">Explore adaptations</p>
              <h2 className="mt-2 font-serif text-2xl font-bold sm:text-3xl">Books that found a new life on screen</h2>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Explore the original work alongside its film adaptation. Detailed character and story comparisons are being added as each title is researched.</p>
            </div>
            <div className="text-sm text-muted-foreground">{data.length} published {data.length === 1 ? 'adaptation' : 'adaptations'}</div>
          </div>

          <div className="mb-7 flex gap-2 overflow-x-auto pb-2" aria-label="Filter adaptations by genre">
            {GENRES.map((item) => (
              <Button key={item} size="sm" variant={genre === item ? 'default' : 'outline'} className="shrink-0 rounded-full" onClick={() => setGenre(item)}>
                {item}
              </Button>
            ))}
          </div>

          {isLoading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-72 animate-pulse rounded-2xl bg-muted" />)}
            </div>
          ) : isError ? (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center">
              <p className="font-semibold">We couldn't load the adaptation catalogue.</p>
              <p className="mt-2 text-sm text-muted-foreground">Please try again in a moment.</p>
              <Button className="mt-4" onClick={() => void refetch()}>Try again</Button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-14 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted"><Clapperboard className="h-6 w-6 text-muted-foreground" /></div>
              <h3 className="font-serif text-xl font-semibold">The catalogue is being curated</h3>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
                We're verifying book-to-screen connections before publishing them. Check back soon for researched adaptations and comparisons.
              </p>
            </div>
          ) : (
            <>
              {featured.length > 0 && (
                <div className="mb-10">
                  <h3 className="mb-4 font-serif text-xl font-semibold">Featured adaptations</h3>
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {featured.map((item) => <AdaptationCard key={item.id} item={item} />)}
                  </div>
                </div>
              )}
              {otherAdaptations.length > 0 && (
                <div>
                  <h3 className="mb-4 font-serif text-xl font-semibold">{featured.length ? 'Explore more' : 'All adaptations'}</h3>
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {otherAdaptations.map((item) => <AdaptationCard key={item.id} item={item} />)}
                  </div>
                </div>
              )}
            </>
          )}
        </section>

        <section className="border-t border-border bg-muted/30">
          <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:grid-cols-3 sm:px-6 lg:px-8">
            <div><BookOpen className="mb-3 h-5 w-5 text-[#9A7736] dark:text-[#D5B16D]" /><h3 className="font-semibold">Read the original</h3><p className="mt-1 text-sm text-muted-foreground">Find the book in Sahadhyayi Library and use legitimate reading options.</p></div>
            <div><Film className="mb-3 h-5 w-5 text-[#9A7736] dark:text-[#D5B16D]" /><h3 className="font-semibold">Explore the adaptation</h3><p className="mt-1 text-sm text-muted-foreground">See the film details, cast and creative team.</p></div>
            <div><Sparkles className="mb-3 h-5 w-5 text-[#9A7736] dark:text-[#D5B16D]" /><h3 className="font-semibold">Compare both versions</h3><p className="mt-1 text-sm text-muted-foreground">Character and story analysis will be published with supporting sources.</p></div>
          </div>
        </section>
      </main>
    </>
  );
};

const AdaptationCard = ({ item }: { item: BookMovieAdaptation }) => (
  <article className="group overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
    <div className="grid grid-cols-2 gap-3 bg-muted/40 p-4">
      <div>
        <Artwork src={item.book_cover_url} alt={item.book_title} kind="book" />
        <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Original book</p>
      </div>
      <div>
        <Artwork src={item.movie?.poster_url || null} alt={item.movie?.title || 'Film adaptation'} kind="movie" />
        <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Screen adaptation</p>
      </div>
    </div>
    <div className="p-5">
      <div className="mb-2 flex flex-wrap gap-2">
        {item.genre && <Badge variant="secondary">{item.genre}</Badge>}
        {item.movie?.release_year && <Badge variant="outline">{item.movie.release_year}</Badge>}
        {item.book_library_id && <Badge className="bg-emerald-700 text-white hover:bg-emerald-700">In Sahadhyayi Library</Badge>}
      </div>
      <h3 className="font-serif text-xl font-bold leading-snug">{item.book_title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{item.book_author ? `by ${item.book_author}` : 'Original author details to be verified'}</p>
      <div className="my-3 flex items-center gap-2 text-sm text-muted-foreground"><ArrowRight className="h-4 w-4" /><span>{item.movie?.title || 'Film title pending'}</span></div>
      {item.movie?.director && <p className="text-xs text-muted-foreground">Directed by {item.movie.director}</p>}
      <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
        <span className="text-xs text-muted-foreground">{item.language || item.movie?.original_language || 'Language details pending'}</span>
        {item.book_library_id ? (
          <Link to={`/book/${item.book_library_id}`} className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">Read book <ArrowRight className="h-3.5 w-3.5" /></Link>
        ) : (
          <span className="text-xs text-muted-foreground">Book link pending</span>
        )}
      </div>
    </div>
  </article>
);

export default FromPageToScreen;
