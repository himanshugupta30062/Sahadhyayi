import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Star, BookOpen, Users, Calendar, ShoppingCart, CalendarPlus, Heart, MessageCircle, Share2, ThumbsUp, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Reviews = () => {
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const { toast } = useToast();

  const feedPosts = [
    {
      id: 1,
      type: "completed",
      user: {
        name: "Priya Sharma",
        avatar: "/placeholder.svg",
        initials: "PS"
      },
      timestamp: "2 hours ago",
      book: {
        title: "The Midnight Library",
        author: "Matt Haig",
        cover: "/placeholder.svg"
      },
      content: "Just finished this incredible book! 🌟 The concept of infinite parallel lives really made me think about the choices we make. Anyone else read this? Would love to discuss!",
      rating: 5,
      likes: 24,
      comments: 8,
      shares: 3
    },
    {
      id: 2,
      type: "progress",
      user: {
        name: "Rajesh Kumar",
        avatar: "/placeholder.svg",
        initials: "RK"
      },
      timestamp: "4 hours ago",
      book: {
        title: "Atomic Habits",
        author: "James Clear",
        cover: "/placeholder.svg"
      },
      content: "Halfway through this amazing book and already implementing the 1% rule! The chapter on habit stacking is a game-changer. Who else is working on building better habits?",
      progress: 67,
      likes: 18,
      comments: 12,
      shares: 5
    },
    {
      id: 3,
      type: "recommendation",
      user: {
        name: "Ananya Patel",
        avatar: "/placeholder.svg",
        initials: "AP"
      },
      timestamp: "6 hours ago",
      book: {
        title: "Sapiens",
        author: "Yuval Noah Harari",
        cover: "/placeholder.svg"
      },
      content: "Recommending this to everyone interested in human history! Harari's perspective on how we evolved from hunter-gatherers to the dominant species is fascinating. Perfect for our History Enthusiasts book club!",
      likes: 31,
      comments: 15,
      shares: 8
    },
    {
      id: 4,
      type: "quote",
      user: {
        name: "Vikram Singh",
        avatar: "/placeholder.svg",
        initials: "VS"
      },
      timestamp: "8 hours ago",
      book: {
        title: "Educated",
        author: "Tara Westover",
        cover: "/placeholder.svg"
      },
      content: "\"You can love someone and still choose to say goodbye to them... You can miss a person every day, and still be glad that they are no longer in your life.\" - This quote from Educated hit me hard. Such a powerful memoir about education and family.",
      likes: 42,
      comments: 20,
      shares: 12
    },
    {
      id: 5,
      type: "started",
      user: {
        name: "Meera Reddy",
        avatar: "/placeholder.svg",
        initials: "MR"
      },
      timestamp: "1 day ago",
      book: {
        title: "The Psychology of Money",
        author: "Morgan Housel",
        cover: "/placeholder.svg"
      },
      content: "Starting this book tonight! Heard great things about how it changes your perspective on wealth and financial decisions. Anyone read it already?",
      likes: 16,
      comments: 7,
      shares: 2
    },
    {
      id: 6,
      type: "review",
      user: {
        name: "Arjun Gupta",
        avatar: "/placeholder.svg",
        initials: "AG"
      },
      timestamp: "1 day ago",
      book: {
        title: "Think Again",
        author: "Adam Grant",
        cover: "/placeholder.svg"
      },
      content: "Detailed review: Grant's book is a masterclass in intellectual humility. While some sections felt repetitive, the core message about being willing to change our minds is crucial in today's polarized world. Great for sparking discussions in our Critical Thinkers group!",
      rating: 4,
      likes: 28,
      comments: 14,
      shares: 6
    }
  ];

  const topBooks = [
    { title: "The Midnight Library", author: "Matt Haig", avgRating: 4.8, reviewCount: 156 },
    { title: "Atomic Habits", author: "James Clear", avgRating: 4.7, reviewCount: 203 },
    { title: "Educated", author: "Tara Westover", avgRating: 4.6, reviewCount: 134 },
    { title: "Sapiens", author: "Yuval Noah Harari", avgRating: 4.5, reviewCount: 189 },
    { title: "The Psychology of Money", author: "Morgan Housel", avgRating: 4.4, reviewCount: 98 }
  ];

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`w-4 h-4 ${index < rating ? "text-yellow-500 fill-current" : "text-gray-300"}`}
      />
    ));
  };

  const getPostTypeIcon = (type: string) => {
    switch (type) {
      case "completed":
        return <BookOpen className="w-4 h-4 text-green-600" />;
      case "progress":
        return <Clock className="w-4 h-4 text-blue-600" />;
      case "recommendation":
        return <ThumbsUp className="w-4 h-4 text-purple-600" />;
      case "quote":
        return <MessageCircle className="w-4 h-4 text-orange-600" />;
      case "started":
        return <BookOpen className="w-4 h-4 text-amber-600" />;
      case "review":
        return <Star className="w-4 h-4 text-yellow-600" />;
      default:
        return <BookOpen className="w-4 h-4 text-gray-600" />;
    }
  };

  const getPostTypeText = (type: string) => {
    switch (type) {
      case "completed":
        return "finished reading";
      case "progress":
        return "is reading";
      case "recommendation":
        return "recommends";
      case "quote":
        return "shared a quote from";
      case "started":
        return "started reading";
      case "review":
        return "reviewed";
      default:
        return "shared";
    }
  };

  const handleLike = (postId: number) => {
    toast({
      title: "Liked!",
      description: "You liked this post.",
    });
  };

  const handleComment = (postId: number) => {
    toast({
      title: "Comment",
      description: "Comment feature coming soon!",
    });
  };

  const handleShare = (postId: number) => {
    toast({
      title: "Shared!",
      description: "Post shared to your timeline.",
    });
  };

  const handlePurchaseBook = (bookTitle: string, author: string) => {
    setSelectedBook(`${bookTitle} by ${author}`);
    toast({
      title: "Added to Cart",
      description: `${bookTitle} has been added to your cart.`,
    });
  };

  const handleScheduleSession = () => {
    toast({
      title: "Redirecting to Author Connect",
      description: "Taking you to schedule a session with authors.",
    });
    // In a real app, this would navigate to /authors
    setTimeout(() => {
      window.location.href = '/authors';
    }, 1000);
  };

  const handleSubmitReview = () => {
    toast({
      title: "Review Submitted",
      description: "Thank you for sharing your review with the community!",
    });
    setShowReviewForm(false);
  };

  const handleHelpfulClick = (reviewId: number) => {
    toast({
      title: "Thank you!",
      description: "Your feedback helps our community.",
    });
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Book Community Feed</h1>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto mb-8">
            Stay connected with your reading community. See what your friends are reading, share your thoughts, and discover your next great book.
          </p>
          <div className="flex gap-4 justify-center">
            <Button 
              onClick={() => setShowReviewForm(!showReviewForm)}
              className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-3 text-lg"
            >
              Share Your Reading
            </Button>
            <Button 
              onClick={handleScheduleSession}
              variant="outline"
              className="border-amber-600 text-amber-600 hover:bg-amber-50 px-8 py-3 text-lg"
            >
              <CalendarPlus className="w-5 h-5 mr-2" />
              Schedule Author Session
            </Button>
          </div>
        </div>

        {/* Share Form */}
        {showReviewForm && (
          <Card className="mb-8 bg-white/70 backdrop-blur-sm border-amber-200">
            <CardHeader>
              <CardTitle className="text-2xl text-gray-900">Share with Community</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Input placeholder="Book Title" />
                <Input placeholder="Author Name" />
              </div>
              <div className="flex items-center space-x-4">
                <span className="font-medium">What are you sharing?</span>
                <select className="border rounded px-3 py-1">
                  <option value="completed">Finished Reading</option>
                  <option value="progress">Reading Progress</option>
                  <option value="recommendation">Recommendation</option>
                  <option value="quote">Book Quote</option>
                  <option value="review">Book Review</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-medium">Rating (optional):</span>
                <div className="flex space-x-1">
                  {Array.from({ length: 5 }, (_, index) => (
                    <Star key={index} className="w-6 h-6 text-gray-300 hover:text-yellow-500 cursor-pointer" />
                  ))}
                </div>
              </div>
              <Textarea placeholder="Share your thoughts, quotes, or progress..." rows={4} />
              <div className="flex space-x-4">
                <Button onClick={handleSubmitReview} className="bg-amber-600 hover:bg-amber-700">Share Post</Button>
                <Button variant="outline" onClick={() => setShowReviewForm(false)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Social Feed */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-3xl font-bold text-gray-900">Community Feed</h2>
            {feedPosts.map((post) => (
              <Card key={post.id} className="bg-white/70 backdrop-blur-sm border-amber-200 hover:shadow-lg transition-all duration-300">
                <CardHeader className="pb-4">
                  <div className="flex items-start space-x-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={post.user.avatar} alt={post.user.name} />
                      <AvatarFallback>{post.user.initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        {getPostTypeIcon(post.type)}
                        <span className="font-medium text-gray-900">{post.user.name}</span>
                        <span className="text-gray-600">{getPostTypeText(post.type)}</span>
                        <span className="font-medium text-gray-900">{post.book.title}</span>
                      </div>
                      <p className="text-sm text-gray-500">{post.timestamp}</p>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="flex space-x-4">
                    <div className="w-16 h-20 bg-gray-200 rounded flex-shrink-0 flex items-center justify-center">
                      <BookOpen className="w-8 h-8 text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{post.book.title}</h4>
                      <p className="text-sm text-gray-600">by {post.book.author}</p>
                      {post.rating && (
                        <div className="flex items-center space-x-1 mt-1">
                          {renderStars(post.rating)}
                        </div>
                      )}
                      {post.progress && (
                        <div className="mt-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{post.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                            <div 
                              className="bg-amber-600 h-2 rounded-full" 
                              style={{ width: `${post.progress}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-gray-700 leading-relaxed">{post.content}</p>
                  
                  {/* Engagement Stats */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <div className="flex items-center space-x-6 text-sm text-gray-500">
                      <span>{post.likes} likes</span>
                      <span>{post.comments} comments</span>
                      <span>{post.shares} shares</span>
                    </div>
                    <Button 
                      onClick={() => handlePurchaseBook(post.book.title, post.book.author)}
                      size="sm"
                      variant="outline"
                      className="border-amber-600 text-amber-600 hover:bg-amber-50"
                    >
                      <ShoppingCart className="w-4 h-4 mr-1" />
                      Buy Book
                    </Button>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleLike(post.id)}
                      className="flex items-center space-x-2 text-gray-600 hover:text-red-600"
                    >
                      <Heart className="w-4 h-4" />
                      <span>Like</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleComment(post.id)}
                      className="flex items-center space-x-2 text-gray-600 hover:text-blue-600"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Comment</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleShare(post.id)}
                      className="flex items-center space-x-2 text-gray-600 hover:text-green-600"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>Share</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Top Rated Books */}
            <Card className="bg-white/70 backdrop-blur-sm border-amber-200">
              <CardHeader>
                <CardTitle className="text-xl text-gray-900 flex items-center">
                  <Star className="w-5 h-5 text-yellow-500 mr-2" />
                  Top Rated Books
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {topBooks.map((book, index) => (
                  <div key={index} className="flex items-center justify-between border-b border-amber-100 last:border-b-0 pb-3 last:pb-0">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">{book.title}</p>
                      <p className="text-gray-600 text-xs">by {book.author}</p>
                      <div className="flex items-center space-x-1 mt-1">
                        {renderStars(Math.floor(book.avgRating))}
                        <span className="text-xs text-gray-500">({book.reviewCount})</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      <span className="text-lg font-bold text-amber-600">{book.avgRating}</span>
                      <Button 
                        onClick={() => handlePurchaseBook(book.title, book.author)}
                        size="sm"
                        variant="outline"
                        className="text-xs border-amber-600 text-amber-600 hover:bg-amber-50"
                      >
                        <ShoppingCart className="w-3 h-3 mr-1" />
                        Buy
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Review Stats */}
            <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
              <CardHeader>
                <CardTitle className="text-xl text-gray-900">Community Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-amber-600">2,847</div>
                  <div className="text-gray-700">Total Reviews</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-amber-600">4.6</div>
                  <div className="text-gray-700">Average Rating</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-amber-600">89%</div>
                  <div className="text-gray-700">Books Rated 4+ Stars</div>
                </div>
                <Button 
                  onClick={handleScheduleSession}
                  className="w-full bg-amber-600 hover:bg-amber-700"
                >
                  <CalendarPlus className="w-4 h-4 mr-2" />
                  Join Author Sessions
                </Button>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="bg-white/70 backdrop-blur-sm border-amber-200">
              <CardHeader>
                <CardTitle className="text-xl text-gray-900 flex items-center">
                  <Calendar className="w-5 h-5 text-amber-600 mr-2" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm">
                  <p className="font-medium text-gray-900">Priya S. rated "The Midnight Library"</p>
                  <p className="text-gray-600">2 hours ago</p>
                </div>
                <div className="text-sm">
                  <p className="font-medium text-gray-900">Book Club discussed "Atomic Habits"</p>
                  <p className="text-gray-600">5 hours ago</p>
                </div>
                <div className="text-sm">
                  <p className="font-medium text-gray-900">New review for "Sapiens" published</p>
                  <p className="text-gray-600">1 day ago</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Purchase Book Dialog */}
        {selectedBook && (
          <Dialog open={!!selectedBook} onOpenChange={() => setSelectedBook(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Purchase Confirmation</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-gray-700">
                  You've added <strong>{selectedBook}</strong> to your cart.
                </p>
                <div className="flex space-x-2">
                  <Button className="bg-amber-600 hover:bg-amber-700">
                    Go to Cart
                  </Button>
                  <Button variant="outline" onClick={() => setSelectedBook(null)}>
                    Continue Shopping
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};

export default Reviews;
