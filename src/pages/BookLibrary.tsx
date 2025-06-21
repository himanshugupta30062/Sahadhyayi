import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/ui/search-bar";
import { BookOpen, Plus } from "lucide-react";
import { useBooks, useLibraryBooks } from "@/hooks/useLibrary";
import BookCard from "@/components/books/BookCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useCreateBook } from "@/hooks/useBooks";

const BookLibrary = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showAddBook, setShowAddBook] = useState(false);
  const [newBook, setNewBook] = useState({
    title: '',
    author: '',
    description: '',
    cover_url: ''
  });

  const { data: libraryBooks = [], isLoading } = useLibraryBooks();
  const createBook = useCreateBook();

  const categories = ["All", "Fiction", "Non-Fiction", "Self-Help", "Biography", "Science", "History"];

  const filteredBooks = libraryBooks.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (book.author && book.author.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === "All" || book.genre === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddBook = async () => {
    if (!newBook.title) return;
    
    try {
      await createBook.mutateAsync(newBook);
      setNewBook({ title: '', author: '', description: '', cover_url: '' });
      setShowAddBook(false);
    } catch (error) {
      console.error('Error adding book:', error);
    }
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Book Library</h1>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto mb-8">
            Discover your next great read from our curated collection of books across various genres. 
            Join reading groups and connect with fellow book lovers.
          </p>
          
          <Dialog open={showAddBook} onOpenChange={setShowAddBook}>
            <DialogTrigger asChild>
              <Button className="bg-amber-600 hover:bg-amber-700">
                <Plus className="w-4 h-4 mr-2" />
                Add New Book
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Book to Library</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={newBook.title}
                    onChange={(e) => setNewBook(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Book title"
                  />
                </div>
                <div>
                  <Label htmlFor="author">Author</Label>
                  <Input
                    id="author"
                    value={newBook.author}
                    onChange={(e) => setNewBook(prev => ({ ...prev, author: e.target.value }))}
                    placeholder="Author name"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newBook.description}
                    onChange={(e) => setNewBook(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Book description"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="cover_url">Cover Image URL</Label>
                  <Input
                    id="cover_url"
                    value={newBook.cover_url}
                    onChange={(e) => setNewBook(prev => ({ ...prev, cover_url: e.target.value }))}
                    placeholder="https://example.com/cover.jpg"
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleAddBook}
                    disabled={createBook.isPending || !newBook.title}
                    className="bg-amber-600 hover:bg-amber-700"
                  >
                    {createBook.isPending ? 'Adding...' : 'Add Book'}
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddBook(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="max-w-2xl mx-auto">
            <SearchBar
              value={searchTerm}
              onValueChange={setSearchTerm}
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

        {/* Loading State */}
        {isLoading && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="bg-gray-200 h-64 rounded-lg"></div>
              </div>
            ))}
          </div>
        )}

        {/* Books Grid */}
        {!isLoading && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBooks.map((book) => (
              <BookCard
                key={book.id}
                book={{
                  id: book.id,
                  title: book.title,
                  author: book.author,
                  description: null,
                  cover_url: book.cover_image_url,
                  created_at: book.created_at || ''
                }}
              />
            ))}
          </div>
        )}

        {!isLoading && filteredBooks.length === 0 && (
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