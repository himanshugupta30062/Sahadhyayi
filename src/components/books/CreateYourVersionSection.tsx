
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import SignInLink from '@/components/SignInLink';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Edit3, Upload, ThumbsUp, MessageCircle, Eye, User, Crown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface CreateYourVersionSectionProps {
  bookId: string;
  bookTitle: string;
}

interface UserVersion {
  id: string;
  user: string;
  title: string;
  content: string;
  type: 'summary' | 'alternate_ending' | 'chapter' | 'complete_rewrite';
  isPublished: boolean;
  upvotes: number;
  comments: number;
  views: number;
  timestamp: string;
  isUpvoted: boolean;
}

const CreateYourVersionSection = ({ bookId, bookTitle }: CreateYourVersionSectionProps) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [versionType, setVersionType] = useState<'summary' | 'alternate_ending' | 'chapter' | 'complete_rewrite'>('summary');
  const [isPublic, setIsPublic] = useState(true);

  // Mock data - replace with real data from your backend
  const [userVersions, setUserVersions] = useState<UserVersion[]>([
    {
      id: '1',
      user: 'Alex Chen',
      title: 'Alternative Happy Ending',
      content: 'In this version, the protagonist makes a different choice in chapter 15 that leads to a completely different outcome...',
      type: 'alternate_ending',
      isPublished: true,
      upvotes: 23,
      comments: 7,
      views: 156,
      timestamp: '3 days ago',
      isUpvoted: false
    },
    {
      id: '2',
      user: 'Maria Santos',
      title: 'Quick Summary for Busy Readers',
      content: 'A comprehensive 5-minute summary covering all the key plot points and character developments...',
      type: 'summary',
      isPublished: true,
      upvotes: 41,
      comments: 12,
      views: 289,
      timestamp: '1 week ago',
      isUpvoted: true
    },
    {
      id: '3',
      user: 'David Kumar',
      title: 'Missing Chapter: The Backstory',
      content: 'This chapter explores what happened to the main character before the events of the original book...',
      type: 'chapter',
      isPublished: true,
      upvotes: 18,
      comments: 5,
      views: 98,
      timestamp: '2 weeks ago',
      isUpvoted: false
    }
  ]);

  const handleSubmitVersion = () => {
    if (!title.trim() || !content.trim() || !user) return;

    const newVersion: UserVersion = {
      id: Date.now().toString(),
      user: user.email?.split('@')[0] || 'Anonymous',
      title: title.trim(),
      content: content.trim(),
      type: versionType,
      isPublished: isPublic,
      upvotes: 0,
      comments: 0,
      views: 0,
      timestamp: 'Just now',
      isUpvoted: false
    };

    setUserVersions([newVersion, ...userVersions]);
    setTitle('');
    setContent('');
  };

  const handleUpvote = (versionId: string) => {
    setUserVersions(userVersions.map(version => 
      version.id === versionId 
        ? { 
            ...version, 
            upvotes: version.isUpvoted ? version.upvotes - 1 : version.upvotes + 1, 
            isUpvoted: !version.isUpvoted 
          }
        : version
    ));
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'summary': return 'bg-blue-100 text-blue-800';
      case 'alternate_ending': return 'bg-purple-100 text-purple-800';
      case 'chapter': return 'bg-green-100 text-green-800';
      case 'complete_rewrite': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'summary': return 'Summary';
      case 'alternate_ending': return 'Alt. Ending';
      case 'chapter': return 'New Chapter';
      case 'complete_rewrite': return 'Rewrite';
      default: return 'Other';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Edit3 className="w-6 h-6 text-purple-600" />
          <h3 className="text-2xl font-bold text-purple-900">Create Your Own Version</h3>
        </div>
        <p className="text-purple-700">Write your own version, summary, or alternate ending of "{bookTitle}"</p>
      </div>

      {/* Create New Version Form */}
      {user ? (
        <Card className="bg-white/80 backdrop-blur-sm border-purple-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-purple-900">Create Your Version</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Title Input */}
            <div>
              <Label htmlFor="version-title">Title</Label>
              <Input
                id="version-title"
                placeholder="Give your version a title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Version Type Selection */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { value: 'summary', label: 'Summary' },
                { value: 'alternate_ending', label: 'Alt. Ending' },
                { value: 'chapter', label: 'New Chapter' },
                { value: 'complete_rewrite', label: 'Rewrite' }
              ].map((type) => (
                <Button
                  key={type.value}
                  variant={versionType === type.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setVersionType(type.value as any)}
                  className={versionType === type.value ? 'bg-purple-600 hover:bg-purple-700' : ''}
                >
                  {type.label}
                </Button>
              ))}
            </div>

            {/* Content Textarea */}
            <div>
              <Label htmlFor="version-content">Content</Label>
              <Textarea
                id="version-content"
                placeholder="Write your version here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[200px] resize-none"
              />
            </div>

            {/* Privacy Toggle */}
            <div className="flex items-center space-x-2">
              <Switch
                id="public-version"
                checked={isPublic}
                onCheckedChange={setIsPublic}
              />
              <Label htmlFor="public-version">
                {isPublic ? 'Publish publicly' : 'Save as private'}
              </Label>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button onClick={handleSubmitVersion} disabled={!title.trim() || !content.trim()}>
                <Upload className="w-4 h-4 mr-2" />
                {isPublic ? 'Publish Version' : 'Save Private'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-white/80 backdrop-blur-sm border-purple-200 shadow-sm">
          <CardContent className="p-6 text-center">
            <p className="text-gray-600 mb-4">Sign in to create and share your own versions</p>
            <Button variant="outline" asChild>
              <SignInLink>Sign In</SignInLink>
            </Button>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* User Versions List */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-gray-900">Community Versions</h4>
        
        {userVersions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Edit3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No versions yet. Be the first to create one!</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {userVersions.map((version) => (
              <Card key={version.id} className="bg-white/60 backdrop-blur-sm border-gray-200 hover:shadow-md transition-shadow">
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
                          <span className="font-medium text-gray-900">{version.user}</span>
                          {version.upvotes > 20 && <Crown className="w-4 h-4 text-yellow-500" />}
                        </div>
                        <h5 className="font-semibold text-lg text-gray-900">{version.title}</h5>
                      </div>
                      <Badge className={getTypeColor(version.type)}>
                        {getTypeLabel(version.type)}
                      </Badge>
                    </div>

                    {/* Content Preview */}
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {version.content.length > 150 
                        ? `${version.content.substring(0, 150)}...` 
                        : version.content
                      }
                    </p>

                    {/* Stats and Actions */}
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {version.views}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-4 h-4" />
                          {version.comments}
                        </span>
                        <span className="text-xs">{version.timestamp}</span>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUpvote(version.id)}
                        className={`${version.isUpvoted ? 'text-purple-600' : 'text-gray-500'}`}
                      >
                        <ThumbsUp className={`w-4 h-4 mr-1 ${version.isUpvoted ? 'fill-current' : ''}`} />
                        {version.upvotes}
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

export default CreateYourVersionSection;
