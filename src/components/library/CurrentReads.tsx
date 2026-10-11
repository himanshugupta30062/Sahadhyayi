import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, ArrowRight, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/authHelpers';
import { fetchCurrentReads, updateLastOpenedAt, type CurrentRead } from '@/lib/supabase/userBooks';

const CurrentReads: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: books = [], isLoading, error } = useQuery<CurrentRead[]>({
    queryKey: ['current-reads', user?.id],
    queryFn: fetchCurrentReads,
    enabled: !!user,
  });

  const handleOpen = async (book: CurrentRead) => {
    try {
      await updateLastOpenedAt(book.id);
    } catch (err) {
      console.error('Failed to update last opened time', err);
    }
    navigate(`/book/${book.book_id}`);
  };

  // Unauthenticated fallback
  if (!user) {
    return (
      <Card className="rounded-2xl border border-[#29332D] bg-[#111614] text-[#F3F0E7]">
        <CardContent className="p-8 text-center space-y-4">
          <BookOpen className="w-8 h-8 text-[#D5B16D] mx-auto mb-2" />
          <h3 className="text-base font-semibold text-[#F3F0E7]">Your Current Reads</h3>
          <p className="text-sm text-[#A5ADA6]">Sign in to track your reading progress.</p>
          <Button asChild className="bg-[#D5B16D] hover:bg-[#e4c688] text-black font-semibold rounded-full px-7">
            <Link to="/signin">Sign In</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="p-4 rounded-xl bg-[#111614] border border-[#29332D] animate-pulse flex gap-4">
            <div className="w-14 h-20 sm:w-16 sm:h-24 bg-[#161D19] rounded-lg border border-[#29332D]" />
            <div className="flex-1 space-y-2.5 py-1">
              <div className="h-4 bg-[#161D19] rounded w-3/4" />
              <div className="h-3 bg-[#161D19] rounded w-1/2" />
              <div className="h-2 bg-[#161D19] rounded w-full mt-3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="rounded-2xl border border-[#29332D] bg-[#111614] text-[#F3F0E7]">
        <CardContent className="p-8 text-center space-y-3">
          <BookOpen className="w-8 h-8 text-[#A5ADA6] mx-auto" />
          <h3 className="text-base font-semibold text-[#F3F0E7]">Unable to load reading progress</h3>
          <p className="text-xs text-[#A5ADA6]">A temporary issue prevented loading your books.</p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.location.reload()}
            className="border-[#29332D] bg-[#161D19] text-[#F3F0E7] hover:bg-[#1C2620]"
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (!books || books.length === 0) {
    return (
      <Card className="rounded-2xl border border-[#29332D] bg-[#111614] text-[#F3F0E7]">
        <CardContent className="p-8 text-center space-y-4">
          <BookOpen className="w-8 h-8 text-[#D5B16D] mx-auto mb-1" />
          <h3 className="text-base font-semibold text-[#F3F0E7]">No books in progress</h3>
          <p className="text-sm text-[#A5ADA6]">Start reading a book to see it here.</p>
          <Button asChild className="bg-[#D5B16D] hover:bg-[#e4c688] text-black font-semibold rounded-full px-6">
            <Link to="/library">Start reading a book</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Active reads list matching Image 2 reference
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {books.map((item, idx) => {
        const libBook = Array.isArray(item.books_library) ? item.books_library[0] : item.books_library;
        const bookTitle = libBook?.title || 'Untitled Book';
        const author = libBook?.author || 'Unknown author';
        const coverImage = libBook?.cover_image_url;
        const progressVal = typeof item.progress === 'number' ? Math.round(item.progress) : 0;

        return (
          <div
            key={item.id || item.book_id || idx}
            onClick={() => handleOpen(item)}
            className="group relative flex gap-3.5 p-4 rounded-xl bg-[#111614] hover:bg-[#161D19] border border-[#29332D] hover:border-[#315C43] transition-all duration-200 cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D5B16D]"
            tabIndex={0}
            role="button"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleOpen(item);
              }
            }}
          >
            {/* Book Cover */}
            <div className="w-14 h-20 sm:w-16 sm:h-24 shrink-0 rounded-lg overflow-hidden bg-[#161D19] border border-[#29332D] relative shadow-sm">
              {coverImage ? (
                <img
                  src={coverImage}
                  alt={bookTitle}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[#1A251E] text-[#D5B16D]">
                  <BookOpen className="w-6 h-6" />
                </div>
              )}
            </div>

            {/* Book Info & Progress */}
            <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
              <div>
                <h4 className="font-semibold text-sm text-[#F3F0E7] group-hover:text-[#D5B16D] transition-colors truncate">
                  {bookTitle}
                </h4>
                <p className="text-xs text-[#A5ADA6] truncate mt-0.5">{author}</p>
              </div>

              <div>
                {/* Progress Bar & Percentage */}
                <div className="space-y-1.5">
                  <div className="w-full h-1.5 rounded-full bg-[#1F2922] overflow-hidden">
                    <div
                      className="h-full bg-[#D5B16D] rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.max(0, progressVal))}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-[#A5ADA6]">{progressVal}%</span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#D5B16D] group-hover:text-[#e4c688]">
                      Continue <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* "Add a book / Track your reading" card (Image 2 reference) */}
      <Link
        to="/library"
        className="group flex flex-col items-center justify-center p-6 rounded-xl border border-dashed border-[#29332D] hover:border-[#315C43] bg-[#161D19]/40 hover:bg-[#161D19] transition-all text-center min-h-[110px]"
      >
        <div className="w-8 h-8 rounded-full bg-[#1F2922] group-hover:bg-[#25362A] text-[#D5B16D] flex items-center justify-center mb-2 transition-colors">
          <Plus className="w-4 h-4" />
        </div>
        <span className="text-xs font-semibold text-[#F3F0E7] group-hover:text-[#D5B16D] transition-colors">
          Add a book
        </span>
        <span className="text-[11px] text-[#A5ADA6] mt-0.5">Track your reading</span>
      </Link>
    </div>
  );
};

export default CurrentReads;
