import SEO from "@/components/SEO";
import ReadingGroupsDirectory from "@/components/groups/ReadingGroupsDirectory";

const ReadingGroups = () => {
  return (
    <>
      <SEO
        title="Reading Groups - Join Book Discussion Communities | Sahadhyayi"
        description="Join vibrant reading groups and book clubs. Engage in meaningful discussions, share insights, and connect with passionate readers who share your literary interests."
        canonical="https://sahadhyayi.com/groups"
        keywords={['reading groups', 'book clubs', 'book discussions', 'reading community', 'literary discussions', 'book lovers']}
      />
      <div className="min-h-screen">
        <section className="relative isolate overflow-hidden border-b border-[#E8E8E3] bg-[#F4F3EF] px-4 py-14 dark:border-[#29332D] dark:bg-[#101711] sm:px-6 sm:py-18 lg:px-8">
          <img src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=2200&q=85" alt="" aria-hidden="true" className="absolute inset-y-0 right-0 h-full w-full object-cover object-center sm:w-[68%]" loading="eager" />
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-[#F4F3EF] via-[#F4F3EF]/68 to-[#F4F3EF]/0 dark:from-[#09120D] dark:via-[#09120D]/90 dark:to-[#09120D]/30" />
          <div className="relative z-10 mx-auto max-w-7xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#1C442D] dark:text-[#D5B16D]">Read better, together</p>
            <h1 className="max-w-2xl font-serif text-4xl font-bold tracking-tight text-[#1C201D] dark:text-[#F3F0E7] sm:text-5xl">Reading Groups</h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-[#636B65] dark:text-[#A5ADA6] sm:text-lg">Find your people, share perspectives, and make every book a conversation.</p>
          </div>
        </section>
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <ReadingGroupsDirectory />
        </div>
      </div>
    </>
  );
};

export default ReadingGroups;
