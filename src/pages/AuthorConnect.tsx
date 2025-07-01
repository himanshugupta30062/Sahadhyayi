
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
      
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
        {/* Hero Header Section */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
          <div className="max-w-6xl mx-auto px-4 py-16">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-3 mb-6">
                <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg">
                  <User className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-2">
                    Connect with Authors
                  </h1>
                  <p className="text-xl text-purple-100 font-medium">
                    Meet the Minds Behind Great Books
                  </p>
                </div>
              </div>
              
              <p className="text-xl text-purple-100 max-w-4xl mx-auto mb-8 leading-relaxed">
                Connect with talented authors, schedule live Q&A sessions, and discover the stories behind your favorite books. 
                Join our vibrant community of writers and readers.
              </p>
              
              <div className="flex flex-wrap items-center justify-center gap-6 text-lg text-purple-100 mb-8">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  <span>50+ Active Authors</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  <span>Live Q&A Sessions</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  <span>Writing Workshops</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  <span>Personalized Recommendations</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-12">
          {/* Search Section */}
          <section className="mb-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Find Your Favorite Authors</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Search through our community of talented writers and discover new voices in literature
              </p>
            </div>
            
            <div className="relative max-w-lg mx-auto">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search authors, genres, or books..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-14 text-lg bg-white border-2 border-purple-200 focus:border-purple-400 rounded-xl shadow-sm"
              />
            </div>
          </section>

          {/* Authors Grid Section */}
          <section aria-labelledby="authors-grid-heading" className="mb-16">
            <div className="text-center mb-10">
              <h2 id="authors-grid-heading" className="text-3xl font-bold text-gray-900 mb-4">Featured Authors</h2>
              <p className="text-lg text-gray-600">Meet the talented writers in our community</p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredAuthors.map((author) => (
                <Card key={author.id} className="group bg-white/90 backdrop-blur-sm border-purple-200 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 hover:border-purple-300">
                  <CardHeader className="text-center pb-4">
                    <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden border-4 border-purple-200 group-hover:border-purple-400 transition-colors">
                      <img
                        src={author.image}
                        alt={`${author.name} - Author profile picture`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <CardTitle className="text-xl text-gray-900 mb-2">{author.name}</CardTitle>
                    <Badge variant="secondary" className="bg-purple-100 text-purple-800 mb-3 px-3 py-1">
                      {author.genre}
                    </Badge>
                    <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{author.rating}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span className="font-medium">{author.followers.toLocaleString()}</span>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-5">
                    <p className="text-gray-700 text-sm leading-relaxed line-clamp-4">{author.bio}</p>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-purple-600" />
                        Featured Books
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {author.books.map((book, index) => (
                          <Badge key={index} variant="outline" className="text-xs border-purple-200 text-purple-700">
                            {book}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-100">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-purple-600" />
                        <span className="font-semibold text-purple-900 text-sm">Next Available Session</span>
                      </div>
                      <p className="text-sm text-purple-800 font-medium">{author.nextSession}</p>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button 
                        size="sm" 
                        className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-md"
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        Schedule Session
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1 border-purple-300 text-purple-700 hover:bg-purple-50 hover:border-purple-400"
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
          <section className="mb-16">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Connect with Authors?</h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Discover the unique benefits of engaging directly with the creative minds behind your favorite books
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="bg-gradient-to-br from-purple-100 to-pink-100 border-purple-200 hover:shadow-lg transition-all duration-300">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <MessageSquare className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Direct Interaction</h3>
                  <p className="text-gray-700 leading-relaxed">Get personal insights from authors about their writing process, inspirations, and upcoming works through live sessions.</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-purple-100 to-pink-100 border-purple-200 hover:shadow-lg transition-all duration-300">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <BookOpen className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Exclusive Content</h3>
                  <p className="text-gray-700 leading-relaxed">Access exclusive previews, behind-the-scenes content, and early releases from your favorite authors before anyone else.</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-purple-100 to-pink-100 border-purple-200 hover:shadow-lg transition-all duration-300">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Community Events</h3>
                  <p className="text-gray-700 leading-relaxed">Join book launches, reading sessions, and literary discussions with authors and fellow readers in our community.</p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* CTA Section */}
          <section className="text-center">
            <Card className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 shadow-2xl">
              <CardContent className="p-12">
                <h2 className="text-4xl font-bold mb-6">Ready to Connect with Authors?</h2>
                <p className="text-xl mb-8 opacity-95 max-w-2xl mx-auto leading-relaxed">
                  Join thousands of readers connecting with their favorite authors on Sahadhyayi and discover new literary adventures.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link to="/library">
                    <Button size="lg" variant="secondary" className="px-8 py-4 text-lg font-semibold hover:shadow-lg transition-all">
                      <BookOpen className="w-5 h-5 mr-2" />
                      Browse books by these authors
                    </Button>
                  </Link>
                  <Link to="/reviews">
                    <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-purple-600 px-8 py-4 text-lg font-semibold transition-all">
                      <Users className="w-5 h-5 mr-2" />
                      Join author discussions
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </>
  );
};

export default AuthorConnect;
