
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  User,
  BookOpen,
  MessageSquare,
  Users,
  Star,
} from "lucide-react";
import SEO from "@/components/SEO";
import { Link } from "react-router-dom";
import AuthorSearch from "@/components/authors/AuthorSearch";
import AuthorGrid from "@/components/authors/AuthorGrid";
import { useIsMobile } from "@/hooks/use-mobile";

const AuthorConnect = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("rating");
  const isMobile = useIsMobile();

  const authors = [
    {
      id: 1,
      name: "Dr. Rajesh Kumar",
      genre: "Science Fiction",
      books: ["Quantum Dreams", "The Neural Network"],
      rating: 4.8,
      followers: 15000,
      bio: "Award-winning science fiction author with a PhD in Physics. Specializes in hard science fiction that explores the intersection of quantum mechanics and human consciousness.",
      image: "",
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
      image: "",
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
      image: "",
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
        {/* Improved Hero Header Section */}
        <div className="bg-gradient-to-r from-orange-600 to-amber-600 text-white">
          <div className={`max-w-6xl mx-auto px-4 ${isMobile ? 'py-12' : 'py-16'}`}>
            <div className="text-center">
              <div className={`flex ${isMobile ? 'flex-col' : 'flex-col sm:flex-row'} items-center justify-center space-y-4 ${!isMobile && 'sm:space-y-0 sm:space-x-4'} mb-6`}>
                <div className={`p-4 bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg ${isMobile ? 'mb-4' : ''}`}>
                  <User className={`${isMobile ? 'w-8 h-8' : 'w-12 h-12'} text-white`} />
                </div>
                <div>
                  <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl sm:text-4xl lg:text-5xl'} font-bold mb-2 tracking-tight`}>
                    Meet Our Authors
                  </h1>
                  <p className={`${isMobile ? 'text-base' : 'text-lg sm:text-xl'} text-orange-100 font-medium`}>
                    Connect with the Minds Behind Great Books
                  </p>
                </div>
              </div>
              
              <p className={`${isMobile ? 'text-sm' : 'text-base sm:text-lg'} text-orange-100 max-w-3xl mx-auto mb-8 leading-relaxed`}>
                Schedule live Q&A sessions and discover the stories behind your favorite books.
              </p>
              
              {/* Mobile: 2x2 grid, Desktop: 4 columns */}
              <div className={`grid ${isMobile ? 'grid-cols-2 gap-3' : 'grid-cols-2 md:grid-cols-4 gap-4'} ${isMobile ? 'text-sm' : 'text-sm sm:text-base'} text-orange-100 mb-8 max-w-4xl mx-auto`}>
                <div className={`flex flex-col items-center gap-2 ${isMobile ? 'p-3' : 'p-4'} bg-white/10 rounded-lg`}>
                  <Users className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'}`} />
                  <span className="font-medium">50+ Authors</span>
                </div>
                <div className={`flex flex-col items-center gap-2 ${isMobile ? 'p-3' : 'p-4'} bg-white/10 rounded-lg`}>
                  <MessageSquare className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'}`} />
                  <span className="font-medium">Live Q&As</span>
                </div>
                <div className={`flex flex-col items-center gap-2 ${isMobile ? 'p-3' : 'p-4'} bg-white/10 rounded-lg`}>
                  <BookOpen className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'}`} />
                  <span className="font-medium">Workshops</span>
                </div>
                <div className={`flex flex-col items-center gap-2 ${isMobile ? 'p-3' : 'p-4'} bg-white/10 rounded-lg`}>
                  <Star className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'}`} />
                  <span className="font-medium">Recommendations</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={`max-w-6xl mx-auto px-4 ${isMobile ? 'py-8' : 'py-12'}`}>
          {/* Fixed Search and Filter positioning */}
          <div className="mb-8 bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-orange-200">
            <AuthorSearch
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              sortOption={sortOption}
              setSortOption={setSortOption}
            />
          </div>

          <AuthorGrid authors={sortedAuthors} />

          {/* Benefits Section */}
          <section className={`${isMobile ? 'mb-12' : 'mb-20'}`}>
            <div className="text-center mb-12">
              <h2 className={`${isMobile ? 'text-2xl' : 'text-4xl'} font-bold text-gray-900 mb-6`}>Why Connect with Authors?</h2>
              <p className={`${isMobile ? 'text-lg' : 'text-xl'} text-gray-600 max-w-4xl mx-auto`}>
                Discover the unique benefits of engaging directly with the creative minds behind your favorite books
              </p>
            </div>
            
            <div className={`grid ${isMobile ? 'gap-6' : 'md:grid-cols-3 gap-10'}`}>
              <Card className="bg-gradient-to-br from-orange-100 to-amber-100 border-orange-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                <CardContent className={`${isMobile ? 'p-6' : 'p-10'} text-center`}>
                  <div className={`${isMobile ? 'w-16 h-16' : 'w-20 h-20'} bg-gradient-to-br from-orange-500 to-amber-600 rounded-full flex items-center justify-center mx-auto ${isMobile ? 'mb-4' : 'mb-8'}`}>
                    <MessageSquare className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} text-white`} />
                  </div>
                  <h3 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-semibold text-gray-900 ${isMobile ? 'mb-3' : 'mb-6'}`}>Direct Interaction</h3>
                  <p className={`text-gray-700 leading-relaxed ${isMobile ? 'text-base' : 'text-lg'}`}>Get personal insights from authors about their writing process, inspirations, and upcoming works through live sessions.</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-orange-100 to-amber-100 border-orange-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                <CardContent className={`${isMobile ? 'p-6' : 'p-10'} text-center`}>
                  <div className={`${isMobile ? 'w-16 h-16' : 'w-20 h-20'} bg-gradient-to-br from-orange-500 to-amber-600 rounded-full flex items-center justify-center mx-auto ${isMobile ? 'mb-4' : 'mb-8'}`}>
                    <BookOpen className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} text-white`} />
                  </div>
                  <h3 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-semibold text-gray-900 ${isMobile ? 'mb-3' : 'mb-6'}`}>Exclusive Content</h3>
                  <p className={`text-gray-700 leading-relaxed ${isMobile ? 'text-base' : 'text-lg'}`}>Access exclusive previews, behind-the-scenes content, and early releases from your favorite authors before anyone else.</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-orange-100 to-amber-100 border-orange-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                <CardContent className={`${isMobile ? 'p-6' : 'p-10'} text-center`}>
                  <div className={`${isMobile ? 'w-16 h-16' : 'w-20 h-20'} bg-gradient-to-br from-orange-500 to-amber-600 rounded-full flex items-center justify-center mx-auto ${isMobile ? 'mb-4' : 'mb-8'}`}>
                    <Users className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} text-white`} />
                  </div>
                  <h3 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-semibold text-gray-900 ${isMobile ? 'mb-3' : 'mb-6'}`}>Community Events</h3>
                  <p className={`text-gray-700 leading-relaxed ${isMobile ? 'text-base' : 'text-lg'}`}>Join book launches, reading sessions, and literary discussions with authors and fellow readers in our community.</p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* CTA Section */}
          <section className="text-center">
            <Card className="bg-gradient-to-r from-orange-600 to-amber-600 text-white border-0 shadow-2xl rounded-3xl overflow-hidden">
              <CardContent className={`${isMobile ? 'p-8' : 'p-16'}`}>
                <h2 className={`${isMobile ? 'text-2xl' : 'text-3xl sm:text-4xl lg:text-5xl'} font-bold ${isMobile ? 'mb-4' : 'mb-8'}`}>Ready to Connect with Authors?</h2>
                <p className={`${isMobile ? 'text-base mb-6' : 'text-lg sm:text-xl lg:text-2xl mb-10'} opacity-95 max-w-3xl mx-auto leading-relaxed`}>
                  Join thousands of readers connecting with their favorite authors on Sahadhyayi and discover new literary adventures.
                </p>
                <div className={`flex ${isMobile ? 'flex-col' : 'flex-col sm:flex-row'} gap-6 justify-center`}>
                  <Link to="/library">
                    <Button size="lg" variant="secondary" className={`${isMobile ? 'px-6 py-4 text-base w-full' : 'px-10 py-5 text-lg sm:text-xl'} font-semibold hover:shadow-lg transition-all rounded-xl ${!isMobile && 'w-full sm:w-auto'}`}>
                      <BookOpen className="w-6 h-6 mr-3" />
                      Browse books by these authors
                    </Button>
                  </Link>
                  <Link to="/reviews">
                    <Button size="lg" variant="outline" className={`border-3 border-white text-white hover:bg-white hover:text-orange-600 ${isMobile ? 'px-6 py-4 text-base w-full' : 'px-10 py-5 text-lg sm:text-xl'} font-semibold transition-all rounded-xl ${!isMobile && 'w-full sm:w-auto'}`}>
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
