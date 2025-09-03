
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
      // Create post in database
      await createPost.mutateAsync({
        content: postText.trim(),
        book_id: selectedBook?.id,
        feeling_emoji: selectedFeeling?.emoji,
        feeling_label: selectedFeeling?.label,
        image_url: imagePreview || undefined, // Use preview URL for now
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
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <>
      <Card className="bg-white shadow-sm border-0 rounded-xl mb-6">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3 mb-4">
            <Avatar className="w-10 h-10">
              <AvatarImage src={user?.user_metadata?.avatar_url} />
              <AvatarFallback className="bg-gradient-to-r from-orange-400 to-amber-500 text-white">
                {user?.user_metadata?.full_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Textarea
                placeholder="What's on your mind?"
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
                className="min-h-[80px] border-0 bg-gray-50 rounded-xl resize-none focus:bg-white"
              />
            </div>
          </div>

          {/* Attachment Previews */}
          {(imagePreview || selectedBook || selectedFeeling) && (
            <div className="mb-4 p-3 bg-gray-50 rounded-xl">
              {imagePreview && (
                <div className="relative mb-3">
                  <img src={imagePreview} alt="Preview" className="w-full max-h-60 object-cover rounded-lg" />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-2 right-2 bg-black/50 text-white hover:bg-black/70"
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
                <div className="flex items-start space-x-3 mb-3 p-3 bg-white rounded-lg border">
                  <div className="w-16 h-20 bg-gradient-to-br from-orange-400 to-amber-500 rounded flex-shrink-0 flex items-center justify-center">
                    {selectedBook.cover ? (
                      <img 
                        src={selectedBook.cover} 
                        alt={selectedBook.title} 
                        className="w-full h-full object-cover rounded" 
                      />
                    ) : (
                      <BookOpen className="w-8 h-8 text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="font-medium text-gray-900 text-sm line-clamp-2 mb-1">
                      {selectedBook.title}
                    </h5>
                    <p className="text-xs text-gray-600 mb-1">
                      by {selectedBook.author}
                    </p>
                    {selectedBook.description && (
                      <p className="text-xs text-gray-500 line-clamp-2">
                        {selectedBook.description.length > 120 
                          ? selectedBook.description.substring(0, 120) + '...'
                          : selectedBook.description
                        }
                      </p>
                    )}
                    <Badge variant="outline" className="mt-2 text-xs">
                      Reading
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedBook(null)}
                    className="ml-2"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {selectedFeeling && (
                <div className="flex items-center space-x-2 mb-3">
                  <span className="text-2xl">{selectedFeeling.emoji}</span>
                  <span className="text-sm text-gray-600">feeling {selectedFeeling.label}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedFeeling(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap sm:flex-nowrap gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:text-gray-700"
                onClick={() => fileInputRef.current?.click()}
              >
                <Image className="w-4 h-4 mr-1" />
                Photo
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowBookModal(true)}
              >
                <BookOpen className="w-4 h-4 mr-1" />
                Book
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowEmojiPicker(true)}
              >
                <Smile className="w-4 h-4 mr-1" />
                Feeling
              </Button>
            </div>
            <Button
              onClick={handlePost}
              disabled={(!postText.trim() && !selectedImage && !selectedBook && !selectedFeeling) || isPosting || createPost.isPending}
              className="bg-orange-600 hover:bg-orange-700 rounded-xl w-full sm:w-auto mt-2 sm:mt-0"
            >
              <Send className="w-4 h-4 mr-1" />
              {isPosting || createPost.isPending ? 'Posting...' : 'Post'}
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
