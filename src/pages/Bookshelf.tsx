import MyLibrary from '@/components/MyLibrary';
import SEO from '@/components/SEO';

const Bookshelf = () => {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'My Bookshelf',
    description:
      'Manage your books, track reading progress, and get AI-powered assistance in your personal digital bookshelf.',
    url: 'https://sahadhyayi.com/bookshelf',
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://sahadhyayi.com' },
        { '@type': 'ListItem', position: 2, name: 'Bookshelf', item: 'https://sahadhyayi.com/bookshelf' },
      ],
    },
  };

  return (
    <>
      <SEO
        title="My Bookshelf - Track Your Reading | Sahadhyayi"
        description="Manage your books, track reading progress, and get AI-powered assistance in your personal digital bookshelf."
        canonical="https://sahadhyayi.com/bookshelf"
        url="https://sahadhyayi.com/bookshelf"
      />
      <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      <div className="min-h-screen pt-20 pb-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">My Bookshelf</h1>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto">
              Track your reading progress, take notes, and get AI-powered assistance.
            </p>
          </div>
          <MyLibrary />
        </div>
      </div>
    </>
  );
};

export default Bookshelf;
