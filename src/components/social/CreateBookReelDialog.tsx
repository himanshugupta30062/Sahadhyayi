import React, { useRef, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client-universal';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useUserBookshelf } from '@/hooks/useUserBookshelf';
import { toast } from 'sonner';
import { Plus, Upload, Loader2, Video, BookOpen, Clock, Tag, Eye, X, Check, Camera } from 'lucide-react';

interface CreateBookReelDialogProps {
  onPublished?: () => void;
}

const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
export const MAX_REEL_DURATION_SECONDS = 10.5; // Strict 10-second limit (with 0.5s tolerance for encoder padding)

const POPULAR_TAGS = [
  '#mustread',
  '#currentread',
  '#bookreview',
  '#favouritepassage',
  '#readingvibe',
  '#spoilersafe',
  '#audioquote',
  '#bookhaul',
];

export function CreateBookReelDialog({ onPublished }: CreateBookReelDialogProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const { data: bookshelf = [] } = useUserBookshelf();

  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [durationSeconds, setDurationSeconds] = useState<number | null>(null);
  const [caption, setCaption] = useState('');
  const [bookTitle, setBookTitle] = useState('');
  const [bookAuthor, setBookAuthor] = useState('');
  const [bookId, setBookId] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>(['#readingvibe']);
  const [customTagInput, setCustomTagInput] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'unlisted' | 'friends'>('public');
  const [showBookshelfPicker, setShowBookshelfPicker] = useState(false);
  const [busy, setBusy] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Clean up object URL when file changes or dialog closes
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const reset = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setFile(null);
    setPreviewUrl(null);
    setDurationSeconds(null);
    setCaption('');
    setBookTitle('');
    setBookAuthor('');
    setBookId(null);
    setSelectedTags(['#readingvibe']);
    setCustomTagInput('');
    setVisibility('public');
    setShowBookshelfPicker(false);
    setValidationError(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleVideoSelect = (selectedFile: File | null) => {
    setValidationError(null);
    if (!selectedFile) return;

    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      const err = 'Please choose an MP4, WebM, or MOV video.';
      setValidationError(err);
      toast.error(err);
      return;
    }

    if (selectedFile.size > MAX_VIDEO_BYTES) {
      const err = 'Video must be 50 MB or smaller.';
      setValidationError(err);
      toast.error(err);
      return;
    }

    // Inspect video duration via in-memory video element
    const objectUrl = URL.createObjectURL(selectedFile);
    const tempVideo = document.createElement('video');
    tempVideo.preload = 'metadata';
    tempVideo.src = objectUrl;

    tempVideo.onloadedmetadata = () => {
      const duration = tempVideo.duration;

      // Mandatory 10-second limit check
      if (duration > MAX_REEL_DURATION_SECONDS) {
        URL.revokeObjectURL(objectUrl);
        const err = `Videos must be 10 seconds or shorter (detected ${duration.toFixed(1)}s). Please trim your clip to 10 seconds.`;
        setValidationError(err);
        toast.error(err);
        setFile(null);
        setPreviewUrl(null);
        setDurationSeconds(null);
        if (fileRef.current) fileRef.current.value = '';
        return;
      }

      setDurationSeconds(Math.min(10, Math.round(duration * 10) / 10));
      setFile(selectedFile);
      setPreviewUrl(objectUrl);
      setValidationError(null);
      toast.success(`Video verified: ${duration.toFixed(1)}s (within 10-second limit).`);
    };

    tempVideo.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      const err = 'Could not read video metadata. Please select a valid video file.';
      setValidationError(err);
      toast.error(err);
      setFile(null);
      setPreviewUrl(null);
    };
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag].slice(0, 5)
    );
  };

  const addCustomTag = () => {
    const raw = customTagInput.trim().replace(/^#/, '');
    if (!raw) return;
    const formatted = `#${raw.toLowerCase()}`;
    if (!selectedTags.includes(formatted)) {
      setSelectedTags((prev) => [...prev, formatted].slice(0, 5));
    }
    setCustomTagInput('');
  };

  const selectBookshelfItem = (item: (typeof bookshelf)[number]) => {
    const title = item.books_library?.title || item.book?.title || '';
    const author = item.books_library?.author || item.book?.author || '';
    setBookTitle(title);
    setBookAuthor(author);
    setBookId(item.book_id || item.books_library?.id || null);
    setShowBookshelfPicker(false);
    toast.success(`Attached "${title}" to your reel.`);
  };

  const publish = async () => {
    if (!file || !caption.trim()) {
      toast.error('Choose a video and add a caption.');
      return;
    }

    if (durationSeconds !== null && durationSeconds > MAX_REEL_DURATION_SECONDS) {
      toast.error(`Reel duration exceeds 10 seconds (${durationSeconds}s).`);
      return;
    }

    if (caption.trim().length > 500) {
      toast.error('Caption must be 500 characters or less.');
      return;
    }

    setBusy(true);
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        toast.error('Sign in to publish a reel.');
        return;
      }

      const ext = file.name.split('.').pop()?.toLowerCase() || 'mp4';
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('book-reels')
        .upload(path, file, { contentType: file.type, upsert: false });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('book-reels').getPublicUrl(path);

      const { error: insertError } = await supabase.from('book_reels').insert({
        user_id: user.id,
        video_url: urlData.publicUrl,
        storage_path: path,
        caption: caption.trim(),
        book_title: bookTitle.trim() || null,
        book_author: bookAuthor.trim() || null,
        book_id: bookId,
        duration_seconds: durationSeconds ?? 10.0,
        tags: selectedTags,
        visibility,
      });

      if (insertError) {
        // Rollback uploaded storage object if database insert failed
        await supabase.storage.from('book-reels').remove([path]);
        throw insertError;
      }

      toast.success('Your 10-second book reel is published!');
      window.dispatchEvent(new Event('book-reel-published'));
      reset();
      setOpen(false);
      onPublished?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Could not publish reel. Please try again.'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!busy) {
          if (!next) reset();
          setOpen(next);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2 rounded-full shadow-sm">
          <Plus className="h-4 w-4" /> Create Reel
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Video className="h-5 w-5 text-amber-500" />
            <span>Create 10-Second Book Reel</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Mandatory 10-Second Banner */}
          <div className="flex items-center justify-between rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2.5 text-xs text-amber-900 dark:text-amber-300">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <span>
                <strong>10-Second Limit:</strong> Keep it punchy! Reels must be 10 seconds or shorter.
              </span>
            </div>
            {durationSeconds !== null && (
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {durationSeconds.toFixed(1)}s / 10s
              </span>
            )}
          </div>

          {/* Video Picker & Preview */}
          <input
            ref={fileRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            className="sr-only"
            onChange={(e) => handleVideoSelect(e.target.files?.[0] ?? null)}
          />

          {!previewUrl ? (
            <div className="space-y-2">
              <div
                role="button"
                tabIndex={0}
                onClick={() => fileRef.current?.click()}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && fileRef.current?.click()}
                className="flex w-full cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-[#E8E8E3] p-7 text-sm transition-colors hover:bg-muted/50 dark:border-[#29332D]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
                  <Upload className="h-6 w-6" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-foreground">Choose or record a 10s video</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    MP4, WebM, MOV · Maximum 50 MB · Max 10.0 seconds
                  </p>
                </div>
              </div>

              {validationError && (
                <p className="text-xs font-medium text-destructive px-1">{validationError}</p>
              )}
            </div>
          ) : (
            <div className="relative overflow-hidden rounded-2xl border bg-black shadow-inner">
              <video
                ref={videoPreviewRef}
                src={previewUrl}
                controls
                playsInline
                loop
                className="aspect-[9/12] max-h-72 w-full object-contain"
              />
              <div className="absolute top-2 left-2 flex items-center gap-2">
                <span className="rounded-full bg-black/70 px-2 py-0.5 text-xs font-semibold text-white backdrop-blur-md">
                  ⏱️ {durationSeconds ? `${durationSeconds.toFixed(1)}s` : 'Verified'}
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={reset}
                className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 text-white hover:bg-black/80"
                aria-label="Remove selected video"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Book Attachment */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5" /> Book Connection
              </label>
              {bookshelf.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowBookshelfPicker(!showBookshelfPicker)}
                  className="text-xs font-medium text-[hsl(var(--brand-primary))] hover:underline"
                >
                  {showBookshelfPicker ? 'Manual entry' : 'Pick from my bookshelf'}
                </button>
              )}
            </div>

            {showBookshelfPicker && bookshelf.length > 0 ? (
              <div className="max-h-40 overflow-y-auto rounded-xl border p-2 space-y-1 bg-muted/30">
                <p className="text-[11px] text-muted-foreground px-1 pb-1">
                  Select a book from your reading shelf:
                </p>
                {bookshelf.map((item) => {
                  const title = item.books_library?.title || item.book?.title || 'Untitled';
                  const author = item.books_library?.author || item.book?.author || '';
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => selectBookshelfItem(item)}
                      className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors hover:bg-muted"
                    >
                      <div className="truncate pr-2">
                        <span className="font-semibold text-foreground">{title}</span>
                        {author && <span className="text-muted-foreground ml-1.5">by {author}</span>}
                      </div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider shrink-0">
                        {item.status.replace(/_/g, ' ')}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Input
                  value={bookTitle}
                  onChange={(e) => setBookTitle(e.target.value)}
                  maxLength={200}
                  placeholder="Book title (e.g. Siddhartha)"
                  className="text-xs"
                />
                <Input
                  value={bookAuthor}
                  onChange={(e) => setBookAuthor(e.target.value)}
                  maxLength={120}
                  placeholder="Author (e.g. Hermann Hesse)"
                  className="text-xs"
                />
              </div>
            )}
          </div>

          {/* Caption */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="create-reel-caption" className="text-xs font-semibold text-muted-foreground">
                Reel Caption / Reaction
              </label>
              <span className="text-[11px] text-muted-foreground">{caption.length}/500</span>
            </div>
            <Textarea
              id="create-reel-caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              maxLength={500}
              placeholder="What did this book make you feel? Share your 10s insight, favorite line, or raw thought… (required)"
              className="min-h-[80px] text-xs resize-none"
            />
          </div>

          {/* Reading Tags */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5" /> Reading Tags (max 5)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {Array.from(new Set([...POPULAR_TAGS, ...selectedTags])).map((tag) => {
                const active = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                      active
                        ? 'bg-[hsl(var(--brand-primary))] text-white'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {tag} {active && '✓'}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2 pt-1">
              <Input
                value={customTagInput}
                onChange={(e) => setCustomTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomTag())}
                placeholder="Add custom tag (e.g. #classics)"
                className="h-8 text-xs flex-1"
                maxLength={30}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addCustomTag}
                className="h-8 text-xs"
              >
                Add Tag
              </Button>
            </div>
          </div>

          {/* Visibility */}
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5" /> Visibility
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'public', label: 'Public', desc: 'All readers' },
                { value: 'friends', label: 'Friends', desc: 'Friends only' },
                { value: 'unlisted', label: 'Unlisted', desc: 'Via link' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setVisibility(opt.value as any)}
                  className={`rounded-xl border p-2 text-center text-xs transition-colors ${
                    visibility === opt.value
                      ? 'border-[hsl(var(--brand-primary))] bg-[hsl(var(--brand-primary)/0.08)] font-semibold text-foreground'
                      : 'border-border bg-card text-muted-foreground hover:bg-muted/50'
                  }`}
                >
                  <p>{opt.label}</p>
                  <span className="text-[10px] text-muted-foreground">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <Button
              onClick={publish}
              disabled={busy || !file || !caption.trim() || !!validationError}
              className="w-full gap-2 font-semibold"
            >
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Publishing 10s Reel…
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Publish 10-Second Reel
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default CreateBookReelDialog;
