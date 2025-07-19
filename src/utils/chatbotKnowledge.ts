
/**
 * Comprehensive knowledge base for the Book Expert chatbot
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
    description: "Classic and contemporary fiction from renowned authors worldwide",
    popularBooks: ["Literary classics", "Contemporary novels", "Short story collections"],
    keyAuthors: ["Various acclaimed fiction writers"]
  },
  {
    name: "Science",
    description: "Scientific discoveries, research, and technological advances",
    popularBooks: ["Physics texts", "Biology research", "Technology guides"],
    keyAuthors: ["Leading scientists and researchers"]
  },
  {
    name: "Hindi Literature",
    description: "Rich tradition of Hindi literature and contemporary works",
    popularBooks: ["Classical Hindi texts", "Modern Hindi novels", "Poetry collections"],
    keyAuthors: ["Renowned Hindi authors"]
  },
  {
    name: "Devotional",
    description: "Spiritual and religious texts across various traditions",
    popularBooks: ["Religious scriptures", "Spiritual guides", "Devotional poetry"],
    keyAuthors: ["Spiritual teachers and scholars"]
  },
  {
    name: "Biography",
    description: "Life stories of notable personalities and historical figures",
    popularBooks: ["Autobiographies", "Historical biographies", "Contemporary profiles"],
    keyAuthors: ["Various biographical subjects"]
  },
  {
    name: "History",
    description: "Historical accounts, cultural studies, and heritage documentation",
    popularBooks: ["World history", "Cultural heritage", "Historical analysis"],
    keyAuthors: ["Historians and cultural experts"]
  }
];

export const PLATFORM_FEATURES: PlatformFeature[] = [
  {
    name: "Digital Library",
    route: "/library",
    description: "Browse and search through 10,000+ books with advanced filtering",
    keyFunctions: [
      "Search books by title, author, or genre",
      "Filter by language, publication year, and category",
      "Download free PDFs",
      "View detailed book information and author bios",
      "Add books to personal bookshelf"
    ]
  },
  {
    name: "Reading Dashboard",
    route: "/dashboard",
    description: "Personal reading management and progress tracking",
    keyFunctions: [
      "Set and track reading goals",
      "Monitor current reads and progress",
      "View reading statistics and achievements",
      "Manage personal bookshelf with different statuses",
      "Get personalized book recommendations"
    ]
  },
  {
    name: "Author Connection",
    route: "/authors",
    description: "Discover and connect with authors directly",
    keyFunctions: [
      "Browse author profiles and biographies",
      "View author's complete book collections",
      "Message authors directly",
      "Attend author events and sessions",
      "Follow favorite authors for updates"
    ]
  },
  {
    name: "Social Reading",
    route: "/reviews",
    description: "Community-driven reading discussions and connections",
    keyFunctions: [
      "Join reading groups and book clubs",
      "Share book reviews and ratings",
      "Connect with fellow readers",
      "Participate in book discussions",
      "Share reading progress and recommendations"
    ]
  },
  {
    name: "User Profile",
    route: "/profile",
    description: "Manage personal reading preferences and account settings",
    keyFunctions: [
      "Update reading preferences and goals",
      "Manage privacy settings",
      "View reading history and statistics",
      "Connect social media accounts",
      "Customize notification preferences"
    ]
  }
];

export const COMMON_QUERIES = {
  bookRecommendations: {
    triggers: ["recommend", "suggestion", "what to read", "good books"],
    response: "I'd be happy to recommend books! What genre interests you most? We have excellent collections in Fiction, Science, Hindi Literature, Devotional texts, Biographies, and History. You can also visit your Dashboard for personalized recommendations based on your reading history."
  },
  findBooks: {
    triggers: ["find books", "search books", "looking for"],
    response: "To find books, visit our Library section where you can browse 10,000+ books. Use the search bar for specific titles or authors, and apply filters for genre, language, or publication year. All books come with detailed descriptions and free PDF downloads."
  },
  readingProgress: {
    triggers: ["track reading", "reading progress", "goals"],
    response: "Track your reading journey in the Dashboard! Set reading goals, monitor current books, view detailed statistics, and manage your bookshelf with statuses like 'Currently Reading', 'Want to Read', and 'Completed'."
  },
  community: {
    triggers: ["community", "social", "discussions", "connect"],
    response: "Join our vibrant reading community! Visit the Reviews section to connect with fellow readers, join book clubs, share reviews, and participate in discussions. You can also follow authors and get recommendations from other readers."
  },
  authorConnection: {
    triggers: ["authors", "writers", "connect with author"],
    response: "Explore our Authors section to discover detailed author profiles, browse their books, read their biographies, and even message them directly. You can also attend author events and follow your favorites for updates."
  },
  technicalHelp: {
    triggers: ["how to", "help", "tutorial", "guide"],
    response: "I'm here to guide you through Sahadhyayi! Whether you need help finding books, tracking reading progress, connecting with authors, or joining our community, I can provide step-by-step assistance. What specific feature would you like help with?"
  }
};

export const generateContextualResponse = (userQuery: string): string => {
  const query = userQuery.toLowerCase();
  
  // Check for specific query patterns
  for (const [key, queryData] of Object.entries(COMMON_QUERIES)) {
    if (queryData.triggers.some(trigger => query.includes(trigger))) {
      return queryData.response;
    }
  }
  
  // Genre-specific responses
  const mentionedGenre = BOOK_CATEGORIES.find(category => 
    query.includes(category.name.toLowerCase())
  );
  
  if (mentionedGenre) {
    return `Great choice! ${mentionedGenre.description}. You can find ${mentionedGenre.name} books in our Library section. ${mentionedGenre.popularBooks.join(', ')} are popular in this category. Visit the Library and filter by "${mentionedGenre.name}" to explore our collection.`;
  }
  
  // Feature-specific responses
  const mentionedFeature = PLATFORM_FEATURES.find(feature => 
    query.includes(feature.name.toLowerCase()) || query.includes(feature.route.slice(1))
  );
  
  if (mentionedFeature) {
    return `${mentionedFeature.description}. Key features include: ${mentionedFeature.keyFunctions.slice(0, 3).join(', ')}. Visit ${mentionedFeature.route} to access this feature.`;
  }
  
  // Default helpful response
  return "Welcome to Sahadhyayi Digital Library! I'm your Book Expert AI. I can help you find books, track reading progress, connect with authors, and navigate our community features. What would you like to explore today?";
};
