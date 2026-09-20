import SEO from "@/components/SEO";
import ReadingGroupsDirectory from "@/components/groups/ReadingGroupsDirectory";

const ReadingGroups = () => {
  return (
    <>
      <SEO
        title="Reading Groups - Join Book Discussion Communities | Sahadhyayi"
        description="Join vibrant reading groups and book clubs. Engage in meaningful discussions, share insights, and connect with passionate readers who share your literary interests."
        canonical="https://sahadhyayi.app/groups"
        keywords={['reading groups', 'book clubs', 'book discussions', 'reading community', 'literary discussions', 'book lovers']}
      />
      <main className="min-h-screen px-4 py-8">
        <div className="mx-auto max-w-7xl">
          <ReadingGroupsDirectory />
        </div>
      </main>
    </>
  );
};

export default ReadingGroups;
