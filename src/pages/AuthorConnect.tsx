
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, BookOpen, MessageSquare, Search, Users, Star, Clock } from "lucide-react";
import SEO from "@/components/SEO";
import { Link } from "react-router-dom";

const AuthorConnect = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const authors = [
    {
      id: 1,
      name: "Dr. Rajesh Kumar",
      genre: "Science Fiction",
      books: ["Quantum Dreams", "The Neural Network"],
      rating: 4.8,
      followers: 15000,
      bio: "Award-winning science fiction author with a PhD in Physics. Specializes in hard science fiction that explores the intersection of quantum mechanics and human consciousness.",
      image: "/lovable-uploads/3f0d5de6-4956-4feb-937f-90f70f359001.png",
      availableSlots: ["Dec 15, 2024", "Dec 22, 2024", "Jan 5, 2025"],
      nextSession: "Dec 15, 2024 at 3:00 PM IST"
    },
    {
      id: 2,
      name: "Priya Sharma",
      genre: "Contemporary Fiction",
      books: ["Mumbai Monsoons", "Threads of Tradition"],
      rating: 4.9,
      followers: 22000,
      bio: "Contemporary fiction author focusing on modern Indian experiences. Her works explore themes of identity, family, and cultural transition in urban India.",
      image: "/lovable-uploads/3f0d5de6-4956-4feb-937f-90f70f359001.png",
      availableSlots: ["Dec 18, 2024", "Dec 25, 2024", "Jan 8, 2025"],
      nextSession: "Dec 18, 2024 at 7:00 PM IST"
    },
    {
      id: 3,
      name: "Arjun Mehta",
      genre: "Historical Fiction",
      books: ["The Last Mughal", "Swords of Swaraj"],
      rating: 4.7,
      followers: 18500,
      bio: "Historical fiction specialist with deep knowledge of Indian history. Brings historical events to life through compelling narratives and well-researched storytelling.",
      image: "/lovable-uploads/3f0d5de6-4956-4feb-937f-90f70f359001.png",
      availableSlots: ["Dec 20, 2024", "Jan 3, 2025", "Jan 10, 2025"],
      nextSession: "Dec 20, 2024 at 4:00 PM IST"
    }
  ];

  const filteredAuthors = authors.filter(author =>
    author.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    author.genre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    author.books.some(book => book.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Sahadhyayi Authors",
    "description": "Author profiles and biographies on Sahadhyayi platform",
    "url": "https://sahadhyayi.com/authors",
    "mainEntity": {
      "@type": "ItemList",
      "name": "Author Profiles",
      "description": "Collection of author biographies and profiles",
      "numberOfItems": authors.length,
      "itemListElement": authors.map((author, index) => ({
        "@type": "Person",
        "position": index + 1,
        "name": author.name,
        "description": author.bio,
        "jobTitle": "Author",
        "genre": author.genre,
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": author.rating,
          "bestRating": 5
        }
      }))
    },
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://sahadhyayi.com"
        },
        {
          "@type": "ListItem", 
          "position": 2,
          "name": "Authors",
          "item": "https://sahadhyayi.com/authors"
        }
      ]
    }
  };

  return (
    <>
      <SEO
        title="Meet Authors - Connect with Writers & Creators | Sahadhyayi"
        description="Connect with talented authors on Sahadhyayi. Read biographies, schedule live sessions, and discover books by your favorite writers in our author community."
        canonical="https://sahadhyayi.com/authors"
      />
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg">
                <User className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Connect with Authors - Meet the Minds Behind Great Books
              </h1>
            </div>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto mb-8">
              Connect with talented authors, schedule live Q&A sessions, and discover the stories behind your favorite books. 
              Join our vibrant community of writers and readers.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-500 mb-6">
              <span>👥 50+ Active Authors</span>
              <span>📚 Live Q&A Sessions</span>
              <span>✍️ Writing Workshops</span>
              <span>🎯 Personalized Recommendations</span>
            </div>
          </div>

          {/* Search Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Find Your Favorite Authors</h2>
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search authors, genres, or books..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 bg-white/90 backdrop-blur-sm border-2 border-purple-200 focus:border-purple-400 rounded-xl"
              />
            </div>
          </div>

          {/* Authors Grid */}
          <section aria-labelledby="authors-grid-heading">
            <h2 id="authors-grid-heading" className="text-2xl font-bold text-gray-900 mb-6">Featured Authors</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {filteredAuthors.map((author) => (
                <Card key={author.id} className="bg-white/80 backdrop-blur-sm border-purple-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <CardHeader className="text-center pb-4">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full overflow-hidden border-4 border-purple-200">
                      <img
                        src={author.image}
                        alt={`${author.name} - Author profile picture`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <CardTitle className="text-xl text-gray-900 mb-2">{author.name}</CardTitle>
                    <Badge variant="secondary" className="bg-purple-100 text-purple-800 mb-2">
                      {author.genre}
                    </Badge>
                    <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span>{author.rating}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{author.followers.toLocaleString()}</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-gray-700 text-sm leading-relaxed">{author.bio}</p>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        Featured Books
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {author.books.map((book, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {book}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="bg-purple-50 p-3 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-purple-600" />
                        <span className="font-semibold text-purple-900 text-sm">Next Session</span>
                      </div>
                      <p className="text-sm text-purple-800">{author.nextSession}</p>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        className="flex-1 bg-purple-600 hover:bg-purple-700"
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        Schedule Session
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1 border-purple-300 text-purple-700 hover:bg-purple-50"
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Message
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Benefits Section */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Why Connect with Authors?</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-br from-purple-100 to-pink-100 border-purple-200">
                <CardContent className="p-6 text-center">
                  <MessageSquare className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Direct Interaction</h3>
                  <p className="text-gray-700">Get personal insights from authors about their writing process, inspirations, and upcoming works.</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-purple-100 to-pink-100 border-purple-200">
                <CardContent className="p-6 text-center">
                  <BookOpen className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Exclusive Content</h3>
                  <p className="text-gray-700">Access exclusive previews, behind-the-scenes content, and early releases from your favorite authors.</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-purple-100 to-pink-100 border-purple-200">
                <CardContent className="p-6 text-center">
                  <Users className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Community Events</h3>
                  <p className="text-gray-700">Join book launches, reading sessions, and literary discussions with authors and fellow readers.</p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* CTA Section */}
          <section className="text-center bg-gradient-to-r from-purple-600 to-pink-600 text-white p-8 rounded-2xl">
            <h2 className="text-3xl font-bold mb-4">Ready to Connect with Authors?</h2>
            <p className="text-xl mb-6 opacity-90">
              Join thousands of readers connecting with their favorite authors on Sahadhyayi.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/library">
                <Button size="lg" variant="secondary" className="px-8 py-3 text-lg">
                  <BookOpen className="w-5 h-5 mr-2" />
                  Browse books by these authors
                </Button>
              </Link>
              <Link to="/reviews">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-purple-600 px-8 py-3 text-lg">
                  <Users className="w-5 h-5 mr-2" />
                  Join author discussions
                </Button>
              </Link>
            </div>
          </section>
        </div>
      </div>
    </>
  );
};

export default AuthorConnect;
