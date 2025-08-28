import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const HomeHero: React.FC = () => {
  return (
    <section className="bg-white dark:bg-black text-center py-24 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl sm:text-5xl font-bold mb-6 text-gray-900 dark:text-white">
          Rediscover the joy of deep reading
        </h1>
        <p className="text-lg mb-8 text-gray-700 dark:text-gray-300">
          Join our community of book lovers and explore thousands of titles.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/signup" className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white px-8 py-3">
              Join Sahadhyayi
            </Button>
          </Link>
          <Link to="/signin" className="w-full sm:w-auto">
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto border-amber-600 text-amber-600 hover:bg-amber-600 hover:text-white px-8 py-3"
            >
              Sign In
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HomeHero;

