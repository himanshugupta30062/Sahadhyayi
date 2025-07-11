import React, { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Users, Map, Calendar, Star, Headphones, LogIn, UserPlus, User, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import SEO from "@/components/SEO";

const Index = () => {
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();
  const navigate = useNavigate();

  // If user is logged in, redirect to dashboard only after a delay to prevent flash
  useEffect(() => {
    if (user) {
      const timer = setTimeout(() => {
        navigate('/dashboard');
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [user, navigate]);

  // Show loading state during redirect
  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Redirecting to your dashboard...</p>
        </div>
      </div>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const features = [
    {
      icon: BookOpen,
      title: "Personal Digital Bookshelf",
      description: "Track your reading progress, manage your book collection, and read directly on our platform with advanced reading tools."
    },
    {
      icon: Users,
      title: "Global Reading Communities",
      description: "Join book-specific discussion groups and connect with passionate readers from around the world."
    },
    {
      icon: Map,
      title: "Local Reader Discovery",
      description: "Discover readers near you and find local book communities through our interactive reader map."
    },
    {
      icon: Calendar,
      title: "Author Connect Sessions",
      description: "Schedule live Q&A sessions and conferences with your favorite authors and literary experts."
    },
    {
      icon: Star,
      title: "Community Reviews & Ratings",
      description: "Share your thoughts and discover great books through our comprehensive community review system."
    },
    {
      icon: Headphones,
      title: "AI-Powered Reading Assistant",
      description: "Get instant explanations for any word, paragraph, or chapter while reading with our intelligent AI companion."
    }
  ];

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Sahadhyayi",
    "alternateName": "Sahadhyayi Reading Community",
    "url": "https://sahadhyayi.com",
    "description": "Digital reading community platform connecting readers and authors worldwide",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://sahadhyayi.com/library?search={search_term_string}",
      "query-input": "required name=search_term_string"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Sahadhyayi",
      "url": "https://sahadhyayi.com",
      "logo": "https://sahadhyayi.com/lovable-uploads/fff3e49f-a95f-4fcf-ad47-da2dc6626f29.png",
      "foundingDate": "2024",
      "mission": "To revive deep reading culture and connect readers worldwide",
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
        title="Sahadhyayi - Digital Reading Community & Book Library"
        description="Join Sahadhyayi's vibrant reading community and book reader social media platform. Discover thousands of books, connect with fellow readers, track your progress, and explore our digital library."
        url="https://sahadhyayi.com/"
      />
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
      {/* Hero Section */}
      <section className="relative py-20 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center mb-8">
            <img
              src="/lovable-uploads/fff3e49f-a95f-4fcf-ad47-da2dc6626f29.png"
              alt="Sahadhyayi logo representing our book reader social media community"
              className="w-24 h-24"
            />
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
            Welcome to
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600"> Sahadhyayi</span>
            <br />
            <span className="text-3xl md:text-4xl">Your Digital Reading Community</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-700 mb-8 leading-relaxed">
            Reviving the transformative power of deep reading through community, technology, and shared knowledge.
            Join thousands of readers building a healthier, more focused reading culture.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup">
              <Button size="lg" className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 text-lg shadow-lg">
                <UserPlus className="w-5 h-5 mr-2" />
                Sign Up Free
              </Button>
            </Link>
            <Link to="/signin">
              <Button variant="outline" size="lg" className="border-orange-400 text-orange-600 hover:bg-orange-50 px-8 py-3 text-lg shadow-lg">
                <LogIn className="w-5 h-5 mr-2" />
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 px-4 bg-white/60 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-8">Why Choose Sahadhyayi for Your Reading Journey?</h2>
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="text-left">
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">The Digital Reading Challenge</h3>
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                Modern digital consumption habits are shifting away from deep reading toward passive content like videos and podcasts. 
                This change impacts our ability to focus deeply, comprehend complex ideas, and engage in meaningful reflection.
              </p>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Our Revolutionary Solution</h3>
              <p className="text-lg text-gray-700 leading-relaxed">
                Sahadhyayi creates a social reading platform that makes books more accessible, interactive, and community-driven. 
                We combine traditional reading with modern technology to build healthier intellectual habits. 
                <Link to="/about" className="text-orange-600 hover:text-orange-700 font-medium ml-1">Learn about our mission</Link>.
              </p>
            </div>
            <div className="bg-gradient-to-br from-orange-100 to-red-100 p-8 rounded-2xl backdrop-blur-sm border border-orange-200 shadow-lg">
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Scientifically Proven Benefits of Deep Reading</h3>
              <ul className="space-y-3 text-gray-700">
                <li>• Improves focus and attention span significantly</li>
                <li>• Enhances critical thinking and analytical skills</li>
                <li>• Reduces digital eye strain from screens</li>
                <li>• Builds empathy and emotional intelligence</li>
                <li>• Promotes mental clarity and deep reflection</li>
                <li>• Creates lasting knowledge retention and understanding</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-4">Comprehensive Platform Features</h2>
          <p className="text-xl text-gray-600 text-center mb-12 max-w-3xl mx-auto">
            Discover powerful tools designed to enhance your reading experience and connect you with a global community of book lovers.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: BookOpen,
                title: "Personal Digital Bookshelf",
                description: "Track your reading progress, manage your book collection, and read directly on our platform with advanced reading tools."
              },
              {
                icon: Users,
                title: "Global Reading Communities",
                description: "Join book-specific discussion groups and connect with passionate readers from around the world."
              },
              {
                icon: Map,
                title: "Local Reader Discovery",
                description: "Discover readers near you and find local book communities through our interactive reader map."
              },
              {
                icon: Calendar,
                title: "Author Connect Sessions",
                description: "Schedule live Q&A sessions and conferences with your favorite authors and literary experts."
              },
              {
                icon: Star,
                title: "Community Reviews & Ratings",
                description: "Share your thoughts and discover great books through our comprehensive community review system."
              },
              {
                icon: Headphones,
                title: "AI-Powered Reading Assistant",
                description: "Get instant explanations for any word, paragraph, or chapter while reading with our intelligent AI companion."
              }
            ].map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="bg-white/80 backdrop-blur-sm border-orange-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <CardHeader>
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-orange-600" />
                    </div>
                    <CardTitle className="text-xl text-gray-900">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Updated Internal Links Section with Equal Sized Cards */}
      <section className="py-16 px-4 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-8">Explore Our Platform</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link to="/library" className="block">
              <Card className="bg-white hover:shadow-xl transition-all duration-300 hover:-translate-y-2 h-full">
                <CardContent className="p-8 text-center flex flex-col justify-between h-full">
                  <div>
                    <BookOpen className="w-16 h-16 text-orange-600 mx-auto mb-6" />
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Digital Library</h3>
                    <p className="text-gray-600 text-base leading-relaxed">Browse thousands of books across all genres with our comprehensive digital collection</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link to="/groups" className="block">
              <Card className="bg-white hover:shadow-xl transition-all duration-300 hover:-translate-y-2 h-full">
                <CardContent className="p-8 text-center flex flex-col justify-between h-full">
                  <div>
                    <Users className="w-16 h-16 text-orange-600 mx-auto mb-6" />
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Reading Groups</h3>
                    <p className="text-gray-600 text-base leading-relaxed">Join meaningful discussions with fellow readers who share your literary interests</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link to="/map" className="block">
              <Card className="bg-white hover:shadow-xl transition-all duration-300 hover:-translate-y-2 h-full">
                <CardContent className="p-8 text-center flex flex-col justify-between h-full">
                  <div>
                    <Map className="w-16 h-16 text-orange-600 mx-auto mb-6" />
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Reader Map</h3>
                    <p className="text-gray-600 text-base leading-relaxed">Find and connect with local readers and book communities in your area</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link to="/authors" className="block">
              <Card className="bg-white hover:shadow-xl transition-all duration-300 hover:-translate-y-2 h-full">
                <CardContent className="p-8 text-center flex flex-col justify-between h-full">
                  <div>
                    <Calendar className="w-16 h-16 text-orange-600 mx-auto mb-6" />
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Meet Authors</h3>
                    <p className="text-gray-600 text-base leading-relaxed">Connect directly with inspiring authors through live sessions and Q&As</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-orange-600 to-red-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Transform Your Reading Journey?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join Sahadhyayi today and become part of a global community dedicated to deep, meaningful reading.
            Start your journey towards better focus, enhanced comprehension, and meaningful literary connections.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup">
              <Button size="lg" variant="secondary" className="px-8 py-3 text-lg">
                <UserPlus className="w-5 h-5 mr-2" />
                Get Started Free
              </Button>
            </Link>
            <Link to="/about">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-orange-600 px-8 py-3 text-lg">
                Learn More About Us
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
