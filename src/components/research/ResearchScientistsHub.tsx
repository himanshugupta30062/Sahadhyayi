import { useMemo, useState } from 'react';
import { ArrowUpRight, BookOpen, Clock3, Compass, FlaskConical, Link2, Search, Sparkles, Users } from 'lucide-react';

type Scientist = {
  name: string;
  era: string;
  field: string;
  contribution: string;
  image: string;
  papers: { title: string; year: string; href: string; note: string }[];
};

const HISTORICAL: Scientist[] = [
  { name: 'Isaac Newton', era: '1643–1727', field: 'Physics · Mathematics', contribution: 'The laws of motion and universal gravitation reshaped how we describe the physical world.', image: 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?auto=format&fit=crop&w=500&q=80', papers: [{ title: 'Philosophiæ Naturalis Principia Mathematica', year: '1687', href: 'https://archive.org/details/newtonspmathema00newt', note: 'Foundations of classical mechanics' }] },
  { name: 'Marie Curie', era: '1867–1934', field: 'Physics · Chemistry', contribution: 'Pioneering research on radioactivity opened new paths in physics, chemistry and medicine.', image: 'https://images.unsplash.com/photo-1581093458791-9d15482442f5?auto=format&fit=crop&w=500&q=80', papers: [{ title: 'Research on radioactive substances', year: '1898', href: 'https://doi.org/10.1021/ja02086a002', note: 'Early work on radioactivity' }] },
  { name: 'Albert Einstein', era: '1879–1955', field: 'Physics', contribution: 'Relativity and foundational contributions to quantum theory transformed modern physics.', image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=500&q=80', papers: [{ title: 'On the Electrodynamics of Moving Bodies', year: '1905', href: 'https://doi.org/10.1002/andp.19053221004', note: 'Special relativity' }, { title: 'The Foundation of the General Theory of Relativity', year: '1916', href: 'https://doi.org/10.1002/andp.19163540702', note: 'General relativity' }] },
  { name: 'Srinivasa Ramanujan', era: '1887–1920', field: 'Mathematics', contribution: 'Extraordinary discoveries in number theory, infinite series and partitions continue to inspire mathematics.', image: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=500&q=80', papers: [{ title: 'Highly composite numbers', year: '1915', href: 'https://doi.org/10.1112/plms/s2-14.1.347', note: 'A landmark in number theory' }] },
  { name: 'Alan Turing', era: '1912–1954', field: 'Computing · Mathematics', contribution: 'His work on computability and machine intelligence laid foundations for theoretical computer science.', image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=500&q=80', papers: [{ title: 'On Computable Numbers, with an Application to the Entscheidungsproblem', year: '1936', href: 'https://doi.org/10.1112/plms/s2-42.1.230', note: 'Theoretical foundations of computation' }] },
  { name: 'Ibn al-Haytham', era: 'c. 965–1040', field: 'Optics · Mathematics', contribution: 'His experimental approach to vision and light helped shape the history of optics and scientific inquiry.', image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=500&q=80', papers: [{ title: 'Book of Optics (Kitāb al-Manāẓir)', year: 'c. 1011–1021', href: 'https://en.wikipedia.org/wiki/Book_of_Optics', note: 'Historical work; editions and translations vary' }] },
];

const CONNECTIONS = [
  { past: 'Einstein · General Relativity (1916)', present: 'Gravitational-wave astronomy', detail: 'A prediction in relativity became a new observational field when LIGO detected gravitational waves in 2015.', href: 'https://doi.org/10.1103/PhysRevLett.116.061102' },
  { past: 'Turing · Computable Numbers (1936)', present: 'Modern AI & machine learning', detail: 'The theory of computation provides a foundation for reasoning about algorithms and what machines can compute.', href: 'https://doi.org/10.1112/plms/s2-42.1.230' },
  { past: 'Curie · Radioactivity (1898)', present: 'Radiation medicine & nuclear science', detail: 'Early radioactivity research connects to contemporary imaging, cancer treatment and nuclear physics.', href: 'https://www.iaea.org/topics/radiation-medicine' },
  { past: 'Newton · Principia (1687)', present: 'Spaceflight & orbital mechanics', detail: 'Classical mechanics remains essential for trajectories, spacecraft navigation and engineering.', href: 'https://www.nasa.gov/' },
];

const contemporaryTopics = ['Artificial intelligence', 'Climate science', 'Quantum computing', 'Biotechnology', 'Neuroscience', 'Space & astronomy'];

export default function ResearchScientistsHub() {
  const [mode, setMode] = useState<'historical' | 'contemporary'>('historical');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Scientist | null>(null);
  const filtered = useMemo(() => HISTORICAL.filter((person) => [person.name, person.field, person.contribution].join(' ').toLowerCase().includes(query.toLowerCase())), [query]);

  return (
    <section aria-labelledby="scientists-heading" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-[2rem] border border-[#E8E8E3] bg-[#F4F3EF] dark:border-[#26302A] dark:bg-[#101711]">
        <div className="grid gap-8 p-6 sm:p-9 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#D9E1DA] bg-white/70 px-3 py-1.5 text-xs font-semibold text-[#31583D] dark:border-white/10 dark:bg-white/5 dark:text-[#D5B16D]"><Sparkles className="h-3.5 w-3.5"/> Across generations of discovery</span>
            <h2 id="scientists-heading" className="mt-4 max-w-xl font-serif text-3xl font-semibold tracking-tight text-[#1C201D] dark:text-[#F3F0E7] sm:text-4xl">Meet the minds behind the research</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#657067] dark:text-[#A5ADA6]">Explore the people who shaped science and researchers advancing it today. Follow the ideas—not just the dates—that connect their work.</p>
            <div className="mt-6 inline-flex rounded-xl border border-[#D9E1DA] bg-white p-1 dark:border-[#344039] dark:bg-[#141815]" role="tablist" aria-label="Scientist era">
              <button type="button" role="tab" aria-selected={mode === 'historical'} onClick={() => { setMode('historical'); setSelected(null); }} className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${mode === 'historical' ? 'bg-[#1C442D] text-white dark:bg-[#D5B16D] dark:text-[#101711]' : 'text-[#657067] dark:text-[#A5ADA6]'}`}>Historical</button>
              <button type="button" role="tab" aria-selected={mode === 'contemporary'} onClick={() => { setMode('contemporary'); setSelected(null); }} className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${mode === 'contemporary' ? 'bg-[#1C442D] text-white dark:bg-[#D5B16D] dark:text-[#101711]' : 'text-[#657067] dark:text-[#A5ADA6]'}`}>Contemporary</button>
            </div>
          </div>
          <div className="relative min-h-[190px] overflow-hidden rounded-2xl bg-[#1C442D] p-6 text-white dark:bg-[#1D2821]">
            <div aria-hidden="true" className="absolute -right-10 -top-20 h-64 w-64 rounded-full border border-white/10" />
            <div aria-hidden="true" className="absolute -right-2 -top-12 h-48 w-48 rounded-full border border-white/10" />
            <div className="relative">
              <p className="text-xs font-semibold uppercase tracking-[.18em] text-[#D5B16D]">A connected knowledge timeline</p>
              <div className="mt-5 flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10"><Clock3 className="h-5 w-5"/></span><div><p className="font-serif text-xl">Then → Now → Next</p><p className="mt-1 text-sm text-white/65">Discover how research evolves.</p></div></div>
              <a href="#research-connections" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#E7C987] hover:text-white">Explore research connections <ArrowUpRight className="h-4 w-4"/></a>
            </div>
          </div>
        </div>

        {mode === 'historical' ? (
          <div className="border-t border-[#E2E3DC] p-6 dark:border-[#26302A] sm:p-9">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-[#8A7350] dark:text-[#D5B16D]">Foundations & first principles</p><h3 className="mt-1 font-serif text-2xl font-semibold text-[#1C201D] dark:text-[#F3F0E7]">Historical scientists</h3></div><label className="relative block w-full sm:max-w-xs"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#899189]"/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a scientist or field" aria-label="Search historical scientists" className="h-10 w-full rounded-lg border border-[#D9E1DA] bg-white pl-9 pr-3 text-sm text-[#1C201D] outline-none focus:ring-2 focus:ring-[#78917B] dark:border-[#344039] dark:bg-[#141815] dark:text-[#F3F0E7]"/></label></div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((person) => <article key={person.name} className="overflow-hidden rounded-2xl border border-[#E8E8E3] bg-white dark:border-[#26302A] dark:bg-[#141815]">
                <div className="flex gap-4 p-4"><img src={person.image} alt="" loading="lazy" className="h-20 w-20 shrink-0 rounded-xl object-cover" /><div className="min-w-0"><h4 className="font-serif text-lg font-semibold text-[#1C201D] dark:text-[#F3F0E7]">{person.name}</h4><p className="mt-1 text-xs text-[#8A7350] dark:text-[#D5B16D]">{person.era}</p><p className="mt-1 text-xs text-[#737B74] dark:text-[#A5ADA6]">{person.field}</p></div></div>
                <p className="px-4 pb-4 text-sm leading-6 text-[#657067] dark:text-[#A5ADA6]">{person.contribution}</p>
                <div className="flex items-center justify-between border-t border-[#E8E8E3] px-4 py-3 dark:border-[#26302A]"><span className="text-xs text-[#737B74] dark:text-[#A5ADA6]">Featured work · {person.papers.length}</span><button type="button" onClick={() => setSelected(selected?.name === person.name ? null : person)} aria-expanded={selected?.name === person.name} className="text-xs font-semibold text-[#31583D] hover:underline dark:text-[#D5B16D]">{selected?.name === person.name ? 'Hide papers' : 'View papers'} ↗</button></div>
                {selected?.name === person.name && <div className="border-t border-[#E8E8E3] bg-[#F8F8F5] p-4 dark:border-[#26302A] dark:bg-[#101711]">{person.papers.map((paper) => <a key={paper.title} href={paper.href} target="_blank" rel="noopener noreferrer" className="mb-2 block rounded-lg border border-[#E8E8E3] bg-white p-3 last:mb-0 dark:border-[#26302A] dark:bg-[#141815]"><span className="text-xs font-semibold text-[#8A7350] dark:text-[#D5B16D]">{paper.year} · {paper.note}</span><span className="mt-1 block text-sm font-medium text-[#1C201D] dark:text-[#F3F0E7]">{paper.title}<ArrowUpRight className="ml-1 inline h-3.5 w-3.5"/></span></a>)}</div>}
              </article>)}
            </div>
            <p className="mt-4 text-xs leading-5 text-[#899189]">A curated starting collection. Dates, titles and links should be reviewed against authoritative editions before expanding profiles.</p>
          </div>
        ) : (
          <div className="border-t border-[#E2E3DC] p-6 dark:border-[#26302A] sm:p-9"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8F0E8] text-[#31583D] dark:bg-[#1D2A20] dark:text-[#D5B16D]"><Users className="h-5 w-5"/></span><div><h3 className="font-serif text-2xl font-semibold text-[#1C201D] dark:text-[#F3F0E7]">Researchers working today</h3><p className="text-sm text-[#737B74] dark:text-[#A5ADA6]">Find active researchers and their newest publications.</p></div></div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{contemporaryTopics.map((topic) => <a key={topic} href={`/research-papers?search=${encodeURIComponent(topic)}`} className="group flex items-center justify-between rounded-xl border border-[#E8E8E3] bg-white p-4 text-sm font-medium text-[#31583D] transition hover:border-[#AAB8AC] hover:bg-[#F6F8F5] dark:border-[#26302A] dark:bg-[#141815] dark:text-[#D5B16D] dark:hover:bg-[#1D2821]"><span className="flex items-center gap-2"><FlaskConical className="h-4 w-4"/>{topic}</span><ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"/></a>)}</div>
            <div className="mt-5 rounded-xl bg-[#F4F3EF] p-4 dark:bg-[#101711]"><p className="text-sm leading-6 text-[#657067] dark:text-[#A5ADA6]"><strong className="text-[#1C201D] dark:text-[#F3F0E7]">Discover people through their work:</strong> search a topic in the research catalogue, open paper records, and use verified author/institution metadata to build researcher profiles. The next phase can add profile claiming, follows, and publication alerts.</p><a href="https://openalex.org" target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-[#31583D] dark:text-[#D5B16D]">Browse the OpenAlex researcher index <ArrowUpRight className="h-3.5 w-3.5"/></a></div>
          </div>
        )}
      </div>

      <div id="research-connections" className="mt-10 scroll-mt-24">
        <div className="mb-5"><p className="text-xs font-semibold uppercase tracking-[.18em] text-[#8A7350] dark:text-[#D5B16D]">From foundations to frontiers</p><h3 className="mt-1 font-serif text-2xl font-semibold text-[#1C201D] dark:text-[#F3F0E7] sm:text-3xl">Research connections</h3><p className="mt-2 max-w-2xl text-sm leading-6 text-[#737B74] dark:text-[#A5ADA6]">Follow a discovery forward in time—from foundational ideas to the questions researchers investigate today.</p></div>
        <div className="grid gap-4 lg:grid-cols-2">{CONNECTIONS.map((item) => <article key={item.past} className="rounded-2xl border border-[#E8E8E3] bg-white p-5 dark:border-[#26302A] dark:bg-[#141815]"><div className="flex flex-wrap items-center gap-2 text-xs font-semibold"><span className="rounded-full bg-[#F1E8D7] px-2.5 py-1 text-[#775D32] dark:bg-[#3A3020] dark:text-[#E7C987]">THEN</span><span className="text-[#737B74] dark:text-[#A5ADA6]">{item.past}</span><Link2 className="h-3.5 w-3.5 text-[#8A7350]"/></div><h4 className="mt-3 font-serif text-xl font-semibold text-[#1C201D] dark:text-[#F3F0E7]">{item.present}</h4><p className="mt-2 text-sm leading-6 text-[#657067] dark:text-[#A5ADA6]">{item.detail}</p><a href={item.href} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-[#31583D] dark:text-[#D5B16D]">Explore related source <ArrowUpRight className="h-3.5 w-3.5"/></a></article>)}</div>
      </div>
      <div className="mt-8 flex flex-col gap-3 rounded-2xl border border-[#E8E8E3] bg-[#F4F3EF] p-5 dark:border-[#26302A] dark:bg-[#101711] sm:flex-row sm:items-center sm:justify-between"><div><p className="font-serif text-lg font-semibold text-[#1C201D] dark:text-[#F3F0E7]">Keep following the questions</p><p className="mt-1 text-sm text-[#737B74] dark:text-[#A5ADA6]">Move from people to papers, and from papers to new ideas.</p></div><a href="#research-catalogue" className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#1C442D] px-4 text-sm font-semibold text-white dark:bg-[#D5B16D] dark:text-[#101711]"><Compass className="h-4 w-4"/> Discover papers <BookOpen className="h-4 w-4"/></a></div>
    </section>
  );
}
