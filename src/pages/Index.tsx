
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Users, Map, Calendar, Star, Headphones, LogIn, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  const features = [
    {
      icon: BookOpen,
      title: "Personal Bookshelf",
      description: "Track your reading progress, manage your book collection, and read directly on our platform."
    },
    {
      icon: Users,
      title: "Reading Groups",
      description: "Join book-specific discussion groups and connect with readers worldwide."
    },
    {
      icon: Map,
      title: "Reader Map",
      description: "Discover readers near you and find local book communities."
    },
    {
      icon: Calendar,
      title: "Author Connect",
      description: "Schedule live Q&A sessions and conferences with your favorite authors."
    },
    {
      icon: Star,
      title: "Reviews & Ratings",
      description: "Share your thoughts and discover great books through community reviews."
    },
    {
      icon: Headphones,
      title: "AI Reading Assistant",
      description: "Get instant explanations for any word, paragraph, or chapter while reading."
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center mb-8">
            <img 
              src="/lovable-uploads/fff3e49f-a95f-4fcf-ad47-da2dc6626f29.png" 
              alt="Sahadhyayi Logo" 
              className="w-24 h-24" 
            />
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
            Welcome to
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-600"> Sahadhyayi</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-700 mb-8 leading-relaxed">
            Reviving the transformative power of deep reading through community, technology, and shared knowledge.
            Join thousands of readers building a healthier, more focused reading culture.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-3 text-lg">
              <UserPlus className="w-5 h-5 mr-2" />
              Sign Up Free
            </Button>
            <Button variant="outline" size="lg" className="border-amber-600 text-amber-600 hover:bg-amber-50 px-8 py-3 text-lg">
              <LogIn className="w-5 h-5 mr-2" />
              Sign In
            </Button>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 px-4 bg-white/50">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-8">Why Sahadhyayi?</h2>
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="text-left">
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">The Problem</h3>
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                Modern digital consumption habits are shifting away from deep reading toward passive content like videos and podcasts. 
                This change impacts our ability to focus deeply, comprehend complex ideas, and engage in meaningful reflection.
              </p>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Our Solution</h3>
              <p className="text-lg text-gray-700 leading-relaxed">
                Sahadhyayi creates a social reading platform that makes books more accessible, interactive, and community-driven. 
                We combine traditional reading with modern technology to build healthier intellectual habits.
              </p>
            </div>
            <div className="bg-gradient-to-br from-amber-100 to-orange-100 p-8 rounded-2xl">
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Benefits of Deep Reading</h3>
              <ul className="space-y-3 text-gray-700">
                <li>• Improves focus and attention span</li>
                <li>• Enhances critical thinking skills</li>
                <li>• Reduces eye strain from screens</li>
                <li>• Builds empathy and emotional intelligence</li>
                <li>• Promotes mental clarity and reflection</li>
                <li>• Creates lasting knowledge retention</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">Platform Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="bg-white/70 backdrop-blur-sm border-amber-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <CardHeader>
                    <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-amber-600" />
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

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-amber-600 to-orange-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Transform Your Reading Journey?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join Sahadhyayi today and become part of a global community dedicated to deep, meaningful reading.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="px-8 py-3 text-lg">
              <UserPlus className="w-5 h-5 mr-2" />
              Get Started Free
            </Button>
            <Link to="/about">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-amber-600 px-8 py-3 text-lg">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
