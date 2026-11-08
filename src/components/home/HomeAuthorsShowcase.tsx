import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  BookOpen,
  ArrowRight,
  UserCheck,
  Calendar,
  PenTool,
  Star,
  Award,
} from 'lucide-react';
import { useAuthors, type Author } from '@/hooks/useAuthors';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const CURATED_AUTHORS_SHOWCASE: Partial<Author>[] = [
  {
    id: 'author-premchand',
    name: 'Munshi Premchand',
    bio: 'Pioneering figure of modern Hindi-Urdu literature, renowned for realistic depictions of rural India, socioeconomic injustice, and humanist compassion.',
    genre: 'Social Realism, Fiction',
    image_url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=300&q=80',
    books_count: 14,
    rating: 4.9,
    verified: true,
  },
  {
    id: 'author-tagore',
    name: 'Rabindranath Tagore',
    bio: 'Nobel laureate, poet, philosopher, and polymath whose verses and dramas reshaped Bengali literature and music across the world.',
    genre: 'Poetry, Philosophy, Drama',
    image_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    books_count: 22,
    rating: 5.0,
    verified: true,
  },
  {
    id: 'author-kalam',
    name: 'Dr. A.P.J. Abdul Kalam',
    bio: 'Visionary scientist, author of Wings of Fire and Ignited Minds, and India’s 11th President who ignited youthful curiosity and scientific inquiry.',
    genre: 'Science, Autobiography, Leadership',
    image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    books_count: 8,
    rating: 4.9,
    verified: true,
  },
];

export const HomeAuthorsShowcase: React.FC = () => {
  const { data: rawAuthors = [] } = useAuthors();
  const authors: Partial<Author>[] =
    rawAuthors && rawAuthors.length >= 3 ? rawAuthors.slice(0, 3) : CURATED_AUTHORS_SHOWCASE;

  return (
    <section
      className="home-authors-showcase relative isolate py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-[#0B0D0C] text-[#1C201D] dark:text-[#F3F0E7] transition-colors duration-300 border-t border-[#E8E8E3] dark:border-[#222824]"
      aria-label="Discover Authors & Literary Experts"
    >
      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12 sm:mb-14">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.22em] text-[#8F681C] dark:text-[#D5B16D] mb-3">
              <span aria-hidden="true" className="h-px w-7 bg-[#8F681C] dark:bg-[#D5B16D]" />
              <span>08 / Literary voices</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-[#1C201D] dark:text-[#F3F0E7] tracking-tight">
              Discover authors & literary minds
            </h2>
            <p className="mt-2.5 text-sm sm:text-base text-[#636B65] dark:text-[#A5ADA6] leading-relaxed">
              Explore profiles of legendary authors, modern creators, reviewers, scientists, and thinkers. Connect with writers through Author Connect and discover books curated by the voices who wrote them.
            </p>
          </div>

          <Link
            to="/authors"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#1C442D] hover:text-[#2D5A40] dark:text-[#D5B16D] dark:hover:text-[#e4c688] transition-colors self-start md:self-end group"
          >
            <span>Browse all authors & experts</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* 3 Author Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-7 mb-10">
          {authors.map((author) => {
            const authorHref = `/authors/${author.id || encodeURIComponent(author.name || 'author')}`;
            return (
              <div
                key={author.id || author.name}
                className="group flex flex-col justify-between rounded-2xl bg-[#FAFAF8] dark:bg-[#111413] border border-[#E8E8E3] hover:border-[#BDA56B]/60 dark:border-[#222824] dark:hover:border-[#D5B16D]/50 p-6 sm:p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
              >
                <div>
                  <div className="flex items-start gap-4 mb-4">
                    <Avatar className="w-16 h-16 rounded-2xl border-2 border-white dark:border-[#222824] shadow-sm shrink-0">
                      <AvatarImage src={author.image_url} alt={author.name} />
                      <AvatarFallback className="bg-[#EBF2EC] dark:bg-[#1C2620] text-[#1C442D] dark:text-[#D5B16D] font-serif text-lg font-bold">
                        {author.name?.charAt(0) || 'A'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-serif text-lg font-bold text-[#1C201D] dark:text-[#F3F0E7] truncate leading-tight group-hover:text-[#1C442D] dark:group-hover:text-[#D5B16D] transition-colors">
                          <Link to={authorHref}>{author.name}</Link>
                        </h3>
                        {author.verified && (
                          <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs font-medium text-[#8F681C] dark:text-[#D5B16D] mt-0.5 truncate">
                        {author.genre || 'Literature & Thought'}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-[#636B65] dark:text-[#A5ADA6] mt-1">
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-3 h-3 text-[#1C442D] dark:text-[#D5B16D]" />
                          {author.books_count || 1} {author.books_count === 1 ? 'book' : 'books'}
                        </span>
                        {Boolean(author.rating) && (
                          <span className="flex items-center gap-0.5 text-amber-600 dark:text-amber-400 font-semibold">
                            <Star className="w-3 h-3 fill-current" /> {author.rating}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {author.bio && (
                    <p className="text-xs sm:text-sm text-[#636B65] dark:text-[#A5ADA6] line-clamp-3 leading-relaxed">
                      {author.bio}
                    </p>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-[#E8E8E3] dark:border-[#222824] flex items-center justify-between">
                  <Link
                    to={authorHref}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#1C442D] dark:text-[#D5B16D] group-hover:underline"
                  >
                    <span>View works & profile</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  </Link>

                  <Link
                    to="/author-connect"
                    className="text-[11px] font-semibold text-[#8F681C] dark:text-[#D5B16D] hover:underline"
                  >
                    Author Connect
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Discovery Category Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <Link
            to="/reviewers-critics"
            className="p-4 rounded-xl bg-[#FAFAF8] dark:bg-[#111413] border border-[#E8E8E3] dark:border-[#222824] hover:border-[#BDA56B]/60 dark:hover:border-[#D5B16D]/50 transition-all text-center group"
          >
            <span className="text-xl">✍️</span>
            <p className="text-xs sm:text-sm font-bold text-[#1C201D] dark:text-[#F3F0E7] mt-1 group-hover:text-[#1C442D] dark:group-hover:text-[#D5B16D]">
              Reviewers & Critics
            </p>
            <p className="text-[11px] text-[#636B65] dark:text-[#A5ADA6]">Bookish creators</p>
          </Link>

          <Link
            to="/scientists"
            className="p-4 rounded-xl bg-[#FAFAF8] dark:bg-[#111413] border border-[#E8E8E3] dark:border-[#222824] hover:border-[#BDA56B]/60 dark:hover:border-[#D5B16D]/50 transition-all text-center group"
          >
            <span className="text-xl">🔬</span>
            <p className="text-xs sm:text-sm font-bold text-[#1C201D] dark:text-[#F3F0E7] mt-1 group-hover:text-[#1C442D] dark:group-hover:text-[#D5B16D]">
              Scientists & Thinkers
            </p>
            <p className="text-[11px] text-[#636B65] dark:text-[#A5ADA6]">Pioneering minds</p>
          </Link>

          <Link
            to="/social-activists"
            className="p-4 rounded-xl bg-[#FAFAF8] dark:bg-[#111413] border border-[#E8E8E3] dark:border-[#222824] hover:border-[#BDA56B]/60 dark:hover:border-[#D5B16D]/50 transition-all text-center group"
          >
            <span className="text-xl">✊</span>
            <p className="text-xs sm:text-sm font-bold text-[#1C201D] dark:text-[#F3F0E7] mt-1 group-hover:text-[#1C442D] dark:group-hover:text-[#D5B16D]">
              Social Activists
            </p>
            <p className="text-[11px] text-[#636B65] dark:text-[#A5ADA6]">Agents of change</p>
          </Link>

          <Link
            to="/author-connect"
            className="p-4 rounded-xl bg-[#FAFAF8] dark:bg-[#111413] border border-[#E8E8E3] dark:border-[#222824] hover:border-[#BDA56B]/60 dark:hover:border-[#D5B16D]/50 transition-all text-center group"
          >
            <span className="text-xl">🤝</span>
            <p className="text-xs sm:text-sm font-bold text-[#1C201D] dark:text-[#F3F0E7] mt-1 group-hover:text-[#1C442D] dark:group-hover:text-[#D5B16D]">
              Author Connect
            </p>
            <p className="text-[11px] text-[#636B65] dark:text-[#A5ADA6]">Direct engagement</p>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HomeAuthorsShowcase;

