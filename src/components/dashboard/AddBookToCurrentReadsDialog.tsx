
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

const AddBookToCurrentReadsDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [bookTitle, setBookTitle] = useState('');
  const [totalPages, setTotalPages] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !bookTitle || !totalPages) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('reading_progress')
        .insert({
          user_id: user.id,
          book_title: bookTitle.trim(),
          total_pages: parseInt(totalPages),
          current_page: 1,
          cover_image_url: coverUrl.trim() || null,
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Book added to your current reads!',
      });

      queryClient.invalidateQueries({ queryKey: ['reading-progress'] });
      setIsOpen(false);
      setBookTitle('');
      setTotalPages('');
      setCoverUrl('');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add book',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-amber-600 hover:bg-amber-700 w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Add Book
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Book to Current Reads</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="bookTitle">Book Title *</Label>
            <Input
              id="bookTitle"
              value={bookTitle}
              onChange={(e) => setBookTitle(e.target.value)}
              placeholder="Enter book title"
              required
            />
          </div>
          <div>
            <Label htmlFor="totalPages">Total Pages *</Label>
            <Input
              id="totalPages"
              type="number"
              min="1"
              value={totalPages}
              onChange={(e) => setTotalPages(e.target.value)}
              placeholder="Enter total pages"
              required
            />
          </div>
          <div>
            <Label htmlFor="coverUrl">Cover Image URL (Optional)</Label>
            <Input
              id="coverUrl"
              type="url"
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              placeholder="https://example.com/cover.jpg"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? 'Adding...' : 'Add Book'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
          </div>
          <div className="pt-2 border-t">
            <Link to="/library" onClick={() => setIsOpen(false)}>
              <Button variant="outline" className="w-full">
                Browse Library Instead
              </Button>
            </Link>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddBookToCurrentReadsDialog;
