import { useState, useMemo } from "react";
import { Heart, MessageCircle, Search, Plus, BookOpen, Users, Camera, MapPin, UserPlus, UserCheck, Dot } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import SEO from "@/components/SEO";

const Reviews = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPostText, setNewPostText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Sample friend suggestions and online friends
  const friendSuggestions = [
    { id: 1, name: "Emma Wilson", avatar: "", readingGenre: "Fiction", mutualFriends: 5 },
    { id: 2, name: "David Chen", avatar: "", readingGenre: "Science", mutualFriends: 3 },
    { id: 3, name: "Sarah Johnson", avatar: "", readingGenre: "Biography", mutualFriends: 8 },
  ];

  const onlineFriends = [
    { id: 1, name: "Alice Reader", avatar: "", currentBook: "The Great Gatsby", status: "online" },
    { id: 2, name: "Bob Bookworm", avatar: "", currentBook: "Sapiens", status: "online" },
    { id: 3, name: "Carol Pages", avatar: "", currentBook: "1984", status: "online" },
    { id: 4, name: "Dan Stories", avatar: "", currentBook: "Pride and Prejudice", status: "online" },
  ];

  // Sample social media posts with book-related content
  const socialPosts = [
    {
      id: 1,
      username: "bookworm_sarah",
      image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=600&fit=crop",
      caption: "Lost in the pages of 'The Seven Husbands of Evelyn Hugo' 📚✨ Can't put it down!",
      likes: 124,
      comments: 23,
      liked: false,
      bookTitle: "The Seven Husbands of Evelyn Hugo",
      readingLocation: "New York, USA"
    },
    {
      id: 2,
      username: "readingwithraj",
      image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=600&fit=crop",
      caption: "My cozy reading corner is ready for tonight's chapter marathon 🌙",
      likes: 89,
      comments: 15,
      liked: true,
      bookTitle: "Atomic Habits",
      readingLocation: "Mumbai, India"
    },
    {
      id: 3,
      username: "litlover_anna",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop",
      caption: "Nothing beats a good book and a cup of coffee on a rainy day ☕",
      likes: 156,
      comments: 31,
      liked: false,
      bookTitle: "The Midnight Library",
      readingLocation: "London, UK"
    },
    {
      id: 4,
      username: "pageflipper_mike",
      image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&h=600&fit=crop",
      caption: "Just finished my 50th book this year! 'Atomic Habits' was incredible 🎯",
      likes: 203,
      comments: 47,
      liked: true,
      bookTitle: "Atomic Habits",
      readingLocation: "Toronto, Canada"
    }
  ];

  const [posts, setPosts] = useState(socialPosts);

  // Filter posts based on search query
  const filteredPosts = useMemo(() => {
    if (!searchQuery.trim()) return posts;
    
    return posts.filter(post => 
      post.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.caption.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.bookTitle?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [posts, searchQuery]);

  const handleLike = (postId: number) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { 
            ...post, 
            liked: !post.liked, 
            likes: post.liked ? post.likes - 1 : post.likes + 1 
          }
        : post
    ));
  };

  const handleComment = (postId: number) => {
    toast({
      title: "Comment",
      description: "Comment feature coming soon!",
    });
  };

  const handleCreatePost = () => {
    if (newPostText.trim()) {
      setIsLoading(true);
      setTimeout(() => {
        const newPost = {
          id: posts.length + 1,
          username: "you",
          image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=600&fit=crop",
          caption: newPostText,
          likes: 0,
          comments: 0,
          liked: false,
          bookTitle: "New Book",
          readingLocation: "Your Location"
        };
        setPosts([newPost, ...posts]);
        setNewPostText("");
        setShowCreatePost(false);
        setIsLoading(false);
        toast({
          title: "Post Created!",
          description: "Your reading update has been shared with the community.",
        });
      }, 1000);
    }
  };

  const findReadingPartners = (bookTitle: string) => {
    const readers = posts.filter(post => 
      post.bookTitle?.toLowerCase().includes(bookTitle.toLowerCase())
    );
    toast({
      title: "Reading Partners Found!",
      description: `Found ${readers.length} readers enjoying "${bookTitle}". Connect with them!`,
    });
  };

  const addFriend = (friendId: number) => {
    toast({
      title: "Friend Request Sent!",
      description: "Your friend request has been sent successfully.",
    });
  };

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="space-y-6">
      {[...Array(3)].map((_, i) => (
        <Card key={i} className="bg-white/90 backdrop-blur-sm">
          <div className="p-4">
            <div className="flex items-center space-x-3 mb-4">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <Skeleton className="h-48 w-full rounded-lg mb-4" />
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </Card>
      ))}
    </div>
  );

  return (
    <>
      <SEO
        title="Community Reviews"
        description="Read and share book reviews with the Sahadhyayi community."
        canonical="https://sahadhyayi.com/reviews"
        url="https://sahadhyayi.com/reviews"
      />
      
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
        <div className="container mx-auto px-4 py-6">
          
          {/* Header Section */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                Reading Community
              </h1>
            </div>
            <p className="text-gray-700 max-w-2xl mx-auto mb-6 text-sm md:text-base">
              Share your reading moments, discover book inspiration, and connect with fellow book lovers.
            </p>
            
            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
              <Button 
                onClick={() => setShowCreatePost(!showCreatePost)}
                className="bg-amber-600 hover:bg-amber-700 text-white text-sm md:text-base"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Share Reading
              </Button>
              <Button variant="outline" size="sm" className="border-amber-200 text-amber-700">
                <BookOpen className="w-4 h-4 mr-2" />
                Browse Library
              </Button>
            </div>
            
            {/* Search Bar */}
            <div className="max-w-md mx-auto relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search posts, books, or readers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border-2 border-amber-200 focus:border-amber-400 rounded-lg bg-white text-gray-900 placeholder-gray-500 text-sm"
              />
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Left Sidebar - Friend Suggestions */}
            <div className="lg:col-span-1 order-3 lg:order-1">
              <Card className="bg-white/90 backdrop-blur-sm border-amber-200 sticky top-4">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-gray-900 flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-amber-600" />
                    Friend Suggestions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {friendSuggestions.map((friend) => (
                    <div key={friend.id} className="flex items-center justify-between p-2 bg-amber-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-amber-200 text-amber-800 text-xs">
                            {friend.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-gray-900 text-xs">{friend.name}</p>
                          <p className="text-xs text-gray-600">{friend.mutualFriends} mutual</p>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => addFriend(friend.id)}
                        className="bg-amber-600 hover:bg-amber-700 text-white text-xs px-2 py-1 h-auto"
                      >
                        Add
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-2 order-1 lg:order-2">
              
              {/* Create Post Section */}
              {showCreatePost && (
                <Card className="mb-6 border-amber-200 shadow-lg">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold text-gray-900">
                      Share Your Reading Moment
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      placeholder="What are you reading? Share your thoughts..."
                      value={newPostText}
                      onChange={(e) => setNewPostText(e.target.value)}
                      className="min-h-[80px] border-amber-200 focus:border-amber-400 text-sm"
                    />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <button className="flex items-center gap-1 hover:text-amber-600">
                          <Camera className="w-3 h-3" />
                          Photo
                        </button>
                        <button className="flex items-center gap-1 hover:text-amber-600">
                          <MapPin className="w-3 h-3" />
                          Location
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          onClick={() => setShowCreatePost(false)}
                          size="sm"
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleCreatePost}
                          className="bg-amber-600 hover:bg-amber-700"
                          size="sm"
                          disabled={isLoading}
                        >
                          {isLoading ? "Posting..." : "Share Post"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Community Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <div className="bg-white/80 backdrop-blur-sm p-3 rounded-lg border border-amber-200 text-center">
                  <div className="text-lg font-bold text-amber-600">2,847</div>
                  <div className="text-xs text-gray-600">Active Readers</div>
                </div>
                <div className="bg-white/80 backdrop-blur-sm p-3 rounded-lg border border-amber-200 text-center">
                  <div className="text-lg font-bold text-amber-600">15,632</div>
                  <div className="text-xs text-gray-600">Books Shared</div>
                </div>
                <div className="bg-white/80 backdrop-blur-sm p-3 rounded-lg border border-amber-200 text-center">
                  <div className="text-lg font-bold text-amber-600">8,429</div>
                  <div className="text-xs text-gray-600">Reading Posts</div>
                </div>
                <div className="bg-white/80 backdrop-blur-sm p-3 rounded-lg border border-amber-200 text-center">
                  <div className="text-lg font-bold text-amber-600">156</div>
                  <div className="text-xs text-gray-600">Countries</div>
                </div>
              </div>

              {/* Posts Section */}
              {isLoading ? (
                <LoadingSkeleton />
              ) : (
                <div className="space-y-6">
                  {filteredPosts.map((post) => (
                    <Card key={post.id} className="bg-white/90 backdrop-blur-sm border-amber-200 hover:shadow-lg transition-all duration-300">
                      <div className="p-4">
                        {/* User Info */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                              {post.username.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <span className="font-medium text-gray-900 text-sm">{post.username}</span>
                              {post.readingLocation && (
                                <div className="flex items-center text-xs text-gray-500">
                                  <MapPin className="w-3 h-3 mr-1" />
                                  {post.readingLocation.split(',')[0]}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Post Image */}
                        <div className="relative mb-4 rounded-lg overflow-hidden">
                          <img
                            src={post.image}
                            alt={`Reading post by ${post.username}`}
                            className="w-full h-64 object-cover"
                          />
                          {post.bookTitle && (
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                              <div className="text-white text-xs">Currently Reading:</div>
                              <div className="text-white text-sm font-semibold">{post.bookTitle}</div>
                            </div>
                          )}
                        </div>

                        {/* Caption */}
                        <p className="text-gray-700 text-sm mb-4">{post.caption}</p>

                        {/* Find Reading Partners */}
                        {post.bookTitle && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => findReadingPartners(post.bookTitle)}
                            className="w-full mb-3 border-amber-200 hover:border-amber-300 text-amber-700 text-xs"
                          >
                            <Users className="w-3 h-3 mr-1" />
                            Find Reading Partners
                          </Button>
                        )}

                        {/* Actions */}
                        <div className="flex items-center space-x-6">
                          <button
                            onClick={() => handleLike(post.id)}
                            className={`flex items-center space-x-2 transition-colors ${
                              post.liked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
                            }`}
                          >
                            <Heart className={`w-4 h-4 ${post.liked ? 'fill-current' : ''}`} />
                            <span className="text-sm font-medium">{post.likes}</span>
                          </button>
                          
                          <button
                            onClick={() => handleComment(post.id)}
                            className="flex items-center space-x-2 text-gray-500 hover:text-amber-600 transition-colors"
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span className="text-sm font-medium">{post.comments}</span>
                          </button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {filteredPosts.length === 0 && searchQuery && (
                <div className="text-center py-12">
                  <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No posts found matching "{searchQuery}"</p>
                </div>
              )}
            </div>

            {/* Right Sidebar - Online Friends */}
            <div className="lg:col-span-1 order-2 lg:order-3">
              <Card className="bg-white/90 backdrop-blur-sm border-amber-200 sticky top-4">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-gray-900 flex items-center gap-2">
                    <Dot className="w-4 h-4 text-green-500" />
                    Online ({onlineFriends.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {onlineFriends.map((friend) => (
                    <div key={friend.id} className="flex items-center space-x-2 p-2 hover:bg-amber-50 rounded-lg transition-colors">
                      <div className="relative">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-gradient-to-br from-amber-400 to-orange-500 text-white text-xs">
                            {friend.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-xs truncate">{friend.name}</p>
                        <p className="text-xs text-gray-600 truncate">Reading: {friend.currentBook}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
            
          </div>
        </div>
      </div>
    </>
  );
};

export default Reviews;
