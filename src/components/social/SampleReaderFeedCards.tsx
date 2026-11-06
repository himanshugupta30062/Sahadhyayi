import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Share2, BookOpen, Sparkles, Check, Copy } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SAMPLE_EVERYDAY_POSTS, SampleReaderPost } from '@/data/sampleSocialPosts';
import { toast } from 'sonner';

interface SampleReaderFeedCardsProps {
  posts?: SampleReaderPost[];
  showHeading?: boolean;
  className?: string;
  isGuest?: boolean;
}

export const SampleReaderFeedCards: React.FC<SampleReaderFeedCardsProps> = ({
  posts = SAMPLE_EVERYDAY_POSTS,
  showHeading = true,
  className = '',
  isGuest = false,
}) => {
  const [likes, setLikes] = useState<{ [postId: string]: boolean }>({});
  const [likeCounts, setLikeCounts] = useState<{ [postId: string]: number }>(() =>
    posts.reduce((acc, p) => ({ ...acc, [p.id]: p.likes_count }), {})
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleToggleLike = (postId: string) => {
    const hasLiked = !!likes[postId];
    setLikes((prev) => ({ ...prev, [postId]: !hasLiked }));
    setLikeCounts((prev) => ({
      ...prev,
      [postId]: (prev[postId] || 0) + (hasLiked ? -1 : 1),
    }));
  };

  const handleShare = async (post: SampleReaderPost) => {
    const text = `${post.content.slice(0, 100)}... — ${post.profile.full_name} on Sahadhyayi`;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.origin + '/social');
        setCopiedId(post.id);
        toast.success('Link copied to clipboard!');
        setTimeout(() => setCopiedId(null), 2500);
      }
    } catch {
      toast.info(text);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {showHeading && (
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between px-1">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#1C442D] dark:text-[#D5B16D]">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span>Reader Dispatches</span>
            </div>
            <h2 className="mt-0.5 font-serif text-lg font-bold text-[#1C201D] dark:text-[#F3F0E7] sm:text-xl">
              Unfiltered thoughts from everyday book lovers
            </h2>
          </div>
          {isGuest && (
            <Link
              to="/signup"
              className="text-xs font-semibold text-[#1C442D] hover:underline dark:text-[#D5B16D]"
            >
              Join the conversation &rarr;
            </Link>
          )}
        </div>
      )}

      {posts.map((post) => {
        const isLiked = !!likes[post.id];
        const currentCount = likeCounts[post.id] ?? post.likes_count;

        return (
          <Card
            key={post.id}
            className="overflow-hidden rounded-2xl border border-[#E8E8E3] bg-white text-[#1C201D] shadow-[0_2px_10px_rgba(28,32,29,0.035)] transition-all hover:border-[#C8DBCB] dark:border-[#29332D] dark:bg-[#111614] dark:text-[#F3F0E7] dark:hover:border-[#315C43]"
          >
            <CardContent className="p-4 sm:p-5">
              {/* Post Author Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border border-[#E8E8E3] dark:border-[#29332D]">
                    <AvatarImage src={post.profile.profile_photo_url} alt={post.profile.full_name} />
                    <AvatarFallback className="bg-[#EBF2EC] text-[#1C442D] font-bold dark:bg-[#1C3024] dark:text-[#D5B16D]">
                      {post.profile.full_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-[#1C201D] dark:text-[#F3F0E7]">
                        {post.profile.full_name}
                      </h3>
                      <span className="text-xs text-[#636B65] dark:text-[#A5ADA6]">
                        @{post.profile.username}
                      </span>
                      {post.profile.reader_badge && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] bg-[#FAF7F2] text-[#1C442D] border border-[#E8E8E3] dark:bg-[#1B241E] dark:text-[#D5B16D] dark:border-[#29332D]"
                        >
                          {post.profile.reader_badge}
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-[#8C948E] dark:text-[#78827A]">
                      Recent reader activity
                    </p>
                  </div>
                </div>
              </div>

              {/* Post Content */}
              <p className="mt-3.5 whitespace-pre-line text-sm leading-relaxed text-[#2C332D] dark:text-[#EAE6DD]">
                {post.content}
              </p>

              {/* Optional Post Photo */}
              {post.image_url && (
                <div className="mt-3.5 overflow-hidden rounded-xl border border-[#E8E8E3] bg-[#F4EFEA] dark:border-[#29332D] dark:bg-[#0B0D0C]">
                  <img
                    src={post.image_url}
                    alt={post.image_alt || 'Book moment'}
                    className="max-h-80 w-full object-cover"
                    loading="lazy"
                  />
                </div>
              )}

              {/* Book Link Attachment if any */}
              {post.book && (
                <Link
                  to={`/book/${post.book.id}`}
                  className="mt-3.5 flex items-center justify-between gap-3 rounded-xl border border-[#E8E8E3] bg-[#FAF7F2] p-2.5 transition-colors hover:border-[#1C442D]/40 hover:bg-[#EBF2EC]/50 dark:border-[#29332D] dark:bg-[#161D19]/70 dark:hover:border-[#D5B16D]/40"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-lg">📖</span>
                    <div className="min-w-0 truncate">
                      <p className="truncate text-xs font-semibold text-[#1C442D] dark:text-[#D5B16D]">
                        {post.book.title}
                      </p>
                      <p className="truncate text-[11px] text-[#636B65] dark:text-[#A5ADA6]">
                        {post.book.author}
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 text-[11px] font-semibold text-[#1C442D] dark:text-[#D5B16D]">
                    Find book &rarr;
                  </span>
                </Link>
              )}

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md bg-[#F4F3EF] px-2 py-0.5 text-[11px] text-[#636B65] dark:bg-[#161D19] dark:text-[#A5ADA6]"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Footer Actions: Like, Comment, Share */}
              <div className="mt-4 flex items-center justify-between border-t border-[#F0EFEB] pt-3 text-xs text-[#636B65] dark:border-[#202923] dark:text-[#A5ADA6]">
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => handleToggleLike(post.id)}
                    aria-label={`Like post, currently ${currentCount} likes`}
                    className={`flex items-center gap-1.5 font-medium transition-colors ${
                      isLiked
                        ? 'text-rose-600 dark:text-rose-400 font-bold'
                        : 'hover:text-[#1C442D] dark:hover:text-[#D5B16D]'
                    }`}
                  >
                    <Heart
                      className={`h-4 w-4 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`}
                    />
                    <span>{currentCount}</span>
                  </button>

                  <Link
                    to={isGuest ? '/signup' : '/social'}
                    aria-label={`View ${post.comments_count} reader comments`}
                    className="flex items-center gap-1.5 font-medium hover:text-[#1C442D] dark:hover:text-[#D5B16D] transition-colors"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>{post.comments_count}</span>
                  </Link>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleShare(post)}
                  className="h-8 gap-1.5 px-2 text-xs text-[#636B65] hover:text-[#1C442D] dark:text-[#A5ADA6] dark:hover:text-[#D5B16D]"
                >
                  {copiedId === post.id ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="h-3.5 w-3.5" />
                      <span>Share</span>
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default SampleReaderFeedCards;
