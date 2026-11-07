import React from 'react';
import SEO from '@/components/SEO';
import StoriesFeed from '@/components/stories/StoriesFeed';

const Stories: React.FC = () => {
  return (
    <>
      <SEO
        title="Short Stories & Serial Novels — Read, Write, and Connect | Sahadhyayi"
        description="Discover short stories, serialized fiction, and reader-written novellas on Sahadhyayi. Read episode by episode, follow talented authors, bookmark favorite narratives, and publish your own stories."
        canonical="https://sahadhyayi.com/stories"
        keywords={[
          'short stories',
          'serialized stories',
          'read stories online',
          'Indian short fiction',
          'Hindi and English stories',
          'creative writing',
          'Sahadhyayi stories',
        ]}
        schema={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'Sahadhyayi Short Stories & Serials',
          description: 'A vibrant reader-writer community for short fiction and episodic stories.',
          url: 'https://sahadhyayi.com/stories',
        }}
      />
      <div className="min-h-screen bg-background py-8 sm:py-12">
        <main className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <StoriesFeed />
        </main>
      </div>
    </>
  );
};

export default Stories;

