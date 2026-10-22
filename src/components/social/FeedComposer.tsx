
import React, { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Image, BookOpen, Smile, Send, X, Quote } from 'lucide-react';
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
  const [postKind, setPostKind] = useState<'post' | 'quote'>('post');
  const [quoteText, setQuoteText] = useState('');
  const [quoteAuthor, setQuoteAuthor] = useState('');
  const [quoteSource, setQuoteSource] = useState('');
  const [quoteContext, setQuoteContext] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageAlt, setImageAlt] = useState('');
  const [selectedBook, setSelectedBook] = useState<SelectedBook | null>(null);
  const [selectedFeeling, setSelectedFeeling] = useState<SelectedFeeling | null>(null);
  const [audience, setAudience] = useState<'public' | 'followers' | 'friends' | 'private'>('friends');
  const [showBookModal, setShowBookModal] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Accept common raster formats; don't trust the filename extension or a generic
    // image/* browser filter as upload validation.
    const allowedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);
    if (!allowedImageTypes.has(file.type)) {
      toast({ title: 'Unsupported image format', description: 'Choose a JPEG, PNG, WebP, or AVIF image.', variant: 'destructive' });
      event.target.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Image too large', description: 'Please select an image under 5MB', variant: 'destructive' });
      event.target.value = '';
      return;
    }

    setSelectedImage(file);
    setImageAlt('');
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.onerror = () => {
      setSelectedImage(null);
      setImagePreview(null);
      toast({ title: 'Could not preview image', description: 'Choose another image or try again.', variant: 'destructive' });
    };
    reader.readAsDataURL(file);
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
    setImageAlt('');
    setSelectedBook(null);
    setSelectedFeeling(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePost = async () => {
    const hasPostContent = postKind === 'quote'
      ? Boolean(quoteText.trim())
      : Boolean(postText.trim() || selectedImage || selectedBook || selectedFeeling);

    if (!hasPostContent) {
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
        post_kind: postKind,
        quote_text: postKind === 'quote' ? quoteText.trim() : undefined,
        quote_author: postKind === 'quote' ? quoteAuthor.trim() : undefined,
        quote_source: postKind === 'quote' ? quoteSource.trim() : undefined,
        quote_context: postKind === 'quote' ? quoteContext.trim() : undefined,
        book_id: selectedBook?.id,
        feeling_emoji: selectedFeeling?.emoji,
        feeling_label: selectedFeeling?.label,
        image_url: uploadedImageUrl,
        image_alt: selectedImage ? imageAlt.trim().slice(0, 250) || null : null,
        audience,
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
      setPostKind('post');
      setQuoteText('');
      setQuoteAuthor('');
      setQuoteSource('');
      setQuoteContext('');
      setAudience('friends');
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
          <div className="mb-4 flex items-center gap-1 rounded-xl bg-[#F4EFEA] p-1 dark:bg-[#0B0D0C] w-fit" role="group" aria-label="Choose what to share">
            <Button type="button" size="sm" variant={postKind === 'post' ? 'default' : 'ghost'} aria-pressed={postKind === 'post'} onClick={() => setPostKind('post')} className={postKind === 'post' ? 'bg-[#1C442D] text-white hover:bg-[#153221] dark:bg-[#D5B16D] dark:text-[#0B0D0C]' : 'text-[#636B65] dark:text-[#A5ADA6]'}>
              <Image className="mr-1.5 h-3.5 w-3.5" /> Post
            </Button>
            <Button type="button" size="sm" variant={postKind === 'quote' ? 'default' : 'ghost'} aria-pressed={postKind === 'quote'} onClick={() => setPostKind('quote')} className={postKind === 'quote' ? 'bg-[#1C442D] text-white hover:bg-[#153221] dark:bg-[#D5B16D] dark:text-[#0B0D0C]' : 'text-[#636B65] dark:text-[#A5ADA6]'}>
              <Quote className="mr-1.5 h-3.5 w-3.5" /> Quote card
            </Button>
          </div>

          {postKind === 'quote' ? (
            <div className="mb-4 space-y-3">
              <div className="rounded-2xl border border-[#C8DBCB] bg-gradient-to-br from-[#F7F2E9] via-[#FFFCF7] to-[#EAF1E8] p-5 dark:border-[#315C43] dark:from-[#16211A] dark:via-[#111614] dark:to-[#1C3024]">
                <div className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#1C442D] dark:text-[#D5B16D]">
                  <Quote className="h-4 w-4" /> A passage worth keeping
                </div>
                <Textarea value={quoteText} onChange={(event) => setQuoteText(event.target.value.slice(0, 500))} maxLength={500} aria-label="Quote text" placeholder="Add a short quote that stayed with you…" className="min-h-[110px] resize-y border-0 bg-transparent p-0 font-serif text-lg leading-relaxed text-[#1C201D] shadow-none placeholder:text-[#636B65]/60 focus-visible:ring-0 dark:text-[#F3F0E7]" />
                <div className="mt-2 flex justify-end text-[10px] text-[#636B65] dark:text-[#A5ADA6]">{quoteText.length}/500</div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <input value={quoteAuthor} onChange={(event) => setQuoteAuthor(event.target.value.slice(0, 120))} maxLength={120} aria-label="Quote author" placeholder="Author / speaker (optional)" className="min-w-0 rounded-lg border border-[#D9DFD5] bg-white/70 px-3 py-2 text-xs text-[#1C201D] outline-none focus:ring-2 focus:ring-[#1C442D] dark:border-[#315C43] dark:bg-[#0B0D0C]/70 dark:text-[#F3F0E7] dark:focus:ring-[#D5B16D]" />
                  <input value={quoteSource} onChange={(event) => setQuoteSource(event.target.value.slice(0, 160))} maxLength={160} aria-label="Quote source" placeholder="Book / source / page (optional)" className="min-w-0 rounded-lg border border-[#D9DFD5] bg-white/70 px-3 py-2 text-xs text-[#1C201D] outline-none focus:ring-2 focus:ring-[#1C442D] dark:border-[#315C43] dark:bg-[#0B0D0C]/70 dark:text-[#F3F0E7] dark:focus:ring-[#D5B16D]" />
                </div>
              </div>
              <Textarea value={quoteContext} onChange={(event) => setQuoteContext(event.target.value.slice(0, 1000))} maxLength={1000} aria-label="Why this quote matters" placeholder="Why does it matter to you? What person, memory, or situation does it remind you of? (optional)" className="min-h-[72px] resize-y rounded-xl border-[#E8E2D9] bg-[#FAF7F2] text-sm dark:border-[#29332D] dark:bg-[#0B0D0C]/70" />
              <p className="text-[11px] text-[#636B65] dark:text-[#A5ADA6]">Add attribution when known. Your reflection gives the quote personal meaning; you can link it to a book below.</p>
            </div>
          ) : null}

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
                placeholder={postKind === 'quote' ? 'Add your reflection (optional)…' : 'What are you reading or thinking about?'}
                aria-label={postKind === 'quote' ? 'Reflection on the quote' : 'What are you reading or thinking about?'}
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                    e.preventDefault();
                    const hasContent = postKind === 'quote'
                      ? Boolean(quoteText.trim())
                      : Boolean(postText.trim() || selectedImage || selectedBook || selectedFeeling);
                    if (hasContent && !isPosting && !createPost.isPending) {
                      void handlePost();
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
                  <img src={imagePreview} alt={imageAlt.trim() || 'Selected image preview'} className="max-h-80 w-full rounded-lg border border-[#E8E2D9] bg-[#F4EFEA] object-contain dark:border-[#29332D] dark:bg-[#0B0D0C]" />
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label="Remove selected image"
                    className="absolute top-2 right-2 bg-black/70 text-white hover:bg-black/90 rounded-full h-8 w-8 p-0"
                    onClick={() => {
                      setSelectedImage(null);
                      setImagePreview(null);
                      setImageAlt('');
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <label htmlFor="post-image-alt" className="mb-1 block text-xs font-medium text-[#636B65] dark:text-[#A5ADA6]">
                  Describe this image (optional)
                </label>
                <input
                  id="post-image-alt"
                  value={imageAlt}
                  onChange={(event) => setImageAlt(event.target.value.slice(0, 250))}
                  maxLength={250}
                  placeholder="E.g. A highlighted passage in a paperback"
                  className="mb-3 w-full rounded-lg border border-[#E8E2D9] bg-white px-3 py-2 text-xs text-[#1C201D] outline-none focus:ring-2 focus:ring-[#1C442D] dark:border-[#29332D] dark:bg-[#111614] dark:text-[#F3F0E7] dark:focus:ring-[#D5B16D]"
                />
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

          <div className="flex flex-col sm:flex-row sm:items-center gap-2 py-3">
            <label htmlFor="post-audience" className="text-xs font-medium text-[#636B65] dark:text-[#A5ADA6]">
              Who can see this post?
            </label>
            <select
              id="post-audience"
              value={audience}
              onChange={(event) => setAudience(event.target.value as 'public' | 'followers' | 'friends' | 'private')}
              className="w-full sm:w-auto rounded-lg border border-[#E8E2D9] dark:border-[#29332D] bg-[#FAF7F2] dark:bg-[#111614] text-[#1C201D] dark:text-[#F3F0E7] px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1C442D] dark:focus:ring-[#D5B16D]"
            >
              <option value="public">Public · any signed-in reader</option>
              <option value="followers">Followers · readers who follow you</option>
              <option value="friends">Friends · mutual friends only</option>
              <option value="private">Only me · private</option>
            </select>
            <span className="text-[11px] text-[#636B65] dark:text-[#A5ADA6]">
              New posts default to Friends.
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#E8E2D9] dark:border-[#29332D]">
            <div className="flex flex-wrap sm:flex-nowrap gap-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
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
              disabled={(postKind === 'quote' ? !quoteText.trim() : (!postText.trim() && !selectedImage && !selectedBook && !selectedFeeling)) || isPosting || createPost.isPending}
              className="bg-[#1C442D] hover:bg-[#143221] text-white dark:bg-[#D5B16D] dark:hover:bg-[#c49f5c] dark:text-[#0B0D0C] font-semibold text-xs h-8 px-4 rounded-xl shadow-xs transition-all disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5 mr-1.5" />
              {isPosting || createPost.isPending ? 'Sharing…' : postKind === 'quote' ? 'Share quote' : 'Post'}
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
