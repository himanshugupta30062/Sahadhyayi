import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  MessageCircle, 
  Heart, 
  ThumbsUp, 
  PartyPopper, 
  Brain,
  Send,
  Reply
} from 'lucide-react';
import { AuthorPost, usePostComments, usePostReactions, useAddComment, useToggleReaction } from '@/hooks/useAuthorPosts';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface AuthorPostCardProps {
  post: AuthorPost;
}

const reactionIcons = {
  like: ThumbsUp,
  love: Heart,
  celebrate: PartyPopper,
  insightful: Brain,
};

const reactionLabels = {
  like: 'Like',
  love: 'Love',
  celebrate: 'Celebrate',
  insightful: 'Insightful',
};

export const AuthorPostCard = ({ post }: AuthorPostCardProps) => {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);

  const { data: comments = [] } = usePostComments(post.id);
  const { data: reactions = [] } = usePostReactions(post.id);
  const addComment = useAddComment();
  const toggleReaction = useToggleReaction();

  const userReaction = reactions.find(r => r.user_id === user?.id);
  
  const reactionCounts = reactions.reduce((acc, reaction) => {
    acc[reaction.reaction_type] = (acc[reaction.reaction_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    if (!user) {
      toast.error('Please sign in to comment');
      return;
    }

    try {
      await addComment.mutateAsync({
        postId: post.id,
        content: newComment.trim(),
        parentCommentId: replyTo || undefined,
      });
      setNewComment('');
      setReplyTo(null);
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleReaction = async (reactionType: 'like' | 'love' | 'celebrate' | 'insightful') => {
    if (!user) {
      toast.error('Please sign in to react');
      return;
    }

    try {
      await toggleReaction.mutateAsync({
        postId: post.id,
        reactionType,
      });
    } catch (error) {
      console.error('Error toggling reaction:', error);
    }
  };

  const getPostTypeColor = (type: string) => {
    switch (type) {
      case 'blog_post': return 'bg-blue-500/10 text-blue-700 border-blue-200';
      case 'announcement': return 'bg-amber-500/10 text-amber-700 border-amber-200';
      default: return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  const getPostTypeLabel = (type: string) => {
    switch (type) {
      case 'blog_post': return 'Blog Post';
      case 'announcement': return 'Announcement';
      case 'status_update': return 'Update';
      default: return 'Post';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage 
              src={post.authors?.profile_image_url || ''} 
              alt={post.authors?.name || 'Author'} 
            />
            <AvatarFallback>
              {post.authors?.name?.charAt(0) || 'A'}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold">{post.authors?.name}</h4>
              <Badge variant="outline" className={getPostTypeColor(post.post_type)}>
                {getPostTypeLabel(post.post_type)}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {post.title && (
          <h3 className="text-xl font-bold">{post.title}</h3>
        )}
        
        <div className="prose prose-sm max-w-none">
          <p className="whitespace-pre-wrap">{post.content}</p>
        </div>

        {post.image_url && (
          <div className="rounded-lg overflow-hidden">
            <img 
              src={post.image_url} 
              alt="Post attachment" 
              className="w-full h-auto object-cover max-h-96"
            />
          </div>
        )}

        {post.video_url && (
          <div className="rounded-lg overflow-hidden aspect-video">
            <iframe
              src={post.video_url}
              className="w-full h-full"
              frameBorder="0"
              allowFullScreen
            />
          </div>
        )}

        <Separator />

        {/* Reaction buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {Object.entries(reactionIcons).map(([type, Icon]) => {
            const count = reactionCounts[type] || 0;
            const isActive = userReaction?.reaction_type === type;
            
            return (
              <Button
                key={type}
                variant={isActive ? "default" : "ghost"}
                size="sm"
                onClick={() => handleReaction(type as any)}
                className="flex items-center gap-1"
              >
                <Icon className="w-4 h-4" />
                <span className="text-xs">{reactionLabels[type as keyof typeof reactionLabels]}</span>
                {count > 0 && (
                  <span className="text-xs bg-muted px-1 rounded">
                    {count}
                  </span>
                )}
              </Button>
            );
          })}

          {post.allow_comments && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-1"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="text-xs">Comments</span>
              {comments.length > 0 && (
                <span className="text-xs bg-muted px-1 rounded">
                  {comments.length}
                </span>
              )}
            </Button>
          )}
        </div>

        {/* Comments section */}
        {showComments && post.allow_comments && (
          <div className="space-y-4 pt-4 border-t">
            {/* Add comment form */}
            <div className="flex gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.user_metadata?.avatar_url} />
                <AvatarFallback>
                  {user?.email?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                {replyTo && (
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Reply className="w-3 h-3" />
                    Replying to comment
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setReplyTo(null)}
                      className="h-4 px-1 text-xs"
                    >
                      Cancel
                    </Button>
                  </div>
                )}
                <Textarea
                  placeholder="Write a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={2}
                  className="resize-none"
                />
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    onClick={handleAddComment}
                    disabled={!newComment.trim() || addComment.isPending}
                  >
                    <Send className="w-3 h-3 mr-1" />
                    Comment
                  </Button>
                </div>
              </div>
            </div>

            {/* Comments list */}
            <div className="space-y-3">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={comment.profiles?.profile_photo_url} />
                    <AvatarFallback>
                      {comment.profiles?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="bg-muted p-3 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">
                          {comment.profiles?.full_name || 'Anonymous'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setReplyTo(comment.id)}
                      className="h-6 px-2 text-xs"
                    >
                      <Reply className="w-3 h-3 mr-1" />
                      Reply
                    </Button>

                    {/* Render replies */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="ml-4 space-y-2 border-l pl-4">
                        {comment.replies.map((reply) => (
                          <div key={reply.id} className="flex gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={reply.profiles?.profile_photo_url} />
                              <AvatarFallback className="text-xs">
                                {reply.profiles?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="bg-muted/50 p-2 rounded-lg">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-xs">
                                    {reply.profiles?.full_name || 'Anonymous'}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                                  </span>
                                </div>
                                <p className="text-xs whitespace-pre-wrap">{reply.content}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};