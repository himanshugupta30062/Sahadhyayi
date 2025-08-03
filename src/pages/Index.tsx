
import * as React from 'react';
import { Helmet } from 'react-helmet-async';
import AnimatedHero from '@/components/AnimatedHero';
import SahadhyayiCircuit from '@/components/SahadhyayiCircuit';
import SahadhyayiCapabilities from '@/components/SahadhyayiCapabilities';
import CommunityStats from '@/components/CommunityStats';
import SEO from '@/components/SEO';

const Index = () => {
  return (
    <>
      <SEO 
        title="Sahadhyayi - Your Reading Community Platform"
        description="Join Sahadhyayi to connect with fellow readers, discover new books, and share your reading journey with a vibrant community."
        keywords={["reading community", "book discovery", "social reading", "book recommendations", "reading circles"]}
      />
      <Helmet>
        <title>Sahadhyayi - Your Reading Community Platform</title>
        <meta name="description" content="Join Sahadhyayi to connect with fellow readers, discover new books, and share your reading journey with a vibrant community." />
      </Helmet>
      <div className="min-h-screen">
        <AnimatedHero />
        <SahadhyayiCircuit />
        <SahadhyayiCapabilities />
        <CommunityStats />
      </div>
    </>
  );
};

export default Index;
