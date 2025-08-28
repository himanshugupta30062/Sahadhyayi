
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Users, Map, Calendar, Star, Headphones, UserPlus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import SignInLink from '@/components/SignInLink';
import { useAuth } from "@/contexts/authHelpers";
import { useProfile } from "@/hooks/useProfile";
import SEO from "@/components/SEO";
import SimpleHero from "@/components/home/SimpleHero";
import PopularBooks from "@/components/home/PopularBooks";
import UpcomingEvents from "@/components/home/UpcomingEvents";
import Testimonials from "@/components/home/Testimonials";
import CurrentReads from "@/components/library/CurrentReads";

const Index = () => {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const navigate = useNavigate();

  const features = [
    {
      icon: BookOpen,
      title: "Personal Bookshelf",
      description: "Track and manage your reading journey effortlessly."
    },
    {
      icon: Users,
      title: "Global Reading Groups",
      description: "Engage in book discussions worldwide."
    },
    {
      icon: Map,
      title: "Find Local Readers",
      description: "Discover local book lovers through our interactive map."
    },
    {
      icon: Calendar,
      title: "Author Connect",
      description: "Participate in live sessions with your favorite authors."
    },
    {
      icon: Star,
      title: "Community Reviews",
      description: "Read authentic book reviews from fellow readers."
    },
    {
      icon: Headphones,
      title: "AI Reading Assistant",
      description: "Instant definitions and explanations as you read."
    }
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
      {/* Hero Section */}
      <SimpleHero />
      <div className="page-container">
        {/* Current Reads Section for Signed-in Users */}
        {user && (
          <section className="py-16 bg-neutral">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-brand mb-4">
                  Welcome back, {profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Reader'}!
                </h2>
                <p className="text-lg">Continue your reading journey</p>
              </div>
              <CurrentReads />

              <div className="text-center mt-8">
                <Link to="/dashboard">
                  <Button className="btn-primary px-8 py-3">
                    Go to Full Dashboard
                  </Button>
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Features Section */}
        <section className="py-16 px-4 bg-black">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-100 mb-6">Explore Sahadhyayi's Features</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Card key={index} className="bg-black/80 backdrop-blur-sm border-orange-700 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <CardHeader className="pb-4">
                      <div className="w-12 h-12 bg-orange-900 rounded-lg flex items-center justify-center mb-4 mx-auto">
                        <Icon className="w-6 h-6 text-orange-400" />
                      </div>
                      <CardTitle className="text-lg text-gray-100 text-center">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-gray-300 text-center">{feature.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        <PopularBooks />
        <UpcomingEvents />
        <Testimonials />

        {/* CTA Section */}
        <section className="py-8 sm:py-12 lg:py-16 text-white">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold mb-3 sm:mb-4 lg:mb-6">Ready to Start Your Reading Journey?</h2>
            <p className="text-sm sm:text-base lg:text-lg xl:text-xl mb-4 sm:mb-6 lg:mb-8 opacity-90">
              Join Sahadhyayi today and experience the joy of reading together.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Link to="/signup" className="w-full sm:w-auto">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto btn-primary px-4 sm:px-6 lg:px-8 py-2 sm:py-3 text-sm sm:text-base lg:text-lg">
                  <UserPlus className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 mr-2" />
                  Get Started Free
                </Button>
              </Link>
              <Link to="/about" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto btn-primary px-4 sm:px-6 lg:px-8 py-2 sm:py-3 text-sm sm:text-base lg:text-lg">
                  Learn More About Sahadhyayi
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default Index;
