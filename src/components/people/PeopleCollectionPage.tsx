import { useMemo, useState } from "react";
import { ArrowUpRight, BookOpen, Search, Sparkles } from "lucide-react";
import Breadcrumb from "@/components/Breadcrumb";
import SEO from "@/components/SEO";
import { Input } from "@/components/ui/input";
import { peopleCollections } from "@/data/peopleCollections";

type PeopleCollectionKey = keyof typeof peopleCollections;

const accentStyles = {
  gold: {
    eyebrow: "text-[#E8CC91]",
    border: "border-[#D5B16D]/30",
    badge: "border-[#D5B16D]/35 bg-[#D5B16D]/10 text-[#9A702B] dark:text-[#E8CC91]",
    glow: "from-[#6D532B]/45 via-[#1D3025]/30 to-transparent",
    dot: "bg-[#D5B16D]",
  },
  green: {
    eyebrow: "text-[#C6D9C5]",
    border: "border-[#81A889]/35",
    badge: "border-[#81A889]/35 bg-[#81A889]/10 text-[#315C43] dark:text-[#C6D9C5]",
    glow: "from-[#1C442D]/55 via-[#1D3025]/35 to-transparent",
    dot: "bg-[#81A889]",
  },
  indigo: {
    eyebrow: "text-[#D4D8FF]",
    border: "border-[#9BA7E8]/35",
    badge: "border-[#9BA7E8]/35 bg-[#9BA7E8]/10 text-[#46548F] dark:text-[#D4D8FF]",
    glow: "from-[#303B70]/55 via-[#1D3025]/35 to-transparent",
    dot: "bg-[#9BA7E8]",
  },
} as const;

export function PeopleCollectionPage({ collectionKey }: { collectionKey: PeopleCollectionKey }) {
  const collection = peopleCollections[collectionKey];
  const [search, setSearch] = useState("");
  const accent = accentStyles[collection.accent];

  const visiblePeople = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    if (!query) return collection.people;
    return collection.people.filter((person) =>
      [
        person.name,
        person.role,
        person.origin,
        person.summary,
        ...person.themes,
        ...person.story,
      ].join(" ").toLocaleLowerCase().includes(query)
    );
  }, [collection.people, search]);

  return (
    <>
      <SEO
        title={collection.title + " | Sahadhyayi"}
        description={collection.description}
        canonical={"https://sahadhyayi.com/" + collectionKey}
        url={"https://sahadhyayi.com/" + collectionKey}
      />

      <div className="min-h-screen bg-[#FAF7F2] text-[#1C201D] transition-colors duration-200 dark:bg-[#0B0D0C] dark:text-[#F3F0E7]">
        <section className="relative isolate overflow-hidden border-b border-[#29332D] bg-[#101711] text-white">
          <div aria-hidden="true" className={"absolute inset-0 bg-gradient-to-br " + accent.glow} />
          <div aria-hidden="true" className="absolute -right-24 -top-36 h-[28rem] w-[28rem] rounded-full border border-white/10" />
          <div aria-hidden="true" className="absolute -right-8 -top-20 h-[20rem] w-[20rem] rounded-full border border-white/10" />
          <div aria-hidden="true" className="absolute inset-0 opacity-[0.12] [background-image:radial-gradient(rgba(255,255,255,0.7)_0.7px,transparent_0.7px)] [background-size:18px_18px]" />

          <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-18 lg:px-8 lg:py-20">
            <div className="max-w-3xl">
              <div className={"mb-5 inline-flex items-center gap-2 rounded-full border bg-black/20 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] backdrop-blur-sm " + accent.border + " " + accent.eyebrow}>
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                {collection.eyebrow}
              </div>
              <h1 className="font-serif text-4xl font-bold leading-[1.08] tracking-tight text-[#FBF7EF] sm:text-5xl md:text-6xl">
                {collection.title}
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-white/80 sm:text-lg sm:leading-8">
                {collection.description}
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3 text-sm text-white/75">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-2">
                  <BookOpen className="h-4 w-4" aria-hidden="true" />
                  {collection.people.length} curated profiles
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-2">
                  <span className={"h-2 w-2 rounded-full " + accent.dot} />
                  Source-linked stories
                </span>
              </div>
            </div>
          </div>
        </section>

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
          <Breadcrumb items={[{ name: collection.title, path: "/" + collectionKey, current: true }]} className="mb-6" />

          <div className="mb-8 flex flex-col gap-5 rounded-2xl border border-[#E5DED2] bg-white p-5 shadow-[0_8px_30px_rgba(28,32,29,0.035)] dark:border-[#29332D] dark:bg-[#111614] sm:flex-row sm:items-end sm:justify-between sm:p-6">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#98733A] dark:text-[#D5B16D]">Explore the collection</p>
              <p className="mt-2 text-sm leading-6 text-[#636B65] dark:text-[#A5ADA6]">{collection.intro}</p>
            </div>
            <div className="relative w-full shrink-0 sm:max-w-sm">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#737B75] dark:text-[#89938B]" aria-hidden="true" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search names, themes or stories…"
                aria-label={"Search " + collection.title}
                className="h-11 rounded-xl border-[#E5DED2] bg-[#FAF7F2] pl-10 text-sm dark:border-[#29332D] dark:bg-[#0B0D0C]"
              />
            </div>
          </div>

          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-serif text-2xl font-bold tracking-tight sm:text-3xl">People and their journeys</h2>
              <p className="mt-1 text-sm text-[#737B75] dark:text-[#89938B]">Showing {visiblePeople.length} of {collection.people.length} profiles</p>
            </div>
          </div>

          {visiblePeople.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              {visiblePeople.map((person) => (
                <article key={person.slug} className="overflow-hidden rounded-2xl border border-[#E5DED2] bg-white shadow-[0_6px_24px_rgba(28,32,29,0.035)] transition-shadow hover:shadow-lg dark:border-[#29332D] dark:bg-[#111614] dark:shadow-none">
                  <details className="group">
                    <summary className="cursor-pointer list-none p-5 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1C442D] dark:focus-visible:ring-[#D5B16D] sm:p-6 [&::-webkit-details-marker]:hidden">
                      <div className="flex items-start gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1C442D] to-[#6A805C] font-serif text-lg font-bold text-white shadow-sm dark:from-[#203B2A] dark:to-[#4B654D]">
                          {person.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <h3 className="font-serif text-xl font-bold leading-tight text-[#202820] transition-colors group-hover:text-[#1C442D] dark:text-[#F3F0E7] dark:group-hover:text-[#D5B16D]">
                              {person.name}
                            </h3>
                            <span className="text-xs font-medium text-[#788076] dark:text-[#A5ADA6]">{person.lifespan}</span>
                          </div>
                          <p className="mt-1 text-xs font-medium text-[#8F681C] dark:text-[#D5B16D]">{person.role}</p>
                          <p className="mt-2 text-sm leading-6 text-[#636B65] dark:text-[#A5ADA6]">{person.summary}</p>
                          <div className="mt-3 flex flex-wrap items-center gap-1.5">
                            {person.themes.map((theme) => (
                              <span key={theme} className={"rounded-full border px-2.5 py-1 text-[10px] font-medium " + accent.badge}>{theme}</span>
                            ))}
                          </div>
                        </div>
                        <span className="hidden shrink-0 items-center gap-1 text-xs font-semibold text-[#1C442D] dark:text-[#D5B16D] sm:inline-flex">
                          Read story <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-open:rotate-45" aria-hidden="true" />
                        </span>
                      </div>
                      <span className="mt-4 block text-xs text-[#737B75] dark:text-[#89938B] sm:hidden">Tap to read the story</span>
                    </summary>

                    <div className="border-t border-[#EDE7DE] bg-[#FCFBF8] px-5 py-5 dark:border-[#29332D] dark:bg-[#0D1210] sm:px-6 sm:py-6">
                      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-[#737B75] dark:text-[#89938B]">
                        <span>{person.origin}</span>
                        <span aria-hidden="true">·</span>
                        <span>{person.role}</span>
                      </div>
                      <div className="space-y-3 text-sm leading-7 text-[#4F5D53] dark:text-[#B9C9BC]">
                        {person.story.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
                      </div>

                      <div className="mt-6">
                        <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8F681C] dark:text-[#D5B16D]">Key moments</h4>
                        <ol className="mt-3 space-y-3 border-l border-[#D9D2C6] pl-4 dark:border-[#34443A]">
                          {person.milestones.map((milestone) => (
                            <li key={milestone.date + milestone.title} className="relative">
                              <span className={"absolute -left-[1.32rem] top-1.5 h-2 w-2 rounded-full ring-4 ring-[#FCFBF8] dark:ring-[#0D1210] " + accent.dot} />
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8F681C] dark:text-[#D5B16D]">{milestone.date}</p>
                              <p className="mt-0.5 text-sm font-semibold text-[#202820] dark:text-[#F3F0E7]">{milestone.title}</p>
                              <p className="mt-0.5 text-xs leading-5 text-[#636B65] dark:text-[#A5ADA6]">{milestone.description}</p>
                            </li>
                          ))}
                        </ol>
                      </div>

                      <div className="mt-6 border-t border-[#E5DED2] pt-4 dark:border-[#29332D]">
                        <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8F681C] dark:text-[#D5B16D]">Further reading and sources</h4>
                        <ul className="mt-2 space-y-2">
                          {person.sources.map((source) => (
                            <li key={source.url}>
                              <a href={source.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-start gap-1.5 text-sm font-medium text-[#1C442D] underline-offset-4 hover:underline dark:text-[#D5B16D]">
                                <span>{source.label}</span>
                                <ArrowUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                              </a>
                              <p className="mt-0.5 text-[11px] text-[#737B75] dark:text-[#89938B]">{source.publisher}</p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </details>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[#D9D2C6] bg-white/70 px-6 py-16 text-center dark:border-[#29332D] dark:bg-[#111614]">
              <Search className="mx-auto h-7 w-7 text-[#8B9188]" aria-hidden="true" />
              <h3 className="mt-3 font-serif text-xl font-bold">No profiles match that search</h3>
              <p className="mt-2 text-sm text-[#687067] dark:text-[#A5ADA6]">Try another name, place or theme.</p>
              <button type="button" onClick={() => setSearch("")} className="mt-4 rounded-lg border border-[#D5CEC2] px-4 py-2 text-xs font-semibold text-[#1C442D] hover:bg-[#EBF2EC] dark:border-[#34443A] dark:text-[#D5B16D] dark:hover:bg-[#1C3024]">Clear search</button>
            </div>
          )}

          <section className="mt-12 rounded-2xl border border-[#DDE2D7] bg-[#EAEDE5] px-6 py-8 dark:border-[#29332D] dark:bg-[#111A14] sm:px-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#526B54] dark:text-[#D5B16D]">An evolving collection</p>
                <h2 className="mt-2 font-serif text-2xl font-bold text-[#202820] dark:text-[#F3F0E7]">Stories deserve careful sourcing.</h2>
                <p className="mt-2 text-sm leading-6 text-[#626B60] dark:text-[#A5ADA6]">Profiles are curated from the linked references. We will expand the collection over time while keeping the source trail visible.</p>
              </div>
              <a href="https://sahadhyayi.com/library" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#1C442D] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#173824] dark:bg-[#D5B16D] dark:text-[#0B0D0C] dark:hover:bg-[#E4C17B]">
                Explore the Library <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
