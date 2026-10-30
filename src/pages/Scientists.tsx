import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Atom, Globe2, Landmark, Search, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Breadcrumb from '@/components/Breadcrumb';
import SEO from '@/components/SEO';
import { scientists, type ScientistRegion } from '@/data/scientists';

const Scientists = () => {
  const [collection, setCollection] = useState<ScientistRegion>('india');
  const [search, setSearch] = useState('');

  const visibleScientists = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return scientists.filter((scientist) => {
      const inCollection = scientist.region === collection;
      const matchesQuery = !query || [
        scientist.name,
        scientist.discipline,
        scientist.summary,
        ...scientist.knownFor,
      ].join(' ').toLocaleLowerCase().includes(query);
      return inCollection && matchesQuery;
    });
  }, [collection, search]);

  const indianCount = scientists.filter((scientist) => scientist.region === 'india').length;
  const globalCount = scientists.filter((scientist) => scientist.region === 'world').length;

  return (
    <>
      <SEO
        title="Scientists & Their Discoveries | Sahadhyayi"
        description="Explore the lives, ideas and discoveries of Indian scientists and remarkable researchers from around the world. Read their stories and follow the evidence behind their work."
        canonical="https://sahadhyayi.com/scientists"
        url="https://sahadhyayi.com/scientists"
      />

      <div className="min-h-screen bg-[#FAF7F2] text-[#1C201D] transition-colors duration-200 dark:bg-[#0B0D0C] dark:text-[#F3F0E7]">
        <section className="relative isolate overflow-hidden border-b border-[#29332D] bg-[#101711] text-white">
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=2200&q=85')", backgroundPosition: 'center 48%' }}
          />
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-[#09120D]/95 via-[#09120D]/82 to-[#09120D]/45" />
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#09120D]/65 via-transparent to-[#09120D]/20" />
          <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-18 lg:px-8 lg:py-20">
            <div className="max-w-3xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#D5B16D]/35 bg-black/25 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#E8CC91] backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                Indian scientific heritage · Global minds
              </div>
              <h1 className="font-serif text-4xl font-bold leading-[1.08] tracking-tight text-[#FBF7EF] sm:text-5xl md:text-6xl">
                Great minds.
                <span className="block text-[#E4C17B]">Timeless discoveries.</span>
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-white/80 sm:text-lg sm:leading-8">
                Meet the people behind the ideas. Explore the lives, questions, experiments and discoveries that changed how we understand the world.
              </p>
              <div className="mt-8 flex w-full max-w-2xl flex-col gap-3 sm:flex-row">
                <div className="relative min-w-0 flex-1">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#69756D]" aria-hidden="true" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search scientists, fields or discoveries…"
                    aria-label="Search scientists"
                    className="h-12 rounded-xl border border-white/25 bg-white/95 pl-11 text-[#1C201D] shadow-xl placeholder:text-[#798179] focus-visible:ring-2 focus-visible:ring-[#D5B16D] sm:h-14"
                  />
                </div>
                <Link to="/library" className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-5 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D5B16D] sm:h-14">
                  Visit the Library <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
              <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-white/75">
                <span className="inline-flex items-center gap-2"><Landmark className="h-4 w-4 text-[#E4C17B]" aria-hidden="true" /> <strong className="text-white">{indianCount}</strong> Indian scientists featured</span>
                <span className="inline-flex items-center gap-2"><Globe2 className="h-4 w-4 text-[#E4C17B]" aria-hidden="true" /> <strong className="text-white">{globalCount}</strong> scientists worldwide</span>
              </div>
            </div>
          </div>
        </section>

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
          <Breadcrumb items={[{ name: 'Scientists', path: '/scientists', current: true }]} className="mb-6" />

          <section aria-label="Scientist collections" className="mb-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8F681C] dark:text-[#D5B16D]">Explore the collection</p>
                <h2 className="mt-2 font-serif text-2xl font-bold sm:text-3xl">Stories behind the science</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#687067] dark:text-[#A5ADA6]">Indian scientists are our starting point. A global collection places their work in conversation with ideas from around the world.</p>
              </div>
              <div className="inline-flex w-full rounded-xl border border-[#E5DED2] bg-white p-1 dark:border-[#29332D] dark:bg-[#111614] sm:w-auto" role="tablist" aria-label="Scientist collection">
                <button type="button" role="tab" aria-selected={collection === 'india'} onClick={() => setCollection('india')} className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition sm:flex-none ${collection === 'india' ? 'bg-[#1C442D] text-white shadow-sm dark:bg-[#D5B16D] dark:text-[#0B0D0C]' : 'text-[#687067] hover:bg-[#F4F1EA] dark:text-[#A5ADA6] dark:hover:bg-[#1A211D]'}`}>
                  Indian Scientists <span className="ml-1 opacity-75">({indianCount})</span>
                </button>
                <button type="button" role="tab" aria-selected={collection === 'world'} onClick={() => setCollection('world')} className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition sm:flex-none ${collection === 'world' ? 'bg-[#1C442D] text-white shadow-sm dark:bg-[#D5B16D] dark:text-[#0B0D0C]' : 'text-[#687067] hover:bg-[#F4F1EA] dark:text-[#A5ADA6] dark:hover:bg-[#1A211D]'}`}>
                  Around the World <span className="ml-1 opacity-75">({globalCount})</span>
                </button>
              </div>
            </div>
          </section>

          <section aria-live="polite">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Atom className="h-4 w-4 text-[#8F681C] dark:text-[#D5B16D]" aria-hidden="true" />
                {collection === 'india' ? 'Indian scientists' : 'Scientists around the world'}
              </div>
              <Badge variant="secondary" className="rounded-full">{visibleScientists.length} profiles</Badge>
            </div>

            {visibleScientists.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {visibleScientists.map((scientist) => (
                  <Link
                    key={scientist.slug}
                    to={`/scientists/${scientist.slug}`}
                    className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#E5DED2] bg-white shadow-[0_8px_30px_rgba(28,32,29,0.035)] transition duration-300 hover:-translate-y-1 hover:border-[#A7B4A1] hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C442D] focus-visible:ring-offset-2 dark:border-[#29332D] dark:bg-[#111614] dark:shadow-none"
                  >
                    <div className="relative flex min-h-[190px] items-end overflow-hidden bg-gradient-to-br from-[#1D3829] via-[#315640] to-[#A17A3C] p-5 sm:min-h-[210px]">
                      <div aria-hidden="true" className="absolute inset-0 opacity-20 [background-image:radial-gradient(rgba(255,255,255,0.7)_0.8px,transparent_0.8px)] [background-size:16px_16px]" />
                      <div aria-hidden="true" className="absolute -right-8 -top-12 h-48 w-48 rounded-full border border-white/20" />
                      <div aria-hidden="true" className="absolute -right-2 -top-6 h-36 w-36 rounded-full border border-white/20" />
                      <span className="relative z-10 font-serif text-6xl font-bold tracking-tight text-white/90 sm:text-7xl">{scientist.initials}</span>
                      <span className="absolute right-5 top-5 rounded-full border border-white/25 bg-black/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/90 backdrop-blur-sm">{scientist.region === 'india' ? 'India' : 'Global'}</span>
                    </div>
                    <div className="flex flex-1 flex-col p-5 sm:p-6">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8F681C] dark:text-[#D5B16D]">{scientist.discipline}</p>
                      <h3 className="mt-2 font-serif text-xl font-bold leading-snug text-[#202820] transition-colors group-hover:text-[#1C442D] dark:text-[#F3F0E7] dark:group-hover:text-[#D5B16D]">{scientist.name}</h3>
                      <p className="mt-1 text-xs font-medium text-[#788076] dark:text-[#A5ADA6]">{scientist.lifespan}</p>
                      <p className="mt-3 flex-1 text-sm leading-6 text-[#687067] dark:text-[#A5ADA6]">{scientist.summary}</p>
                      <div className="mt-5 flex items-center justify-between border-t border-[#ECE8DF] pt-4 dark:border-[#29332D]">
                        <span className="text-xs font-medium text-[#687067] dark:text-[#A5ADA6]">Explore life & work</span>
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1C442D] dark:text-[#D5B16D]">Read profile <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true" /></span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[#D9D2C6] bg-white/70 px-6 py-14 text-center dark:border-[#29332D] dark:bg-[#111614]">
                <Search className="mx-auto h-7 w-7 text-[#8B9188]" aria-hidden="true" />
                <h3 className="mt-3 font-serif text-xl font-bold">No scientists found</h3>
                <p className="mt-2 text-sm text-[#687067] dark:text-[#A5ADA6]">Try another name, field or discovery.</p>
                <Button variant="outline" onClick={() => setSearch('')} className="mt-4">Clear search</Button>
              </div>
            )}
          </section>

          <section className="mt-12 rounded-2xl border border-[#DDE2D7] bg-[#EAEDE5] px-6 py-8 dark:border-[#29332D] dark:bg-[#111A14] sm:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#526B54] dark:text-[#D5B16D]">A growing collection</p>
                <h2 className="mt-2 font-serif text-2xl font-bold text-[#202820] dark:text-[#F3F0E7]">Every discovery has a human story.</h2>
                <p className="mt-2 text-sm leading-6 text-[#626B60] dark:text-[#A5ADA6]">We are building this collection carefully, with biographies, scientific explanations and references that readers can follow.</p>
              </div>
              <Link to="/library" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#1C442D] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#173824] dark:bg-[#D5B16D] dark:text-[#0B0D0C] dark:hover:bg-[#E4C17B]">
                Explore the Library <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </section>
        </main>
      </div>
    </>
  );
};

export default Scientists;
