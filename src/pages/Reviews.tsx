import { useState, useMemo } from "react";
import { Heart, MessageCircle, Search, Plus, BookOpen, Users, Camera, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SEO from "@/components/SEO";

const Reviews = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPostText, setNewPostText] = useState("");
  const { toast } = useToast();

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
      toast({
        title: "Post Created!",
        description: "Your reading update has been shared with the community.",
      });
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

  return (
    <>
      <SEO
        title="Community Reviews"
        description="Read and share book reviews with the Sahadhyayi community."/>
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* SEO-optimized Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              Reading Community
            </h1>
          </div>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto mb-8">
            Share your reading moments, discover book inspiration, and connect with fellow book lovers around the world. Join our vibrant community of readers and bookworms.
          </p>
          
          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
            <Button 
              onClick={() => setShowCreatePost(!showCreatePost)}
              className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-lg font-medium"
            >
              <Plus className="w-4 h-4 mr-2" />
              Share Your Reading
            </Button>
            <a href="/library" className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-amber-200 hover:border-amber-300 text-amber-700 rounded-lg font-medium transition-colors">
              <BookOpen className="w-4 h-4" />
              Browse Library
            </a>
          </div>
          
          {/* Search Bar */}
          <div className="max-w-md mx-auto relative mb-8">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search posts, books, or readers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-2 border-amber-200 focus:border-amber-400 rounded-xl bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-amber-100 transition-all duration-300"
            />
          </div>
        </div>

        {/* Create Post Section */}
        {showCreatePost && (
          <Card className="mb-8 border-amber-200 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">
                Share Your Reading Moment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="What are you reading? Share your thoughts, progress, or a beautiful quote..."
                value={newPostText}
                onChange={(e) => setNewPostText(e.target.value)}
                className="min-h-[100px] border-amber-200 focus:border-amber-400"
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <button className="flex items-center gap-2 hover:text-amber-600">
                    <Camera className="w-4 h-4" />
                    Add Photo
                  </button>
                  <button className="flex items-center gap-2 hover:text-amber-600">
                    <MapPin className="w-4 h-4" />
                    Add Location
                  </button>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowCreatePost(false)}
                    className="border-gray-300"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreatePost}
                    className="bg-amber-600 hover:bg-amber-700"
                  >
                    Share Post
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Community Stats Section */}
        <section aria-labelledby="community-stats-heading" className="mb-12">
          <h2 id="community-stats-heading" className="text-2xl font-bold text-gray-900 mb-6">
            Community Highlights
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-amber-200 text-center">
              <div className="text-2xl font-bold text-amber-600 mb-1">2,847</div>
              <div className="text-sm text-gray-600">Active Readers</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-amber-200 text-center">
              <div className="text-2xl font-bold text-amber-600 mb-1">15,632</div>
              <div className="text-sm text-gray-600">Books Shared</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-amber-200 text-center">
              <div className="text-2xl font-bold text-amber-600 mb-1">8,429</div>
              <div className="text-sm text-gray-600">Reading Posts</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-amber-200 text-center">
              <div className="text-2xl font-bold text-amber-600 mb-1">156</div>
              <div className="text-sm text-gray-600">Countries</div>
            </div>
          </div>
        </section>

        {/* Posts Section */}
        <section aria-labelledby="posts-section-heading">
          <h2 id="posts-section-heading" className="text-2xl font-bold text-gray-900 mb-6">
            Recent Reading Updates
          </h2>
          
          {/* Posts Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredPosts.map((post) => (
              <Card key={post.id} className="group bg-white/90 backdrop-blur-sm border-amber-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                {/* Image */}
                <div className="relative overflow-hidden aspect-[4/5]">
                  <img
                    src={post.image}
                    alt={`Reading post by ${post.username} about ${post.bookTitle || 'books'}`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300"></div>
                  
                  {/* Book Info Overlay */}
                  {post.bookTitle && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                      <div className="text-white text-xs font-medium mb-1">Currently Reading:</div>
                      <div className="text-white text-sm font-semibold">{post.bookTitle}</div>
                    </div>
                  )}
                </div>

                {/* Content */}
                <CardContent className="p-4">
                  {/* Username and Location */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {post.username.charAt(0).toUpperCase()}
                      </div>
                      <span className="ml-2 font-medium text-gray-900">{post.username}</span>
                    </div>
                    {post.readingLocation && (
                      <div className="flex items-center text-xs text-gray-500">
                        <MapPin className="w-3 h-3 mr-1" />
                        {post.readingLocation.split(',')[0]}
                      </div>
                    )}
                  </div>

                  {/* Caption */}
                  <p className="text-gray-700 text-sm leading-relaxed mb-4 line-clamp-3">
                    {post.caption}
                  </p>

                  {/* Find Reading Partners Button */}
                  {post.bookTitle && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => findReadingPartners(post.bookTitle)}
                      className="w-full mb-3 border-amber-200 hover:border-amber-300 text-amber-700 hover:bg-amber-50"
                    >
                      <Users className="w-3 h-3 mr-1" />
                      Find Reading Partners
                    </Button>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => handleLike(post.id)}
                        className={`flex items-center space-x-1 transition-colors duration-200 ${
                          post.liked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${post.liked ? 'fill-current' : ''}`} />
                        <span className="text-sm font-medium">{post.likes}</span>
                      </button>
                      
                      <button
                        onClick={() => handleComment(post.id)}
                        className="flex items-center space-x-1 text-gray-500 hover:text-amber-600 transition-colors duration-200"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">{post.comments}</span>
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredPosts.length === 0 && searchQuery && (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No posts found matching "{searchQuery}"</p>
              <p className="text-gray-400 text-sm mt-2">Try searching for different books or authors</p>
            </div>
          )}
        </section>

        {/* Join Community CTA */}
        <section className="mt-16 bg-gradient-to-r from-amber-100 to-orange-100 p-8 rounded-2xl border border-amber-200">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Join Our Global Reading Community</h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Connect with thousands of book lovers worldwide. Share your reading journey, discover new books, and find your next reading partner.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Button 
                onClick={() => setShowCreatePost(true)}
                className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3"
              >
                <Plus className="w-4 h-4 mr-2" />
                Share Your First Post
              </Button>
              <a href="/library" className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-amber-300 hover:border-amber-400 text-amber-700 rounded-lg font-medium transition-colors">
                <BookOpen className="w-4 h-4" />
                Explore Book Library
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
    </>
  );
};

export default Reviews;
