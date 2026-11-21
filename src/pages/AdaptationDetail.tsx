import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, Clapperboard, Film, Info, ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import SEO from '@/components/SEO';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type AnyRow = Record<string, any>;

const fetchAdaptation = async (id: string) => {
  const { data, error } = await (supabase as any).from('book_movie_adaptations')
    .select('*, movie:adaptation_movies!inner(*)')
    .eq('id', id).eq('status', 'published').eq('movie.status', 'published').maybeSingle();
  if (error) throw error;
  return data as (AnyRow & { movie: AnyRow }) | null;
};

const DetailArtwork = ({ src, alt, kind }: { src?: string | null; alt: string; kind: 'book' | 'movie' }) => {
  const [failed, setFailed] = useState(false);
  const Icon = kind === 'book' ? BookOpen : Film;
  return (
    <div className={`flex aspect-[3/4] items-center justify-center overflow-hidden rounded-xl ${kind === 'book' ? 'bg-gradient-to-br from-amber-200 via-orange-200 to-rose-300 text-amber-950' : 'bg-gradient-to-br from-slate-300 via-indigo-300 to-violet-400 text-slate-950'}`}>
      {src && !failed ? (
        <img src={src} alt={alt} loading="eager" className="h-full w-full object-cover" onError={() => setFailed(true)} />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-4 text-center">
          <Icon className="h-10 w-10 opacity-75" />
          <span className="font-serif text-lg font-bold leading-tight">{alt}</span>
          <span className="text-[10px] font-semibold uppercase tracking-widest opacity-70">{kind === 'book' ? 'Original book' : 'Screen adaptation'}</span>
        </div>
      )}
    </div>
  );
};

export default function AdaptationDetail() {
  const { id = '' } = useParams();
  const [showSpoilers, setShowSpoilers] = useState(false);
  const { data, isLoading, isError } = useQuery({ queryKey: ['adaptation-detail', id], queryFn: () => fetchAdaptation(id), enabled: !!id });
  const { data: stories = [] } = useQuery({
    queryKey: ['adaptation-story-differences', id],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from('adaptation_story_differences').select('id,category,title,book_summary,movie_summary,narrative_impact,spoiler_level,sort_order,source:adaptation_sources(label,source_url,verification_status)').eq('adaptation_id', id).eq('status', 'published').order('sort_order');
      if (error) throw error; return data || [];
    }, enabled: !!data,
  });
  const { data: characters = [] } = useQuery({
    queryKey: ['adaptation-character-comparisons', id],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from('adaptation_character_comparisons').select('id,character_name,change_type,book_portrayal,movie_portrayal,comparison_notes,spoiler_level,sort_order,source:adaptation_sources(label,source_url,verification_status)').eq('adaptation_id', id).eq('status', 'published').order('sort_order');
      if (error) throw error; return data || [];
    }, enabled: !!data,
  });

  if (isLoading) return <main className="mx-auto max-w-5xl animate-pulse px-4 py-12"><div className="h-72 rounded-3xl bg-muted" /><div className="mt-6 h-8 w-1/2 rounded bg-muted" /></main>;
  if (isError || !data) return <main className="mx-auto max-w-3xl px-4 py-20 text-center"><h1 className="text-2xl font-semibold">Adaptation not found</h1><p className="mt-2 text-muted-foreground">This title may not be published yet, or the link may be incorrect.</p><Button asChild className="mt-5"><Link to="/from-page-to-screen">Back to adaptations</Link></Button></main>;

  const movie = data.movie || {};
  const title = data.book_title + ' – ' + movie.title;
  const bookUrl = data.book_library_id ? `/book/${data.book_library_id}` : null;
  return <>
    <SEO title={`${title} | From Page to Screen – Sahadhyayi`} description={data.synopsis || movie.synopsis || `Explore how ${data.book_title} was adapted into ${movie.title}, including character and story differences.`} canonical={`https://sahadhyayi.com/from-page-to-screen/${id}`} url={`https://sahadhyayi.com/from-page-to-screen/${id}`} />
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Link to="/from-page-to-screen" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4"/> All adaptations</Link>
        <section className="mt-6 overflow-hidden rounded-3xl bg-[#101711] p-5 text-white sm:p-8">
          <div className="grid gap-7 md:grid-cols-[1fr_1.1fr] md:items-center">
            <div className="grid grid-cols-2 gap-4">
              <div><DetailArtwork key={data.book_cover_url || data.book_title} src={data.book_cover_url} alt={data.book_title} kind="book" /><p className="mt-2 text-xs uppercase tracking-wider text-white/60">Original book</p></div>
              <div><DetailArtwork key={movie.poster_url || movie.title} src={movie.poster_url} alt={movie.title} kind="movie" /><p className="mt-2 text-xs uppercase tracking-wider text-white/60">Screen adaptation</p></div>
            </div>
            <div>
              <Badge className="border-white/20 bg-white/10 text-amber-200">From Page to Screen</Badge>
              <h1 className="mt-4 font-serif text-3xl font-bold sm:text-4xl">{data.book_title}</h1>
              <p className="mt-2 text-white/75">{data.book_author ? `by ${data.book_author}` : 'Original book'} · {data.book_publication_year || 'Publication year unavailable'}</p>
              <div className="my-4 flex items-center gap-2 text-amber-200"><Clapperboard className="h-4 w-4"/><span className="font-semibold">{movie.title}</span>{movie.release_year && <span className="text-white/65">({movie.release_year})</span>}</div>
              <p className="max-w-xl leading-7 text-white/75">{data.synopsis || movie.synopsis || 'Explore the original work and its screen adaptation.'}</p>
              <div className="mt-5 flex flex-wrap gap-3">
                {bookUrl && <Button asChild><Link to={bookUrl}><BookOpen className="mr-2 h-4 w-4"/>Read original book</Link></Button>}
                {movie.official_trailer_url && <Button asChild variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20"><a href={movie.official_trailer_url} target="_blank" rel="noreferrer">Watch official trailer</a></Button>}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-5"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700 dark:text-amber-300">The adaptation</p><h2 className="mt-1 font-serif text-2xl font-bold">Book vs Movie</h2><p className="mt-2 text-sm text-muted-foreground">Editorial comparisons summarize each version in original wording. Spoiler-marked entries reveal important story details.</p><Button size="sm" variant="outline" className="mt-3" onClick={() => setShowSpoilers((value) => !value)}>{showSpoilers ? "Hide spoilers" : "Reveal spoiler sections"}</Button></div>
          {stories.length === 0 ? <Card><CardContent className="flex items-center gap-3 p-6 text-sm text-muted-foreground"><Info className="h-5 w-5"/>Story comparisons are being researched for this adaptation.</CardContent></Card> : <div className="space-y-4">{stories.filter((item: AnyRow) => showSpoilers || item.spoiler_level !== 'spoiler').map((item: AnyRow) => <Card key={item.id}><CardHeader><div className="flex flex-wrap items-center gap-2"><Badge variant="secondary">{item.category.replaceAll('_',' ')}</Badge>{item.spoiler_level === 'spoiler' && <Badge variant="destructive">Spoiler</Badge>}</div><CardTitle className="font-serif text-xl">{item.title}</CardTitle></CardHeader><CardContent className="grid gap-4 md:grid-cols-2"><div className="rounded-xl bg-amber-50 p-4 text-slate-900 dark:bg-amber-950/30 dark:text-foreground"><h3 className="mb-2 flex items-center gap-2 font-semibold"><BookOpen className="h-4 w-4"/>In the book</h3><p className="text-sm leading-6">{item.book_summary}</p></div><div className="rounded-xl bg-indigo-50 p-4 text-slate-900 dark:bg-indigo-950/30 dark:text-foreground"><h3 className="mb-2 flex items-center gap-2 font-semibold"><Film className="h-4 w-4"/>In the movie</h3><p className="text-sm leading-6">{item.movie_summary}</p></div>{item.narrative_impact && <p className="text-sm text-muted-foreground md:col-span-2"><strong>Why it matters:</strong> {item.narrative_impact}</p>}{item.source?.verification_status === 'verified' && <a className="inline-flex items-center gap-1 text-xs text-primary hover:underline md:col-span-2" href={item.source.source_url} target="_blank" rel="noreferrer"><ShieldCheck className="h-3.5 w-3.5"/>Source: {item.source.label}</a>}</CardContent></Card>)}</div>}
        </section>

        <section className="mt-10">
          <div className="mb-5"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700 dark:text-amber-300">People in the story</p><h2 className="mt-1 font-serif text-2xl font-bold">Character comparison</h2></div>
          {characters.length === 0 ? <Card><CardContent className="p-6 text-sm text-muted-foreground">Character comparisons will appear here as they are researched and approved.</CardContent></Card> : <div className="grid gap-4 md:grid-cols-2">{characters.filter((item: AnyRow) => showSpoilers || item.spoiler_level !== 'spoiler').map((item: AnyRow) => <Card key={item.id}><CardHeader><div className="flex flex-wrap items-center gap-2"><CardTitle className="font-serif text-xl">{item.character_name}</CardTitle><Badge variant="outline">{item.change_type.replaceAll('_',' ')}</Badge>{item.spoiler_level === 'spoiler' && <Badge variant="destructive">Spoiler</Badge>}</div></CardHeader><CardContent className="space-y-4"><div><h3 className="text-sm font-semibold">In the book</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">{item.book_portrayal || 'Not documented'}</p></div><div><h3 className="text-sm font-semibold">In the movie</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">{item.movie_portrayal || 'Not documented'}</p></div>{item.comparison_notes && <p className="border-t pt-3 text-sm text-muted-foreground">{item.comparison_notes}</p>}{item.source?.verification_status === 'verified' && <a className="inline-flex items-center gap-1 text-xs text-primary hover:underline" href={item.source.source_url} target="_blank" rel="noreferrer"><ShieldCheck className="h-3.5 w-3.5"/>Source: {item.source.label}</a>}</CardContent></Card>)}</div>}
        </section>
        <section className="mt-10 rounded-2xl border border-border bg-muted/30 p-5 text-sm text-muted-foreground"><Info className="mb-2 h-5 w-5"/><p>Comparisons are editorial summaries, not reproductions of the book or screenplay. Interpretations are distinguished from verified production facts.</p></section>
      </div>
    </main>
  </>;
}
