import SEO from "@/components/SEO";
import ReadingGroupsDirectory from "@/components/groups/ReadingGroupsDirectory";
import { ArrowDown, Users } from "lucide-react";

const ReadingGroups = () => {
  return (
    <>
      <SEO
        title="Reading Groups - Join Book Discussion Communities | Sahadhyayi"
        description="Join reading circles, share perspectives, and find people who make your favourite books even more meaningful."
        canonical="https://sahadhyayi.com/groups"
        keywords={['reading groups', 'book clubs', 'book discussions', 'reading community', 'literary discussions', 'book lovers']}
      />

      <div className="min-h-screen bg-[#FAF7F2] text-[#1C201D] transition-colors duration-200 dark:bg-[#0B0D0C] dark:text-[#F3F0E7]">
        <section className="relative isolate overflow-hidden border-b border-[#DCD5C9] bg-[#FAF7F2] dark:border-[#29332D] dark:bg-[#101711]">
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: "url('https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=2200&q=85')",
              backgroundPosition: 'center 42%',
            }}
          />
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-[#FAF7F2]/95 via-[#FAF7F2]/84 to-[#FAF7F2]/54 dark:from-[#09120D]/95 dark:via-[#09120D]/84 dark:to-[#09120D]/48" />
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#FAF7F2]/76 via-transparent to-[#FAF7F2]/16 dark:from-[#09120D]/76 dark:via-transparent dark:to-[#09120D]/20" />

          <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-18 lg:px-8 lg:py-22">
            <div className="max-w-3xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#C8DBCB] bg-white/75 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.17em] text-[#1C442D] shadow-sm backdrop-blur-sm dark:border-[#D5B16D]/35 dark:bg-black/25 dark:text-[#E8CC91] sm:mb-6">
                <Users className="h-3.5 w-3.5" aria-hidden="true" />
                Read a little closer, together
              </div>
              <h1 className="max-w-3xl font-serif text-4xl font-bold leading-[1.08] tracking-tight text-[#1C201D] sm:text-5xl md:text-6xl lg:text-7xl dark:text-[#FBF7EF]">
                Good books are
                <span className="block text-[#8F681C] dark:text-[#E4C17B]">better shared.</span>
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-[#4F5D53] dark:text-white/80 sm:mt-6 sm:text-lg sm:leading-8">
                Find a reading circle for your favourite genre, exchange perspectives, and build a habit that is easier to keep together.
              </p>
              <a
                href="#group-directory"
                className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#1C442D] px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#143221] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C442D] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF7F2] dark:bg-[#D5B16D] dark:text-[#0B0D0C] dark:hover:bg-[#E4C17B] dark:focus-visible:ring-[#D5B16D] dark:focus-visible:ring-offset-[#0B0D0C]">
                Browse reading groups
                <ArrowDown className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          </div>
        </section>

        <main id="group-directory" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          <ReadingGroupsDirectory />
        </main>
      </div>
    </>
  );
};

export default ReadingGroups;
