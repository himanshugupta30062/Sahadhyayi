import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  BookOpen,
  ArrowRight,
  PenLine,
  Clock,
  Sparkles,
  BookOpenText,
  Flame,
} from 'lucide-react';
import { usePublishedArticles, type Article } from '@/hooks/useArticles';
import { useStories, type Story } from '@/hooks/useStories';
import { STARTER_STORIES } from '@/data/starterStories';

const FALLBACK_ARTICLES: Partial<Article>[] = [
  {
    id: 'sample-article-1',
    title: 'The Architecture of Solitude: Reading Marquez in the Digital Age',
    subtitle: 'How Gabriel García Márquez captured the cyclical nature of human isolation in One Hundred Years of Solitude.',
    reading_time_minutes: 6,
    tags: ['Literary Essay', 'Classics', 'Latin American Literature'],
    author_name: 'Dr. Alok Mukherjee',
    published_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    cover_image_url: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=500&q=80',
  },
  {
    id: 'sample-article-2',
    title: 'Revisiting Premchand’s Nirmala: Dowry, Dignity, and Social Realism',
    subtitle: 'Why the 1927 Hindi novel remains one of the sharpest literary dissections of institutionalized injustice.',
    reading_time_minutes: 8,
    tags: ['Indian Literature', 'Social Realism', 'Premchand'],
    author_name: 'Sunita Kashyap',
    published_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
    cover_image_url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=500&q=80',
  },
];

export const HomeReadAndWriteSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'articles' | 'stories'>('articles');
  const { data: rawArticles = [] } = usePublishedArticles();
  const { data: rawStories = [] } = useStories();

  const articles: Partial<Article>[] =
    rawArticles && rawArticles.length > 0 ? rawArticles.slice(0, 3) : FALLBACK_ARTICLES;

  const stories: Story[] =
    rawStories && rawStories.length > 0 ? rawStories.slice(0, 3) : STARTER_STORIES.slice(0, 3);

  return (
    <section
      className="home-read-and-write relative isolate py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-[#0B0D0C] text-[#1C201D] dark:text-[#F3F0E7] transition-colors duration-300"
      aria-label="Read & Write Section"
    >
      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10 sm:mb-12">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.22em] text-[#8F681C] dark:text-[#D5B16D] mb-3">
              <span aria-hidden="true" className="h-px w-7 bg-[#8F681C] dark:bg-[#D5B16D]" />
              <span>06 / Read & write</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-[#1C201D] dark:text-[#F3F0E7] tracking-tight">
              Two distinct reading and publishing experiences
            </h2>
            <p className="mt-2.5 text-sm sm:text-base text-[#636B65] dark:text-[#A5ADA6] leading-relaxed">
              Explore long-form essays, literary critiques, and book analyses in Articles — or immerse yourself in serialized fiction and biography in Short Stories.
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center gap-1.5 p-1 rounded-full bg-[#F4F3EF] dark:bg-[#161D19] border border-[#E8E8E3] dark:border-[#26352B] self-start md:self-end">
            <button
              type="button"
              onClick={() => setActiveTab('articles')}
              className={`px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'articles'
                  ? 'bg-white dark:bg-[#1E2621] text-[#1C442D] dark:text-[#D5B16D] shadow-sm'
                  : 'text-[#636B65] dark:text-[#A5ADA6] hover:text-[#1C201D] dark:hover:text-white'
              }`}
            >
              Articles & Essays
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('stories')}
              className={`px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'stories'
                  ? 'bg-white dark:bg-[#1E2621] text-[#1C442D] dark:text-[#D5B16D] shadow-sm'
                  : 'text-[#636B65] dark:text-[#A5ADA6] hover:text-[#1C201D] dark:hover:text-white'
              }`}
            >
              Short Stories & Serials
            </button>
          </div>
        </div>

        {/* Dynamic Cards Grid */}
        {activeTab === 'articles' ? (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-7 mb-8">
              {articles.map((article) => {
                const authorName = article.author_name || 'Contributor';
                return (
                  <article
                    key={article.id}
                    className="group flex flex-col justify-between rounded-2xl bg-[#FAFAF8] dark:bg-[#111413] border border-[#E8E8E3] hover:border-[#BDA56B]/60 dark:border-[#222824] dark:hover:border-[#D5B16D]/50 p-5 sm:p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                  >
                    <div>
                      {article.cover_image_url && (
                        <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden mb-4 bg-muted border border-[#E8E8E3] dark:border-[#222824]">
                          <img
                            src={article.cover_image_url}
                            alt={article.title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                          />
                        </div>
                      )}

                      <div className="flex items-center gap-2 mb-2 text-[11px] font-semibold text-[#8F681C] dark:text-[#D5B16D]">
                        <FileText className="w-3.5 h-3.5" />
                        <span>{article.tags?.[0] || 'Literary Essay'}</span>
                        {article.reading_time_minutes && (
                          <span className="text-[#636B65] dark:text-[#A5ADA6]">
                            · {article.reading_time_minutes} min read
                          </span>
                        )}
                      </div>

                      <h3 className="font-serif text-lg sm:text-xl font-bold text-[#1C201D] dark:text-[#F3F0E7] group-hover:text-[#1C442D] dark:group-hover:text-[#D5B16D] transition-colors leading-snug">
                        <Link to={article.slug ? `/articles/${article.slug}` : `/articles`}>
                          {article.title}
                        </Link>
                      </h3>

                      {article.subtitle && (
                        <p className="text-xs sm:text-sm text-[#636B65] dark:text-[#A5ADA6] mt-2 line-clamp-2 leading-relaxed">
                          {article.subtitle}
                        </p>
                      )}
                    </div>

                    <div className="mt-6 pt-4 border-t border-[#E8E8E3] dark:border-[#222824] flex items-center justify-between">
                      <span className="text-xs font-medium text-[#1C201D] dark:text-[#F3F0E7]">
                        By {authorName}
                      </span>

                      <Link
                        to={article.slug ? `/articles/${article.slug}` : `/articles`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#1C442D] dark:text-[#D5B16D] group-hover:underline"
                      >
                        <span>Read essay</span>
                        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Articles Footer Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-[#F8F7F3] dark:bg-[#131916] border border-[#E8E2D9] dark:border-[#26352B]">
              <div>
                <h4 className="text-sm font-bold text-[#1C201D] dark:text-[#F3F0E7]">
                  Publish your literary perspectives on Sahadhyayi
                </h4>
                <p className="text-xs text-[#636B65] dark:text-[#A5ADA6] mt-0.5">
                  Share reviews, cultural commentary, or research-backed writing with fellow readers.
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Link
                  to="/articles/write"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1C442D] hover:bg-[#143221] text-white text-xs font-semibold transition-colors"
                >
                  <PenLine className="w-3.5 h-3.5" />
                  <span>Write an Article</span>
                </Link>
                <Link
                  to="/articles"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#C9D2CA] dark:border-[#2F3D33] text-xs font-semibold text-[#1C442D] dark:text-[#D5B16D] hover:bg-white dark:hover:bg-[#1E2721] transition-colors"
                >
                  <span>Explore All Articles</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-7 mb-8">
              {stories.map((story) => (
                <article
                  key={story.id}
                  className="group flex flex-col justify-between rounded-2xl bg-[#FAFAF8] dark:bg-[#111413] border border-[#E8E8E3] hover:border-[#BDA56B]/60 dark:border-[#222824] dark:hover:border-[#D5B16D]/50 p-5 sm:p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                >
                  <div>
                    {story.cover_image_url && (
                      <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden mb-4 bg-muted border border-[#E8E8E3] dark:border-[#222824]">
                        <img
                          src={story.cover_image_url}
                          alt={story.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                      </div>
                    )}

                    <div className="flex items-center gap-2 mb-2 text-[11px] font-semibold text-[#8F681C] dark:text-[#D5B16D]">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>{story.genre || 'Short Story'}</span>
                      <span className="text-[#636B65] dark:text-[#A5ADA6]">
                        · {story.format === 'series' ? 'Multi-part Serial' : 'Standalone Story'}
                      </span>
                    </div>

                    <h3 className="font-serif text-lg sm:text-xl font-bold text-[#1C201D] dark:text-[#F3F0E7] group-hover:text-[#1C442D] dark:group-hover:text-[#D5B16D] transition-colors leading-snug">
                      <Link to={`/stories/${story.id}`}>
                        {story.title}
                      </Link>
                    </h3>

                    {story.description && (
                      <p className="text-xs sm:text-sm text-[#636B65] dark:text-[#A5ADA6] mt-2 line-clamp-2 leading-relaxed">
                        {story.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-6 pt-4 border-t border-[#E8E8E3] dark:border-[#222824] flex items-center justify-between">
                    <span className="text-xs font-medium text-[#1C201D] dark:text-[#F3F0E7]">
                      By {story.author_name}
                    </span>

                    <Link
                      to={`/stories/${story.id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#1C442D] dark:text-[#D5B16D] group-hover:underline"
                    >
                      <span>Read story</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>

            {/* Stories Footer Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-[#F8F7F3] dark:bg-[#131916] border border-[#E8E2D9] dark:border-[#26352B]">
              <div>
                <h4 className="text-sm font-bold text-[#1C201D] dark:text-[#F3F0E7]">
                  Publish your own short stories & serialized episodes
                </h4>
                <p className="text-xs text-[#636B65] dark:text-[#A5ADA6] mt-0.5">
                  Publish episode-by-episode, build an audience, and read stories with AI text-to-speech narration.
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Link
                  to="/social?tab=stories"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#8F681C] hover:bg-[#785715] text-white text-xs font-semibold transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Publish Story</span>
                </Link>
                <Link
                  to="/stories"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#C9D2CA] dark:border-[#2F3D33] text-xs font-semibold text-[#1C442D] dark:text-[#D5B16D] hover:bg-white dark:hover:bg-[#1E2721] transition-colors"
                >
                  <span>Explore All Stories</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default HomeReadAndWriteSection;

