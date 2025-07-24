import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { PenTool, Send, Image, Video, X } from 'lucide-react';
import { useCreatePost } from '@/hooks/useAuthorPosts';
import { toast } from 'sonner';
import { containsInappropriateLanguage } from '@/utils/trustAndSafety';
import { useReportContent } from '@/hooks/useTrustAndSafety';

interface CreatePostFormProps {
  authorId: string;
  onPostCreated?: () => void;
}

export const CreatePostForm = ({ authorId, onPostCreated }: CreatePostFormProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState<'status_update' | 'blog_post' | 'announcement'>('status_update');
  const [allowComments, setAllowComments] = useState(true);
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');

  const createPost = useCreatePost();
  const reportContent = useReportContent();

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast.error('Please add some content to your post');
      return;
    }

    if (containsInappropriateLanguage(`${title} ${content}`)) {
      reportContent.mutate({ contentId: authorId, contentType: 'post', reason: 'Inappropriate language in post' });
    }

    try {
      await createPost.mutateAsync({
        title: title.trim() || undefined,
        content: content.trim(),
        post_type: postType,
        allow_comments: allowComments,
        image_url: imageUrl.trim() || undefined,
        video_url: videoUrl.trim() || undefined,
        is_published: true,
      });

      // Reset form
      setTitle('');
      setContent('');
      setPostType('status_update');
      setAllowComments(true);
      setImageUrl('');
      setVideoUrl('');
      setIsExpanded(false);
      
      onPostCreated?.();
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  if (!isExpanded) {
    return (
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div 
            className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted/70 transition-colors"
            onClick={() => setIsExpanded(true)}
          >
            <PenTool className="w-5 h-5 text-muted-foreground" />
            <span className="text-muted-foreground">Share an update with your followers...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <h3 className="text-lg font-medium">Create New Post</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(false)}
        >
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="post-type">Post Type</Label>
          <Select value={postType} onValueChange={(value: any) => setPostType(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="status_update">Status Update</SelectItem>
              <SelectItem value="blog_post">Blog Post</SelectItem>
              <SelectItem value="announcement">Announcement</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {postType === 'blog_post' && (
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Enter post title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="content">Content</Label>
          <Textarea
            id="content"
            placeholder="What's on your mind?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
            className="resize-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="image-url">Image URL</Label>
            <div className="flex">
              <Image className="w-4 h-4 mt-3 mr-2 text-muted-foreground" />
              <Input
                id="image-url"
                placeholder="https://example.com/image.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="video-url">Video URL</Label>
            <div className="flex">
              <Video className="w-4 h-4 mt-3 mr-2 text-muted-foreground" />
              <Input
                id="video-url"
                placeholder="https://youtube.com/watch?v=..."
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="allow-comments"
            checked={allowComments}
            onCheckedChange={setAllowComments}
          />
          <Label htmlFor="allow-comments">Allow comments</Label>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button
            variant="outline"
            onClick={() => setIsExpanded(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createPost.isPending || !content.trim()}
          >
            <Send className="w-4 h-4 mr-2" />
            {createPost.isPending ? 'Publishing...' : 'Publish'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};