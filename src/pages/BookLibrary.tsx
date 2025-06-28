import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/ui/search-bar";
import { BookOpen, Plus, Users, MessageCircle, MapPin, Star, Heart, Share2 } from "lucide-react";
import { useLibraryBooks } from "@/hooks/useLibrary";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useCreateBook } from "@/hooks/useBooks";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import SocialBookCard from "@/components/library/SocialBookCard";
import ReadingCirclePanel from "@/components/library/ReadingCirclePanel";
import SocialSyncPanel from "@/components/library/SocialSyncPanel";

const BookLibrary = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showAddBook, setShowAddBook] = useState(false);
  const [showSocialSync, setShowSocialSync] = useState(false);
  const [newBook, setNewBook] = useState({
    title: '',
    author: '',
    description: '',
    cover_url: ''
  });

  const { data: libraryBooks = [], isLoading } = useLibraryBooks();
  const createBook = useCreateBook();

  const categories = ["All", "Fiction", "Non-Fiction", "Self-Help", "Biography", "Science", "History"];

  // Mock data for social features
  const mockSocialBooks = [
    {
      id: '1',
      title: 'The Midnight Library',
      author: 'Matt Haig',
      cover_url: '/placeholder.svg',
      rating: 4.5,
      readingFriends: [
        { name: 'Sarah M.', avatar: '/placeholder.svg', status: 'reading' as const },
        { name: 'John D.', avatar: '/placeholder.svg', status: 'completed' as const },
        { name: 'Emma R.', avatar: '/placeholder.svg', status: 'want_to_read' as const }
      ],
      comments: [
        { user: 'Sarah M.', text: 'This book changed my perspective on life!', time: '2 hours ago' },
        { user: 'John D.', text: 'Couldn\'t put it down, finished in one sitting.', time: '1 day ago' }
      ],
      locations: [
        { city: 'Mumbai', country: 'India', readers: 12 },
        { city: 'Delhi', country: 'India', readers: 8 },
        { city: 'Bangalore', country: 'India', readers: 15 }
      ],
      podcastUrl: 'https://example.com/podcast/midnight-library'
    },
    {
      id: '2',
      title: 'Atomic Habits',
      author: 'James Clear',
      cover_url: '/placeholder.svg',
      rating: 4.8,
      readingFriends: [
        { name: 'Mike K.', avatar: '/placeholder.svg', status: 'reading' as const },
        { name: 'Lisa P.', avatar: '/placeholder.svg', status: 'completed' as const }
      ],
      comments: [
        { user: 'Mike K.', text: 'Great practical advice for building better habits!', time: '3 hours ago' }
      ],
      locations: [
        { city: 'Chennai', country: 'India', readers: 20 },
        { city: 'Pune', country: 'India', readers: 10 }
      ]
    }
  ];

  const filteredBooks = mockSocialBooks.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         book.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "All"; // For demo, showing all
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
    <div className="min-h-screen py-8 px-4 bg-gradient-to-br from-amber-50 to-orange-100">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Social Library</h1>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto mb-8">
            Discover books, connect with reading friends, and join vibrant reading communities.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
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

            <Dialog open={showSocialSync} onOpenChange={setShowSocialSync}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-50">
                  <Users className="w-4 h-4 mr-2" />
                  Find Reading Friends
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Connect with Reading Friends</DialogTitle>
                </DialogHeader>
                <SocialSyncPanel />
              </DialogContent>
            </Dialog>
          </div>
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

        {/* Books Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredBooks.map((book) => (
            <SocialBookCard key={book.id} book={book} />
          ))}
        </div>

        {filteredBooks.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-600 mb-2">No books found</h3>
            <p className="text-gray-500">Try adjusting your search or connect with friends to see their reading lists</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookLibrary;
