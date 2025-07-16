import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { BookOpen, MessageCircle, Search, Filter } from "lucide-react";
import {
  useUserBookshelf,
  useUpdateBookshelfItem,
  type BookshelfItem,
} from "@/hooks/useUserBookshelf";
import { Link } from "react-router-dom";
import SEO from "@/components/SEO";

const Bookshelf = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [aiQuestion, setAiQuestion] = useState("");

  const { data: userBooks = [], isLoading } = useUserBookshelf();
  const updateBookStatus = useUpdateBookshelfItem();

  const statusColors = {
    reading: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    want_to_read: "bg-amber-100 text-amber-800",
  };

  const filterOptions = ["All", "reading", "completed", "want_to_read"];

  const filteredBooks = userBooks.filter((userBook: BookshelfItem) => {
    const book = userBook.books_library;
    if (!book) return false;
    
    const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (book.author && book.author.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFilter = filterStatus === "All" || userBook.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleStatusChange = (userBookId: string, newStatus: string) => {
    updateBookStatus.mutate({ id: userBookId, updates: { status: newStatus } });
  };

  const handleAiQuestion = (bookTitle: string) => {
    console.log(`AI question for ${bookTitle}: ${aiQuestion}`);
    // In a real app, this would send to AI service
    setAiQuestion("");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">My Bookshelf</h1>
            <div className="text-gray-500">Loading your books...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title="My Bookshelf - Track Your Reading | Sahadhyayi"
        description="Manage your books, track reading progress, and get AI-powered assistance in your personal digital bookshelf."
        canonical="https://sahadhyayi.com/bookshelf"
        url="https://sahadhyayi.com/bookshelf"
      />
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'My Bookshelf',
          description:
            'Manage your books, track reading progress, and get AI-powered assistance in your personal digital bookshelf.',
          url: 'https://sahadhyayi.com/bookshelf',
          breadcrumb: {
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: 'https://sahadhyayi.com'
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: 'Bookshelf',
                item: 'https://sahadhyayi.com/bookshelf'
              }
            ]
          }
        })}
      </script>
      <div className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">My Bookshelf</h1>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto">
            Track your reading progress, take notes, and get AI-powered assistance for better understanding.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search your books..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Link to="/library">
              <Button className="bg-amber-600 hover:bg-amber-700">
                Add More Books
              </Button>
            </Link>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="flex items-center text-sm text-gray-600 mr-2">
              <Filter className="w-4 h-4 mr-1" />
              Filter:
            </span>
            {filterOptions.map((status) => (
              <Button
                key={status}
                variant={filterStatus === status ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus(status)}
                className={filterStatus === status ? "bg-amber-600 hover:bg-amber-700" : ""}
              >
                {status === "All" ? "All" : status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Button>
            ))}
          </div>
        </div>

        {/* Reading Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {userBooks.filter((book: BookshelfItem) => book.status === "reading").length}
              </div>
              <div className="text-blue-800 font-medium">Currently Reading</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {userBooks.filter((book: BookshelfItem) => book.status === "completed").length}
              </div>
              <div className="text-green-800 font-medium">Completed</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-amber-600 mb-2">
                {userBooks.filter((book: BookshelfItem) => book.status === "want_to_read").length}
              </div>
              <div className="text-amber-800 font-medium">Want to Read</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {userBooks.length}
              </div>
              <div className="text-purple-800 font-medium">Total Books</div>
            </CardContent>
          </Card>
        </div>

        {/* Books Grid */}
        {filteredBooks.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-600 mb-2">
              {userBooks.length === 0 ? "Your bookshelf is empty" : "No books found"}
            </h3>
            <p className="text-gray-500 mb-4">
              {userBooks.length === 0 
                ? "Start building your digital library" 
                : "Try adjusting your search or filter criteria"
              }
            </p>
            <Link to="/library">
              <Button className="bg-amber-600 hover:bg-amber-700">
                Browse Library
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBooks.map((userBook: BookshelfItem) => {
              const book = userBook.books_library;
              if (!book) return null;

              return (
                <Card key={userBook.id} className="bg-white/70 backdrop-blur-sm border-amber-200 hover:shadow-xl transition-all duration-300">
                  <CardHeader className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0">
                    {book.cover_image_url ? (
                      <img
                        src={book.cover_image_url}
                        alt={`Cover of ${book.title}`}
                        className="w-full sm:w-32 h-48 object-cover rounded-md"
                      />
                    ) : (
                      <div className="w-full sm:w-32 h-48 bg-gradient-to-br from-amber-100 to-orange-100 rounded-md flex items-center justify-center">
                        <BookOpen className="w-12 h-12 text-amber-600" />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <CardTitle className="text-xl text-gray-900 mb-2">{book.title}</CardTitle>
                          <p className="text-gray-600">{book.author || 'Unknown Author'}</p>
                        </div>
                        <Badge className={statusColors[userBook.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}>
                          {userBook.status?.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'Unread'}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Status Update */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Reading Status</label>
                      <select
                        value={userBook.status || 'want_to_read'}
                        onChange={(e) => handleStatusChange(userBook.id, e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      >
                        <option value="want_to_read">Want to Read</option>
                        <option value="reading">Reading</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Personal Notes</label>
                      <Textarea
                        placeholder="Add your thoughts about this book..."
                        className="min-h-[60px]"
                      />
                    </div>

                    {/* AI Assistant */}
                    <div className="bg-blue-50 p-3 rounded-lg space-y-2">
                      <label className="text-sm font-medium text-blue-800 flex items-center">
                        <MessageCircle className="w-4 h-4 mr-1" />
                        Ask AI Assistant
                      </label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Ask about this book..."
                          value={aiQuestion}
                          onChange={(e) => setAiQuestion(e.target.value)}
                          className="flex-1 text-sm"
                        />
                        <Button 
                          size="sm"
                          onClick={() => handleAiQuestion(book.title)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Ask
                        </Button>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2"></div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
    </>
  );
};

export default Bookshelf;