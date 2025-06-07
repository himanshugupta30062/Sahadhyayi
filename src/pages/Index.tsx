
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Users, Map, Calendar, Star, Headphones } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  const features = [
    {
      icon: BookOpen,
      title: "Discover Books",
      description: "Explore curated collections and discover your next great read with personalized recommendations."
    },
    {
      icon: Users,
      title: "Join Reading Groups",
      description: "Connect with fellow readers worldwide and engage in meaningful discussions about the books you love."
    },
    {
      icon: Map,
      title: "Find Local Community",
      description: "Discover nearby bookstores and readers in your area using our interactive community map."
    },
    {
      icon: Calendar,
      title: "Author Sessions",
      description: "Schedule live Q&A sessions and conferences with your favorite authors and literary experts."
    },
    {
      icon: Star,
      title: "Reviews & Ratings",
      description: "Share your thoughts and read authentic reviews from our global community of readers."
    },
    {
      icon: Headphones,
      title: "Audio Content",
      description: "Access podcasts, audiobooks, and author interviews to enhance your reading experience."
    }
  ];

  const stats = [
    { number: "50K+", label: "Active Readers" },
    { number: "10K+", label: "Books Available" },
    { number: "500+", label: "Reading Groups" },
    { number: "100+", label: "Author Sessions" }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
            Reviving the
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-600"> Art of Reading</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-700 mb-8 leading-relaxed">
            Join a global community dedicated to bringing back the transformative power of books. 
            Connect, discuss, and grow through the timeless practice of deep reading.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/library">
              <Button size="lg" className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-3 text-lg">
                Explore Library
              </Button>
            </Link>
            <Link to="/groups">
              <Button variant="outline" size="lg" className="border-amber-600 text-amber-600 hover:bg-amber-50 px-8 py-3 text-lg">
                Join Groups
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 px-4 bg-white/50">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-8">Our Mission</h2>
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="text-left">
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                In an era dominated by short-form content and digital distractions, we're witnessing the decline of deep reading habits. 
                This shift towards consuming bite-sized information is impacting our ability to focus, comprehend complex ideas, and engage in meaningful reflection.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                ReadTogether is more than just a platform—it's a movement to restore the transformative power of books. 
                We believe that reading strengthens focus, enhances comprehension, and promotes mental clarity that's essential for personal and intellectual growth.
              </p>
            </div>
            <div className="bg-gradient-to-br from-amber-100 to-orange-100 p-8 rounded-2xl">
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Why Reading Matters</h3>
              <ul className="space-y-3 text-gray-700">
                <li>• Strengthens focus and attention span</li>
                <li>• Improves comprehension and critical thinking</li>
                <li>• Promotes mental clarity and reflection</li>
                <li>• Builds empathy and emotional intelligence</li>
                <li>• Reduces screen time and digital fatigue</li>
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

      {/* Stats Section */}
      <section className="py-16 px-4 bg-white/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-12">Growing Community</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-amber-600 mb-2">{stat.number}</div>
                <div className="text-gray-700 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Future Vision Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-8">Future Vision</h2>
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="bg-gradient-to-br from-orange-100 to-red-100 p-8 rounded-2xl">
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Physical Reading Centers</h3>
              <p className="text-gray-700 leading-relaxed">
                We envision establishing physical reading centers in major cities worldwide, where community members can meet, 
                discuss books face-to-face, and participate in literary events. These spaces will bridge the gap between digital connection and real-world community.
              </p>
            </div>
            <div className="text-left">
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Global Impact</h3>
              <p className="text-lg text-gray-700 leading-relaxed mb-4">
                Our platform aims to create a cultural shift towards mindful reading, especially in India and other markets where digital consumption is rapidly replacing traditional reading habits.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                By fostering both online and offline reading communities, we're building a sustainable ecosystem that promotes intellectual growth, cultural preservation, and meaningful human connection.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-amber-600 to-orange-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Transform Your Reading Journey?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of readers who are rediscovering the joy and power of books through our community-driven platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/library">
              <Button size="lg" variant="secondary" className="px-8 py-3 text-lg">
                Start Reading Today
              </Button>
            </Link>
            <Link to="/investors">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-amber-600 px-8 py-3 text-lg">
                Investment Opportunities
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
