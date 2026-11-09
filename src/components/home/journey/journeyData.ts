export interface JourneyFeature {
  label: string;
  description: string;
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
  distanceKm: number;
  title: string;
  subtitle: string;
  landmarkName: string;
  lore: string;
  description: string;
  badge: string;
  route: string;
  ctaText: string;
  secondaryRoute?: string;
  secondaryCtaText?: string;
  stats: { value: string; label: string }[];
  features: JourneyFeature[];
  accentColor: string; // HSL color or theme token
  prompts?: QuickPrompt[];
}

export const JOURNEY_DESTINATIONS: JourneyDestination[] = [
  {
    id: 'library-city',
    index: 1,
    distanceKm: 0.0,
    title: 'Library City',
    subtitle: 'Where Human Knowledge Gathers',
    landmarkName: 'The Grand Classical Archives',
    badge: 'Milestone 01 · Departure City',
    lore: 'Our student begins at the great metropolitan archives — towering marble arches, sunlit reading halls, and endless rows of open books waiting to be explored.',
    description: 'Dive into more than 100,000 public domain classics, contemporary masterpieces, and curated anthologies. Filter by genre, era, language, or theme.',
    route: '/library',
    ctaText: 'Explore Digital Library',
    secondaryRoute: '/discovery',
    secondaryCtaText: 'Smart Book Discovery',
    accentColor: '#1C442D',
    stats: [
      { value: '100K+', label: 'Digital Books' },
      { value: '45+', label: 'Literary Genres' },
      { value: 'Free', label: 'Open Access' },
    ],
    features: [
      { label: 'Public Domain Classics', description: 'Timeless philosophy, world literature, and historical treatises.' },
      { label: 'Curated Anthologies', description: 'Hand-selected collections tailored for deep thematic study.' },
      { label: 'Instant In-Browser Reader', description: 'Distraction-free typography, bookmarks, and font tuning.' },
    ],
  },
  {
    id: 'reading-valley',
    index: 2,
    distanceKm: 3.4,
    title: 'Reading Valley',
    subtitle: 'Your Private Sanctuary',
    landmarkName: 'The Ancient Oak of Solitude',
    badge: 'Milestone 02 · Rolling Hills',
    lore: 'Pedaling past the city gates into rolling green pastures, our cyclist pauses beneath a magnificent oak tree where a fellow reader sits lost in thought.',
    description: 'Keep your reading life beautifully organized. Track current reads, build custom shelves, log reading streaks, and preserve marginalia highlights.',
    route: '/bookshelf',
    ctaText: 'Open Your Bookshelf',
    secondaryRoute: '/dashboard',
    secondaryCtaText: 'Reading Dashboard',
    accentColor: '#2D5E3A',
    stats: [
      { value: 'Personal', label: 'Custom Shelves' },
      { value: 'Daily', label: 'Streak Tracker' },
      { value: 'Private', label: 'Reading Notes' },
    ],
    features: [
      { label: 'Custom Digital Shelves', description: 'Organize by Currently Reading, Want to Read, and Favorites.' },
      { label: 'Daily Streak Counter', description: 'Build consistency with gentle habit tracking and milestones.' },
      { label: 'Reading Goal Insights', description: 'Visualize your yearly reading targets and pacing.' },
    ],
  },
  {
    id: 'reader-village',
    index: 3,
    distanceKm: 7.8,
    title: 'Reader Village',
    subtitle: 'Fellow Readers in Every Corner',
    landmarkName: 'The Village Book Exchange Kiosk',
    badge: 'Milestone 03 · Cobblestone Hamlet',
    lore: 'Arriving in a cozy hamlet with stone cottages and chimney smoke, the student spots a neighborhood "Take a Book, Leave a Book" library where neighbors gather.',
    description: 'Reading never has to be lonely. Discover readers in your neighborhood, find local book swaps, and form meaningful friendships with kindred spirits.',
    route: '/map',
    ctaText: 'Find Readers Near Me',
    secondaryRoute: '/social?tab=friends',
    secondaryCtaText: 'Reader Connections',
    accentColor: '#8F681C',
    stats: [
      { value: 'Local', label: 'Reader Map' },
      { value: '100%', label: 'Privacy Safe' },
      { value: 'Nearby', label: 'Book Swaps' },
    ],
    features: [
      { label: 'Interactive Reader Map', description: 'Discover fellow book lovers around your campus or neighborhood.' },
      { label: 'Privacy First', description: 'Only share what you choose with coarse city-level precision.' },
      { label: 'Book Lending Circles', description: 'Borrow and exchange physical books with trusted peers.' },
    ],
  },
  {
    id: 'reading-bridge',
    index: 4,
    distanceKm: 12.1,
    title: 'Reading Together Bridge',
    subtitle: 'Shared Thoughts, Boundless Discourse',
    landmarkName: 'The Stone Aqueduct of Dialogue',
    badge: 'Milestone 04 · River Crossing',
    lore: 'Crossing a grand triple-arched stone bridge spanning a glittering river, the student joins lively book clubs gathered on the balustrades discussing favorite chapters.',
    description: 'Join community book clubs, schedule buddy reads, debate plot twists, and share chapter-by-chapter reflections in dedicated reading spaces.',
    route: '/groups',
    ctaText: 'Browse Book Clubs',
    secondaryRoute: '/social',
    secondaryCtaText: 'Community Feed',
    accentColor: '#2B577E',
    stats: [
      { value: '250+', label: 'Reading Clubs' },
      { value: 'Live', label: 'Buddy Reads' },
      { value: 'Daily', label: 'Chapter Salons' },
    ],
    features: [
      { label: 'Themed Book Circles', description: 'From Sci-Fi & Philosophy to Classics and Non-Fiction.' },
      { label: 'Chapter Discussions', description: 'Spoiler-protected threads for safe reading progress.' },
      { label: 'Live Virtual Salons', description: 'Schedule weekend reading sprints and voice discussions.' },
    ],
  },
  {
    id: 'storytelling-forest',
    index: 5,
    distanceKm: 16.5,
    title: 'Storytelling Forest',
    subtitle: 'From Reader to Creator',
    landmarkName: 'The Lantern Gazebo of Tales',
    badge: 'Milestone 05 · Enchanted Woods',
    lore: 'Deep in an enchanted birch forest glowing with hanging paper lanterns, our traveler finds writers seated at open-air cedar desks penning original serialized tales.',
    description: 'Unleash your creativity. Publish serialized fiction, write reflective essays, receive constructive peer feedback, and build a following of devoted readers.',
    route: '/stories',
    ctaText: 'Read & Write Stories',
    secondaryRoute: '/articles',
    secondaryCtaText: 'Literary Articles',
    accentColor: '#6B4286',
    stats: [
      { value: 'Chapters', label: 'Serial Releases' },
      { value: 'Rich Text', label: 'Distraction-Free' },
      { value: 'Community', label: 'Peer Reviews' },
    ],
    features: [
      { label: 'Serialized Fiction Hub', description: 'Publish chapter-by-chapter with subscriber notifications.' },
      { label: 'Literary Articles', description: 'Write long-form book critiques and philosophical essays.' },
      { label: 'Writer Prompts', description: 'Weekly creative challenges to spark fresh inspiration.' },
    ],
  },
  {
    id: 'author-avenue',
    index: 6,
    distanceKm: 21.0,
    title: 'Author Avenue',
    subtitle: 'Walk With the Masters',
    landmarkName: 'The Boulevard of Great Pens',
    badge: 'Milestone 06 · Boulevard of Pens',
    lore: 'A scenic promenade lined with gas lamps and bronze bust plaques of history’s greatest authors — from Tagore and Tolstoy to Woolf and Morrison.',
    description: 'Explore comprehensive biographies, literary timelines, verified author accounts, and exclusive author interviews shedding light on the craft.',
    route: '/authors',
    ctaText: 'Meet Renowned Authors',
    secondaryRoute: '/author-interviews',
    secondaryCtaText: 'Author Interviews',
    accentColor: '#964326',
    stats: [
      { value: '500+', label: 'Author Profiles' },
      { value: 'Verified', label: 'Creator Hubs' },
      { value: 'In-Depth', label: 'Craft Interviews' },
    ],
    features: [
      { label: 'Author Portfolios', description: 'Complete bibliographies, chronological guides, and quotes.' },
      { label: 'Creator Verification', description: 'Direct connection between contemporary authors and fans.' },
      { label: 'Literary Lineage', description: 'See who influenced who across centuries of literature.' },
    ],
  },
  {
    id: 'festival-hills',
    index: 7,
    distanceKm: 26.2,
    title: 'Festival Hills',
    subtitle: 'The Literary Playground',
    landmarkName: 'The Mountain Book Fair Pavilion',
    badge: 'Milestone 07 · Highland Fair',
    lore: 'Climbing into the highlands, colorful festival pavilions appear with bunting banners, book trivia contests, celebratory bonfires, and hot air balloons drifting overhead.',
    description: 'Test your literary knowledge with daily quizzes, compete on global leaderboards, join annual reading challenges, and participate in virtual book festivals.',
    route: '/events',
    ctaText: 'Explore Literary Events',
    secondaryRoute: '/games',
    secondaryCtaText: 'Play Literary Games',
    accentColor: '#A0641E',
    stats: [
      { value: 'Daily', label: 'Trivia Quizzes' },
      { value: 'Global', label: 'Leaderboard' },
      { value: 'Live', label: 'Festival Events' },
    ],
    features: [
      { label: 'Interactive Book Games', description: 'Word quests, quote identification, and literary trivia.' },
      { label: 'Seasonal Reading Quests', description: 'Badges and accomplishments for expanding your horizons.' },
      { label: 'Community Gatherings', description: 'Book launch events, webinars, and literary meetups.' },
    ],
  },
  {
    id: 'ai-knowledge-station',
    index: 8,
    distanceKm: 30.0,
    title: 'AI Knowledge Station',
    subtitle: 'Meet Your Book Expert AI',
    landmarkName: 'The Summit Observatory Rotunda',
    badge: 'Milestone 08 · Summit Observatory',
    lore: 'At the peak of the mountain stands a luminous domed observatory with an astrolabe and a floating holographic book sphere — the nerve center of Book Expert AI.',
    description: 'Your 24/7 personal literary companion. Ask anything — from complex philosophical comparisons and plot clarifications to hyper-personalized book recommendations.',
    route: '/book-expert',
    ctaText: 'Open Book Expert AI',
    accentColor: '#1F5475',
    stats: [
      { value: 'Instant', label: 'Deep Answers' },
      { value: 'Omniscient', label: 'Book Analysis' },
      { value: '24/7', label: 'Reading Guide' },
    ],
    features: [
      { label: 'Philosophical Synthesis', description: 'Compare Eastern and Western philosophy or dissect complex metaphors.' },
      { label: 'Hyper-Personalized Recs', description: 'Describe your exact mood, taste, or dilemma to get tailored titles.' },
      { label: 'Chapter Companion', description: 'Ask questions without spoilers while progressing through any book.' },
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
