import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Volume2,
  BookOpen,
  ArrowRight,
  Heart,
  Flame,
  Coffee,
  Bookmark,
  X,
} from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { SAMPLE_BOOK_REELS, BookReelItem } from '@/data/sampleSocialPosts';
import { CreateBookReelDialog } from './CreateBookReelDialog';
import { supabase } from '@/integrations/supabase/client-universal';
import { toast } from 'sonner';

interface BookReelsStripProps {
  reels?: BookReelItem[];
  title?: string;
  subtitle?: string;
  className?: string;
}

export const BookReelsStrip: React.FC<BookReelsStripProps> = ({
  reels = SAMPLE_BOOK_REELS,
  title = 'Book Reels & Reader Moments',
  subtitle = 'Swipe through unfiltered 30-second book reactions, margin finds & late-night thoughts',
  className = '',
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedReelIndex, setSelectedReelIndex] = useState<number | null>(null);
  const [activeReaction, setActiveReaction] = useState<{ [reelId: string]: string }>({});
  const [extraLikes, setExtraLikes] = useState<{ [reelId: string]: number }>({});
  const [comments, setComments] = useState<any[]>([]);
  const [commentDraft, setCommentDraft] = useState('');
  const [commentBusy, setCommentBusy] = useState(false);
  const [communityReels, setCommunityReels] = useState<BookReelItem[]>([]);
  const [savedReels, setSavedReels] = useState<Record<string, boolean>>({});
  useEffect(() => {
    let active = true;
    const load = async () => {
      const { data } = await supabase.from('book_reels').select('id,user_id,video_url,caption,book_title,book_author,created_at').order('created_at', { ascending: false }).limit(50);
      if (!active || !data) return;
      const userIds = [...new Set(data.map((item: any) => item.user_id))];
      const { data: profiles } = userIds.length ? await supabase.from('profiles_public').select('id,full_name,username,profile_photo_url').in('id', userIds) : { data: [] };
      const profileMap = new Map((profiles || []).map((profile: any) => [profile.id, profile]));
      const { data: reactions } = await supabase.from('book_reel_reactions').select('reel_id,user_id,emoji').in('reel_id', data.map((item: any) => item.id));
      if (!active) return;
      const currentUser = (await supabase.auth.getUser()).data.user?.id;
      setActiveReaction(Object.fromEntries((reactions || []).filter((reaction: any) => reaction.user_id === currentUser).map((reaction: any) => [reaction.reel_id, reaction.emoji])));
      if (currentUser) { const { data: saves } = await supabase.from('book_reel_saves').select('reel_id').eq('user_id', currentUser); if (active) setSavedReels(Object.fromEntries((saves || []).map((save: any) => [save.reel_id, true]))); }
      setCommunityReels(data.map((item: any) => { const profile: any = profileMap.get(item.user_id); const count = (reactions || []).filter((reaction: any) => reaction.reel_id === item.id).length; return { id: item.id, creatorId: item.user_id, tag: '📚 COMMUNITY REEL', tagColor: 'bg-emerald-700/80 text-white', readerName: profile?.full_name || profile?.username || 'Sahadhyayi Reader', readerHandle: profile?.username || 'reader', readerAvatar: profile?.profile_photo_url || '', bookTitle: item.book_title || 'A reader moment', bookAuthor: item.book_author || '', hook: item.caption, fullQuote: item.caption, moodAudio: 'Community video', imageUrl: '', videoUrl: item.video_url, likesCount: count, commentsCount: 0 }; }));

    };
    void load();
    const refresh = () => void load();
    window.addEventListener('book-reel-published', refresh);
    return () => { active = false; window.removeEventListener('book-reel-published', refresh); };
  }, []);
  const displayedReels = [...communityReels, ...reels];

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const distance = 300;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -distance : distance,
      behavior: 'smooth',
    });
  };

  const activeReel = selectedReelIndex !== null ? displayedReels[selectedReelIndex] : null;
  useEffect(() => {
    let active = true;
    const loadComments = async () => {
      if (!activeReel || !communityReels.some((reel) => reel.id === activeReel.id)) { setComments([]); return; }
      const { data } = await supabase.from('book_reel_comments').select('id,reel_id,user_id,body,created_at').eq('reel_id', activeReel.id).order('created_at', { ascending: true }).limit(100);
      if (!active || !data) return;
      const ids = [...new Set(data.map((item: any) => item.user_id))];
      const { data: profiles } = ids.length ? await supabase.from('profiles_public').select('id,full_name,username,profile_photo_url').in('id', ids) : { data: [] };
      const map = new Map((profiles || []).map((profile: any) => [profile.id, profile]));
      setComments(data.map((item: any) => ({ ...item, profile: map.get(item.user_id) })));
    };
    void loadComments();
    return () => { active = false; };
  }, [activeReel?.id, communityReels]);
  const submitComment = async () => {
    const body = commentDraft.trim();
    if (!body || !activeReel) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error('Sign in to comment.'); return; }
    setCommentBusy(true);
    const { data, error } = await supabase.from('book_reel_comments').insert({ reel_id: activeReel.id, user_id: user.id, body }).select('id,reel_id,user_id,body,created_at').single();
    setCommentBusy(false);
    if (error || !data) { toast.error('Could not post comment. Apply the comments migration first.'); return; }
    const { data: profile } = await supabase.from('profiles_public').select('id,full_name,username,profile_photo_url').eq('id', user.id).maybeSingle();
    setComments((previous) => [...previous, { ...data, profile }]);
    setCommentDraft('');
  };


  const handleNextReel = () => {
    if (selectedReelIndex === null) return;
    setSelectedReelIndex((selectedReelIndex + 1) % displayedReels.length);
  };

  const handlePrevReel = () => {
    if (selectedReelIndex === null) return;
    setSelectedReelIndex((selectedReelIndex - 1 + displayedReels.length) % displayedReels.length);
  };

  const handleSaveReel = async (reelId: string) => {\n    const { data: { user } } = await supabase.auth.getUser();\n    if (!user) { toast.error('Sign in to save reels.'); return; }\n    if (savedReels[reelId]) {\n      const { error } = await supabase.from('book_reel_saves').delete().eq('reel_id', reelId).eq('user_id', user.id);\n      if (error) { toast.error('Could not remove saved reel.'); return; }\n      setSavedReels(prev => { const next = { ...prev }; delete next[reelId]; return next; }); toast.success('Reel removed from saved.');\n    } else {\n      const { error } = await supabase.from('book_reel_saves').insert({ reel_id: reelId, user_id: user.id });\n      if (error) { toast.error('Could not save reel. Apply the saved reels migration first.'); return; }\n      setSavedReels(prev => ({ ...prev, [reelId]: true })); toast.success('Reel saved.');\n    }\n  };\n\n  const handleReaction = async (reelId: string, emoji: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error('Sign in to react to reels.'); return; }
    const existing = activeReaction[reelId];
    if (existing === emoji) {
      const { error } = await supabase.from('book_reel_reactions').delete().eq('reel_id', reelId).eq('user_id', user.id);
      if (error) { toast.error('Could not remove reaction.'); return; }
      setActiveReaction((prev) => { const next = { ...prev }; delete next[reelId]; return next; });
      setExtraLikes((prev) => ({ ...prev, [reelId]: Math.max(0, (prev[reelId] || 0) - 1) }));
      return;
    }
    const { error } = await supabase.from('book_reel_reactions').upsert({ reel_id: reelId, user_id: user.id, emoji }, { onConflict: 'reel_id,user_id' });
    if (error) { toast.error('Could not save reaction. Apply the reactions migration first.'); return; }
    setActiveReaction((prev) => ({ ...prev, [reelId]: emoji }));
    setExtraLikes((prev) => ({ ...prev, [reelId]: (prev[reelId] || 0) + (existing ? 0 : 1) }));
  };

  return (
    <section className={`w-full overflow-hidden ${className}`} aria-label={title}>
      {/* Header with Title and Scroll Arrows */}
      <div className="mb-4 flex items-center justify-between px-1">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#1C442D] dark:text-[#D5B16D]">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>Shorts & Micro-Moments</span>
          </div>
          <h2 className="mt-0.5 font-serif text-lg font-bold text-[#1C201D] dark:text-[#F3F0E7] sm:text-xl">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-0.5 text-xs text-[#636B65] dark:text-[#A5ADA6]">
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1.5"><Button asChild variant="outline" size="sm" className="h-8 gap-1.5"><Link to="/social/reels/saved"><Bookmark className="h-3.5 w-3.5"/>Saved</Link></Button><CreateBookReelDialog /> <div className="hidden items-center gap-1.5 sm:flex">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => scroll('left')}
            className="h-8 w-8 rounded-full border-[#E8E8E3] bg-white text-[#1C201D] hover:bg-[#F4F3EF] dark:border-[#29332D] dark:bg-[#111614] dark:text-[#F3F0E7] dark:hover:bg-[#1B241E]"
            aria-label="Scroll reels left"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => scroll('right')}
            className="h-8 w-8 rounded-full border-[#E8E8E3] bg-white text-[#1C201D] hover:bg-[#F4F3EF] dark:border-[#29332D] dark:bg-[#111614] dark:text-[#F3F0E7] dark:hover:bg-[#1B241E]"
            aria-label="Scroll reels right"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        </div>
      </div>

      {/* Horizontal Carousel */}
      <div
        ref={scrollRef}
        role="region"
        aria-label="Horizontal list of book reels"
        className="flex gap-3.5 overflow-x-auto pb-3 pt-1 outline-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden focus-visible:ring-1 focus-visible:ring-primary/40 rounded-xl"
      >
        {displayedReels.map((reel, index) => {
          const totalLikes = reel.likesCount + (extraLikes[reel.id] || 0);

          return (
            <div
              key={reel.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedReelIndex(index)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelectedReelIndex(index);
                }
              }}
              className="group relative flex h-72 w-48 shrink-0 cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border border-[#E8E8E3] bg-[#101711] p-3.5 text-left text-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-[#1C442D]/50 dark:border-[#29332D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C442D] dark:focus-visible:ring-[#D5B16D]"
            >
              {/* Background Photo */}
              <img
                src={reel.imageUrl}
                alt=""
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />

              {/* Scrim Overlays */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/30" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent" />

              {/* Top: Tag + Audio Icon */}
              <div className="relative z-10 flex items-center justify-between gap-1.5">
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md ${reel.tagColor}`}
                >
                  {reel.tag}
                </span>
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-black/40 text-white/80 backdrop-blur-xs">
                  <Volume2 className="h-3 w-3" />
                </span>
              </div>

              {/* Bottom: Hook + Reader details */}
              <div className="relative z-10 space-y-2">
                <p className="line-clamp-3 text-xs font-semibold leading-relaxed text-white drop-shadow-sm">
                  {reel.hook}
                </p>

                <div className="flex items-center gap-2 border-t border-white/15 pt-2">
                  <Avatar className="h-6 w-6 border border-white/30">
                    <AvatarImage src={reel.readerAvatar} alt={reel.readerName} />
                    <AvatarFallback className="text-[10px] bg-emerald-800 text-white">
                      {reel.readerName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-medium text-white/95">
                      {reel.readerName}
                    </p>
                    <p className="truncate text-[9px] text-white/70">
                      📖 {reel.bookTitle}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold text-amber-300">
                    ♥ {totalLikes}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Full-Screen / Modal Viewer for Selected Reel */}
      <Dialog
        open={selectedReelIndex !== null}
        onOpenChange={(open) => !open && setSelectedReelIndex(null)}
      >
        <DialogContent className="max-w-md overflow-hidden rounded-3xl border border-white/15 bg-[#0B0D0C] p-0 text-white shadow-2xl sm:max-w-lg">
          <DialogTitle className="sr-only">
            {activeReel ? `${activeReel.readerName}'s Book Reel: ${activeReel.bookTitle}` : 'Book Reel'}
          </DialogTitle>
          {activeReel && (
            <div className="relative flex flex-col justify-between overflow-hidden min-h-[580px] p-6">
              {/* Background Aesthetic Image */}
              <img
                src={activeReel.imageUrl}
                alt=""
                className="absolute inset-0 h-full w-full object-cover filter blur-[2px] brightness-50"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B0D0C] via-[#0B0D0C]/75 to-black/60" />

              {/* Top Navigation & Reader Info */}
              <div className="relative z-10 flex items-center justify-between border-b border-white/15 pb-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border-2 border-amber-400/80 shadow-md">
                    <AvatarImage src={activeReel.readerAvatar} alt={activeReel.readerName} />
                    <AvatarFallback className="bg-emerald-900 text-white font-bold">
                      {activeReel.readerName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      {activeReel.readerName}
                      <span className="text-xs font-normal text-white/60">@{activeReel.readerHandle}</span>
                    </h3>
                    <div className="flex items-center gap-1.5 text-[11px] text-amber-300">
                      <Volume2 className="h-3 w-3 animate-pulse" />
                      <span>{activeReel.moodAudio}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${activeReel.tagColor}`}>
                    {activeReel.tag}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedReelIndex(null)}
                    className="h-8 w-8 rounded-full text-white/80 hover:bg-white/10 hover:text-white"
                    aria-label="Close reel viewer"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Center: The Reader's Unfiltered Thought & Quotes */}
              <div className="relative z-10 my-6 space-y-4 rounded-2xl border border-white/10 bg-black/45 p-5 backdrop-blur-md">
                <p className="font-serif text-lg font-bold leading-snug text-amber-100 sm:text-xl">
                  {activeReel.hook}
                </p>
                <p className="whitespace-pre-line text-sm leading-relaxed text-white/90">
                  {activeReel.fullQuote}
                </p>

                {/* Attached Book Card */}
                <div className="flex items-center justify-between gap-3 rounded-xl border border-white/15 bg-white/10 p-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-300">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-white">
                        {activeReel.bookTitle}
                      </p>
                      <p className="truncate text-[11px] text-white/70">
                        {activeReel.bookAuthor}
                      </p>
                    </div>
                  </div>

                  <Link
                    to={`/library?q=${encodeURIComponent(activeReel.bookTitle)}`}
                    onClick={() => setSelectedReelIndex(null)}
                    className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-[#D5B16D] px-2.5 py-1.5 text-xs font-semibold text-[#0B0D0C] transition-colors hover:bg-[#E8CC91]"
                  >
                    <span>View Book</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>

              {/* Bottom: Quick Reaction Emojis & Reel Switcher */}
              <div className="relative z-10 space-y-3 pt-2">
                <div className="rounded-xl border border-white/10 bg-black/30 p-3 space-y-2">
                  <div className="flex items-center justify-between"><span className="text-xs font-semibold text-white">Reader discussion</span><span className="text-[10px] text-white/50">{comments.length} comments</span></div>
                  <div className="max-h-28 space-y-2 overflow-y-auto">
                    {comments.map((comment) => <div key={comment.id} className="text-xs"><span className="font-semibold text-amber-200">{comment.profile?.full_name || comment.profile?.username || 'Reader'} </span><span className="text-white/85 break-words">{comment.body}</span></div>)}
                    {!comments.length && <p className="text-[11px] text-white/50">Be the first to share a thought.</p>}
                  </div>
                  <form onSubmit={(event) => { event.preventDefault(); void submitComment(); }} className="flex gap-2">
                    <input value={commentDraft} onChange={(event) => setCommentDraft(event.target.value)} maxLength={500} placeholder="Add a thoughtful comment…" aria-label="Comment on reel" className="min-w-0 flex-1 rounded-lg border border-white/15 bg-white/10 px-2.5 py-2 text-xs text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-amber-400" />
                    <Button type="submit" size="sm" disabled={commentBusy || !commentDraft.trim()} className="bg-amber-400 text-black hover:bg-amber-300">{commentBusy ? '…' : 'Post'}</Button>
                  </form>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-white/10 px-3 py-2 backdrop-blur-md">
                  <span className="text-xs font-medium text-white/80">React with readers:</span>
                  <div className="flex items-center gap-2">
                    {[
                      { emoji: '❤️', label: 'Love', icon: Heart },
                      { emoji: '😭', label: 'Tears', text: '😭' },
                      { emoji: '☕', label: 'Cozy', icon: Coffee },
                      { emoji: '🔥', label: 'Fire', icon: Flame },
                    ].map((item) => (
                      <button
                        key={item.emoji}
                        type="button"
                        onClick={() => handleReaction(activeReel.id, item.emoji)}
                        aria-label={`React with ${item.label}`}
                        className={`flex h-8 items-center gap-1 rounded-full border px-2.5 text-xs font-bold transition-all ${
                          activeReaction[activeReel.id] === item.emoji
                            ? 'scale-110 border-amber-400 bg-amber-400 text-black'
                            : 'border-white/20 bg-white/5 text-white hover:bg-white/20'
                        }`}
                      >
                        <span>{item.emoji}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handlePrevReel}
                    className="gap-1 text-xs text-white/75 hover:bg-white/10 hover:text-white"
                  >
                    <ChevronLeft className="h-4 w-4" /> Previous
                  </Button>
                  <span className="text-xs text-white/50">
                    {(selectedReelIndex ?? 0) + 1} of {displayedReels.length}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleNextReel}
                    className="gap-1 text-xs text-white/75 hover:bg-white/10 hover:text-white"
                  >
                    Next <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default BookReelsStrip;

