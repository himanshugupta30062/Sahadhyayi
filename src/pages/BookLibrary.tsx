
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BookOpen, Star, Users, Headphones } from "lucide-react";

const BookLibrary = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const books = [
    {
      id: 1,
      title: "The Midnight Library",
      author: "Matt Haig",
      rating: 4.8,
      price: "$12.99",
      category: "Fiction",
      readers: 1250,
      image: "/placeholder.svg",
      summary: "A magical story about infinite possibilities and the art of living.",
      hasAudio: true
    },
    {
      id: 2,
      title: "Atomic Habits",
      author: "James Clear",
      rating: 4.9,
      price: "$14.99",
      category: "Self-Help",
      readers: 2100,
      image: "/placeholder.svg",
      summary: "Transform your life through the power of small, consistent changes.",
      hasAudio: true
    },
    {
      id: 3,
      title: "Sapiens",
      author: "Yuval Noah Harari",
      rating: 4.7,
      price: "$16.99",
      category: "History",
      readers: 1800,
      image: "/placeholder.svg",
      summary: "A brief history of humankind and our journey to dominance.",
      hasAudio: false
    },
    {
      id: 4,
      title: "The Psychology of Money",
      author: "Morgan Housel",
      rating: 4.6,
      price: "$13.99",
      category: "Finance",
      readers: 950,
      image: "/placeholder.svg",
      summary: "Timeless lessons on wealth, greed, and happiness.",
      hasAudio: true
    },
    {
      id: 5,
      title: "Educated",
      author: "Tara Westover",
      rating: 4.8,
      price: "$15.99",
      category: "Memoir",
      readers: 1650,
      image: "/placeholder.svg",
      summary: "A powerful memoir about education, family, and the struggle for self-invention.",
      hasAudio: false
    },
    {
      id: 6,
      title: "Think Again",
      author: "Adam Grant",
      rating: 4.5,
      price: "$14.99",
      category: "Psychology",
      readers: 1100,
      image: "/placeholder.svg",
      summary: "The power of knowing what you don't know.",
      hasAudio: true
    }
  ];

  const categories = ["All", "Fiction", "Self-Help", "History", "Finance", "Memoir", "Psychology"];
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         book.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "All" || book.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Book Library</h1>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto">
            Discover your next great read from our curated collection of books across various genres. 
            Join reading groups and connect with fellow book lovers.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="max-w-2xl mx-auto">
            <Input
              type="text"
              placeholder="Search books or authors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                onClick={() => setSelectedCategory(category)}
                className={selectedCategory === category ? "bg-amber-600 hover:bg-amber-700" : ""}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Books Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBooks.map((book) => (
            <Card key={book.id} className="bg-white/70 backdrop-blur-sm border-amber-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="aspect-[3/4] bg-gradient-to-br from-amber-100 to-orange-100 rounded-lg mb-4 flex items-center justify-center">
                  <BookOpen className="w-16 h-16 text-amber-600" />
                </div>
                <CardTitle className="text-xl text-gray-900">{book.title}</CardTitle>
                <p className="text-gray-600">by {book.author}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 text-sm">{book.summary}</p>
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span className="font-medium">{book.rating}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>{book.readers} readers</span>
                  </div>
                  {book.hasAudio && (
                    <div className="flex items-center space-x-1 text-amber-600">
                      <Headphones className="w-4 h-4" />
                      <span>Audio</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-amber-600">{book.price}</span>
                  <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">
                    {book.category}
                  </span>
                </div>

                <div className="space-y-2">
                  <Button className="w-full bg-amber-600 hover:bg-amber-700">
                    Purchase Book
                  </Button>
                  <Button variant="outline" className="w-full border-amber-600 text-amber-600 hover:bg-amber-50">
                    Join Reading Group
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredBooks.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-600 mb-2">No books found</h3>
            <p className="text-gray-500">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookLibrary;
