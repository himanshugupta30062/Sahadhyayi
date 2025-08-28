import React from 'react';
import { Button } from '@/components/ui/button';
import { BookOpen, Users, Map, Calendar, Star, Headphones } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/authHelpers';
import { useProfile } from '@/hooks/useProfile';
import SEO from '@/components/SEO';
import CurrentReads from '@/components/library/CurrentReads';
import HomeHero from '@/components/home/HomeHero';
import PopularBooksCarousel from '@/components/home/PopularBooksCarousel';
import UpcomingEvents from '@/components/home/UpcomingEvents';
import Testimonials from '@/components/home/Testimonials';

const Index = () => {
  const { user } = useAuth();
  const { data: profile } = useProfile();

  const features = [
    { icon: BookOpen, title: 'Personal Bookshelf', description: 'Track and manage your reading journey effortlessly.' },
    { icon: Users, title: 'Global Reading Groups', description: 'Engage in book discussions worldwide.' },
    { icon: Map, title: 'Find Local Readers', description: 'Discover local book lovers through our interactive map.' },
    { icon: Calendar, title: 'Author Connect', description: 'Participate in live sessions with your favorite authors.' },
    { icon: Star, title: 'Community Reviews', description: 'Read authentic book reviews from fellow readers.' },
    { icon: Headphones, title: 'AI Reading Assistant', description: 'Instant definitions and explanations as you read.' }
  ];

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Sahadhyayi",
    "alternateName": ["Sahadhyayi Reading Community", "Sahadhyayi Digital Library", "Fellow Reader Platform"],
    "url": "https://sahadhyayi.com",
    "description": "Sahadhyayi means 'fellow reader' in Sanskrit. Join our digital reading community platform connecting readers and authors worldwide for deep reading experiences.",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://sahadhyayi.com/library?search={search_term_string}",
      "query-input": "required name=search_term_string"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Sahadhyayi",
      "url": "https://sahadhyayi.com",
      "logo": "https://sahadhyayi.com/lovable-uploads/sahadhyayi-logo-digital-reading.png",
      "foundingDate": "2024",
      "mission": "To revive deep reading culture and connect readers worldwide as fellow study companions (Sahadhyayi)",
      "sameAs": [
        "https://sahadhyayi.com/library",
        "https://sahadhyayi.com/authors",
        "https://sahadhyayi.com/about"
      ]
    }
  };

  return (
    <>
      <SEO
        title="Sahadhyayi - Digital Reading Community & Book Library | Fellow Readers Platform"
        description="Sahadhyayi means 'fellow reader' in Sanskrit. Join our vibrant digital reading community and book reader social media platform. Discover thousands of books, connect with fellow readers, track your progress, and explore our comprehensive digital library with your study companions."
        url="https://sahadhyayi.com/"
        keywords={['Sahadhyayi', 'fellow reader', 'Sanskrit meaning', 'digital reading community', 'book library', 'reading platform', 'study companions', 'book lovers']}
      />
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>

      <HomeHero />
      <PopularBooksCarousel />
      <UpcomingEvents />

      {/* Features Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-900">Features</h2>
          <ul className="space-y-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <li key={index} className="flex items-start">
                  <Icon className="w-6 h-6 text-amber-600 mr-3 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900">{feature.title}</h3>
                    <p className="text-gray-700">{feature.description}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* Current Reads Section for Signed-in Users */}
      {user && (
        <section className="py-16 px-4 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900">
                Welcome back, {profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Reader'}!
              </h2>
              <p className="text-gray-700 text-lg">Continue your reading journey</p>
            </div>
            <CurrentReads />
            <div className="text-center mt-8">
              <Link to="/dashboard">
                <Button className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-3">
                  Go to Full Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      <Testimonials />

      {/* CTA Section */}
      <section className="py-16 px-4 bg-black text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Start Your Reading Journey?</h2>
          <p className="text-lg mb-8 text-gray-300">Join Sahadhyayi today and experience the joy of reading together.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup">
              <Button size="lg" className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-3">
                Join Now
              </Button>
            </Link>
            <Link to="/signin">
              <Button size="lg" variant="outline" className="border-amber-500 text-amber-400 hover:bg-amber-500 hover:text-white px-8 py-3">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
};

export default Index;

