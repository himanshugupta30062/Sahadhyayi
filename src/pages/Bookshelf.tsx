
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Download, Play, MessageCircle, Plus, Search, Filter } from "lucide-react";

const Bookshelf = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [aiQuestion, setAiQuestion] = useState("");

  const myBooks = [
    {
      id: 1,
      title: "The Midnight Library",
      author: "Matt Haig",
      currentPage: 145,
      totalPages: 288,
      status: "Reading",
      progress: 50,
      notes: "Fascinating concept about infinite possibilities",
      downloadUrl: "#",
      hasAiChat: true
    },
    {
      id: 2,
      title: "Atomic Habits",
      author: "James Clear",
      currentPage: 278,
      totalPages: 278,
      status: "Completed",
      progress: 100,
      notes: "Life-changing insights on habit formation",
      downloadUrl: "#",
      hasAiChat: true
    },
    {
      id: 3,
      title: "Sapiens",
      author: "Yuval Noah Harari",
      currentPage: 89,
      totalPages: 443,
      status: "Reading",
      progress: 20,
      notes: "Complex but engaging historical perspective",
      downloadUrl: "#",
      hasAiChat: true
    },
    {
      id: 4,
      title: "The Psychology of Money",
      author: "Morgan Housel",
      currentPage: 0,
      totalPages: 256,
      status: "Want to Read",
      progress: 0,
      notes: "",
      downloadUrl: "#",
      hasAiChat: false
    }
  ];

  const statusColors = {
    "Reading": "bg-blue-100 text-blue-800",
    "Completed": "bg-green-100 text-green-800",
    "Want to Read": "bg-gray-100 text-gray-800",
    "Paused": "bg-yellow-100 text-yellow-800"
  };

  const filterOptions = ["All", "Reading", "Completed", "Want to Read", "Paused"];

  const filteredBooks = myBooks.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         book.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "All" || book.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handlePageUpdate = (bookId: number, newPage: number) => {
    console.log(`Updating book ${bookId} to page ${newPage}`);
    // In a real app, this would update the database
  };

  const handleAiQuestion = (bookTitle: string) => {
    console.log(`AI question for ${bookTitle}: ${aiQuestion}`);
    // In a real app, this would send to AI service
    setAiQuestion("");
  };

  return (
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
            <Button className="bg-amber-600 hover:bg-amber-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Book
            </Button>
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
                {status}
              </Button>
            ))}
          </div>
        </div>

        {/* Reading Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {myBooks.filter(book => book.status === "Reading").length}
              </div>
              <div className="text-blue-800 font-medium">Currently Reading</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {myBooks.filter(book => book.status === "Completed").length}
              </div>
              <div className="text-green-800 font-medium">Completed</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-amber-600 mb-2">
                {Math.round(myBooks.reduce((sum, book) => sum + book.progress, 0) / myBooks.length)}%
              </div>
              <div className="text-amber-800 font-medium">Avg Progress</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {myBooks.reduce((sum, book) => sum + (book.currentPage || 0), 0)}
              </div>
              <div className="text-purple-800 font-medium">Pages Read</div>
            </CardContent>
          </Card>
        </div>

        {/* Books Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBooks.map((book) => (
            <Card key={book.id} className="bg-white/70 backdrop-blur-sm border-amber-200 hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <CardTitle className="text-xl text-gray-900 mb-2">{book.title}</CardTitle>
                    <p className="text-gray-600">by {book.author}</p>
                  </div>
                  <Badge className={statusColors[book.status as keyof typeof statusColors]}>
                    {book.status}
                  </Badge>
                </div>
                
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Progress</span>
                    <span>{book.currentPage} / {book.totalPages} pages</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-amber-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${book.progress}%` }}
                    ></div>
                  </div>
                  <div className="text-center text-sm font-medium text-amber-600">
                    {book.progress}% Complete
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Page Update */}
                {book.status === "Reading" && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Update Current Page</label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder={book.currentPage.toString()}
                        max={book.totalPages}
                        min={0}
                        className="flex-1"
                      />
                      <Button 
                        size="sm"
                        onClick={() => handlePageUpdate(book.id, book.currentPage)}
                        className="bg-amber-600 hover:bg-amber-700"
                      >
                        Update
                      </Button>
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Personal Notes</label>
                  <Textarea
                    placeholder="Add your thoughts about this book..."
                    value={book.notes}
                    className="min-h-[60px]"
                  />
                </div>

                {/* AI Assistant */}
                {book.hasAiChat && (
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
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" size="sm">
                    <Play className="w-4 h-4 mr-1" />
                    Read
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4" />
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
            <p className="text-gray-500 mb-4">Start building your digital library</p>
            <Button className="bg-amber-600 hover:bg-amber-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Book
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Bookshelf;
