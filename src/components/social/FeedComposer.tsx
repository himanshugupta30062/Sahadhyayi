
import React, { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Image, BookOpen, Smile, Send, X } from 'lucide-react';
import { useAuth } from '@/contexts/authHelpers';
import { BookSelectionModal } from './BookSelectionModal';
import { EmojiPicker } from './EmojiPicker';
import { useCreatePost } from '@/hooks/useSocialPosts';
import { useToast } from '@/hooks/use-toast';

interface SelectedBook {
  id: string;
  title: string;
  author: string;
  cover: string;
  description?: string;
}

interface SelectedFeeling {
  emoji: string;
  label: string;
}

export const FeedComposer = ({ onPost }: { onPost?: (postData: any) => void }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const createPost = useCreatePost();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [postText, setPostText] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedBook, setSelectedBook] = useState<SelectedBook | null>(null);
  const [selectedFeeling, setSelectedFeeling] = useState<SelectedFeeling | null>(null);
  const [showBookModal, setShowBookModal] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({ title: 'Image too large', description: 'Please select an image under 5MB', variant: 'destructive' });
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleBookSelect = (book: SelectedBook) => {
    setSelectedBook(book);
    setShowBookModal(false);
  };

  const handleFeelingSelect = (feeling: SelectedFeeling) => {
    setSelectedFeeling(feeling);
    setShowEmojiPicker(false);
  };

  const clearAttachments = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setSelectedBook(null);
    setSelectedFeeling(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePost = async () => {
    if (!postText.trim() && !selectedImage && !selectedBook && !selectedFeeling) {
      toast({ title: 'Empty post', description: 'Please add some content to your post', variant: 'destructive' });
      return;
    }

    if (!user) {
      toast({ title: 'Error', description: 'You must be signed in to create a post.', variant: 'destructive' });
      return;
    }

    setIsPosting(true);
    try {
      let uploadedImageUrl: string | undefined;

      // Upload image to Supabase Storage if present
      if (selectedImage) {
          const { supabase } = await import('@/integrations/supabase/client');
          const ext = selectedImage.name.split('.').pop() || 'jpg';
          const path = `user-uploads/${user.id}/${Date.now()}.${ext}`;
          const { error: uploadError } = await supabase.storage
            .from('books')
            .upload(path, selectedImage, { cacheControl: '3600', upsert: false });
          if (uploadError) {
            throw new Error('Your photo could not be uploaded. Your draft is still here; please try again.');
          }
          const { data: pub } = supabase.storage.from('books').getPublicUrl(path);
          uploadedImageUrl = pub?.publicUrl;
          if (!uploadedImageUrl) {
            throw new Error('Your photo could not be confirmed. Your draft is still here; please try again.');
          }
      }

      await createPost.mutateAsync({
        content: postText.trim(),
        book_id: selectedBook?.id,
        feeling_emoji: selectedFeeling?.emoji,
        feeling_label: selectedFeeling?.label,
        image_url: uploadedImageUrl,
      });

      // Legacy callback for compatibility
      const postData = {
        content: postText,
        image: selectedImage,
        book: selectedBook,
        feeling: selectedFeeling,
        timestamp: new Date().toISOString()
      };

      onPost?.(postData);
      
      // Clear the composer
      setPostText('');
      clearAttachments();
      
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: 'Unable to create post',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <>
      <Card className="bg-white dark:bg-[#111614] border-[#E8E2D9] dark:border-[#29332D] rounded-2xl mb-6 shadow-[0_2px_8px_rgba(28,32,29,0.04)] dark:shadow-sm transition-colors">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3 mb-4">
            <Avatar className="w-10 h-10 border border-[#E8E2D9] dark:border-[#29332D]">
              <AvatarImage src={user?.user_metadata?.avatar_url} />
              <AvatarFallback className="bg-[#EBF2EC] text-[#1C442D] dark:bg-[#1C3024] dark:text-[#D5B16D] text-xs font-semibold">
                {user?.user_metadata?.full_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Textarea
                id="feed-composer-textarea"
                placeholder="What are you reading or thinking about?"
                aria-label="What are you reading or thinking about?"
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                    e.preventDefault();
                    if (!((!postText.trim() && !selectedImage && !selectedBook && !selectedFeeling) || isPosting || createPost.isPending)) {
                      handlePost();
                    }
                  }
                }}
                className="min-h-[80px] border border-[#E8E2D9] dark:border-[#29332D] bg-[#FAF7F2] dark:bg-[#0B0D0C]/70 text-[#1C201D] dark:text-[#F3F0E7] rounded-xl resize-none focus-visible:ring-1 focus-visible:ring-[#1C442D] dark:focus-visible:ring-[#D5B16D] transition-colors text-sm placeholder:text-[#636B65]/70 dark:placeholder:text-[#A5ADA6]/70"
              />
            </div>
          </div>

          {/* Attachment Previews */}
          {(imagePreview || selectedBook || selectedFeeling) && (
            <div className="mb-4 p-3 bg-[#FAF7F2] dark:bg-[#0B0D0C]/80 rounded-xl border border-[#E8E2D9] dark:border-[#29332D]">
              {imagePreview && (
                <div className="relative mb-3">
                  <img src={imagePreview} alt="Preview" className="w-full max-h-60 object-cover rounded-lg border border-[#E8E2D9] dark:border-[#29332D]" />
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label="Remove selected image"
                    className="absolute top-2 right-2 bg-black/70 text-white hover:bg-black/90 rounded-full h-8 w-8 p-0"
                    onClick={() => {
                      setSelectedImage(null);
                      setImagePreview(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {selectedBook && (
                <div className="flex items-start space-x-3 mb-3 p-3 bg-[#EBF2EC]/70 dark:bg-[#16211A]/60 rounded-xl border border-[#C8DBCB] dark:border-[#315C43]/50">
                  <div className="w-16 h-20 bg-[#F4EFEA] dark:bg-[#1C3024] border border-[#E8E2D9] dark:border-[#315C43]/40 rounded flex-shrink-0 flex items-center justify-center overflow-hidden">
                    {selectedBook.cover ? (
                      <img
                        src={selectedBook.cover}
                        alt={selectedBook.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <BookOpen className="w-8 h-8 text-[#1C442D] dark:text-[#D5B16D]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="font-semibold text-[#1C201D] dark:text-[#F3F0E7] text-sm line-clamp-2 mb-1">
                      {selectedBook.title}
                    </h5>
                    <p className="text-xs text-[#636B65] dark:text-[#A5ADA6] mb-1">
                      by {selectedBook.author}
                    </p>
                    {selectedBook.description && (
                      <p className="text-xs text-[#636B65]/90 dark:text-[#A5ADA6]/80 line-clamp-2">
                        {selectedBook.description.length > 120
                          ? selectedBook.description.substring(0, 120) + '...'
                          : selectedBook.description
                        }
                      </p>
                    )}
                    <Badge variant="outline" className="mt-2 text-xs border-[#C8DBCB] dark:border-[#315C43] text-[#1C442D] dark:text-[#D5B16D] bg-white dark:bg-[#111614]">
                      Reading
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label="Remove selected book"
                    onClick={() => setSelectedBook(null)}
                    className="ml-2 rounded-full h-8 w-8 p-0 text-[#636B65] hover:text-[#1C201D] dark:text-[#A5ADA6] dark:hover:text-[#F3F0E7]"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {selectedFeeling && (
                <div className="flex items-center space-x-2 p-2 bg-[#EBF2EC]/70 dark:bg-[#16211A]/60 rounded-xl border border-[#C8DBCB] dark:border-[#315C43]/50">
                  <span className="text-2xl">{selectedFeeling.emoji}</span>
                  <span className="text-sm text-[#1C201D] dark:text-[#F3F0E7]">feeling <span className="font-medium text-[#1C442D] dark:text-[#D5B16D]">{selectedFeeling.label}</span></span>
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label="Remove selected feeling"
                    onClick={() => setSelectedFeeling(null)}
                    className="ml-auto rounded-full h-8 w-8 p-0 text-[#636B65] hover:text-[#1C201D] dark:text-[#A5ADA6] dark:hover:text-[#F3F0E7]"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#E8E2D9] dark:border-[#29332D]">
            <div className="flex flex-wrap sm:flex-nowrap gap-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
                aria-label="Upload post image"
              />
              <Button
                variant="ghost"
                size="sm"
                aria-label="Add image to post"
                className="text-[#636B65] hover:text-[#1C442D] hover:bg-[#EBF2EC] dark:text-[#A5ADA6] dark:hover:text-[#D5B16D] dark:hover:bg-[#1C3024] rounded-lg gap-1.5 text-xs h-8"
                onClick={() => fileInputRef.current?.click()}
              >
                <Image className="w-3.5 h-3.5 text-[#1C442D] dark:text-[#D5B16D]" />
                <span>Add Image</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                aria-label="Add book to post"
                className="text-[#636B65] hover:text-[#1C442D] hover:bg-[#EBF2EC] dark:text-[#A5ADA6] dark:hover:text-[#D5B16D] dark:hover:bg-[#1C3024] rounded-lg gap-1.5 text-xs h-8"
                onClick={() => setShowBookModal(true)}
              >
                <BookOpen className="w-3.5 h-3.5 text-[#1C442D] dark:text-[#D5B16D]" />
                <span>Add Book</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                aria-label="Add feeling to post"
                className="text-[#636B65] hover:text-[#1C442D] hover:bg-[#EBF2EC] dark:text-[#A5ADA6] dark:hover:text-[#D5B16D] dark:hover:bg-[#1C3024] rounded-lg gap-1.5 text-xs h-8"
                onClick={() => setShowEmojiPicker(true)}
              >
                <Smile className="w-3.5 h-3.5 text-[#1C442D] dark:text-[#D5B16D]" />
                <span>Feeling</span>
              </Button>
            </div>
            <Button
              onClick={handlePost}
              disabled={(!postText.trim() && !selectedImage && !selectedBook && !selectedFeeling) || isPosting || createPost.isPending}
              className="bg-[#1C442D] hover:bg-[#143221] text-white dark:bg-[#D5B16D] dark:hover:bg-[#c49f5c] dark:text-[#0B0D0C] font-semibold text-xs h-8 px-4 rounded-xl shadow-xs transition-all disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5 mr-1.5" />
              {isPosting || createPost.isPending ? 'Posting…' : 'Post'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <BookSelectionModal
        isOpen={showBookModal}
        onClose={() => setShowBookModal(false)}
        onSelect={handleBookSelect}
      />

      <EmojiPicker
        isOpen={showEmojiPicker}
        onClose={() => setShowEmojiPicker(false)}
        onSelect={handleFeelingSelect}
      />
    </>
  );
};
