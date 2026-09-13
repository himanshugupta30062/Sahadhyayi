import {
  supabase
} from "./chunk-I5QU6NVE.js";

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
