export interface BlogPostSummary {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  category: string;
  readTime: string;
  image: string;
}

export const blogPosts: BlogPostSummary[] = [
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
