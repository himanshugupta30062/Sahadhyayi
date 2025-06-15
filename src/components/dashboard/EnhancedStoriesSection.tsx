
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit, Plus, Trash2, Play, FileText } from 'lucide-react';
import { useStories, useCreateStory, useDeleteStory } from '@/hooks/useStories';
import { toast } from '@/hooks/use-toast';

const EnhancedStoriesSection = () => {
  const { data: stories = [], isLoading } = useStories();
  const createStory = useCreateStory();
  const deleteStory = useDeleteStory();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    format: 'text',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast({ title: 'Error', description: 'Title is required.' });
      return;
    }

    createStory.mutate(formData, {
      onSuccess: () => {
        setIsDialogOpen(false);
        setFormData({ title: '', description: '', content: '', format: 'text' });
      },
    });
  };

  const handleDelete = (storyId: string) => {
    if (confirm('Are you sure you want to delete this story?')) {
      deleteStory.mutate(storyId);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Edit className="w-5 h-5" />
          My Stories
        </CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              New Story
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Story</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter story title..."
                />
              </div>
              <div>
                <Label htmlFor="format">Format</Label>
                <Select 
                  value={formData.format} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, format: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text Story</SelectItem>
                    <SelectItem value="audio">Audio Story</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of your story..."
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Write your story here..."
                  rows={6}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={createStory.isPending}>
                  {createStory.isPending ? 'Creating...' : 'Create Story'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse bg-gray-200 h-16 rounded"></div>
            ))}
          </div>
        ) : stories.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Edit className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No stories yet.</p>
            <p className="text-sm">Create your first story to get started!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {stories.slice(0, 4).map((story) => (
              <div key={story.id} className="border rounded-lg p-3 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {story.format === 'audio' ? (
                        <Play className="w-4 h-4 text-blue-500" />
                      ) : (
                        <FileText className="w-4 h-4 text-green-500" />
                      )}
                      <h4 className="font-medium text-sm">{story.title}</h4>
                    </div>
                    {story.description && (
                      <p className="text-xs text-gray-600 mb-2">{story.description}</p>
                    )}
                    <span className="text-xs text-gray-400">
                      {new Date(story.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(story.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            {stories.length > 4 && (
              <Button variant="ghost" className="w-full">
                View All Stories ({stories.length})
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedStoriesSection;
