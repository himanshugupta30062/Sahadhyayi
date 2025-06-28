
import { useState, useMemo } from "react";
import { Heart, MessageCircle, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Reviews = () => {
  const [searchQuery, setSearchQuery] = useState("");
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
      liked: false
    },
    {
      id: 2,
      username: "readingwithraj",
      image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=600&fit=crop",
      caption: "My cozy reading corner is ready for tonight's chapter marathon 🌙",
      likes: 89,
      comments: 15,
      liked: true
    },
    {
      id: 3,
      username: "litlover_anna",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop",
      caption: "Nothing beats a good book and a cup of coffee on a rainy day ☕",
      likes: 156,
      comments: 31,
      liked: false
    },
    {
      id: 4,
      username: "pageflipper_mike",
      image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&h=600&fit=crop",
      caption: "Just finished my 50th book this year! 'Atomic Habits' was incredible 🎯",
      likes: 203,
      comments: 47,
      liked: true
    },
    {
      id: 5,
      username: "storyteller_priya",
      image: "https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=400&h=600&fit=crop",
      caption: "Book club meeting prep! Can't wait to discuss this masterpiece 📖",
      likes: 78,
      comments: 12,
      liked: false
    },
    {
      id: 6,
      username: "novel_enthusiast",
      image: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400&h=600&fit=crop",
      caption: "The library is my happy place 🏛️ So many adventures waiting to be discovered!",
      likes: 167,
      comments: 28,
      liked: false
    },
    {
      id: 7,
      username: "bookish_dreams",
      image: "https://images.unsplash.com/photo-1550399105-c4db5fb85c18?w=400&h=600&fit=crop",
      caption: "Reading under fairy lights hits different ✨ Currently devouring 'The Midnight Library'",
      likes: 134,
      comments: 19,
      liked: true
    },
    {
      id: 8,
      username: "chapter_chaser",
      image: "https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=400&h=600&fit=crop",
      caption: "Vintage books have their own magic 🪄 Found this gem at a local bookstore",
      likes: 98,
      comments: 16,
      liked: false
    },
    {
      id: 9,
      username: "reading_retreat",
      image: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=400&h=600&fit=crop",
      caption: "Beach reading session! 'Where the Crawdads Sing' is perfect for this setting 🌊",
      likes: 189,
      comments: 34,
      liked: false
    },
    {
      id: 10,
      username: "bookworm_alex",
      image: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400&h=600&fit=crop",
      caption: "My TBR pile is getting out of control, but I'm not complaining! 📚",
      likes: 142,
      comments: 25,
      liked: true
    },
    {
      id: 11,
      username: "literary_escape",
      image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=600&fit=crop",
      caption: "Nothing like a good book to transport you to another world 🌟",
      likes: 176,
      comments: 22,
      liked: false
    },
    {
      id: 12,
      username: "page_turner_sam",
      image: "https://images.unsplash.com/photo-1541963463532-d68292c34d19?w=400&h=600&fit=crop",
      caption: "Sunday morning reading ritual with my favorite bookmark 🔖",
      likes: 112,
      comments: 18,
      liked: false
    }
  ];

  const [posts, setPosts] = useState(socialPosts);

  // Filter posts based on search query
  const filteredPosts = useMemo(() => {
    if (!searchQuery.trim()) return posts;
    
    return posts.filter(post => 
      post.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.caption.toLowerCase().includes(searchQuery.toLowerCase())
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-6">
            Social Media
          </h1>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto mb-8">
            Share your reading moments, discover book inspiration, and connect with fellow book lovers
          </p>
          
          {/* Search Bar */}
          <div className="max-w-md mx-auto relative mb-8">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-full bg-white text-gray-900 placeholder-gray-500 focus:border-pink-400 focus:ring-2 focus:ring-pink-200 transition-all duration-300"
            />
          </div>
        </div>

        {/* Posts Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredPosts.map((post) => (
            <div key={post.id} className="group bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              {/* Image */}
              <div className="relative overflow-hidden aspect-[4/5]">
                <img
                  src={post.image}
                  alt={`Post by ${post.username}`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300"></div>
              </div>

              {/* Content */}
              <div className="p-4">
                {/* Username */}
                <div className="flex items-center mb-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {post.username.charAt(0).toUpperCase()}
                  </div>
                  <span className="ml-2 font-medium text-gray-900">{post.username}</span>
                </div>

                {/* Caption */}
                <p className="text-gray-700 text-sm leading-relaxed mb-4 line-clamp-3">
                  {post.caption}
                </p>

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center space-x-1 transition-colors duration-200 ${
                        post.liked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
                      }`}
                    >
                      <Heart className={`w-5 h-5 ${post.liked ? 'fill-current' : ''}`} />
                      <span className="text-sm font-medium">{post.likes}</span>
                    </button>
                    
                    <button
                      onClick={() => handleComment(post.id)}
                      className="flex items-center space-x-1 text-gray-500 hover:text-blue-500 transition-colors duration-200"
                    >
                      <MessageCircle className="w-5 h-5" />
                      <span className="text-sm font-medium">{post.comments}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredPosts.length === 0 && searchQuery && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No posts found matching "{searchQuery}"</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reviews;
