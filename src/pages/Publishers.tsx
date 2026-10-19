import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Building2, Search, Globe, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client-universal';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import SEO from '@/components/SEO';
import Breadcrumb from '@/components/Breadcrumb';
import BookFlipLoader from '@/components/ui/BookFlipLoader';

type Publisher = {
  id: string;
  name: string;
  bio: string | null;
  profile_image_url: string | null;
  location: string | null;
  website_url: string | null;
  genres: string[] | null;
  books_count: number | null;
  verified: boolean | null;
};

type PublisherBook = { id: string; title: string; cover_image_url: string | null; publisher_id: string | null };

const Publishers = () => {
  const [search, setSearch] = useState('');
  const { data, isLoading, error } = useQuery({
    queryKey: ['publisher-directory'],
    queryFn: async () => {
      const { data: publisherRows, error: publisherError } = await (supabase as any)
        .from('publishers')
        .select('id,name,bio,profile_image_url,location,website_url,genres,books_count,verified')
        .order('name', { ascending: true });
      if (publisherError) throw publisherError;

      const { data: bookRows, error: bookError } = await (supabase as any)
        .from('books_library')
        .select('id,title,cover_image_url,publisher_id')
        .not('publisher_id', 'is', null);
      if (bookError) throw bookError;

      return {
        publishers: (publisherRows || []) as Publisher[],
        books: (bookRows || []) as PublisherBook[],
      };
    },
    staleTime: 5 * 60 * 1000,
  });

  const publishers = data?.publishers ?? [];
  const booksByPublisher = useMemo(() => {
    const grouped = new Map<string, PublisherBook[]>();
    (data?.books ?? []).forEach((book) => {
      if (!book.publisher_id) return;
      const current = grouped.get(book.publisher_id) ?? [];
      current.push(book);
      grouped.set(book.publisher_id, current);
    });
    return grouped;
  }, [data?.books]);

  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    return publishers.filter((publisher) =>
      !term ||
      publisher.name.toLocaleLowerCase().includes(term) ||
      (publisher.bio || '').toLocaleLowerCase().includes(term) ||
      (publisher.location || '').toLocaleLowerCase().includes(term) ||
      (publisher.genres || []).some((genre) => genre.toLocaleLowerCase().includes(term))
    );
  }, [publishers, search]);

  return (
    <>
      <SEO
        title="Publishers & Literary Institutions | Sahadhyayi"
        description="Discover publishing houses, editorial teams, and literary institutions behind the books in Sahadhyayi’s library."
        canonical="https://sahadhyayi.com/publishers"
        url="https://sahadhyayi.com/publishers"
      />
      <div className="min-h-screen bg-[#FAF7F2] text-[#1C201D] dark:bg-[#0B0D0C] dark:text-[#F3F0E7]">
        <section className="relative overflow-hidden bg-[#101711] text-white">
          <div className="absolute inset-0 bg-gradient-to-br from-[#10251A] via-[#1C442D] to-[#6C5833]" aria-hidden="true" />
          <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#D5B16D]/40 bg-black/20 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#E8CC91]">
              <Building2 className="h-4 w-4" /> The institutions behind the books
            </div>
            <h1 className="max-w-3xl font-serif text-4xl font-bold leading-tight sm:text-5xl md:text-6xl">
              Meet the publishers <span className="text-[#E4C17B]">behind the pages.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/80 sm:text-lg">
              Explore publishing houses, editorial boards, and institutions separately from individual writers.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <div className="relative w-full max-w-xl">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#69756D]" />
                <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search publishers or institutions…" aria-label="Search publishers" className="h-12 rounded-xl border-white/25 bg-white pl-11 text-[#1C201D] placeholder:text-[#798179]" />
              </div>
              <Link to="/authors" className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/30 px-4 text-sm font-semibold hover:bg-white/10">
                Browse individual authors <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/80">
              <span><strong className="text-white">{publishers.length}</strong> publishers and institutions</span>
              <span><strong className="text-white">{data?.books.length ?? 0}</strong> linked books</span>
            </div>
          </div>
        </section>

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
          <Breadcrumb items={[{ name: 'Publishers', path: '/publishers', current: true }]} className="mb-6" />
          {isLoading ? (
            <div className="flex min-h-64 items-center justify-center"><BookFlipLoader size="md" text="Finding publishers…" /></div>
          ) : error ? (
            <div role="alert" className="rounded-2xl border border-red-200 bg-white p-8 text-center text-sm text-red-700 dark:border-red-900/50 dark:bg-[#111614] dark:text-red-300">
              We couldn’t load the publisher directory. Please refresh and try again.
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#DCD5C9] bg-white px-5 py-16 text-center dark:border-[#29332D] dark:bg-[#111614]">
              <Building2 className="mx-auto h-8 w-8 text-[#98733A] dark:text-[#D5B16D]" />
              <h2 className="mt-3 font-serif text-2xl font-bold">{search ? 'No matching publishers' : 'No publishers available yet'}</h2>
              <p className="mt-2 text-sm text-[#636B65] dark:text-[#A5ADA6]">{search ? 'Try a different name or clear your search.' : 'Publisher records will appear here as the catalog is enriched.'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((publisher) => {
                const books = booksByPublisher.get(publisher.id) ?? [];
                return (
                  <Card key={publisher.id} className="overflow-hidden rounded-2xl border-[#E5DED2] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-[#29332D] dark:bg-[#111614]">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-14 w-14 rounded-xl border border-[#E5DED2] dark:border-[#29332D]">
                        <AvatarImage src={publisher.profile_image_url || ''} alt={publisher.name} />
                        <AvatarFallback className="rounded-xl bg-[#EBF2EC] text-[#1C442D] dark:bg-[#1C3024] dark:text-[#D5B16D]"><Building2 className="h-5 w-5" /></AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <h2 className="font-serif text-xl font-bold leading-snug">{publisher.name}</h2>
                        {publisher.location && publisher.location !== 'Unknown' && <p className="mt-1 flex items-center gap-1 text-xs text-[#737B75] dark:text-[#89938B]"><MapPin className="h-3.5 w-3.5" />{publisher.location}</p>}
                      </div>
                    </div>
                    <p className="mt-4 line-clamp-3 min-h-12 text-sm leading-6 text-[#636B65] dark:text-[#A5ADA6]">{publisher.bio || 'Publishing and editorial information will be added as this profile is verified.'}</p>
                    {publisher.genres?.length ? <div className="mt-3 flex flex-wrap gap-2">{publisher.genres.slice(0, 3).map((genre) => <span key={genre} className="rounded-full border border-[#DCD5C9] bg-[#FAF7F2] px-2.5 py-1 text-xs dark:border-[#34443A] dark:bg-[#172019]">{genre}</span>)}</div> : null}
                    <div className="mt-5 border-t border-[#EDE7DE] pt-4 dark:border-[#26302A]">
                      <div className="flex items-center gap-2 text-sm"><BookOpen className="h-4 w-4 text-[#98733A] dark:text-[#D5B16D]" /><strong>{books.length}</strong> linked {books.length === 1 ? 'book' : 'books'}</div>
                      {books.length > 0 && <div className="mt-3 flex items-center gap-2">{books.filter((book) => book.cover_image_url).slice(0, 5).map((book) => <Link key={book.id} to={`/book/${book.id}`} title={book.title} className="h-14 w-10 overflow-hidden rounded border border-black/10 bg-[#F4EFEA]"><img src={book.cover_image_url || ''} alt={book.title} loading="lazy" className="h-full w-full object-cover" /></Link>)}</div>}
                      {publisher.website_url && <a href={publisher.website_url} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#1C442D] hover:underline dark:text-[#D5B16D]">Official website <Globe className="h-4 w-4" /></a>}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </>
  );
};

export default Publishers;
