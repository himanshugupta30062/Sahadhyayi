
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, BookOpen } from "lucide-react";

interface Book {
  id: number;
  title: string;
  author: string;
  genre: string;
  pages: number;
  summary: string;
  rating: number;
}

const availableBooks: Book[] = [
  {
    id: 5,
    title: "The Alchemist",
    author: "Paulo Coelho",
    genre: "Fiction",
    pages: 163,
    summary: "A young shepherd's journey to find treasure teaches him about following his dreams.",
    rating: 4.2
  },
  {
    id: 6,
    title: "Educated",
    author: "Tara Westover",
    genre: "Memoir",
    pages: 334,
    summary: "A memoir about education, family, and the struggle between staying loyal to family and pursuing knowledge.",
    rating: 4.5
  },
  {
    id: 7,
    title: "1984",
    author: "George Orwell",
    genre: "Dystopian",
    pages: 328,
    summary: "A dystopian novel about totalitarian control and the power of independent thought.",
    rating: 4.4
  },
  {
    id: 8,
    title: "The Power of Now",
    author: "Eckhart Tolle",
    genre: "Self-Help",
    pages: 236,
    summary: "A guide to spiritual enlightenment through living in the present moment.",
    rating: 4.1
  },
  {
    id: 9,
    title: "Becoming",
    author: "Michelle Obama",
    genre: "Memoir",
    pages: 448,
    summary: "Former First Lady Michelle Obama's memoir of her life, from childhood to the White House.",
    rating: 4.6
  },
  {
    id: 10,
    title: "The 7 Habits of Highly Effective People",
    author: "Stephen Covey",
    genre: "Self-Help",
    pages: 381,
    summary: "A business and self-help book that presents a principle-centered approach for solving personal and professional problems.",
    rating: 4.3
  }
];

interface AddBookDialogProps {
  onAddBook: (book: Book) => void;
}

const AddBookDialog = ({ onAddBook }: AddBookDialogProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const filteredBooks = availableBooks.filter(book =>
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.genre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddBook = (book: Book) => {
    onAddBook(book);
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-amber-600 hover:bg-amber-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Book
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">Add Book to Your Shelf</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search books by title, author, or genre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Books Grid */}
          <div className="grid md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto">
            {filteredBooks.map((book) => (
              <Card key={book.id} className="bg-white/70 backdrop-blur-sm border-amber-200 hover:shadow-lg transition-all duration-300">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg text-gray-900 mb-1">{book.title}</CardTitle>
                      <p className="text-gray-600 text-sm">by {book.author}</p>
                    </div>
                    <Badge variant="outline" className="ml-2">
                      {book.genre}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  <p className="text-sm text-gray-700 line-clamp-2">{book.summary}</p>
                  
                  <div className="flex justify-between items-center text-sm text-gray-600">
                    <span className="flex items-center">
                      <BookOpen className="w-4 h-4 mr-1" />
                      {book.pages} pages
                    </span>
                    <span className="font-medium">★ {book.rating}</span>
                  </div>
                  
                  <Button 
                    onClick={() => handleAddBook(book)}
                    className="w-full bg-amber-600 hover:bg-amber-700"
                    size="sm"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add to Shelf
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredBooks.length === 0 && (
            <div className="text-center py-8">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No books found matching your search.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddBookDialog;
