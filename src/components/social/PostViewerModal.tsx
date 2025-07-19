
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle, Share2, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Comment {
  id: string;
  user: {
    name: string;
    avatar?: string;
  };
  content: string;
  timestamp: string;
  replies?: Comment[];
}

interface Post {
  id: string;
  user: {
    name: string;
    username: string;
    avatar: string;
    isOnline: boolean;
  };
  content: string;
  book?: {
    title: string;
    author: string;
    cover: string;
  };
  image?: string;
  feeling?: {
    emoji: string;
    label: string;
  };
  timestamp: string;
  likes: number;
  comments: number;
  isLiked: boolean;
}

interface PostViewerModalProps {
  post: Post | null;
  isOpen: boolean;
  onClose: () => void;
}

// Mock comments data
const mockComments: Comment[] = [
  {
    id: '1',
    user: { name: 'Alice Johnson', avatar: '' },
    content: 'Great book recommendation! I\'ve been looking for something like this.',
    timestamp: '2 hours ago',
    replies: [
      {
        id: '1-1',
        user: { name: 'Bob Wilson', avatar: '' },
        content: 'I agree! This author writes amazing stories.',
        timestamp: '1 hour ago'
      }
    ]
  },
  {
    id: '2',
    user: { name: 'Charlie Brown', avatar: '' },
    content: 'Added to my reading list! Thanks for sharing.',
    timestamp: '3 hours ago'
  }
];

export const PostViewerModal: React.FC<PostViewerModalProps> = ({ post, isOpen, onClose }) => {
  const [comments] = useState<Comment[]>(mockComments);
  const [isLiked, setIsLiked] = useState(post?.isLiked || false);
  const [likes, setLikes] = useState(post?.likes || 0);
  const { toast } = useToast();

  if (!post) return null;

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikes(isLiked ? likes - 1 : likes + 1);
  };

  const handleComment = () => {
    toast({
      title: "Comment",
      description: "Comment feature coming soon!",
    });
  };

  const handleShare = () => {
    toast({
      title: "Share",
      description: "Share feature coming soon!",
    });
  };

  const renderComment = (comment: Comment, isReply = false) => (
    <div key={comment.id} className={`${isReply ? 'ml-8 mt-2' : 'mb-4'}`}>
      <div className="flex items-start space-x-3">
        <Avatar className="w-8 h-8">
          <AvatarImage src={comment.user.avatar} />
          <AvatarFallback className="text-xs bg-gradient-to-r from-orange-400 to-amber-500 text-white">
            {comment.user.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="bg-gray-100 rounded-lg px-3 py-2">
            <h4 className="font-medium text-sm text-gray-900">{comment.user.name}</h4>
            <p className="text-sm text-gray-700 mt-1">{comment.content}</p>
          </div>
          <div className="flex items-center mt-1 text-xs text-gray-500 space-x-4">
            <span>{comment.timestamp}</span>
            <button className="hover:text-gray-700">Like</button>
            <button className="hover:text-gray-700">Reply</button>
          </div>
        </div>
      </div>
      {comment.replies && comment.replies.map(reply => renderComment(reply, true))}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="p-4 border-b flex flex-row items-center justify-between">
          <h2 className="text-lg font-semibold">{post.user.name}'s Post</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </DialogHeader>
        
        <div className="overflow-y-auto">
          {/* Post Content */}
          <div className="p-4">
            {/* Post Header */}
            <div className="flex items-center space-x-3 mb-4">
              <div className="relative">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={post.user.avatar} />
                  <AvatarFallback className="bg-gradient-to-r from-orange-400 to-amber-500 text-white">
                    {post.user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                {post.user.isOnline && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-gray-900">{post.user.name}</h4>
                  {post.feeling && (
                    <span className="text-sm text-gray-500">
                      is feeling {post.feeling.emoji} {post.feeling.label}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500">@{post.user.username} • {post.timestamp}</p>
              </div>
            </div>

            {/* Post Content */}
            <div className="mb-4">
              <p className="text-gray-800 mb-3">{post.content}</p>
              
              {/* Book Card */}
              {post.book && (
                <div className="bg-gray-50 rounded-xl p-3 flex items-center space-x-3 mb-3">
                  <div className="w-12 h-16 bg-gradient-to-br from-orange-400 to-amber-500 rounded flex-shrink-0"></div>
                  <div>
                    <h5 className="font-medium text-gray-900 text-sm">{post.book.title}</h5>
                    <p className="text-xs text-gray-500">{post.book.author}</p>
                    <Badge variant="outline" className="mt-1 text-xs">
                      Currently Reading
                    </Badge>
                  </div>
                </div>
              )}

              {/* Image */}
              {post.image && (
                <div className="mb-3">
                  <img src={post.image} alt="Post image" className="w-full max-h-96 object-cover rounded-xl" />
                </div>
              )}
            </div>

            {/* Post Actions */}
            <div className="flex items-center space-x-6 pb-4 border-b border-gray-100">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                className={`${isLiked ? 'text-red-500 hover:text-red-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Heart className={`w-4 h-4 mr-1 ${isLiked ? 'fill-current' : ''}`} />
                {likes}
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-gray-500 hover:text-gray-700"
                onClick={handleComment}
              >
                <MessageCircle className="w-4 h-4 mr-1" />
                {post.comments}
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-gray-500 hover:text-gray-700"
                onClick={handleShare}
              >
                <Share2 className="w-4 h-4 mr-1" />
                Share
              </Button>
            </div>
          </div>

          {/* Comments Section */}
          <div className="p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Comments</h3>
            <div className="space-y-4">
              {comments.map(comment => renderComment(comment))}
            </div>
            
            {comments.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No comments yet</p>
                <p className="text-xs">Be the first to comment!</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
