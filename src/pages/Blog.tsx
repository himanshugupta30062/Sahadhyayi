import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, User, ArrowRight, Search, BookOpen } from 'lucide-react';
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

  const categories = ['All', ...Array.from(new Set(blogPosts.map(post => post.category)))];
  const [selectedCategory, setSelectedCategory] = React.useState('All');
  const [searchQuery, setSearchQuery] = React.useState('');
  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredPosts = blogPosts.filter(post => {
    const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
    const searchableText = `${post.title} ${post.excerpt} ${post.author} ${post.category}`.toLowerCase();
    return matchesCategory && (!normalizedQuery || searchableText.includes(normalizedQuery));
  });

  const featuredPost = selectedCategory === 'All' && !normalizedQuery
    ? blogPosts.find(post => post.featured)
    : undefined;
  const regularPosts = filteredPosts.filter(post => post.slug !== featuredPost?.slug);

  return (
    <>
      <SEO
        title="Sahadhyayi Blog - Reading Insights, Community Stories & Tips"
        description="Explore Sahadhyayi's blog for reading insights, community stories, book recommendations, and tips to enhance your reading journey, including Indian literature across languages."
        canonical="https://sahadhyayi.com/blog"
        keywords={['Sahadhyayi blog', 'reading insights', 'book community', 'reading tips', 'what is Sahadhyayi', 'Sahadhyayi meaning', 'reading culture']}
      />
      
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Blogs & Literary News
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Editorially published book news, author updates, reading culture and curated literary guides from Sahadhyayi.
            </p>
          </div>

          {/* Search */}
          <div className="max-w-2xl mx-auto mb-8">
            <label htmlFor="blog-search" className="sr-only">Search blogs</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
              <input
                id="blog-search"
                type="search"
                value={searchQuery}
                onChange={event => setSearchQuery(event.target.value)}
                placeholder="Search blogs, topics, or authors..."
                className="w-full rounded-xl border border-orange-200 bg-white/90 py-3 pl-12 pr-4 text-gray-900 shadow-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
              />
            </div>
            <p className="mt-2 text-center text-sm text-gray-500">
              {filteredPosts.length} {filteredPosts.length === 1 ? 'blog' : 'blogs'} to explore
            </p>
          </div>

          {/* Featured Post */}
          {featuredPost && (
            <div className="mb-12">
              <Card className="overflow-hidden bg-white/80 backdrop-blur-sm border-orange-200 hover:shadow-xl transition-all duration-300">
                <div className="md:flex">
                  <div className="md:w-1/2">
                    <img
                      src={featuredPost.image}
                      alt={featuredPost.title}
                      loading="lazy"
                      className="w-full h-64 md:h-full object-cover"
                    />
                  </div>
                  <div className="md:w-1/2 p-8">
                    <Badge className="mb-4 bg-orange-100 text-orange-800">
                      Featured
                    </Badge>
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                      {featuredPost.title}
                    </h2>
                    <p className="text-gray-600 mb-6 text-lg">
                      {featuredPost.excerpt}
                    </p>
                    <div className="flex items-center gap-4 mb-6 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {featuredPost.author}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(featuredPost.date).toLocaleDateString()}
                      </div>
                      <Badge variant="outline">{featuredPost.category}</Badge>
                    </div>
                    <Link to={`/blog/${featuredPost.slug}`}>
                      <Button className="bg-orange-600 hover:bg-orange-700">
                        Read Blog
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 mb-8 justify-center">
            {categories.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                onClick={() => setSelectedCategory(category)}
                className={selectedCategory === category 
                  ? "bg-orange-600 hover:bg-orange-700" 
                  : "border-orange-200 text-orange-600 hover:bg-orange-50"
                }
              >
                {category}
              </Button>
            ))}
          </div>

          {/* Blog Posts Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {regularPosts.length === 0 ? (
              <div className="col-span-full rounded-2xl border border-dashed border-orange-300 bg-white/70 px-6 py-12 text-center">
                <BookOpen className="mx-auto mb-3 h-8 w-8 text-orange-500" aria-hidden="true" />
                <h2 className="text-xl font-semibold text-gray-900">No blogs found</h2>
                <p className="mt-2 text-gray-600">Try another search or choose a different category.</p>
                <Button variant="outline" className="mt-5 border-orange-300 text-orange-700" onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}>
                  Clear filters
                </Button>
              </div>
            ) : regularPosts.map(post => (
              <Card key={post.id} className="overflow-hidden bg-white/80 backdrop-blur-sm border-orange-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="relative">
                  <img
                    src={post.image}
                    alt={post.title}
                    loading="lazy"
                    className="w-full h-48 object-cover"
                  />
                  <Badge className="absolute top-3 left-3 bg-white/90 text-gray-800">
                    {post.category}
                  </Badge>
                </div>
                <CardHeader>
                  <CardTitle className="text-xl text-gray-900 hover:text-orange-600 cursor-pointer">
                    {post.slug ? (
                      <Link to={`/blog/${post.slug}`} className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 rounded-sm">
                        {post.title}
                      </Link>
                    ) : (
                      <span>{post.title}</span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {post.author}
                    </div>
                    <span>{post.readTime}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      {new Date(post.date).toLocaleDateString()}
                    </span>
                    {post.slug ? (
                      <Link to={`/blog/${post.slug}`}>
                        <Button variant="ghost" size="sm" className="text-orange-600 hover:text-orange-700">
                          Read More
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                      </Link>
                    ) : (
                      <span className="text-xs text-gray-400">Coming soon</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Continue Reading CTA */}
          <section className="rounded-2xl border border-orange-200 bg-white/80 px-6 py-10 text-center shadow-sm sm:px-10">
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-orange-700">Keep turning pages</p>
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">Your next great read is waiting</h2>
            <p className="mx-auto mt-3 max-w-2xl text-gray-600">
              Explore the library, find a book that speaks to you, and bring your reading journey into the Sahadhyayi community.
            </p>
            <Link to="/library" className="mt-6 inline-block">
              <Button className="bg-orange-600 hover:bg-orange-700">
                Explore the Library <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </section>
        </div>
      </div>
    </>
  );
};

export default Blog;
