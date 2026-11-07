import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Heart,
  MessageCircle,
  Repeat2,
  Share2,
  BookOpen,
  ArrowRight,
  Sparkles,
  UserPlus,
  Quote,
  Flame,
} from 'lucide-react';
import { useSocialPosts, type SocialPost } from '@/hooks/useSocialPosts';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { safeFormatDistanceToNow } from '@/lib/dateUtils';
import { useAuth } from '@/contexts/authHelpers';
import { useToast } from '@/hooks/use-toast';

const CURATED_COMMUNITY_FALLBACK_POSTS: SocialPost[] = [
  {
    id: 'sample-post-1',
    user_id: 'user-sample-1',
    content:
      'Re-reading Tagore’s Gitanjali on quiet mornings. There is a transcendent simplicity in song 35: "Where the mind is without fear and the head is held high..." Sahadhyayi’s margin notes feature makes pausing and reflecting effortless.',
    post_kind: 'quote',
    quote_text: 'Where the mind is without fear and the head is held high...',
    quote_author: 'Rabindranath Tagore',
    quote_source: 'Gitanjali',
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    likes_count: 24,
    comments_count: 6,
    reposts_count: 3,
    profiles: {
      id: 'user-sample-1',
      full_name: 'Ananya Sharma',
      username: 'ananya_reads',
      profile_photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80',
    },
    books_library: {
      id: 'book-sample-1',
      title: 'Gitanjali: Song Offerings',
      author: 'Rabindranath Tagore',
      cover_image_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=300&q=80',
    },
  },
  {
    id: 'sample-post-2',
    user_id: 'user-sample-2',
    content:
      'Just finished Godaan by Munshi Premchand. The tragic nobility of Hori Mahato and the unflinching look at agrarian debt in 1930s India remains as moving today as when it was written. Who else is in the Premchand reading sprint?',
    post_kind: 'post',
    created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    likes_count: 38,
    comments_count: 11,
    reposts_count: 5,
    profiles: {
      id: 'user-sample-2',
      full_name: 'Vikramaditya Roy',
      username: 'vikram_roy',
      profile_photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80',
    },
    books_library: {
      id: 'book-sample-2',
      title: 'Godaan (The Gift of a Cow)',
      author: 'Munshi Premchand',
      cover_image_url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=300&q=80',
    },
  },
  {
    id: 'sample-post-3',
    user_id: 'user-sample-3',
    content:
      'Asked the Book Expert AI to compare the stoic philosophy in Marcus Aurelius’ Meditations with the Karma Yoga passages of the Bhagavad Gita. The thematic synthesis it provided on duty without attachment was remarkably lucid.',
    post_kind: 'post',
    created_at: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    likes_count: 45,
    comments_count: 9,
    reposts_count: 8,
    profiles: {
      id: 'user-sample-3',
      full_name: 'Priyanka Sen',
      username: 'sen_priyanka',
      profile_photo_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=160&q=80',
    },
    books_library: {
      id: 'book-sample-3',
      title: 'Meditations',
      author: 'Marcus Aurelius',
      cover_image_url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=300&q=80',
    },
  },
];

export const HomeSocialFeedPreview: React.FC = () => {
  const { posts: livePosts, isLoading } = useSocialPosts('community');
  const { user } = useAuth();
  const { toast } = useToast();
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});

  // Use real posts from database when available; fallback gracefully to curated community examples
  const displayPosts: SocialPost[] =
    livePosts && livePosts.length >= 2
      ? livePosts.slice(0, 3)
      : CURATED_COMMUNITY_FALLBACK_POSTS;

  const handleToggleLike = (postId: string) => {
    setLikedPosts((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  const handleShare = async (post: SocialPost) => {
    const shareUrl = `${window.location.origin}/social#post-${post.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Post by ${post.profiles?.full_name || 'Reader'} on Sahadhyayi`,
          text: post.content.slice(0, 120),
          url: shareUrl,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: 'Post link copied',
        description: 'Share this post link with fellow readers.',
      });
    }
  };

  return (
    <section
      className="home-social-feed-preview relative isolate py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-[#F4F3EF] dark:bg-[#0B0D0C] text-[#1C201D] dark:text-[#F3F0E7] transition-colors duration-300 overflow-hidden"
      aria-label="The Social Reading Experience"
    >
      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12 sm:mb-14">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.22em] text-[#8F681C] dark:text-[#D5B16D] mb-3">
              <span aria-hidden="true" className="h-px w-7 bg-[#8F681C] dark:bg-[#D5B16D]" />
              <span>04 / The community</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-[#1C201D] dark:text-[#F3F0E7] tracking-tight">
              The social reading experience
            </h2>
            <p className="mt-2.5 text-sm sm:text-base text-[#636B65] dark:text-[#A5ADA6] leading-relaxed">
              Real posts from fellow readers. Share reflections, discuss book passages, follow inspiring readers, and see what the literary world is talking about.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-end">
            <Link
              to="/social"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1C442D] hover:bg-[#143221] dark:bg-[#D5B16D] dark:hover:bg-[#e4c688] text-white dark:text-stone-950 font-semibold text-xs sm:text-sm transition-all shadow-sm group"
            >
              <span>Explore full community feed</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>

        {/* 3 Editorial Post Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-7">
          {displayPosts.map((post) => {
            const authorName = post.profiles?.full_name || post.profiles?.username || 'Fellow Reader';
            const username = post.profiles?.username ? `@${post.profiles.username}` : '@reader';
            const avatarUrl = post.profiles?.profile_photo_url;
            const book = post.books_library;
            const isLiked = likedPosts[post.id] ?? post.user_liked;
            const displayLikes = (post.likes_count || 0) + (likedPosts[post.id] ? 1 : 0);

            return (
              <article
                key={post.id}
                className="flex flex-col justify-between rounded-2xl bg-white dark:bg-[#111413] border border-[#E8E8E3] hover:border-[#BDA56B]/60 dark:border-[#222824] dark:hover:border-[#D5B16D]/50 p-6 sm:p-7 shadow-[0_2px_12px_rgba(28,32,29,0.04)] dark:shadow-none transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
              >
                <div>
                  {/* Author Header */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10 border border-[#E8E8E3] dark:border-[#29332D]">
                        <AvatarImage src={avatarUrl} alt={authorName} />
                        <AvatarFallback className="bg-[#EBF2EC] dark:bg-[#1E2721] text-[#1C442D] dark:text-[#D5B16D] font-semibold text-xs">
                          {authorName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-[#1C201D] dark:text-[#F3F0E7] truncate leading-tight">
                          {authorName}
                        </h4>
                        <p className="text-[11px] text-[#636B65] dark:text-[#A5ADA6] truncate">
                          {username} · {safeFormatDistanceToNow(post.created_at)}
                        </p>
                      </div>
                    </div>

                    <Link
                      to="/social"
                      className="text-[11px] font-semibold text-[#1C442D] dark:text-[#D5B16D] hover:underline shrink-0"
                    >
                      Follow
                    </Link>
                  </div>

                  {/* Book Reference Tag (if attached) */}
                  {book && (
                    <div className="mb-3.5 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#F8F7F3] dark:bg-[#161D19] border border-[#E8E2D9] dark:border-[#28352D] text-xs max-w-full">
                      <BookOpen className="w-3.5 h-3.5 text-[#8F681C] dark:text-[#D5B16D] shrink-0" />
                      <span className="font-semibold text-[#1C201D] dark:text-[#F3F0E7] truncate">
                        {book.title}
                      </span>
                      {book.author && (
                        <span className="text-[#636B65] dark:text-[#A5ADA6] truncate hidden sm:inline">
                          · {book.author}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Quote Snippet (if kind is quote) */}
                  {post.quote_text && (
                    <blockquote className="mb-3 pl-3 border-l-2 border-[#8F681C] dark:border-[#D5B16D] text-xs font-serif italic text-[#1C201D] dark:text-[#F3F0E7] leading-relaxed">
                      "{post.quote_text}"
                      {post.quote_author && (
                        <cite className="block text-[11px] not-italic text-[#636B65] dark:text-[#A5ADA6] mt-1 font-sans">
                          — {post.quote_author}
                        </cite>
                      )}
                    </blockquote>
                  )}

                  {/* Post Content */}
                  <p className="text-xs sm:text-sm text-[#1C201D]/90 dark:text-[#E4E1D8] leading-relaxed whitespace-pre-wrap">
                    {post.content}
                  </p>
                </div>

                {/* Footer Interactions */}
                <div className="mt-6 pt-4 border-t border-[#E8E8E3] dark:border-[#222824] flex items-center justify-between text-xs text-[#636B65] dark:text-[#A5ADA6]">
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => handleToggleLike(post.id)}
                      className={`inline-flex items-center gap-1.5 transition-colors ${
                        isLiked ? 'text-rose-600 dark:text-rose-400 font-semibold' : 'hover:text-[#1C201D] dark:hover:text-[#F3F0E7]'
                      }`}
                      aria-label="Like post"
                    >
                      <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                      <span>{displayLikes}</span>
                    </button>

                    <Link
                      to="/social"
                      className="inline-flex items-center gap-1.5 hover:text-[#1C201D] dark:hover:text-[#F3F0E7] transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>{post.comments_count || 0}</span>
                    </Link>

                    <span className="inline-flex items-center gap-1 text-[11px]">
                      <Repeat2 className="w-3.5 h-3.5" />
                      <span>{post.reposts_count || 0}</span>
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleShare(post)}
                    className="p-1 rounded hover:bg-[#F4F3EF] dark:hover:bg-[#1E2420] text-[#636B65] dark:text-[#A5ADA6] transition-colors"
                    aria-label="Share post"
                    title="Share post"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        {/* Live Discussion Strip */}
        <div className="mt-8 sm:mt-10 p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#111413] border border-[#E8E8E3] dark:border-[#222824] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="w-9 h-9 rounded-xl bg-[#EBF2EC] dark:bg-[#181C1A] text-[#1C442D] dark:text-[#D5B16D] flex items-center justify-center shrink-0">
              <Flame className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-semibold text-[#1C201D] dark:text-[#F3F0E7]">
                Trending Discussion: "Which translated classic changed the way you see human nature?"
              </p>
              <p className="text-[11px] text-[#636B65] dark:text-[#A5ADA6]">
                32 readers contributing thoughts right now in Book Discussions.
              </p>
            </div>
          </div>
          <Link
            to="/social?tab=threads"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-[#1C442D] hover:bg-[#EBF2EC] dark:text-[#D5B16D] dark:hover:bg-[#1E2420] transition-colors shrink-0"
          >
            <span>Join discussion</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HomeSocialFeedPreview;

