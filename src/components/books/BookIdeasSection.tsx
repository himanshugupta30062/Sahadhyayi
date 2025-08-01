
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import SignInLink from '@/components/SignInLink';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Lightbulb, Bug, ThumbsUp, MessageCircle, AlertTriangle, User, Send } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface BookIdeasSectionProps {
  bookId: string;
  bookTitle: string;
}

interface Feedback {
  id: string;
  user: string;
  title: string;
  content: string;
  type: 'idea' | 'issue' | 'improvement';
  priority: 'low' | 'medium' | 'high';
  upvotes: number;
  comments: number;
  timestamp: string;
  isUpvoted: boolean;
  status: 'open' | 'under_review' | 'resolved';
}

const BookIdeasSection = ({ bookId, bookTitle }: BookIdeasSectionProps) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [feedbackType, setFeedbackType] = useState<'idea' | 'issue' | 'improvement'>('idea');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');

  // Mock data - replace with real data from your backend
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([
    {
      id: '1',
      user: 'Jennifer Kim',
      title: 'Add audio narration',
      content: 'It would be great to have an audio version of this book for people who prefer listening while commuting.',
      type: 'idea',
      priority: 'medium',
      upvotes: 34,
      comments: 8,
      timestamp: '2 days ago',
      isUpvoted: true,
      status: 'under_review'
    },
    {
      id: '2',
      user: 'Robert Wilson',
      title: 'Typo in Chapter 3',
      content: 'Found a typo on page 45, third paragraph: "recieve" should be "receive".',
      type: 'issue',
      priority: 'low',
      upvotes: 5,
      comments: 2,
      timestamp: '5 days ago',
      isUpvoted: false,
      status: 'resolved'
    },
    {
      id: '3',
      user: 'Lisa Chen',
      title: 'Character development suggestions',
      content: 'The supporting characters could use more backstory. Maybe add a few more scenes showing their motivations?',
      type: 'improvement',
      priority: 'medium',
      upvotes: 18,
      comments: 12,
      timestamp: '1 week ago',
      isUpvoted: false,
      status: 'open'
    }
  ]);

  const handleSubmitFeedback = () => {
    if (!title.trim() || !content.trim() || !user) return;

    const newFeedback: Feedback = {
      id: Date.now().toString(),
      user: user.email?.split('@')[0] || 'Anonymous',
      title: title.trim(),
      content: content.trim(),
      type: feedbackType,
      priority: priority,
      upvotes: 0,
      comments: 0,
      timestamp: 'Just now',
      isUpvoted: false,
      status: 'open'
    };

    setFeedbackList([newFeedback, ...feedbackList]);
    setTitle('');
    setContent('');
  };

  const handleUpvote = (feedbackId: string) => {
    setFeedbackList(feedbackList.map(feedback => 
      feedback.id === feedbackId 
        ? { 
            ...feedback, 
            upvotes: feedback.isUpvoted ? feedback.upvotes - 1 : feedback.upvotes + 1, 
            isUpvoted: !feedback.isUpvoted 
          }
        : feedback
    ));
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'idea': return <Lightbulb className="w-4 h-4" />;
      case 'issue': return <Bug className="w-4 h-4" />;
      case 'improvement': return <AlertTriangle className="w-4 h-4" />;
      default: return <Lightbulb className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'idea': return 'bg-green-100 text-green-800';
      case 'issue': return 'bg-red-100 text-red-800';
      case 'improvement': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'under_review': return 'bg-orange-100 text-orange-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Lightbulb className="w-6 h-6 text-green-600" />
          <h3 className="text-2xl font-bold text-green-900">Ideas and Feedback</h3>
        </div>
        <p className="text-green-700">Share your ideas or report issues about "{bookTitle}"</p>
      </div>

      {/* Submit Feedback Form */}
      {user ? (
        <Card className="bg-white/80 backdrop-blur-sm border-green-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-green-900">Share Your Feedback</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Title Input */}
            <div>
              <Label htmlFor="feedback-title">Title</Label>
              <Input
                id="feedback-title"
                placeholder="Brief description of your feedback..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Type and Priority Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="feedback-type">Type</Label>
                <Select value={feedbackType} onValueChange={(value: any) => setFeedbackType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="idea">💡 Idea</SelectItem>
                    <SelectItem value="issue">🐛 Issue</SelectItem>
                    <SelectItem value="improvement">⚠️ Improvement</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="feedback-priority">Priority</Label>
                <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">🟢 Low</SelectItem>
                    <SelectItem value="medium">🟡 Medium</SelectItem>
                    <SelectItem value="high">🔴 High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Content Textarea */}
            <div>
              <Label htmlFor="feedback-content">Details</Label>
              <Textarea
                id="feedback-content"
                placeholder="Provide more details about your feedback..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[120px] resize-none"
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button onClick={handleSubmitFeedback} disabled={!title.trim() || !content.trim()}>
                <Send className="w-4 h-4 mr-2" />
                Submit Feedback
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-white/80 backdrop-blur-sm border-green-200 shadow-sm">
          <CardContent className="p-6 text-center">
            <p className="text-gray-600 mb-4">Sign in to share your ideas and feedback</p>
            <Button variant="outline" asChild>
              <SignInLink>Sign In</SignInLink>
            </Button>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Feedback List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-semibold text-gray-900">Community Feedback</h4>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-xs">
              {feedbackList.filter(f => f.status === 'open').length} Open
            </Badge>
            <Badge variant="outline" className="text-xs">
              {feedbackList.filter(f => f.status === 'under_review').length} Under Review
            </Badge>
            <Badge variant="outline" className="text-xs">
              {feedbackList.filter(f => f.status === 'resolved').length} Resolved
            </Badge>
          </div>
        </div>
        
        {feedbackList.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Lightbulb className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No feedback yet. Be the first to share your ideas!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {feedbackList.map((feedback) => (
              <Card key={feedback.id} className="bg-white/60 backdrop-blur-sm border-gray-200 hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Avatar className="w-6 h-6">
                            <AvatarFallback>
                              <User className="w-3 h-3" />
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-gray-900">{feedback.user}</span>
                          <span className="text-xs text-gray-500">{feedback.timestamp}</span>
                        </div>
                        <h5 className="font-semibold text-lg text-gray-900">{feedback.title}</h5>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Badge className={getTypeColor(feedback.type)}>
                          {getTypeIcon(feedback.type)}
                          <span className="ml-1 capitalize">{feedback.type}</span>
                        </Badge>
                        <Badge className={getStatusColor(feedback.status)}>
                          {feedback.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>

                    {/* Priority Badge */}
                    <Badge variant="outline" className={`${getPriorityColor(feedback.priority)} w-fit`}>
                      {feedback.priority.toUpperCase()} Priority
                    </Badge>

                    {/* Content */}
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {feedback.content}
                    </p>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-4 h-4" />
                          {feedback.comments}
                        </span>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUpvote(feedback.id)}
                        className={`${feedback.isUpvoted ? 'text-green-600' : 'text-gray-500'}`}
                      >
                        <ThumbsUp className={`w-4 h-4 mr-1 ${feedback.isUpvoted ? 'fill-current' : ''}`} />
                        {feedback.upvotes}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookIdeasSection;
