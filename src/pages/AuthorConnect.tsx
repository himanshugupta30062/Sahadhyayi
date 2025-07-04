
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Calendar,
  User,
  BookOpen,
  MessageSquare,
  Search,
  Users,
  Star,
  Clock,
  SortAsc,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SEO from "@/components/SEO";
import { Link } from "react-router-dom";

const AuthorConnect = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("rating");

  const authors = [
    {
      id: 1,
      name: "Dr. Rajesh Kumar",
      genre: "Science Fiction",
      books: ["Quantum Dreams", "The Neural Network"],
      rating: 4.8,
      followers: 15000,
      bio: "Award-winning science fiction author with a PhD in Physics. Specializes in hard science fiction that explores the intersection of quantum mechanics and human consciousness.",
      image: "", // Empty to trigger fallback
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
      image: "", // Empty to trigger fallback
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
      image: "", // Empty to trigger fallback
      availableSlots: ["Dec 20, 2024", "Jan 3, 2025", "Jan 10, 2025"],
      nextSession: "Dec 20, 2024 at 4:00 PM IST"
    }
  ];

  const filteredAuthors = authors.filter(author =>
    author.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    author.genre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    author.books.some(book => book.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const sortedAuthors = [...filteredAuthors].sort((a, b) => {
    if (sortOption === "name") {
      return a.name.localeCompare(b.name);
    }
    if (sortOption === "followers") {
      return b.followers - a.followers;
    }
    return b.rating - a.rating;
  });

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
        url="https://sahadhyayi.com/authors"
      />
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
      
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
        {/* Hero Header Section */}
        <div className="bg-gradient-to-r from-orange-600 to-amber-600 text-white">
          <div className="max-w-6xl mx-auto px-4 py-20">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-4 mb-8">
                <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg">
                  <User className="w-12 h-12 text-white" />
                </div>
                <div>
                  <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-3 tracking-tight">
                    Connect with Authors
                  </h1>
                  <p className="text-2xl text-orange-100 font-medium">
                    Meet the Minds Behind Great Books
                  </p>
                </div>
              </div>
              
              <p className="text-xl text-orange-100 max-w-4xl mx-auto mb-10 leading-relaxed">
                Connect with talented authors, schedule live Q&A sessions, and discover the stories behind your favorite books. 
                Join our vibrant community of writers and readers.
              </p>
              
              <div className="flex flex-wrap items-center justify-center gap-8 text-lg text-orange-100 mb-10">
                <div className="flex items-center gap-3">
                  <Users className="w-6 h-6" />
                  <span className="font-medium">50+ Active Authors</span>
                </div>
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-6 h-6" />
                  <span className="font-medium">Live Q&A Sessions</span>
                </div>
                <div className="flex items-center gap-3">
                  <BookOpen className="w-6 h-6" />
                  <span className="font-medium">Writing Workshops</span>
                </div>
                <div className="flex items-center gap-3">
                  <Star className="w-6 h-6" />
                  <span className="font-medium">Personalized Recommendations</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-16">
          {/* Search Section */}
          <section className="mb-16">
            <div className="text-center mb-10">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Find Your Favorite Authors</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Search through our community of talented writers and discover new voices in literature
              </p>
            </div>
            
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6" />
              <Input
                type="text"
                placeholder="Search authors, genres, or books..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-14 h-16 text-lg bg-white border-2 border-orange-200 focus:border-orange-400 rounded-2xl shadow-lg"
              />
            </div>
            <div className="mt-6 flex justify-center">
              <div className="flex items-center gap-2">
                <SortAsc className="w-5 h-5 text-gray-400" />
                <Select value={sortOption} onValueChange={setSortOption}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                    <SelectItem value="followers">Most Followers</SelectItem>
                    <SelectItem value="name">Name A-Z</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          {/* Authors Grid Section */}
          <section aria-labelledby="authors-grid-heading" className="mb-20">
            <div className="text-center mb-12">
              <h2 id="authors-grid-heading" className="text-4xl font-bold text-gray-900 mb-6">Featured Authors</h2>
              <p className="text-xl text-gray-600">Meet the talented writers in our community</p>
              <p className="text-sm text-gray-500 mt-2">{sortedAuthors.length} author{sortedAuthors.length !== 1 && 's'} found</p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
              {sortedAuthors.map((author) => (
                <Card key={author.id} className="group bg-white/95 backdrop-blur-sm border-orange-200 hover:shadow-2xl transition-all duration-300 hover:-translate-y-3 hover:border-orange-300 rounded-2xl overflow-hidden">
                  <CardHeader className="text-center pb-6">
                    <Avatar className="w-28 h-28 mx-auto mb-6 ring-4 ring-orange-200 group-hover:ring-orange-400 transition-all">
                      <AvatarImage src={author.image} alt={`${author.name} profile`} />
                      <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-orange-500 to-amber-500 text-white">
                        {author.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <CardTitle className="text-2xl text-gray-900 mb-3">{author.name}</CardTitle>
                    <Badge variant="secondary" className="bg-orange-100 text-orange-800 mb-4 px-4 py-2 text-sm font-medium">
                      {author.genre}
                    </Badge>
                    <div className="flex items-center justify-center gap-8 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold text-lg">{author.rating}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        <span className="font-semibold text-lg">{author.followers.toLocaleString()}</span>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-6 px-6 pb-6">
                    <p className="text-gray-700 leading-relaxed line-clamp-4">{author.bio}</p>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-orange-600" />
                        Featured Books
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {author.books.map((book, index) => (
                          <Badge key={index} variant="outline" className="text-sm border-orange-200 text-orange-700 hover:bg-orange-50">
                            {book}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-5 rounded-xl border border-orange-100">
                      <div className="flex items-center gap-2 mb-3">
                        <Clock className="w-5 h-5 text-orange-600" />
                        <span className="font-semibold text-orange-900">Next Available Session</span>
                      </div>
                      <p className="text-orange-800 font-medium">{author.nextSession}</p>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button 
                        size="lg" 
                        className="flex-1 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white shadow-lg hover:shadow-xl transition-all"
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        Schedule Session
                      </Button>
                      <Button 
                        size="lg" 
                        variant="outline" 
                        className="flex-1 border-2 border-orange-300 text-orange-700 hover:bg-orange-50 hover:border-orange-400 transition-all"
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
          <section className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Why Connect with Authors?</h2>
              <p className="text-xl text-gray-600 max-w-4xl mx-auto">
                Discover the unique benefits of engaging directly with the creative minds behind your favorite books
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-10">
              <Card className="bg-gradient-to-br from-orange-100 to-amber-100 border-orange-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                <CardContent className="p-10 text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-8">
                    <MessageSquare className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-6">Direct Interaction</h3>
                  <p className="text-gray-700 leading-relaxed text-lg">Get personal insights from authors about their writing process, inspirations, and upcoming works through live sessions.</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-orange-100 to-amber-100 border-orange-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                <CardContent className="p-10 text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-8">
                    <BookOpen className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-6">Exclusive Content</h3>
                  <p className="text-gray-700 leading-relaxed text-lg">Access exclusive previews, behind-the-scenes content, and early releases from your favorite authors before anyone else.</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-orange-100 to-amber-100 border-orange-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                <CardContent className="p-10 text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-8">
                    <Users className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-6">Community Events</h3>
                  <p className="text-gray-700 leading-relaxed text-lg">Join book launches, reading sessions, and literary discussions with authors and fellow readers in our community.</p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* CTA Section */}
          <section className="text-center">
            <Card className="bg-gradient-to-r from-orange-600 to-amber-600 text-white border-0 shadow-2xl rounded-3xl overflow-hidden">
              <CardContent className="p-16">
                <h2 className="text-5xl font-bold mb-8">Ready to Connect with Authors?</h2>
                <p className="text-2xl mb-10 opacity-95 max-w-3xl mx-auto leading-relaxed">
                  Join thousands of readers connecting with their favorite authors on Sahadhyayi and discover new literary adventures.
                </p>
                <div className="flex flex-col sm:flex-row gap-6 justify-center">
                  <Link to="/library">
                    <Button size="lg" variant="secondary" className="px-10 py-5 text-xl font-semibold hover:shadow-lg transition-all rounded-xl">
                      <BookOpen className="w-6 h-6 mr-3" />
                      Browse books by these authors
                    </Button>
                  </Link>
                  <Link to="/reviews">
                    <Button size="lg" variant="outline" className="border-3 border-white text-white hover:bg-white hover:text-orange-600 px-10 py-5 text-xl font-semibold transition-all rounded-xl">
                      <Users className="w-6 h-6 mr-3" />
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
