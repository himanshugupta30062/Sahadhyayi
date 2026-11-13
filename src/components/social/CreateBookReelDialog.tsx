import { useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client-universal';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Plus, Upload, Loader2, Video } from 'lucide-react';

interface CreateBookReelDialogProps { onPublished?: () => void; }
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
const MAX_VIDEO_SECONDS = 10;
const ALLOWED_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

export function CreateBookReelDialog({ onPublished }: CreateBookReelDialogProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [bookTitle, setBookTitle] = useState('');
  const [bookAuthor, setBookAuthor] = useState('');
  const [busy, setBusy] = useState(false);
  const [checkingDuration, setCheckingDuration] = useState(false);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);

  const reset = () => { setFile(null); setVideoDuration(null); setCaption(''); setBookTitle(''); setBookAuthor(''); };

  const selectVideo = (selected: File | undefined) => {
    setFile(null); setVideoDuration(null);
    if (!selected) return;
    if (!ALLOWED_TYPES.includes(selected.type)) { toast.error('Use an MP4, WebM, or MOV video.'); return; }
    if (selected.size > MAX_VIDEO_BYTES) { toast.error('Video must be 50 MB or smaller.'); return; }
    setCheckingDuration(true);
    const video = document.createElement('video');
    const objectUrl = URL.createObjectURL(selected);
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(objectUrl);
      setCheckingDuration(false);
      if (!Number.isFinite(video.duration) || video.duration <= 0) { toast.error('Could not read video duration. Try another file.'); return; }
      if (video.duration > MAX_VIDEO_SECONDS + 0.05) { setFile(null); if (fileRef.current) fileRef.current.value = ''; toast.error('Book reels must be 10 seconds or shorter. Trim your video and try again.'); return; }
      setFile(selected);
      setVideoDuration(video.duration);
      toast.success('Video ready (10 seconds max).');
    };
    video.onerror = () => { URL.revokeObjectURL(objectUrl); setCheckingDuration(false); toast.error('Could not read video duration. Try another file.'); };
    video.src = objectUrl;
  };

  const publish = async () => {
    if (!file || !caption.trim()) { toast.error('Choose a video and add a caption.'); return; }
    if (!ALLOWED_TYPES.includes(file.type)) { toast.error('Use an MP4, WebM, or MOV video.'); return; }
    if (file.size > MAX_VIDEO_BYTES) { toast.error('Video must be 50 MB or smaller.'); return; }
    if (caption.trim().length > 500) { toast.error('Caption must be 500 characters or less.'); return; }
    setBusy(true);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) { toast.error('Sign in to publish a reel.'); return; }
      const ext = file.name.split('.').pop()?.toLowerCase() || 'mp4';
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('book-reels').upload(path, file, { contentType: file.type, upsert: false });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('book-reels').getPublicUrl(path);
      const { error: insertError } = await supabase.from('book_reels').insert({
        user_id: user.id, video_url: urlData.publicUrl, storage_path: path,
        caption: caption.trim(), book_title: bookTitle.trim() || null, book_author: bookAuthor.trim() || null,
      });
      if (insertError) {
        await supabase.storage.from('book-reels').remove([path]);
        throw insertError;
      }
      toast.success('Your book reel is published!');\n      window.dispatchEvent(new Event('book-reel-published'));
      reset(); setOpen(false); onPublished?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not publish reel. Please try again.');
    } finally { setBusy(false); }
  };

  return <Dialog open={open} onOpenChange={(next) => { if (!busy) setOpen(next); }}>
    <DialogTrigger asChild><Button size="sm" className="gap-2 rounded-full"><Plus className="h-4 w-4" /> Create Reel</Button></DialogTrigger>
    <DialogContent className="sm:max-w-md">
      <DialogHeader><DialogTitle className="flex items-center gap-2"><Video className="h-5 w-5" /> Create a book reel</DialogTitle></DialogHeader>
      <div className="space-y-4">
        <input ref={fileRef} type="file" accept="video/mp4,video/webm,video/quicktime" className="sr-only" onChange={(e) => selectVideo(e.target.files?.[0])} />
        <button type="button" onClick={() => fileRef.current?.click()} className="flex w-full flex-col items-center gap-2 rounded-xl border border-dashed p-6 text-sm hover:bg-muted/50">
          <Upload className="h-6 w-6" /><span>{file ? file.name : checkingDuration ? 'Checking video duration…' : 'Choose video (MP4, WebM, MOV)'}</span><span className="text-xs text-muted-foreground">Maximum 50 MB · 10 seconds</span>{videoDuration !== null && <span className="text-xs font-medium text-emerald-600">{videoDuration.toFixed(2)}s / 10s</span>}
        </button>
        <Textarea value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={500} placeholder="What did this book make you feel? (required)" />
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Input value={bookTitle} onChange={(e) => setBookTitle(e.target.value)} maxLength={200} placeholder="Book title (optional)" />
          <Input value={bookAuthor} onChange={(e) => setBookAuthor(e.target.value)} maxLength={120} placeholder="Author (optional)" />
        </div>
        <p className="text-xs text-muted-foreground">Book reels are limited to 10 seconds and 50 MB. Share original content or content you have permission to post. Reels are public.</p>
        <Button onClick={publish} disabled={busy || checkingDuration || !file || !caption.trim()} className="w-full">{busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Publishing…</> : 'Publish Reel'}</Button>
      </div>
    </DialogContent>
  </Dialog>;
}
