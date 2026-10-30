import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BookOpen, ExternalLink, MapPin, ScrollText, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Breadcrumb from '@/components/Breadcrumb';
import SEO from '@/components/SEO';
import { getScientistBySlug, scientists } from '@/data/scientists';

const ScientistProfile = () => {
  const { slug = '' } = useParams<{ slug: string }>();
  const scientist = getScientistBySlug(slug);

  if (!scientist) {
    return (
      <main className="min-h-[70vh] bg-[#FAF7F2] px-4 py-20 text-center dark:bg-[#0B0D0C]">
        <h1 className="font-serif text-3xl font-bold text-[#1C201D] dark:text-[#F3F0E7]">Scientist profile not found</h1>
        <p className="mt-3 text-sm text-[#687067] dark:text-[#A5ADA6]">This profile may have moved or is not part of the collection yet.</p>
        <Link to="/scientists" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#1C442D] dark:text-[#D5B16D]"><ArrowLeft className="h-4 w-4" /> Back to scientists</Link>
      </main>
    );
  }

  const relatedScientists = scientists
    .filter((item) => item.region === scientist.region && item.slug !== scientist.slug)
    .slice(0, 3);

  return (
    <>
      <SEO
        title={`${scientist.name} — Life, Work & Discoveries | Sahadhyayi`}
        description={scientist.summary}
        canonical={`https://sahadhyayi.com/scientists/${scientist.slug}`}
        url={`https://sahadhyayi.com/scientists/${scientist.slug}`}
      />

      <div className="min-h-screen bg-[#FAF7F2] text-[#1C201D] dark:bg-[#0B0D0C] dark:text-[#F3F0E7]">
        <section className="relative isolate overflow-hidden bg-[#101711] text-white">
          <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_80%_15%,rgba(213,177,109,0.24),transparent_32%),linear-gradient(115deg,#0B120D,#17251B_60%,#3A3928)]" />
          <div aria-hidden="true" className="absolute -right-24 -top-28 h-96 w-96 rounded-full border border-white/10" />
          <div aria-hidden="true" className="absolute -right-10 -top-14 h-64 w-64 rounded-full border border-white/10" />
          <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
            <Link to="/scientists" className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-white/75 transition hover:text-white"><ArrowLeft className="h-4 w-4" /> All scientists</Link>
            <div className="grid items-end gap-8 lg:grid-cols-[minmax(0,1fr)_260px]">
              <div className="max-w-3xl">
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <Badge className="border border-[#D5B16D]/40 bg-[#D5B16D]/15 text-[#F0D9A7] hover:bg-[#D5B16D]/20">{scientist.region === 'india' ? 'Indian scientist' : 'Scientist around the world'}</Badge>
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#E4C17B]">{scientist.discipline}</span>
                </div>
                <h1 className="font-serif text-4xl font-bold leading-tight tracking-tight text-[#FBF7EF] sm:text-5xl md:text-6xl">{scientist.name}</h1>
                <p className="mt-3 text-sm font-medium text-white/65">{scientist.lifespan} <span className="px-2">·</span> {scientist.birthplace}</p>
                <p className="mt-5 max-w-2xl font-serif text-xl leading-relaxed text-[#E9D7B5] sm:text-2xl">{scientist.headline}</p>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-white/75 sm:text-base">{scientist.summary}</p>
              </div>
              <div className="flex aspect-square w-full max-w-[220px] items-center justify-center justify-self-start rounded-[2rem] border border-white/15 bg-white/[0.06] font-serif text-6xl font-bold text-white/80 shadow-2xl backdrop-blur-sm lg:justify-self-end">
                {scientist.initials}
              </div>
            </div>
          </div>
        </section>

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          <Breadcrumb items={[{ name: 'Scientists', path: '/scientists' }, { name: scientist.name, path: `/scientists/${scientist.slug}`, current: true }]} className="mb-8" />
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
            <article className="min-w-0 space-y-10">
              <section id="life-story">
                <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#8F681C] dark:text-[#D5B16D]"><BookOpen className="h-4 w-4" /> The life story</div>
                <div className="space-y-4 text-[15px] leading-8 text-[#4E574F] dark:text-[#C0C7C0]">
                  {scientist.lifeStory.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                </div>
              </section>

              <section id="scientific-work" className="border-t border-[#E5DED2] pt-8 dark:border-[#29332D]">
                <div className="mb-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#8F681C] dark:text-[#D5B16D]"><Sparkles className="h-4 w-4" /> Discoveries & scientific work</div>
                <div className="space-y-4">
                  {scientist.work.map((item) => (
                    <div key={item.title} className="rounded-2xl border border-[#E5DED2] bg-white p-5 dark:border-[#29332D] dark:bg-[#111614] sm:p-6">
                      <h2 className="font-serif text-xl font-bold text-[#202820] dark:text-[#F3F0E7]">{item.title}</h2>
                      <p className="mt-2 text-sm leading-7 text-[#687067] dark:text-[#A5ADA6]">{item.description}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section id="timeline" className="border-t border-[#E5DED2] pt-8 dark:border-[#29332D]">
                <div className="mb-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#8F681C] dark:text-[#D5B16D]"><ScrollText className="h-4 w-4" /> Life & work timeline</div>
                <ol className="relative ml-2 space-y-6 border-l border-[#D8CDBB] pl-6 dark:border-[#465448]">
                  {scientist.milestones.map((milestone) => (
                    <li key={`${milestone.year}-${milestone.title}`} className="relative">
                      <span aria-hidden="true" className="absolute -left-[31px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-[#FAF7F2] bg-[#8F681C] dark:border-[#0B0D0C] dark:bg-[#D5B16D]" />
                      <p className="text-xs font-bold tracking-[0.12em] text-[#8F681C] dark:text-[#D5B16D]">{milestone.year}</p>
                      <h2 className="mt-1 font-semibold text-[#202820] dark:text-[#F3F0E7]">{milestone.title}</h2>
                      <p className="mt-1 text-sm leading-6 text-[#687067] dark:text-[#A5ADA6]">{milestone.description}</p>
                    </li>
                  ))}
                </ol>
              </section>

              <section id="legacy" className="border-t border-[#E5DED2] pt-8 dark:border-[#29332D]">
                <div className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-[#8F681C] dark:text-[#D5B16D]">Why their work matters</div>
                <blockquote className="rounded-2xl border-l-4 border-[#B38A42] bg-[#EEE9DE] px-6 py-6 font-serif text-lg leading-8 text-[#39463A] dark:bg-[#172019] dark:text-[#E8DDC7]">{scientist.legacy}</blockquote>
              </section>

              <section id="sources" className="border-t border-[#E5DED2] pt-8 dark:border-[#29332D]">
                <div className="mb-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#8F681C] dark:text-[#D5B16D]"><ExternalLink className="h-4 w-4" /> Sources & further reading</div>
                <div className="space-y-3">
                  {scientist.sources.map((source) => (
                    <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer" className="group flex items-start justify-between gap-4 rounded-xl border border-[#E5DED2] bg-white p-4 transition hover:border-[#A7B4A1] hover:shadow-sm dark:border-[#29332D] dark:bg-[#111614]">
                      <span>
                        <span className="block text-sm font-semibold text-[#202820] group-hover:text-[#1C442D] dark:text-[#F3F0E7] dark:group-hover:text-[#D5B16D]">{source.label}</span>
                        <span className="mt-1 block text-xs text-[#788076] dark:text-[#A5ADA6]">{source.publisher}</span>
                      </span>
                      <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-[#8F681C] dark:text-[#D5B16D]" aria-hidden="true" />
                    </a>
                  ))}
                </div>
              </section>
            </article>

            <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
              <section className="rounded-2xl border border-[#E5DED2] bg-white p-5 dark:border-[#29332D] dark:bg-[#111614]">
                <h2 className="font-serif text-lg font-bold text-[#202820] dark:text-[#F3F0E7]">Known for</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {scientist.knownFor.map((item) => <Badge key={item} variant="secondary" className="rounded-full">{item}</Badge>)}
                </div>
                <div className="mt-5 flex items-start gap-2 border-t border-[#ECE8DF] pt-4 text-sm leading-6 text-[#687067] dark:border-[#29332D] dark:text-[#A5ADA6]">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#8F681C] dark:text-[#D5B16D]" />
                  {scientist.birthplace}
                </div>
              </section>

              <section className="rounded-2xl border border-[#E5DED2] bg-white p-5 dark:border-[#29332D] dark:bg-[#111614]">
                <h2 className="font-serif text-lg font-bold text-[#202820] dark:text-[#F3F0E7]">On this page</h2>
                <nav className="mt-3 space-y-2 text-sm">
                  <a href="#life-story" className="block text-[#687067] hover:text-[#1C442D] dark:text-[#A5ADA6] dark:hover:text-[#D5B16D]">Life story</a>
                  <a href="#scientific-work" className="block text-[#687067] hover:text-[#1C442D] dark:text-[#A5ADA6] dark:hover:text-[#D5B16D]">Discoveries & work</a>
                  <a href="#timeline" className="block text-[#687067] hover:text-[#1C442D] dark:text-[#A5ADA6] dark:hover:text-[#D5B16D]">Timeline</a>
                  <a href="#legacy" className="block text-[#687067] hover:text-[#1C442D] dark:text-[#A5ADA6] dark:hover:text-[#D5B16D]">Legacy</a>
                  <a href="#sources" className="block text-[#687067] hover:text-[#1C442D] dark:text-[#A5ADA6] dark:hover:text-[#D5B16D]">Sources</a>
                </nav>
              </section>

              {relatedScientists.length > 0 && (
                <section className="rounded-2xl border border-[#E5DED2] bg-white p-5 dark:border-[#29332D] dark:bg-[#111614]">
                  <h2 className="font-serif text-lg font-bold text-[#202820] dark:text-[#F3F0E7]">More scientists</h2>
                  <div className="mt-3 space-y-3">
                    {relatedScientists.map((item) => (
                      <Link key={item.slug} to={`/scientists/${item.slug}`} className="group flex items-center justify-between gap-3 text-sm">
                        <span className="min-w-0">
                          <span className="block truncate font-semibold text-[#202820] group-hover:text-[#1C442D] dark:text-[#F3F0E7] dark:group-hover:text-[#D5B16D]">{item.name}</span>
                          <span className="block text-xs text-[#788076] dark:text-[#A5ADA6]">{item.discipline}</span>
                        </span>
                        <ArrowRight className="h-4 w-4 shrink-0 text-[#8F681C] dark:text-[#D5B16D]" />
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </aside>
          </div>
          <div className="mt-10 border-t border-[#E5DED2] pt-6 dark:border-[#29332D]">
            <Link to="/scientists" className="inline-flex items-center gap-2 text-sm font-semibold text-[#1C442D] hover:text-[#8F681C] dark:text-[#D5B16D]"><ArrowLeft className="h-4 w-4" /> Back to all scientists</Link>
          </div>
        </main>
      </div>
    </>
  );
};

export default ScientistProfile;
