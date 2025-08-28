import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const SimpleHero: React.FC = () => {
  return (
    <section className="bg-white text-gray-900 pt-32 pb-16 px-4 text-center">
      <h1 className="text-4xl sm:text-5xl font-bold text-brand mb-6">
        Rediscover the joy of deep reading
      </h1>
      <p className="max-w-2xl mx-auto mb-8 text-lg text-gray-700">
        Connect with fellow readers, explore curated collections, and track your progress.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link to="/signup">
          <Button className="btn-primary px-8 py-4">
            Join Sahadhyayi
          </Button>
        </Link>
        <Link to="/about">
          <Button variant="outline" className="btn-secondary px-8 py-4">
            Learn More
          </Button>
        </Link>
      </div>
    </section>
  );
};

export default SimpleHero;

