
import React from 'react';
import BookFlipLoader from '@/components/ui/BookFlipLoader';

const HeroLoader: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-brand-neutral to-background flex items-center justify-center">
      <BookFlipLoader size="lg" text="Welcome to Sahadhyayi..." />
    </div>
  );
};

export default HeroLoader;
