
import { useState, useMemo } from "react";
import { Heart, MessageCircle, Search, ImagePlus, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import {
  useSocialPosts,
  useCreateSocialPost,
  useLikeSocialPost,
} from "@/hooks/useSocialPosts";

const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400&h=600&fit=crop";

const Reviews = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [newCaption, setNewCaption] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: dbPosts = [], isLoading } = useSocialPosts();
  const createPost = useCreateSocialPost();
  const likePost = useLikeSocialPost();

  // Locally liked post ids (session-only) so the heart reflects user action
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());

  // Posts from the database; empty list is valid (user just hasn't posted yet)
  const posts = useMemo(
    () =>
      dbPosts.map((post) => ({
        id: post.id,
        username: post.username || "anonymous_reader",
        image: post.image_url || PLACEHOLDER_IMAGE,
        caption: post.caption,
        likes: post.likes ?? 0,
        comments: post.comments ?? 0,
        liked: likedIds.has(post.id),
      })),
    [dbPosts, likedIds]
  );

  // Filter posts based on search query
  const filteredPosts = useMemo(() => {
    if (!searchQuery.trim()) return posts;

    const q = searchQuery.toLowerCase();
    return posts.filter(
      (post) =>
        post.username.toLowerCase().includes(q) ||
        post.caption.toLowerCase().includes(q)
    );
  }, [posts, searchQuery]);

  const handleLike = (postId: string) => {
    const wasLiked = likedIds.has(postId);
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (wasLiked) next.delete(postId);
      else next.add(postId);
      return next;
    });
    likePost.mutate({ postId, liked: wasLiked });
  };

  const handleComment = () => {
    toast({
      title: "Comment",
      description: "Comment feature coming soon!",
    });
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to share a post.",
        variant: "destructive",
      });
      return;
    }

    if (!newCaption.trim()) {
      toast({
        title: "Empty post",
        description: "Write a caption before publishing.",
        variant: "destructive",
      });
      return;
    }

    await createPost.mutateAsync({
      caption: newCaption,
      imageUrl: newImageUrl,
    });

    setNewCaption("");
    setNewImageUrl("");
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
            Share your reading moments, discover book inspiration, and connect
            with fellow book lovers
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

        {/* Create Post Composer */}
        {user ? (
          <form
            onSubmit={handleCreatePost}
            className="max-w-2xl mx-auto mb-12 bg-white rounded-2xl shadow-md p-5 space-y-3"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                {(user.email?.charAt(0) || "R").toUpperCase()}
              </div>
              <span className="font-medium text-gray-900">
                Share a reading moment
              </span>
            </div>
            <textarea
              value={newCaption}
              onChange={(e) => setNewCaption(e.target.value)}
              placeholder={`What are you reading today? (max ${2000} chars)`}
              maxLength={2000}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-900 placeholder-gray-500 focus:border-pink-400 focus:ring-2 focus:ring-pink-200 resize-none transition-all duration-300"
            />
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <ImagePlus className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="url"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="Image URL (optional)"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl bg-white text-gray-900 placeholder-gray-500 focus:border-pink-400 focus:ring-2 focus:ring-pink-200 text-sm transition-all duration-300"
                />
              </div>
              <button
                type="submit"
                disabled={createPost.isPending}
                className="flex items-center justify-center gap-2 px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold rounded-xl hover:from-pink-600 hover:to-purple-600 disabled:opacity-50 transition-all duration-300"
              >
                <Send className="w-4 h-4" />
                {createPost.isPending ? "Posting..." : "Post"}
              </button>
            </div>
          </form>
        ) : (
          <div className="max-w-2xl mx-auto mb-12 bg-white rounded-2xl shadow-md p-6 text-center">
            <p className="text-gray-700 mb-3">
              Sign in to share your reading moments with the community.
            </p>
            <Link
              to="/signin"
              className="inline-block px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold rounded-full hover:from-pink-600 hover:to-purple-600 transition-all duration-300"
            >
              Sign In
            </Link>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Loading posts…</p>
          </div>
        )}

        {/* Posts Grid */}
        {!isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredPosts.map((post) => (
              <div
                key={post.id}
                className="group bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
              >
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
                    <span className="ml-2 font-medium text-gray-900">
                      {post.username}
                    </span>
                  </div>

                  {/* Caption */}
                  <p className="text-gray-700 text-sm leading-relaxed mb-4 line-clamp-3 whitespace-pre-wrap break-words">
                    {post.caption}
                  </p>

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => handleLike(post.id)}
                        className={`flex items-center space-x-1 transition-colors duration-200 ${
                          post.liked
                            ? "text-red-500"
                            : "text-gray-500 hover:text-red-500"
                        }`}
                      >
                        <Heart
                          className={`w-5 h-5 ${post.liked ? "fill-current" : ""}`}
                        />
                        <span className="text-sm font-medium">{post.likes}</span>
                      </button>

                      <button
                        onClick={handleComment}
                        className="flex items-center space-x-1 text-gray-500 hover:text-blue-500 transition-colors duration-200"
                      >
                        <MessageCircle className="w-5 h-5" />
                        <span className="text-sm font-medium">
                          {post.comments}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && posts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              No posts yet. Be the first to share a reading moment!
            </p>
          </div>
        )}

        {!isLoading && filteredPosts.length === 0 && posts.length > 0 && searchQuery && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              No posts found matching "{searchQuery}"
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reviews;
