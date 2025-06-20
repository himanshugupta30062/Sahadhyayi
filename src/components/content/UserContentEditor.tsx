
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Edit, Send } from 'lucide-react';
import { useCreateUserContent } from '@/hooks/useUserGeneratedContent';
import { toast } from '@/hooks/use-toast';

interface UserContentEditorProps {
  bookId: string;
  onSuccess?: () => void;
}

const UserContentEditor: React.FC<UserContentEditorProps> = ({
  bookId,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    content_type: 'alternative_chapter' as const,
    original_chapter_number: '',
    is_published: false,
  });

  const createContent = useCreateUserContent();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      toast({
        title: "Error",
        description: "Title and content are required.",
        variant: "destructive"
      });
      return;
    }

    try {
      await createContent.mutateAsync({
        book_id: bookId,
        title: formData.title.trim(),
        content: formData.content.trim(),
        content_type: formData.content_type,
        original_chapter_number: formData.original_chapter_number ? 
          parseInt(formData.original_chapter_number) : null,
        is_published: formData.is_published,
        is_approved: false,
      });

      toast({
        title: "Content Submitted",
        description: "Your content has been submitted for review!"
      });

      setFormData({
        title: '',
        content: '',
        content_type: 'alternative_chapter',
        original_chapter_number: '',
        is_published: false,
      });

      onSuccess?.();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit content. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-900">
          <Edit className="w-5 h-5" />
          Create Your Story
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter your story title..."
              className="border-purple-200 focus:border-purple-400"
            />
          </div>

          <div>
            <Label htmlFor="content_type">Content Type</Label>
            <Select 
              value={formData.content_type} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, content_type: value as any }))}
            >
              <SelectTrigger className="border-purple-200 focus:border-purple-400">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="alternative_chapter">Alternative Chapter</SelectItem>
                <SelectItem value="alternative_ending">Alternative Ending</SelectItem>
                <SelectItem value="continuation">Story Continuation</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.content_type === 'alternative_chapter' && (
            <div>
              <Label htmlFor="chapter_number">Original Chapter Number</Label>
              <Input
                id="chapter_number"
                type="number"
                value={formData.original_chapter_number}
                onChange={(e) => setFormData(prev => ({ ...prev, original_chapter_number: e.target.value }))}
                placeholder="Which chapter are you reimagining?"
                className="border-purple-200 focus:border-purple-400"
              />
            </div>
          )}

          <div>
            <Label htmlFor="content">Your Story</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Write your story here... Let your creativity flow!"
              rows={12}
              className="border-purple-200 focus:border-purple-400 resize-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="publish"
              checked={formData.is_published}
              onChange={(e) => setFormData(prev => ({ ...prev, is_published: e.target.checked }))}
              className="accent-purple-600"
            />
            <Label htmlFor="publish" className="text-sm">
              Publish immediately (subject to moderation)
            </Label>
          </div>

          <div className="flex gap-2">
            <Button 
              type="submit" 
              disabled={createContent.isPending}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Send className="w-4 h-4 mr-2" />
              {createContent.isPending ? 'Submitting...' : 'Submit Story'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default UserContentEditor;
