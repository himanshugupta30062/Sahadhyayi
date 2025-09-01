// src/integrations/supabase/client-universal.ts
import { createClient } from "@supabase/supabase-js";
var SUPABASE_URL = "https://rknxtatvlzunatpyqxro.supabase.co";
var SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrbnh0YXR2bHp1bmF0cHlxeHJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MzI0MjUsImV4cCI6MjA2NTUwODQyNX0.NXIWEwm8NlvzHnxf55cgdsy1ljX2IbFKQL7OS8xlb-U";
var supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storage: typeof window !== "undefined" ? window.localStorage : void 0,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: "pkce"
  },
  global: {
    headers: {
      "X-Client-Info": "sahadhyayi-app"
    }
  }
});

// src/utils/enhancedChatbotKnowledge.ts
var getWebsiteContext = async () => {
  try {
    const { count: totalBooks } = await supabase.from("books_library").select("*", { count: "exact", head: true });
    const { data: genreData } = await supabase.from("books_library").select("genre").not("genre", "is", null);
    const genres = [...new Set(genreData == null ? void 0 : genreData.map((item) => item.genre).filter(Boolean))];
    const { data: recentBooks } = await supabase.from("books_library").select("id, title, author, genre, description, language").order("created_at", { ascending: false }).limit(10);
    return {
      totalBooks: totalBooks || 0,
      genres,
      features: [
        "Digital Library with 10,000+ books",
        "Free PDF downloads",
        "Reading progress tracking",
        "Author connections",
        "Social reading community",
        "Book recommendations",
        "Reading goals and statistics"
      ],
      recentBooks: recentBooks || []
    };
  } catch (error) {
    console.error("Error fetching website context:", error);
    return {
      totalBooks: 1e4,
      genres: ["Fiction", "Science", "Hindi Literature", "Devotional", "Biography", "History"],
      features: ["Digital Library", "Free Downloads", "Progress Tracking", "Author Connections"],
      recentBooks: []
    };
  }
};
var generateEnhancedPrompt = (userMessage, context) => {
  const { totalBooks, genres, features, recentBooks } = context;
  let prompt = "You are an AI assistant for the Sahadhyayi digital library. Use the website context to answer user questions.\n\n";
  prompt += `Total books in library: ${totalBooks}.
`;
  if (genres.length > 0) {
    prompt += `Available genres include: ${genres.join(", ")}.
`;
  }
  if (features.length > 0) {
    prompt += `Key features: ${features.join(", ")}.
`;
  }
  if (recentBooks.length > 0) {
    prompt += "Recent books:\n";
    recentBooks.slice(0, 3).forEach((book) => {
      prompt += `- "${book.title}" by ${book.author} (${book.genre})
`;
    });
  }
  prompt += `
User query: ${userMessage}
`;
  prompt += "Provide a concise and helpful response referencing the context when relevant.";
  return prompt;
};
var searchRelevantBooks = async (query, limit = 5) => {
  try {
    const { data, error } = await supabase.from("books_library").select("id, title, author, genre, description, language").or(`title.ilike.%${query}%,author.ilike.%${query}%,description.ilike.%${query}%,genre.ilike.%${query}%`).limit(limit);
    if (error)
      throw error;
    return data || [];
  } catch (error) {
    console.error("Error searching books:", error);
    return [];
  }
};
var getBookSummaries = async (bookIds) => {
  try {
    const { data, error } = await supabase.from("book_summaries").select("content, book_id, books_library(title, author)").in("book_id", bookIds).limit(3);
    if (error)
      throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching book summaries:", error);
    return [];
  }
};
var populateInitialTrainingData = async (userId) => {
  const trainingData = [
    {
      prompt: JSON.stringify({
        original_prompt: "What is Sahadhyayi?",
        category: "platform_overview",
        context: "website_knowledge",
        metadata: {
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          platform: "sahadhyayi",
          interaction_type: "knowledge_base"
        }
      }),
      completion: "Sahadhyayi is a digital library platform with 10,000+ free books across Fiction, Science, Hindi Literature, Devotional, Biography, and History genres. You can download PDFs for free, track reading progress, and connect with authors and readers."
    },
    {
      prompt: JSON.stringify({
        original_prompt: "How do I find books?",
        category: "book_discovery",
        context: "website_knowledge",
        metadata: {
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          platform: "sahadhyayi",
          interaction_type: "navigation"
        }
      }),
      completion: "Visit /library to browse our collection, use the search bar for specific titles/authors, or filter by genre. You can also get personalized recommendations based on your reading preferences."
    },
    {
      prompt: JSON.stringify({
        original_prompt: "What features does Sahadhyayi offer?",
        category: "features",
        context: "website_knowledge",
        metadata: {
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          platform: "sahadhyayi",
          interaction_type: "features"
        }
      }),
      completion: "Key features include: free PDF downloads, reading progress tracking (/dashboard), author connections (/authors), social reading community (/social), book recommendations, and reading goals. All books are completely free to access."
    },
    {
      prompt: JSON.stringify({
        original_prompt: "How do I download books?",
        category: "download_process",
        context: "website_knowledge",
        metadata: {
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          platform: "sahadhyayi",
          interaction_type: "process"
        }
      }),
      completion: "Find any book in our library, click on it to open the detail page, then click 'Download PDF'. All 10,000+ books are completely free to download with no registration required."
    },
    {
      prompt: JSON.stringify({
        original_prompt: "Tell me about Hindi literature",
        category: "genre_specific",
        context: "book_collection",
        metadata: {
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          platform: "sahadhyayi",
          interaction_type: "genre_inquiry"
        }
      }),
      completion: "Our Hindi Literature collection includes classical and modern Hindi texts, poetry collections, and works by renowned Hindi authors. Browse the /library section and filter by 'Hindi Literature' to explore our extensive collection."
    },
    {
      prompt: JSON.stringify({
        original_prompt: "Can I track my reading progress?",
        category: "progress_tracking",
        context: "website_knowledge",
        metadata: {
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          platform: "sahadhyayi",
          interaction_type: "feature_inquiry"
        }
      }),
      completion: "Yes! Visit your /dashboard to set reading goals, track progress, manage your bookshelf, and view detailed reading statistics. You can organize books by status: reading, completed, or want to read."
    },
    {
      prompt: JSON.stringify({
        original_prompt: "How do I connect with authors?",
        category: "author_connection",
        context: "website_knowledge",
        metadata: {
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          platform: "sahadhyayi",
          interaction_type: "social_feature"
        }
      }),
      completion: "Visit /authors to browse author profiles, read their biographies, and connect with them directly. You can also attend virtual author events and join author-led reading discussions."
    },
    {
      prompt: JSON.stringify({
        original_prompt: "What genres are available?",
        category: "genres",
        context: "book_collection",
        metadata: {
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          platform: "sahadhyayi",
          interaction_type: "collection_inquiry"
        }
      }),
      completion: "We offer 6 main genres: Fiction (novels, stories), Science (physics, biology, tech), Hindi Literature (classical, modern), Devotional (spiritual texts), Biography (life stories), and History (world, cultural heritage)."
    }
  ];
  try {
    for (const data of trainingData) {
      await supabase.from("gemini_training_data").insert({
        user_id: userId,
        prompt: data.prompt,
        completion: data.completion
      });
    }
    console.log("Initial training data populated successfully");
  } catch (error) {
    console.error("Error populating training data:", error);
  }
};
export {
  generateEnhancedPrompt,
  getBookSummaries,
  getWebsiteContext,
  populateInitialTrainingData,
  searchRelevantBooks
};
