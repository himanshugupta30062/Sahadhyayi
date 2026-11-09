export interface JourneyMenuItem {
  id: string;
  label: string;
  description: string;
  route?: string;
  requiresAuth?: boolean;
  action?: 'open-book-expert';
}

export interface QuickPrompt {
  id: string;
  label: string;
  question: string;
  previewReply: string;
}

export interface JourneyDestination {
  id: string;
  index: number;
  title: string;
  subtitle: string;
  landmarkName: string;
  description: string;
  menuPreview: string;
  menuItems: JourneyMenuItem[];
  accentColor: string;
  prompts?: QuickPrompt[];
}

export const JOURNEY_DESTINATIONS: JourneyDestination[] = [
  {
    id: 'library-city',
    index: 1,
    title: 'Library City',
    subtitle: 'A world of books, ideas and discovery',
    landmarkName: 'The Grand Classical Archives',
    description: 'Start with the collection. Browse books, discover your next read, explore research and open titles in the digital library.',
    menuPreview: 'Books · Discovery · Research',
    accentColor: '#1C442D',
    menuItems: [
      { id: 'digital-library', label: 'Digital Library', description: 'Browse books across genres, subjects and reading interests.', route: '/library' },
      { id: 'book-discovery', label: 'Discover Books', description: 'Find books by topic, mood, author or reading preference.', route: '/discovery' },
      { id: 'research-papers', label: 'Research Papers', description: 'Explore papers, ideas and academic reading.', route: '/research-papers' },
      { id: 'book-archive', label: 'Book Archive', description: 'Browse the wider public book collection.', route: '/book-library' },
    ],
  },
  {
    id: 'reading-valley',
    index: 2,
    title: 'Reading Valley',
    subtitle: 'Make every reading day count',
    landmarkName: 'The Ancient Oak of Solitude',
    description: 'Build a reading life of your own. Keep your shelves organised, follow your progress and save the ideas worth returning to.',
    menuPreview: 'My Bookshelf · Journal · Goals',
    accentColor: '#2D5E3A',
    menuItems: [
      { id: 'bookshelf', label: 'My Bookshelf', description: 'Keep track of books you are reading, want to read and have finished.', route: '/bookshelf' },
      { id: 'reading-dashboard', label: 'Reading Dashboard', description: 'See your personal reading activity and progress. Sign-in required.', route: '/dashboard', requiresAuth: true },
      { id: 'reading-journal', label: 'Reading Journal', description: 'Return to notes and reflections from your reading.', route: '/journal' },
      { id: 'quotes', label: 'Quotes & Highlights', description: 'Collect meaningful passages and memorable lines.', route: '/quotes' },
    ],
  },
  {
    id: 'reader-village',
    index: 3,
    title: 'Reader Village',
    subtitle: 'Find the people who love what you read',
    landmarkName: 'The Village Book Exchange Kiosk',
    description: 'Meet fellow readers, discover nearby reading connections and find people exploring the same book.',
    menuPreview: 'Friends · Nearby Readers · Maps',
    accentColor: '#8F681C',
    menuItems: [
      { id: 'friends-feed', label: 'Friends Feed', description: 'See what fellow readers are sharing in the community.', route: '/social' },
      { id: 'reader-map', label: 'Readers Near Me', description: 'Explore the reader map. Sign-in required.', route: '/map', requiresAuth: true },
      { id: 'book-reader-map', label: 'Readers Around a Book', description: 'Find readers connected to a particular title. Sign-in required.', route: '/reader-map', requiresAuth: true },
    ],
  },
  {
    id: 'reading-bridge',
    index: 4,
    title: 'Reading Together Bridge',
    subtitle: 'Good books become better conversations',
    landmarkName: 'The Stone Aqueduct of Dialogue',
    description: 'Move from reading alone to reading together. Join groups, exchange perspectives and take part in shared community activity.',
    menuPreview: 'Reading Groups · Feed · Activity',
    accentColor: '#2B577E',
    menuItems: [
      { id: 'reading-groups', label: 'Reading Groups', description: 'Find and participate in shared reading groups. Sign-in required.', route: '/groups', requiresAuth: true },
      { id: 'community-feed', label: 'Community Feed', description: 'Continue the conversation with fellow readers.', route: '/social' },
      { id: 'community-activity', label: 'Community Activity', description: 'Explore reading challenges and shared activities.', route: '/activity' },
    ],
  },
  {
    id: 'storytelling-forest',
    index: 5,
    title: 'Storytelling Forest',
    subtitle: 'Read a story. Then write your own.',
    landmarkName: 'The Lantern Gazebo of Tales',
    description: 'Explore original writing and community voices, or move from reader to creator by sharing your own stories and articles.',
    menuPreview: 'Short Stories · Life Stories · Articles',
    accentColor: '#6B4286',
    menuItems: [
      { id: 'short-stories', label: 'Short Stories', description: 'Read and publish community short fiction.', route: '/stories' },
      { id: 'community-stories', label: 'Community Stories', description: 'Discover stories shared by readers in the community.', route: '/community-stories' },
      { id: 'life-stories', label: 'Life Stories', description: 'Read personal journeys and lived experiences.', route: '/life-stories' },
      { id: 'articles', label: 'Articles & Essays', description: 'Explore long-form writing, ideas and literary reflections.', route: '/articles' },
    ],
  },
  {
    id: 'author-avenue',
    index: 6,
    title: 'Author Avenue',
    subtitle: 'Discover the people behind the pages',
    landmarkName: 'The Boulevard of Great Pens',
    description: 'Explore author profiles, connect with literary voices and discover the people, influences and ideas behind books.',
    menuPreview: 'Authors · Author Connect · Critics',
    accentColor: '#964326',
    menuItems: [
      { id: 'authors', label: 'Author Directory', description: 'Explore author profiles and their work.', route: '/authors' },
      { id: 'author-connect', label: 'Author Connect', description: 'Explore ways to connect with authors and literary creators.', route: '/author-connect' },
      { id: 'reviewers-critics', label: 'Reviewers & Critics', description: 'Discover literary reviewers and critical voices.', route: '/reviewers-critics' },
    ],
  },
  {
    id: 'festival-hills',
    index: 7,
    title: 'Festival Hills',
    subtitle: 'Make reading an adventure',
    landmarkName: 'The Mountain Book Fair Pavilion',
    description: 'Step into the lively side of Sahadhyayi with literary events, quizzes, games, challenges and community updates.',
    menuPreview: 'Events · Games · Newsroom',
    accentColor: '#A0641E',
    menuItems: [
      { id: 'events', label: 'Literary Events', description: 'Discover upcoming literary gatherings and events.', route: '/events' },
      { id: 'games', label: 'Literary Games', description: 'Play games and test your literary knowledge.', route: '/games' },
      { id: 'activity', label: 'Activity Hub', description: 'Explore reading challenges and community activities.', route: '/activity' },
      { id: 'newsroom', label: 'Newsroom', description: 'Catch up on books, authors, education and research news.', route: '/news' },
    ],
  },
  {
    id: 'ai-knowledge-station',
    index: 8,
    title: 'AI Knowledge Station',
    subtitle: 'Meet your Book Expert AI',
    landmarkName: 'The Summit Observatory Rotunda',
    description: 'Ask questions, explore ideas and get help finding your next read with the Book Expert AI companion.',
    menuPreview: 'Book Questions · Recommendations · Ideas',
    accentColor: '#1F5475',
    menuItems: [
      { id: 'open-book-expert', label: 'Open Book Expert AI', description: 'Start a conversation with your AI reading companion.', action: 'open-book-expert' },
    ],
    prompts: [
      {
        id: 'rec-philosophy',
        label: 'Philosophy',
        question: 'Recommend 3 books similar to Siddhartha for exploring inner peace.',
        previewReply: '1. "The Prophet" by Kahlil Gibran\n2. "The Razor\'s Edge" by W. Somerset Maugham\n3. "The Way of Zen" by Alan Watts',
      },
      {
        id: 'concept-critique',
        label: 'Dystopia',
        question: 'Compare state control in 1984 vs Brave New World.',
        previewReply: 'Orwell envisions control through surveillance and fear; Huxley foresees control through pleasure and sedation.',
      },
      {
        id: 'habit-plan',
        label: 'Habit Plan',
        question: 'How do I build a consistent 30-minute daily reading habit?',
        previewReply: 'Anchor reading to morning tea, keep the book in view, and aim for 15 pages before checking digital notifications.',
      },
      {
        id: 'sci-fi-themes',
        label: 'Sci-Fi Depth',
        question: 'What are the core philosophical themes in Dune?',
        previewReply: 'The danger of charismatic leaders, ecological interconnectedness, and the burden of prescience.',
      },
    ],
  },
];
