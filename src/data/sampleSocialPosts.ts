export interface BookReelItem {
  id: string;
  tag: string;
  tagColor: string;
  readerName: string;
  readerHandle: string;
  readerAvatar: string;
  bookTitle: string;
  bookAuthor: string;
  bookSlug?: string;
  hook: string;
  fullQuote: string;
  moodAudio: string;
  imageUrl: string;\n  videoUrl?: string;
  likesCount: number;
  commentsCount: number;
}

export interface SampleReaderPost {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
  reposts_count: number;
  profile: {
    full_name: string;
    username: string;
    profile_photo_url: string;
    reader_badge?: string;
  };
  book?: {
    id: string;
    title: string;
    author: string;
    cover_url?: string;
  };
  image_url?: string;
  image_alt?: string;
  tags?: string[];
  user_has_liked?: boolean;
}

export const SAMPLE_BOOK_REELS: BookReelItem[] = [
  {
    id: 'reel-1',
    tag: '🌙 2 AM THOUGHTS',
    tagColor: 'bg-indigo-600/80 text-white',
    readerName: 'Priya Sharma',
    readerHandle: 'priya_reads_late',
    readerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    bookTitle: 'The Song of Achilles',
    bookAuthor: 'Madeline Miller',
    bookSlug: 'the-song-of-achilles',
    hook: 'POV: It’s 2:47 AM and chapter 20 completely ruined you for all future books.',
    fullQuote: '“I could recognize him by touch alone, by smell; I would know him blind, by the way his breaths came and his feet struck the earth.”\n\nWho gave Madeline Miller the legal authority to write this?! I am lying awake staring at my ceiling. If you need me tomorrow, no you don’t.',
    moodAudio: '♫ Nocturne in C-sharp minor (Piano & Rain)',
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=900&q=80',
    likesCount: 342,
    commentsCount: 68,
  },
  {
    id: 'reel-2',
    tag: '⚡ SLUMP BREAKER',
    tagColor: 'bg-amber-600/80 text-white',
    readerName: 'Aarav Mehta',
    readerHandle: 'aarav_pages',
    readerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    bookTitle: 'Atomic Habits',
    bookAuthor: 'James Clear',
    bookSlug: 'atomic-habits',
    hook: 'Confession: Screen time was 6 hrs/day until I tried the 10-page bedtime rule.',
    fullQuote: '“You do not rise to the level of your goals. You fall to the level of your systems.”\n\nLeaving my smartphone in the living room and keeping a paperback on my pillow changed everything. First book finished in 7 months. Small wins compound.',
    moodAudio: '♫ Morning Chai & Acoustic Fingerpicking',
    imageUrl: 'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?auto=format&fit=crop&w=900&q=80',
    likesCount: 289,
    commentsCount: 44,
  },
  {
    id: 'reel-3',
    tag: '✍️ SECOND-HAND MAGIC',
    tagColor: 'bg-emerald-700/80 text-white',
    readerName: 'Kabir D.',
    readerHandle: 'kabir_in_the_margins',
    readerAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
    bookTitle: 'The God of Small Things',
    bookAuthor: 'Arundhati Roy',
    bookSlug: 'the-god-of-small-things',
    hook: 'Found a ₹80 copy in old Delhi with a pencil note from 1999 on page 42.',
    fullQuote: '“...the secret of the Great Stories is that they have no secrets. The Great Stories are the ones you have heard and want to hear again.”\n\nA pencil note written in delicate cursive says: ‘Read this whenever you miss the monsoon back home.’ Absolute chills.',
    moodAudio: '♫ Kerala Monsoon Ambience & Wind Chimes',
    imageUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=900&q=80',
    likesCount: 512,
    commentsCount: 91,
  },
  {
    id: 'reel-4',
    tag: '☕ CAFÉ READS',
    tagColor: 'bg-stone-700/80 text-white',
    readerName: 'Sneha Rao',
    readerHandle: 'sneha_reads',
    readerAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
    bookTitle: 'Before the Coffee Gets Cold',
    bookAuthor: 'Toshikazu Kawaguchi',
    bookSlug: 'before-the-coffee-gets-cold',
    hook: 'Thought this was a cozy light cafe story... now I am questioning every bond I have.',
    fullQuote: '“Water flows from higher places to lower places. That is the nature of gravity. Emotions also seem to act according to gravity.”\n\nOnly 200 pages, but the second story about the husband who begins forgetting made me tear up in public. Order a warm latte and prepare your heart.',
    moodAudio: '♫ Warm Jazz & Steaming Espresso Machine',
    imageUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=900&q=80',
    likesCount: 198,
    commentsCount: 32,
  },
  {
    id: 'reel-5',
    tag: '💡 MIND EXPANDER',
    tagColor: 'bg-purple-700/80 text-white',
    readerName: 'Rohan Varma',
    readerHandle: 'rohan_in_curiosity',
    readerAvatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=300&q=80',
    bookTitle: 'Cosmos',
    bookAuthor: 'Carl Sagan',
    bookSlug: 'cosmos',
    hook: 'Nothing heals everyday existential dread quite like Carl Sagan reminding us we are stardust.',
    fullQuote: '“For small creatures such as we the vastness is bearable only through love.”\n\nIf you ever feel overwhelmed by deadlines or petty worries, open Cosmos for 15 minutes. It puts everything into perspective.',
    moodAudio: '♫ Ambient Synth Wave & Night Sky',
    imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=900&q=80',
    likesCount: 421,
    commentsCount: 57,
  },
];

export const SAMPLE_EVERYDAY_POSTS: SampleReaderPost[] = [
  {
    id: 'sample-post-1',
    user_id: 'sample-user-priya',
    content: "It’s 2:47 AM and I am sobbing uncontrollably into my pillow. Who gave Madeline Miller the legal authority to write that ending?! 😭\n\nIf anyone needs me tomorrow, no you don't. I am mentally trapped in ancient Greece forever.\n\nWhat’s the last book that genuinely broke your heart in the best way possible?",
    created_at: new Date(Date.now() - 1000 * 60 * 42).toISOString(), // 42 mins ago
    likes_count: 142,
    comments_count: 38,
    reposts_count: 12,
    profile: {
      full_name: 'Priya Sharma',
      username: 'priya_reads_late',
      profile_photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      reader_badge: 'Night Owl Reader 🌙',
    },
    book: {
      id: 'book-achilles',
      title: 'The Song of Achilles',
      author: 'Madeline Miller',
    },
    image_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1200&q=80',
    image_alt: 'Bedside reading under warm ambient light with an open book',
    tags: ['GreekMythology', 'LateNightReading', 'Heartbroken'],
  },
  {
    id: 'sample-post-2',
    user_id: 'sample-user-aarav',
    content: "Confession time: I hadn't finished a single book in 8 months because my screen time was averaging 5.5 hours a day.\n\nTwo weeks ago I made one rule: phone charges in the living room after 10 PM, and I keep James Clear on my nightstand. Finished it this evening.\n\nYou don’t need 2 hours of quiet time to read. You just need 20 pages before sleep. Small wins hit different! ☕📖",
    created_at: new Date(Date.now() - 1000 * 60 * 185).toISOString(), // 3 hours ago
    likes_count: 94,
    comments_count: 19,
    reposts_count: 7,
    profile: {
      full_name: 'Aarav Mehta',
      username: 'aarav_pages',
      profile_photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
      reader_badge: 'Habit Builder ☕',
    },
    book: {
      id: 'book-atomic-habits',
      title: 'Atomic Habits',
      author: 'James Clear',
    },
    tags: ['ReadingHabits', 'Productivity', 'BookLover'],
  },
  {
    id: 'sample-post-3',
    user_id: 'sample-user-kabir',
    content: "Found a dog-eared 1997 paperback of Arundhati Roy at the Sunday Daryaganj book pavement for ₹80.\n\nTurned to page 42 and someone had written in faded 0.5mm blue ballpen: 'Read this whenever you miss the monsoon back home — Ananya, July 1999'.\n\nThis is why I will always prefer used books over brand new ones. You aren’t just reading a story; you’re sharing a ghost of someone else's memory. ❤️",
    created_at: new Date(Date.now() - 1000 * 60 * 360).toISOString(), // 6 hours ago
    likes_count: 215,
    comments_count: 47,
    reposts_count: 29,
    profile: {
      full_name: 'Kabir D.',
      username: 'kabir_in_the_margins',
      profile_photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
      reader_badge: 'Marginalia Hunter ✍️',
    },
    book: {
      id: 'book-god-of-small-things',
      title: 'The God of Small Things',
      author: 'Arundhati Roy',
    },
    image_url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1200&q=80',
    image_alt: 'Faded vintage paperback page with handwritten marginal notes',
    tags: ['UsedBooks', 'Marginalia', 'IndianFiction', 'BookStagram'],
  },
  {
    id: 'sample-post-4',
    user_id: 'sample-user-sneha',
    content: "POV: You pick up a cute 200-page Japanese book called 'Before the Coffee Gets Cold' thinking it's light café aesthetic fiction, and now you’re on public transport trying not to leak tears down your mask. ☕✨\n\nPlease tell me someone else has read the second story about the husband with early-onset Alzheimer's?! Need to discuss immediately.",
    created_at: new Date(Date.now() - 1000 * 60 * 540).toISOString(), // 9 hours ago
    likes_count: 88,
    comments_count: 26,
    reposts_count: 5,
    profile: {
      full_name: 'Sneha Rao',
      username: 'sneha_reads',
      profile_photo_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
      reader_badge: 'Fiction Enthusiast 🌸',
    },
    book: {
      id: 'book-coffee-gets-cold',
      title: 'Before the Coffee Gets Cold',
      author: 'Toshikazu Kawaguchi',
    },
    tags: ['JapaneseFiction', 'CozyReads', 'BookDiscussion'],
  },
  {
    id: 'sample-post-admin',
    user_id: 'sample-admin-team',
    content: "📚 Community Question of the Week:\n\nIf you could wipe your memory of ONE book completely just to experience the sheer thrill of reading it for the very first time again, which book would you pick?\n\nDrop your title below — we’re compiling the ultimate community re-read list! 👇",
    created_at: new Date(Date.now() - 1000 * 60 * 720).toISOString(), // 12 hours ago
    likes_count: 310,
    comments_count: 92,
    reposts_count: 34,
    profile: {
      full_name: 'Sahadhyayi Editorial',
      username: 'sahadhyayi_team',
      profile_photo_url: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=300&q=80',
      reader_badge: 'Community Host 📖',
    },
    tags: ['CommunityDiscussion', 'FavoriteBooks', 'ReadingLife'],
  },
];

