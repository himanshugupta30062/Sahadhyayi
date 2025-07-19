
/**
 * Enhanced knowledge base for the Book Expert chatbot with more varied responses
 */

export interface BookCategory {
  name: string;
  description: string;
  popularBooks: string[];
  keyAuthors: string[];
}

export interface PlatformFeature {
  name: string;
  route: string;
  description: string;
  keyFunctions: string[];
}

export const BOOK_CATEGORIES: BookCategory[] = [
  {
    name: "Fiction",
    description: "Immerse yourself in captivating stories from classic and contemporary fiction",
    popularBooks: ["Literary masterpieces", "Contemporary novels", "Short story collections", "Classic literature"],
    keyAuthors: ["Renowned fiction writers", "Award-winning novelists"]
  },
  {
    name: "Science",
    description: "Explore the wonders of scientific discovery and technological innovation",
    popularBooks: ["Physics explorations", "Biology research", "Technology guides", "Scientific breakthroughs"],
    keyAuthors: ["Leading scientists", "Research pioneers"]
  },
  {
    name: "Hindi Literature",
    description: "Discover the rich tapestry of Hindi literature from classical to modern works",
    popularBooks: ["Classical Hindi texts", "Modern Hindi novels", "Poetry collections", "Cultural narratives"],
    keyAuthors: ["Distinguished Hindi authors", "Contemporary Hindi writers"]
  },
  {
    name: "Devotional",
    description: "Find spiritual guidance and inspiration through devotional texts",
    popularBooks: ["Sacred scriptures", "Spiritual guides", "Devotional poetry", "Religious philosophy"],
    keyAuthors: ["Spiritual teachers", "Religious scholars"]
  },
  {
    name: "Biography",
    description: "Learn from the life journeys of remarkable personalities",
    popularBooks: ["Inspiring autobiographies", "Historical biographies", "Contemporary profiles", "Leadership stories"],
    keyAuthors: ["Notable personalities", "Historical figures"]
  },
  {
    name: "History",
    description: "Journey through time with engaging historical accounts and cultural studies",
    popularBooks: ["World history", "Cultural heritage", "Historical analysis", "Ancient civilizations"],
    keyAuthors: ["Historians", "Cultural experts"]
  }
];

export const PLATFORM_FEATURES: PlatformFeature[] = [
  {
    name: "Digital Library",
    route: "/library",
    description: "Your gateway to 10,000+ books with powerful search and discovery tools",
    keyFunctions: [
      "Advanced search by title, author, genre, or keywords",
      "Smart filtering by language, publication year, and category",
      "Free PDF downloads for all books",
      "Detailed book pages with descriptions and author bios",
      "Personal bookshelf management with reading statuses"
    ]
  },
  {
    name: "Reading Dashboard",
    route: "/dashboard",
    description: "Your personal reading command center for tracking progress and goals",
    keyFunctions: [
      "Set and monitor personalized reading goals",
      "Track reading progress with detailed statistics",
      "Manage your bookshelf with multiple reading statuses",
      "Get AI-powered book recommendations",
      "View reading achievements and milestones"
    ]
  },
  {
    name: "Author Connection",
    route: "/authors",
    description: "Connect directly with authors and discover their literary worlds",
    keyFunctions: [
      "Explore comprehensive author profiles and biographies",
      "Browse complete author book collections",
      "Send direct messages to authors",
      "Attend virtual author events and sessions",
      "Follow favorite authors for latest updates"
    ]
  },
  {
    name: "Social Reading Community",
    route: "/reviews",
    description: "Join a vibrant community of book lovers and reading enthusiasts",
    keyFunctions: [
      "Connect with fellow readers and book enthusiasts",
      "Share detailed book reviews and ratings",
      "Join or create reading groups and book clubs",
      "Participate in engaging book discussions",
      "Discover books through social recommendations"
    ]
  },
  {
    name: "User Profile",
    route: "/profile",
    description: "Customize your reading experience and manage your account",
    keyFunctions: [
      "Set reading preferences and favorite genres",
      "Manage privacy and notification settings",
      "View comprehensive reading history and statistics",
      "Connect social media accounts for sharing",
      "Customize your reading goals and targets"
    ]
  }
];

// Enhanced response patterns with more variety
export const RESPONSE_PATTERNS = {
  bookSearch: [
    "Let me help you find the perfect book! What genre or topic interests you most?",
    "I'd love to help you discover your next great read! Are you looking for something specific?",
    "Book discovery time! Tell me about your reading preferences - fiction, non-fiction, or something specific?"
  ],
  
  genreExploration: [
    "Excellent choice! That genre has some fantastic options in our library.",
    "Great selection! We have an amazing collection in that category.",
    "Perfect! That's one of our most popular genres with incredible variety."
  ],
  
  featureGuidance: [
    "I'll guide you through that feature step by step!",
    "Let me show you how to make the most of that section!",
    "That's a powerful feature - here's how to use it effectively:"
  ],
  
  encouragement: [
    "That sounds like a great reading journey ahead!",
    "Wonderful! You're going to love exploring that.",
    "Excellent choice! I think you'll find exactly what you're looking for."
  ]
};

export const generateContextualResponse = (userQuery: string): string => {
  const query = userQuery.toLowerCase();
  
  // More specific pattern matching with varied responses
  if (query.includes('find') && query.includes('book')) {
    return RESPONSE_PATTERNS.bookSearch[Math.floor(Math.random() * RESPONSE_PATTERNS.bookSearch.length)] + 
           " You can explore our Library section with 10,000+ books across all genres, or tell me your preferences for personalized recommendations!";
  }
  
  if (query.includes('recommend') || query.includes('suggest')) {
    return "I'd love to recommend some great reads! What draws you in - compelling characters, fascinating facts, spiritual insights, or perhaps historical adventures? Our library spans Fiction, Science, Hindi Literature, Devotional texts, Biographies, and History.";
  }
  
  if (query.includes('track') && (query.includes('reading') || query.includes('progress'))) {
    return "Your reading journey deserves proper tracking! In your Dashboard, you can set reading goals, monitor your progress through books, and see detailed statistics of your reading habits. Want help setting up your first reading goal?";
  }
  
  if (query.includes('author') && query.includes('connect')) {
    return "Author connections are one of our unique features! You can browse author profiles, read their biographies, explore their complete works, and even send them direct messages. Some authors also host virtual sessions. Are you looking for a specific author?";
  }
  
  if (query.includes('community') || query.includes('social')) {
    return "Our reading community is incredibly active! You can join reading groups, share book reviews, connect with fellow readers, and discover books through social recommendations. It's like having a book club that never sleeps! Want to explore the social features?";
  }
  
  if (query.includes('download') || query.includes('pdf')) {
    return "Absolutely! Every book in our library offers free PDF downloads - we believe knowledge should be accessible to everyone. Just visit any book's page and hit the download button. Looking for a specific book to download?";
  }
  
  if (query.includes('hindi') || query.includes('हिंदी')) {
    return "Our Hindi Literature section is a treasure trove! From classical works like Godan and Gunahon Ka Devta to contemporary Hindi novels and poetry collections. We celebrate the rich tradition of Hindi literature. Any particular Hindi author or genre you're interested in?";
  }
  
  // Genre-specific responses with more personality
  const mentionedGenre = BOOK_CATEGORIES.find(category => 
    query.includes(category.name.toLowerCase()) || 
    category.name.toLowerCase().includes(query.replace(/books?/g, '').trim())
  );
  
  if (mentionedGenre) {
    const randomEncouragement = RESPONSE_PATTERNS.genreExploration[Math.floor(Math.random() * RESPONSE_PATTERNS.genreExploration.length)];
    return `${randomEncouragement} ${mentionedGenre.description}. Our ${mentionedGenre.name} collection includes ${mentionedGenre.popularBooks.slice(0, 2).join(' and ')} among many others. Visit our Library and filter by "${mentionedGenre.name}" to explore everything we have!`;
  }
  
  // Feature-specific responses
  const mentionedFeature = PLATFORM_FEATURES.find(feature => 
    query.includes(feature.name.toLowerCase()) || 
    query.includes(feature.route.slice(1)) ||
    feature.keyFunctions.some(func => query.includes(func.toLowerCase().split(' ')[0]))
  );
  
  if (mentionedFeature) {
    const randomGuidance = RESPONSE_PATTERNS.featureGuidance[Math.floor(Math.random() * RESPONSE_PATTERNS.featureGuidance.length)];
    return `${randomGuidance} ${mentionedFeature.description}. Key features include ${mentionedFeature.keyFunctions.slice(0, 2).join(' and ')}. Head to ${mentionedFeature.route} to get started!`;
  }
  
  // Default responses with more variety - avoid the repetitive message
  const helpfulResponses = [
    "I'm here to help you make the most of Sahadhyayi! Whether you're looking for your next great read, want to track your reading progress, or connect with our amazing community of readers, I can guide you. What interests you most?",
    "Let's explore what Sahadhyayi has to offer together! From discovering new books to connecting with authors and fellow readers, there's so much to explore. What would you like to dive into first?",
    "Great to chat with you! I can help you navigate our extensive library, set up reading goals, find author connections, or join our reading community. What sounds most interesting to you right now?",
    "Welcome! I'm excited to help you discover everything Sahadhyayi offers. Whether it's finding the perfect book, tracking your reading journey, or connecting with other book lovers, I'm here to guide you. Where shall we start?"
  ];
  
  return helpfulResponses[Math.floor(Math.random() * helpfulResponses.length)];
};
