import React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, User, ArrowRight, Search, BookOpen, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import SEO from '@/components/SEO';

const Blog = () => {
  const blogPosts = [
    {
      id: '1',
      slug: 'what-is-sahadhyayi-meaning-story',
      title: 'What is Sahadhyayi? Meaning & Story Behind Our Name',
      excerpt: 'Discover the deep Sanskrit meaning of Sahadhyayi and how it embodies our mission to create a community of fellow readers and study companions.',
      author: 'Himanshu Gupta',
      date: '2024-07-14',
      category: 'About Sahadhyayi',
      readTime: '6 min read',
      image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=400&fit=crop',
    },
    {
      id: '2',
      slug: 'how-sahadhyayi-revives-reading-culture',
      title: 'How Sahadhyayi Revives the Reading Culture',
      excerpt: 'Learn how Sahadhyayi is revolutionizing reading habits in the digital age and bringing back the transformative power of deep reading.',
      author: 'Himanshu Gupta',
      date: '2024-07-14',
      category: 'Reading Culture',
      readTime: '8 min read',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop'
    },
    {
      id: '3',
      slug: 'why-book-lovers-should-join-sahadhyayi',
      title: '5 Reasons Why Book Lovers Should Join Sahadhyayi',
      excerpt: 'Explore the compelling reasons why Sahadhyayi is the ultimate platform for book enthusiasts and reading community members.',
      author: 'Himanshu Gupta',
      date: '2024-07-14',
      category: 'Community',
      readTime: '7 min read',
      image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&h=400&fit=crop'
    },
  {
    id: '8',
    slug: 'build-a-reading-habit-that-lasts',
    title: 'How to Build a Reading Habit That Actually Lasts',
    excerpt: 'Build a sustainable reading routine with small goals, better book choices, and practical ways to make reading part of everyday life.',
    author: 'Sahadhyayi Editorial',
    date: '2026-10-29',
    category: 'Reading Tips',
    readTime: '7 min read',
    image: 'https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=1200&h=630&fit=crop'
  },
  {
    id: '9',
    slug: 'how-to-start-a-book-club',
    title: 'How to Start a Book Club: A Practical Guide for Readers',
    excerpt: 'From choosing your first book to hosting inclusive discussions, here is how to start a book club that people enjoy returning to.',
    author: 'Sahadhyayi Editorial',
    date: '2026-10-29',
    category: 'Community',
    readTime: '8 min read',
    image: 'https://images.unsplash.com/photo-1521583641526-6ce8a8b8e2c5?w=1200&h=630&fit=crop'
  },
  {
    id: '10',
    slug: 'how-to-read-classic-literature',
    title: 'A Beginner’s Guide to Reading Classic Literature',
    excerpt: 'Approach classic books with confidence: choose a readable edition, learn the context you need, and read for curiosity rather than perfection.',
    author: 'Sahadhyayi Editorial',
    date: '2026-10-29',
    category: 'Reading Tips',
    readTime: '7 min read',
    image: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1200&h=630&fit=crop'
  },
  {
    id: '11',
    slug: 'best-indian-short-story-collections',
    title: 'Indian Short Story Collections to Start Reading Today',
    excerpt: 'Explore Indian short fiction from different languages and literary traditions, with a practical guide to choosing your first collection.',
    author: 'Sahadhyayi Editorial',
    date: '2026-10-29',
    category: 'Indian Literature',
    readTime: '8 min read',
    image: 'https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=1200&h=630&fit=crop'
  },
  {
    id: '12',
    slug: 'books-for-when-life-feels-stuck',
    title: 'Books to Read When You Feel Stuck in Life',
    excerpt: 'Choose books for uncertainty, change, low motivation, or a fresh perspective—without turning reading into another task.',
    author: 'Sahadhyayi Editorial',
    date: '2026-10-29',
    category: 'Book Recommendations',
    readTime: '7 min read',
    image: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1200&h=630&fit=crop'
  },
  {
    id: '13',
    slug: 'exploring-indian-literature-in-translation',
    title: 'How to Explore Indian Literature Beyond English',
    excerpt: 'A beginner-friendly path into Indian literary languages through translations, anthologies, regional traditions, and reading groups.',
    author: 'Sahadhyayi Editorial',
    date: '2026-10-29',
    category: 'Indian Literature',
    readTime: '8 min read',
    image: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=1200&h=630&fit=crop'
  },
  {
    id: '14',
    slug: 'choose-your-next-book-by-mood',
    title: 'How to Choose Your Next Book by Mood',
    excerpt: 'Match your next read to the time, energy, and kind of story you want—from comfort reading to a thoughtful challenge.',
    author: 'Sahadhyayi Editorial',
    date: '2026-10-29',
    category: 'Book Recommendations',
    readTime: '6 min read',
    image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=1200&h=630&fit=crop'
  },
  {
    id: '15',
    slug: 'how-to-read-without-distractions',
    title: 'How to Read Without Getting Distracted',
    excerpt: 'Build a calmer reading setup, manage phone interruptions, and return to a book without blaming yourself for every lapse in focus.',
    author: 'Sahadhyayi Editorial',
    date: '2026-10-29',
    category: 'Reading Tips',
    readTime: '7 min read',
    image: 'https://images.unsplash.com/photo-1455390582262-044c025c3f5b?w=1200&h=630&fit=crop'
  },
  {
    id: '16',
    slug: '30-day-reading-challenge',
    title: 'A Gentle 30-Day Reading Challenge for Any Reader',
    excerpt: 'A flexible month of small reading prompts designed to help you explore genres, notice ideas, and make reading feel rewarding.',
    author: 'Sahadhyayi Editorial',
    date: '2026-10-29',
    category: 'Reading Challenges',
    readTime: '8 min read',
    image: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=1200&h=630&fit=crop'
  },
  {
    id: '17',
    slug: 'osho-books-and-themes-in-his-discourses',
    title: 'The Books Osho Read: Ashtavakra Gita, Vedas, Puranas, and the Worlds Explored in His Discourses',
    excerpt: 'Explore Osho’s talks on the Ashtavakra Gita, Upanishads, Vedic and Puranic traditions, yoga, tantra, world religions, literature, psychology, and society.',
    author: 'Sahadhyayi Editorial',
    date: '2026-10-29',
    category: 'Philosophy & Ideas',
    readTime: '12 min read',
    image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=1200&h=630&fit=crop'
  },
  {
    id: '7',
    slug: 'best-indian-books-to-read',
    title: '25 Best Indian Books to Read: Classics, Novels & Regional Literature',
    excerpt: 'From Premchand and Tagore to Tamil historical epics and contemporary regional fiction, discover 25 books that open a window into India’s many literary worlds.',
    author: 'Sahadhyayi Editorial',
    date: '2026-10-29',
    category: 'Book Recommendations',
    readTime: '12 min read',
    image: 'https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=1200&h=630&fit=crop',
    featured: true
  },
    {
      id: '4',
      title: 'The Science Behind Deep Reading: Why It Matters More Than Ever',
      excerpt: 'Discover how deep reading transforms your brain, improves focus, and enhances critical thinking in our digital age.',
      author: 'Dr. Sarah Chen',
      date: '2024-07-08',
      category: 'Reading Science',
      readTime: '8 min read',
      image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=400&fit=crop'
    },
    {
      id: '5',
      title: 'Building Reading Communities: A Guide for Book Lovers',
      excerpt: 'Learn how to create and nurture thriving reading communities that engage readers and foster meaningful discussions.',
      author: 'Michael Rodriguez',
      date: '2024-07-05',
      category: 'Community',
      readTime: '6 min read',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop'
    },
    {
      id: '6',
      title: 'Digital vs Physical Books: Finding Your Perfect Reading Balance',
      excerpt: 'Explore the benefits of both digital and physical reading formats and how to optimize your reading experience.',
      author: 'Emma Thompson',
      date: '2024-07-03',
      category: 'Reading Tips',
      readTime: '5 min read',
      image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&h=400&fit=crop'
    }
  ];

  const publishedPosts = blogPosts.filter(post => Boolean(post.slug));
  const categories = ['All', ...Array.from(new Set(publishedPosts.map(post => post.category)))];
  const [selectedCategory, setSelectedCategory] = React.useState('All');
  const [searchQuery, setSearchQuery] = React.useState('');
  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredPosts = publishedPosts.filter(post => {
    const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
    const searchableText = `${post.title} ${post.excerpt} ${post.author} ${post.category}`.toLowerCase();
    return matchesCategory && (!normalizedQuery || searchableText.includes(normalizedQuery));
  });

  const sortedPosts = [...filteredPosts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || a.title.localeCompare(b.title));
  const featuredPost = selectedCategory === 'All' && !normalizedQuery
    ? (sortedPosts.find(post => post.featured) || sortedPosts[0])
    : undefined;
  const regularPosts = sortedPosts.filter(post => post.slug !== featuredPost?.slug);

  return (
    <>
      <SEO
        title="Sahadhyayi Journal — Latest Reading News, Stories & Guides"
        description="The Sahadhyayi Journal: official platform updates, literary news, reading guides, and curated stories from our editorial team."
        canonical="https://sahadhyayi.com/blog"
        keywords={['Sahadhyayi Journal', 'literary news', 'reading guides', 'book recommendations', 'reading culture']}
      />

      <main className="min-h-screen bg-[#F7F5EF] text-[#202820]">
        <section className="relative isolate overflow-hidden bg-[#101A13]">
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-cover bg-center opacity-35"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=2200&q=85')" }}
          />
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-[#101A13] via-[#101A13]/90 to-[#101A13]/45" />
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#101A13]/75 via-transparent to-transparent" />
          <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
            <div className="max-w-3xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#D5B16D]/40 bg-black/25 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#E4C17B] backdrop-blur-sm">
                <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                Sahadhyayi Journal · Official Editorial
              </div>
              <h1 className="font-serif text-4xl font-bold leading-tight tracking-tight text-[#FBF7EF] sm:text-5xl md:text-6xl">
                Stories for curious readers.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-white/75 sm:text-lg sm:leading-8">
                The latest from Sahadhyayi: reading guides, literary discoveries, book recommendations, and notes from our editorial desk.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium uppercase tracking-[0.12em] text-white/60">
                <span className="inline-flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#D5B16D]" /> Editor-published</span>
                <span>Read-only for readers</span>
                <span>{publishedPosts.length} published stories in the journal</span>
              </div>
              <div className="mt-8 max-w-2xl">
                <label htmlFor="blog-search" className="sr-only">Search journal stories</label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#68756A]" aria-hidden="true" />
                  <input
                    id="blog-search"
                    type="search"
                    value={searchQuery}
                    onChange={event => setSearchQuery(event.target.value)}
                    placeholder="Search stories, books, or topics…"
                    className="h-12 w-full rounded-xl border border-white/20 bg-white/95 pl-12 pr-12 text-sm text-[#202820] shadow-xl outline-none transition placeholder:text-[#788078] focus:border-[#D5B16D] focus:ring-2 focus:ring-[#D5B16D]/50 sm:h-14"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      aria-label="Clear journal search"
                      className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-[#68756A] transition hover:bg-[#E9EDE6] hover:text-[#202820] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C442D]"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="sticky top-16 z-20 border-b border-[#E5E0D4] bg-[#F7F5EF]/95 backdrop-blur-md">
          <div className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-4 py-3 sm:px-6 lg:px-8">
            {categories.map(category => (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                aria-pressed={selectedCategory === category}
                className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C442D] focus-visible:ring-offset-2 ${
                  selectedCategory === category
                    ? 'border-[#1C442D] bg-[#1C442D] text-white shadow-sm'
                    : 'border-[#DED9CD] bg-white/70 text-[#596258] hover:border-[#9BAA9A] hover:bg-white'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-9 sm:px-6 sm:py-12 lg:px-8">
          <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6B7B6B]">From the editorial desk</p>
              <h2 className="mt-1 font-serif text-2xl font-bold text-[#202820] sm:text-3xl">
                {selectedCategory === 'All' ? 'Latest stories' : selectedCategory}
              </h2>
            </div>
            <p aria-live="polite" className="text-sm text-[#72796F]">
              {sortedPosts.length} {sortedPosts.length === 1 ? 'story' : 'stories'}
              {normalizedQuery ? ` matching “${searchQuery.trim()}”` : ''}
            </p>
          </div>

          {sortedPosts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#C9D0C4] bg-white px-6 py-16 text-center">
              <BookOpen className="mx-auto mb-4 h-9 w-9 text-[#71836F]" aria-hidden="true" />
              <h2 className="font-serif text-2xl font-bold text-[#202820]">No stories found</h2>
              <p className="mt-2 text-sm text-[#687168]">Try another search or choose a different topic.</p>
              <Button variant="outline" className="mt-5 border-[#C9D0C4]" onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}>
                Clear filters
              </Button>
            </div>
          ) : (
            <>
              {featuredPost && (
                <Link
                  to={`/blog/${featuredPost.slug}`}
                  className="group mb-10 grid overflow-hidden rounded-3xl border border-[#E3DED2] bg-white shadow-sm transition hover:border-[#9CAB96] hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C442D] focus-visible:ring-offset-4 md:grid-cols-2"
                >
                  <div className="relative min-h-[250px] overflow-hidden bg-[#E7E8DF] sm:min-h-[340px]">
                    <img
                      src={featuredPost.image}
                      alt=""
                      loading="eager"
                      className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
                    <span className="absolute left-5 top-5 rounded-full bg-[#D5B16D] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#182019]">Editor's pick</span>
                  </div>
                  <div className="flex flex-col justify-center p-6 sm:p-9 lg:p-12">
                    <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#6B7B6B]">
                      <span>{featuredPost.category}</span><span aria-hidden="true">·</span><span>Featured story</span>
                    </div>
                    <h3 className="font-serif text-2xl font-bold leading-tight text-[#202820] transition group-hover:text-[#1C442D] sm:text-3xl lg:text-4xl">
                      {featuredPost.title}
                    </h3>
                    <p className="mt-4 text-sm leading-7 text-[#626B60] sm:text-base">{featuredPost.excerpt}</p>
                    <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[#ECE8DF] pt-5 text-xs text-[#6D756B]">
                      <span className="inline-flex items-center gap-1.5"><User className="h-3.5 w-3.5" />{featuredPost.author}</span>
                      <span className="inline-flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />{new Date(featuredPost.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      <span>{featuredPost.readTime}</span>
                    </div>
                    <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#1C442D]">
                      Read the story <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              )}

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {regularPosts.map(post => (
                  <Link
                    key={post.id}
                    to={post.slug ? `/blog/${post.slug}` : '/blog'}
                    className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#E4DFD4] bg-white transition duration-300 hover:-translate-y-1 hover:border-[#A7B4A1] hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C442D] focus-visible:ring-offset-2"
                  >
                    <div className="relative aspect-[16/9] overflow-hidden bg-[#E8E9E1]">
                      <img src={post.image} alt="" loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                      <span className="absolute left-3 top-3 rounded-full border border-white/70 bg-[#F7F5EF]/95 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#344538]">{post.category}</span>
                    </div>
                    <div className="flex flex-1 flex-col p-5 sm:p-6">
                      <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#778173]">
                        <span>{new Date(post.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span><span aria-hidden="true">·</span><span>{post.readTime}</span>
                      </div>
                      <h3 className="font-serif text-xl font-bold leading-snug text-[#202820] transition-colors group-hover:text-[#1C442D]">{post.title}</h3>
                      <p className="mt-3 flex-1 text-sm leading-6 text-[#687067]">{post.excerpt}</p>
                      <div className="mt-5 flex items-center justify-between border-t border-[#ECE8DF] pt-4">
                        <span className="max-w-[70%] truncate text-xs font-medium text-[#687067]">{post.author}</span>
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1C442D]">Read story <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" /></span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}

          <section className="mt-14 rounded-3xl border border-[#DDE2D7] bg-[#EAEDE5] px-6 py-9 sm:px-10 sm:py-11">
            <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#526B54]">Keep exploring</p>
                <h2 className="mt-2 font-serif text-2xl font-bold text-[#202820] sm:text-3xl">A good story leads to another.</h2>
                <p className="mt-3 text-sm leading-6 text-[#626B60]">Find your next book in the library, or share your own perspective in the community Articles section.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link to="/library"><Button className="bg-[#1C442D] text-white hover:bg-[#173824]">Explore library <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
                <Link to="/articles"><Button variant="outline" className="border-[#B7C2B1] bg-white text-[#294632] hover:bg-[#F7F8F4]">Community articles</Button></Link>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
};

export default Blog;
