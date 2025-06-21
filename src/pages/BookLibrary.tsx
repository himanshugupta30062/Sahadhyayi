
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SearchBar } from "@/components/ui/search-bar";
import { BookOpen } from "lucide-react";

const sampleBooks = [
  {
    id: 1,
    title: "Atomic Habits",
    author: "James Clear",
    category: "Self Help",
    cover_url: "https://m.media-amazon.com/images/I/91bYsX41DVL.jpg"
  },
  {
    id: 2,
    title: "Sapiens",
    author: "Yuval Noah Harari",
    category: "History",
    cover_url: "https://m.media-amazon.com/images/I/713jIoMO3UL.jpg"
  },
  {
    id: 3,
    title: "The Intelligent Investor",
    author: "Benjamin Graham",
    category: "Finance",
    cover_url: ""
  },
  {
    id: 4,
    title: "The Alchemist",
    author: "Paulo Coelho",
    category: "Fiction",
    cover_url: ""
  },
  {
    id: 5,
    title: "Man’s Search for Meaning",
    author: "Viktor Frankl",
    category: "Memoir",
    cover_url: ""
  },
  {
    id: 6,
    title: "Thinking, Fast and Slow",
    author: "Daniel Kahneman",
    category: "Psychology",
    cover_url: ""
  },
  {
    id: 7,
    title: "Rich Dad Poor Dad",
    author: "Robert Kiyosaki",
    category: "Finance",
    cover_url: ""
  },
  {
    id: 8,
    title: "1984",
    author: "George Orwell",
    category: "Fiction",
    cover_url: ""
  }
];

const BookLibrary = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const books = sampleBooks;

  const categories = ["All", ...Array.from(new Set(books.map((b) => b.category)))] as string[];
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
            <SearchBar
              value={searchTerm}
              onValueChange={(v) => setSearchTerm(v)}
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
            <Card
              key={book.id}
              className="bg-white/70 backdrop-blur-sm border-amber-200 overflow-hidden hover:shadow-lg transition-all"
            >
              {book.cover_url ? (
                <img
                  src={book.cover_url}
                  alt={book.title}
                  className="w-full h-56 object-cover"
                />
              ) : (
                <div className="w-full h-56 bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                  <BookOpen className="w-16 h-16 text-amber-600" />
                </div>
              )}
              <CardContent className="space-y-1">
                <h3 className="font-bold text-lg text-gray-900">{book.title}</h3>
                <p className="text-sm text-gray-500">{book.author}</p>
                <span className="inline-block mt-2 bg-amber-100 text-amber-800 rounded-full text-xs px-2 py-1">
                  {book.category}
                </span>
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
