import React, { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BookOpen, Compass, ExternalLink, Heart, Search, ShieldCheck, Sparkles } from 'lucide-react';
import SEO from '@/components/SEO';

type LifeStory = {
  slug: string;
  name: string;
  role: string;
  category: string;
  years: string;
  location: string;
  summary: string;
  story: string[];
  lesson: string;
  sourceLabel: string;
  sourceUrl: string;
  accent: string;
  initials: string;
};

const stories: LifeStory[] = [
  {
    slug: 'kalpana-chawla',
    name: 'Kalpana Chawla',
    role: 'Astronaut and aerospace engineer',
    category: 'Science & discovery',
    years: '1962–2003',
    location: 'Karnal, Haryana, India · United States',
    summary: 'From a small city in Haryana to space, Kalpana Chawla helped make the universe feel closer to a generation of dreamers.',
    story: [
      'Kalpana Chawla grew up in Karnal, where an early fascination with aircraft and the night sky shaped her ambitions. She studied aeronautical engineering in India before moving to the United States for advanced studies in aerospace engineering.',
      'She joined NASA in 1994 and became the first woman of Indian origin to travel to space. Her first mission aboard Space Shuttle Columbia took place in 1997. In 2003, she flew again on STS-107, a research mission dedicated to science and experimentation.',
      'The Columbia crew did not return after the shuttle broke apart during re-entry. Kalpana’s work and journey continue to inspire students interested in science, engineering and exploration.'
    ],
    lesson: 'Let curiosity grow into skill, and let ambition travel beyond the boundaries of what seems familiar.',
    sourceLabel: 'NASA biography',
    sourceUrl: 'https://www.nasa.gov/people/kalpana-chawla/',
    accent: 'from-sky-950 via-blue-900 to-indigo-800',
    initials: 'KC'
  },
  {
    slug: 'arunima-sinha',
    name: 'Arunima Sinha',
    role: 'Mountaineer and former national-level volleyball player',
    category: 'Courage & resilience',
    years: 'Born 1988',
    location: 'Uttar Pradesh, India',
    summary: 'After losing a leg in a violent train incident, Arunima rebuilt her life around an extraordinary mountaineering goal.',
    story: [
      'Arunima Sinha was a national-level volleyball player whose life changed dramatically in 2011 when she was thrown from a moving train during a robbery attempt. She lost a leg and faced a long period of recovery.',
      'During rehabilitation, she decided to train for mountaineering. With a prosthetic leg and sustained preparation, she climbed Mount Everest in May 2013, becoming the first female amputee to reach its summit.',
      'Her journey is not a story of pain magically disappearing. It is a story of rebuilding, disciplined preparation and choosing a new direction after life changes without warning.'
    ],
    lesson: 'A changed path can still lead to a meaningful summit; progress is built one difficult step at a time.',
    sourceLabel: 'Arunima Sinha official website',
    sourceUrl: 'https://arunimasinha.com/',
    accent: 'from-amber-950 via-orange-900 to-rose-800',
    initials: 'AS'
  },
  {
    slug: 'a-p-j-abdul-kalam',
    name: 'A. P. J. Abdul Kalam',
    role: 'Aerospace scientist and former President of India',
    category: 'Science & discovery',
    years: '1931–2015',
    location: 'Rameswaram, Tamil Nadu, India',
    summary: 'A scientist who helped shape India’s space and defence programmes, then used the presidency to speak directly to young people.',
    story: [
      'Avul Pakir Jainulabdeen Abdul Kalam was born in Rameswaram in 1931. He studied physics and aerospace engineering, and went on to work with India’s defence and space research organisations.',
      'At ISRO, he was closely associated with the development of India’s satellite launch vehicle programme. He later contributed to missile development work at the Defence Research and Development Organisation.',
      'Kalam served as the 11th President of India from 2002 to 2007. Through lectures and books, he continued to encourage students to combine knowledge, hard work and public purpose.'
    ],
    lesson: 'Knowledge becomes more powerful when it is shared and used in service of others.',
    sourceLabel: 'President of India – former presidents',
    sourceUrl: 'https://presidentofindia.nic.in/former-presidents',
    accent: 'from-emerald-950 via-teal-900 to-cyan-800',
    initials: 'AK'
  },
  {
    slug: 'sudha-murty',
    name: 'Sudha Murty',
    role: 'Author, educator and philanthropist',
    category: 'Service & society',
    years: 'Born 1950',
    location: 'Karnataka, India',
    summary: 'An engineer who broke barriers in industry and became widely known for storytelling and philanthropic work.',
    story: [
      'Sudha Murty studied engineering at the B.V.B. College of Engineering and Technology and later completed a master’s degree in computer science. She challenged a recruitment policy at TELCO that excluded women applicants and became the company’s first female engineer.',
      'She later taught computer science and became involved in social initiatives through the Infosys Foundation, supporting work in education, healthcare, rural development and public infrastructure.',
      'Alongside this work, she built a large readership through fiction, children’s literature, travel writing and reflections drawn from everyday life.'
    ],
    lesson: 'Professional excellence and social responsibility can reinforce one another.',
    sourceLabel: 'Infosys Foundation',
    sourceUrl: 'https://www.infosys.com/infosys-foundation/',
    accent: 'from-violet-950 via-purple-900 to-fuchsia-800',
    initials: 'SM'
  },
  {
    slug: 'mary-kom',
    name: 'Mary Kom',
    role: 'Boxer and Olympic medalist',
    category: 'Courage & resilience',
    years: 'Born 1982',
    location: 'Manipur, India',
    summary: 'A champion boxer whose career challenged expectations about women in sport and the possibilities available to athletes from the northeast.',
    story: [
      'Mangte Chungneijang Mary Kom grew up in a farming family in Manipur. She developed an interest in athletics before turning to boxing, a sport in which women had limited visibility in India at the time.',
      'Through years of training and competition, she became a six-time world champion. At the 2012 London Olympics, she won a bronze medal in the women’s flyweight event.',
      'Her career has included setbacks, a return to competition after motherhood, and advocacy for sporting opportunities. Her achievements brought wider attention to boxing in India and to athletes from the northeast.'
    ],
    lesson: 'Talent matters, but sustained practice and the courage to return after setbacks shape a lasting career.',
    sourceLabel: 'Olympics athlete profile',
    sourceUrl: 'https://olympics.com/en/athletes/mary-kom',
    accent: 'from-red-950 via-rose-900 to-orange-800',
    initials: 'MK'
  },
  {
    slug: 'dashrath-manjhi',
    name: 'Dashrath Manjhi',
    role: 'Community figure known as the Mountain Man',
    category: 'Courage & resilience',
    years: '1934–2007',
    location: 'Gehlaur, Bihar, India',
    summary: 'Working with simple hand tools, Dashrath Manjhi spent years cutting a passage through a hill to make travel easier for his village.',
    story: [
      'Dashrath Manjhi lived in the village of Gehlaur in Bihar, where a rocky hill made journeys to nearby services difficult. After his wife was injured and could not reach timely medical help, he resolved to create a shorter route through the hill.',
      'Using a hammer and chisel, he worked for years to carve a passage through the rock. The path eventually reduced the distance between his village and nearby areas, becoming a powerful local symbol of persistence.',
      'His story is also a reminder that infrastructure, healthcare access and public services should not depend on one person’s extraordinary effort. Individual determination can draw attention to barriers communities should not have to face.'
    ],
    lesson: 'Persistence can change a community, while lasting progress also requires systems that make essential services accessible.',
    sourceLabel: 'BBC – profile and reporting',
    sourceUrl: 'https://www.bbc.com/news/world-asia-india-',
    accent: 'from-stone-950 via-stone-800 to-amber-800',
    initials: 'DM'
  }
];

const categories = ['All stories', 'Science & discovery', 'Courage & resilience', 'Service & society'];

const LifeStories = () => {
  const { slug } = useParams<{ slug?: string }>();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All stories');
  const selectedStory = slug ? stories.find((story) => story.slug === slug) : undefined;

  const filteredStories = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    return stories.filter((story) => {
      const matchesCategory = activeCategory === 'All stories' || story.category === activeCategory;
      const matchesSearch = !term || [story.name, story.role, story.category, story.location, story.summary]
        .some((value) => value.toLocaleLowerCase().includes(term));
      return matchesCategory && matchesSearch;
    });
  }, [search, activeCategory]);

  if (slug) {
    if (!selectedStory) {
      return (
        <main className="min-h-[70vh] bg-[#FAF7F2] px-4 py-20 text-center dark:bg-[#0B0D0C]">
          <h1 className="font-serif text-3xl font-bold text-[#202820] dark:text-[#F3F0E7]">Story not found</h1>
          <p className="mt-3 text-sm text-[#687067] dark:text-[#A5ADA6]">This life story may have moved or is not available yet.</p>
          <Link to="/life-stories" className="mt-6 inline-flex items-center gap-2 font-semibold text-[#1C442D] dark:text-[#D5B16D]"><ArrowLeft className="h-4 w-4" /> Back to Life Stories</Link>
        </main>
      );
    }

    return (
      <>
        <SEO title={`${selectedStory.name} — Life Story | Sahadhyayi`} description={selectedStory.summary} canonical={`https://sahadhyayi.com/life-stories/${selectedStory.slug}`} />
        <article className="min-h-screen bg-[#FAF7F2] text-[#202820] dark:bg-[#0B0D0C] dark:text-[#F3F0E7]">
          <header className={`relative isolate overflow-hidden bg-gradient-to-br ${selectedStory.accent} text-white`}>
            <div className="absolute inset-0 opacity-15 [background-image:radial-gradient(rgba(255,255,255,0.8)_0.8px,transparent_0.8px)] [background-size:18px_18px]" />
            <div className="relative mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-24">
              <Link to="/life-stories" className="inline-flex items-center gap-2 text-sm text-white/80 transition hover:text-white"><ArrowLeft className="h-4 w-4" /> All life stories</Link>
              <p className="mt-10 text-xs font-semibold uppercase tracking-[0.2em] text-white/70">{selectedStory.category} · {selectedStory.years}</p>
              <h1 className="mt-4 max-w-3xl font-serif text-4xl font-bold leading-tight sm:text-6xl">{selectedStory.name}</h1>
              <p className="mt-4 text-lg text-white/85">{selectedStory.role}</p>
              <p className="mt-5 max-w-2xl text-base leading-8 text-white/80">{selectedStory.summary}</p>
              <p className="mt-6 text-sm text-white/65">{selectedStory.location}</p>
            </div>
          </header>
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:py-16">
            <div className="space-y-6">
              {selectedStory.story.map((paragraph, index) => <p key={index} className="font-serif text-lg leading-9 text-[#414B43] dark:text-[#C8D0C8]">{paragraph}</p>)}
              <section className="rounded-2xl border border-[#DCD5C9] bg-white p-6 dark:border-[#29332D] dark:bg-[#111614]">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#98733A] dark:text-[#D5B16D]"><Sparkles className="h-4 w-4" /> A thought to carry forward</div>
                <p className="mt-3 font-serif text-xl leading-8 text-[#202820] dark:text-[#F3F0E7]">{selectedStory.lesson}</p>
              </section>
              <div className="rounded-xl border border-[#DCD5C9] bg-[#F3EFE7] p-5 dark:border-[#29332D] dark:bg-[#111614]">
                <div className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck className="h-4 w-4 text-[#1C7A4A] dark:text-[#8EC9A4]" /> Read the source</div>
                <p className="mt-2 text-sm leading-6 text-[#687067] dark:text-[#A5ADA6]">This story is an editorial introduction. Consult the reference for further detail and context.</p>
                <a href={selectedStory.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[#1C442D] hover:underline dark:text-[#D5B16D]">{selectedStory.sourceLabel} <ExternalLink className="h-3.5 w-3.5" /></a>
              </div>
            </div>
            <aside className="h-fit rounded-2xl border border-[#DCD5C9] bg-white p-5 dark:border-[#29332D] dark:bg-[#111614]">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#98733A] dark:text-[#D5B16D]">At a glance</p>
              <p className="mt-3 font-serif text-xl font-bold">{selectedStory.name}</p>
              <p className="mt-1 text-sm text-[#687067] dark:text-[#A5ADA6]">{selectedStory.years}</p>
              <div className="my-4 h-px bg-[#E9E3D9] dark:bg-[#29332D]" />
              <p className="text-xs font-semibold uppercase tracking-wide text-[#687067] dark:text-[#A5ADA6]">Known for</p>
              <p className="mt-1 text-sm leading-6">{selectedStory.role}</p>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-[#687067] dark:text-[#A5ADA6]">From</p>
              <p className="mt-1 text-sm leading-6">{selectedStory.location}</p>
              <Link to="/life-stories" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#1C442D] hover:underline dark:text-[#D5B16D]">Discover more stories <ArrowRight className="h-4 w-4" /></Link>
            </aside>
          </div>
        </article>
      </>
    );
  }

  return (
    <>
      <SEO
        title="Life Stories — Real People, Remarkable Journeys | Sahadhyayi"
        description="Discover true stories of remarkable people from India and around the world: their lives, challenges, achievements and the lessons they leave behind."
        canonical="https://sahadhyayi.com/life-stories"
        keywords={['real life stories', 'inspiring biographies', 'Indian personalities', 'human stories', 'life journeys']}
      />
      <div className="min-h-screen bg-[#FAF7F2] text-[#202820] dark:bg-[#0B0D0C] dark:text-[#F3F0E7]">
        <section className="relative isolate overflow-hidden bg-[#101711] text-white">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_15%,rgba(213,177,109,0.22),transparent_42%),radial-gradient(ellipse_at_10%_90%,rgba(63,111,79,0.3),transparent_45%)]" />
          <div className="absolute inset-0 opacity-[0.12] [background-image:radial-gradient(rgba(255,255,255,0.65)_0.7px,transparent_0.7px)] [background-size:18px_18px]" />
          <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#D5B16D]/35 bg-white/5 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#E8CC91]"><Heart className="h-3.5 w-3.5" /> Real lives. Real journeys.</div>
              <h1 className="mt-6 font-serif text-4xl font-bold leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl">Every life has a story.<span className="block text-[#E4C17B]">Some change how we see the world.</span></h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-white/75 sm:text-lg">Meet people who questioned the impossible, stood through adversity, served their communities and left the world a little different.</p>
              <div className="mt-8 flex flex-wrap gap-3 text-xs text-white/70">
                <span className="inline-flex items-center gap-2"><BookOpen className="h-4 w-4 text-[#E4C17B]" /> Carefully curated biographies</span>
                <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#E4C17B]" /> Reference links included</span>
              </div>
            </div>
          </div>
        </section>

        <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <section aria-label="Search and filter life stories" className="mb-9 rounded-2xl border border-[#E5DED2] bg-white p-4 shadow-sm dark:border-[#29332D] dark:bg-[#111614] sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full lg:max-w-md">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#788076]" />
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search people, journeys or themes…" aria-label="Search life stories" className="h-12 w-full rounded-xl border border-[#DCD5C9] bg-[#FAF7F2] pl-11 pr-4 text-sm text-[#202820] outline-none transition focus:border-[#1C442D] focus:ring-2 focus:ring-[#1C442D]/15 dark:border-[#34443A] dark:bg-[#0B0D0C] dark:text-[#F3F0E7]" />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Story categories">
                {categories.map((category) => <button key={category} type="button" onClick={() => setActiveCategory(category)} aria-pressed={activeCategory === category} className={`shrink-0 rounded-full border px-3.5 py-2 text-xs font-semibold transition ${activeCategory === category ? 'border-[#1C442D] bg-[#1C442D] text-white dark:border-[#D5B16D] dark:bg-[#D5B16D] dark:text-[#101711]' : 'border-[#DCD5C9] text-[#687067] hover:border-[#1C442D] dark:border-[#34443A] dark:text-[#A5ADA6]'}`}>{category}</button>)}
              </div>
            </div>
          </section>

          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#98733A] dark:text-[#D5B16D]">The collection</p>
              <h2 className="mt-1 font-serif text-2xl font-bold sm:text-3xl">People worth knowing</h2>
            </div>
            <span className="text-xs text-[#788076] dark:text-[#A5ADA6]">{filteredStories.length} {filteredStories.length === 1 ? 'story' : 'stories'}</span>
          </div>

          {filteredStories.length ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filteredStories.map((story) => (
                <article key={story.slug} className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#E5DED2] bg-white shadow-[0_6px_24px_rgba(28,32,29,0.035)] transition duration-300 hover:-translate-y-1 hover:border-[#B68A35]/50 hover:shadow-[0_18px_45px_rgba(28,32,29,0.09)] dark:border-[#29332D] dark:bg-[#111614] dark:shadow-none">
                  <div className={`relative flex h-40 items-end overflow-hidden bg-gradient-to-br ${story.accent} p-5 text-white`}>
                    <div className="absolute -right-8 -top-12 h-40 w-40 rounded-full border border-white/15" />
                    <div className="absolute -right-1 -top-5 h-28 w-28 rounded-full border border-white/15" />
                    <span className="relative rounded-xl border border-white/20 bg-black/15 px-3 py-2 text-2xl font-serif font-bold backdrop-blur-sm">{story.initials}</span>
                    <span className="relative ml-auto rounded-full border border-white/25 bg-black/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide backdrop-blur-sm">{story.years}</span>
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#98733A] dark:text-[#D5B16D]">{story.category}</p>
                    <h3 className="mt-2 font-serif text-xl font-bold">{story.name}</h3>
                    <p className="mt-1 text-xs text-[#788076] dark:text-[#A5ADA6]">{story.role}</p>
                    <p className="mt-4 flex-1 text-sm leading-6 text-[#59635B] dark:text-[#B8C1B9]">{story.summary}</p>
                    <div className="mt-5 flex items-center justify-between border-t border-[#EDE7DE] pt-4 dark:border-[#29332D]">
                      <span className="inline-flex items-center gap-1.5 text-[11px] text-[#788076] dark:text-[#A5ADA6]"><Compass className="h-3.5 w-3.5" /> {story.location.split(',')[0]}</span>
                      <Link to={`/life-stories/${story.slug}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1C442D] transition group-hover:gap-2.5 dark:text-[#D5B16D]">Read story <ArrowRight className="h-4 w-4" /></Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[#DCD5C9] px-5 py-16 text-center dark:border-[#34443A]">
              <Search className="mx-auto h-8 w-8 text-[#98733A]" />
              <h3 className="mt-4 font-serif text-xl font-bold">No stories found</h3>
              <p className="mt-2 text-sm text-[#788076] dark:text-[#A5ADA6]">Try another name or choose a different category.</p>
              <button type="button" onClick={() => { setSearch(''); setActiveCategory('All stories'); }} className="mt-4 text-sm font-semibold text-[#1C442D] underline dark:text-[#D5B16D]">Clear filters</button>
            </div>
          )}

          <section className="mt-12 rounded-2xl border border-[#DCD5C9] bg-[#F3EFE7] p-6 dark:border-[#29332D] dark:bg-[#111614] sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#1C442D] text-[#F3E5C4] dark:bg-[#D5B16D] dark:text-[#101711]"><Sparkles className="h-5 w-5" /></div>
              <div>
                <h2 className="font-serif text-xl font-bold">A growing collection of human journeys</h2>
                <p className="mt-1 max-w-3xl text-sm leading-6 text-[#687067] dark:text-[#A5ADA6]">We add stories as they are researched and reviewed. Know someone whose life deserves to be documented? Share a suggestion with the Sahadhyayi team.</p>
              </div>
              <Link to="/feedback" className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-[#1C442D] hover:underline dark:text-[#D5B16D]">Suggest a story <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </section>
        </main>
      </div>
    </>
  );
};

export default LifeStories;
