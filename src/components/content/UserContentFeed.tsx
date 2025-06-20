
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThumbsUp, ThumbsDown, MessageCircle, Heart } from 'lucide-react';
import { useUserGeneratedContent, useContentVotes, useVoteContent } from '@/hooks/useUserGeneratedContent';
import { useAuth } from '@/contexts/AuthContext';

interface UserContentFeedProps {
  bookId?: string;
}

const UserContentFeed: React.FC<UserContentFeedProps> = ({ bookId }) => {
  const { user } = useAuth();
  const { data: content = [], isLoading } = useUserGeneratedContent(bookId);
  const voteContent = useVoteContent();

  const handleVote = async (contentId: string, voteType: 'upvote' | 'downvote') => {
    if (!user) return;
    
    try {
      await voteContent.mutateAsync({ contentId, voteType });
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                <div className="h-4 bg-gray-200 rounded w-4/6"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (content.length === 0) {
    return (
      <Card className="text-center py-8">
        <CardContent>
          <Heart className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">No user stories yet.</p>
          <p className="text-sm text-gray-500">Be the first to share your creative take!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {content.map((item) => (
        <UserContentCard 
          key={item.id} 
          content={item} 
          onVote={handleVote}
          currentUserId={user?.id}
        />
      ))}
    </div>
  );
};

interface UserContentCardProps {
  content: any;
  onVote: (contentId: string, voteType: 'upvote' | 'downvote') => void;
  currentUserId?: string;
}

const UserContentCard: React.FC<UserContentCardProps> = ({ 
  content, 
  onVote, 
  currentUserId 
}) => {
  const { data: votes = [] } = useContentVotes(content.id);
  
  const upvotes = votes.filter(v => v.vote_type === 'upvote').length;
  const downvotes = votes.filter(v => v.vote_type === 'downvote').length;
  const userVote = votes.find(v => v.user_id === currentUserId)?.vote_type;

  const getContentTypeColor = (type: string) => {
    switch (type) {
      case 'alternative_chapter': return 'bg-blue-100 text-blue-800';
      case 'alternative_ending': return 'bg-green-100 text-green-800';
      case 'continuation': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getContentTypeLabel = (type: string) => {
    switch (type) {
      case 'alternative_chapter': return 'Alternative Chapter';
      case 'alternative_ending': return 'Alternative Ending';
      case 'continuation': return 'Continuation';
      default: return type;
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg mb-2">{content.title}</CardTitle>
            <div className="flex items-center gap-2">
              <Badge className={getContentTypeColor(content.content_type)}>
                {getContentTypeLabel(content.content_type)}
              </Badge>
              {content.original_chapter_number && (
                <Badge variant="outline">
                  Chapter {content.original_chapter_number}
                </Badge>
              )}
            </div>
          </div>
          <span className="text-sm text-gray-500">
            {new Date(content.created_at).toLocaleDateString()}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="prose prose-sm max-w-none mb-4">
          {content.content.length > 500 
            ? `${content.content.substring(0, 500)}...` 
            : content.content
          }
        </div>
        
        <div className="flex items-center gap-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            <Button
              variant={userVote === 'upvote' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onVote(content.id, 'upvote')}
              className="flex items-center gap-1"
            >
              <ThumbsUp className="w-4 h-4" />
              {upvotes}
            </Button>
            
            <Button
              variant={userVote === 'downvote' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onVote(content.id, 'downvote')}
              className="flex items-center gap-1"
            >
              <ThumbsDown className="w-4 h-4" />
              {downvotes}
            </Button>
          </div>
          
          <Button variant="ghost" size="sm" className="flex items-center gap-1">
            <MessageCircle className="w-4 h-4" />
            Comment
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserContentFeed;
