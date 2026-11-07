import React from 'react';
import SEO from '@/components/SEO';
import { StoriesFeed } from '@/components/stories/StoriesFeed';

const Stories: React.FC = () => (
  <>
    <SEO
      title="Short Stories & Serials — Read and Write | Sahadhyayi"
      description="Discover short stories, serialized fiction, and reader-written novels on Sahadhyayi. Read episode by episode, follow authors, bookmark stories, and publish your own."
      canonical="https://sahadhyayi.com/stories"
      keywords={['short stories', 'serial stories', 'read stories online', 'Indian stories', 'fiction', 'Sahadhyayi']}
    />
    <main className="container mx-auto px-4 py-6 sm:py-10">
      <StoriesFeed />
    </main>
  </>
);

export default Stories;
