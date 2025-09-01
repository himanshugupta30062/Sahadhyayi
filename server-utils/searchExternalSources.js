// src/integrations/supabase/client.ts
import { createClient } from "@supabase/supabase-js";
var SUPABASE_URL = "https://rknxtatvlzunatpyqxro.supabase.co";
var SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrbnh0YXR2bHp1bmF0cHlxeHJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MzI0MjUsImV4cCI6MjA2NTUwODQyNX0.NXIWEwm8NlvzHnxf55cgdsy1ljX2IbFKQL7OS8xlb-U";
var supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: typeof window !== "undefined" ? localStorage : void 0,
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

// src/utils/searchExternalSources.ts
async function searchExternalSources(query) {
  try {
    const { data, error } = await supabase.functions.invoke("search-books-preview", {
      body: { searchTerm: query }
    });
    if (error)
      throw error;
    return ((data == null ? void 0 : data.books) || []).filter((book) => book.pdf_url).map((book) => ({
      id: book.isbn || book.title,
      title: book.title || "Unknown Title",
      author: book.author,
      year: book.publication_year ? String(book.publication_year) : void 0,
      language: book.language,
      extension: book.pdf_url ? "pdf" : void 0,
      size: book.pages ? `${book.pages} pages` : void 0,
      md5: book.isbn || book.title,
      downloadUrl: book.pdf_url,
      source: "open_access"
    }));
  } catch (err) {
    console.error("searchExternalSources error:", err);
    return [];
  }
}
export {
  searchExternalSources
};
