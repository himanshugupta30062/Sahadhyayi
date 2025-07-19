
// Utility functions for cleaning and preparing book data for API requests

export interface CleanBookData {
  id: string;
  title: string;
  author: string;
  description?: string;
  imageUrl?: string;
  source: 'google_books' | 'internet_archive' | 'manual';
  isbn?: string;
  publishedDate?: string;
  pageCount?: number;
  language?: string;
  genre?: string;
}

export const constructImageUrl = (volumeInfo: any): string | undefined => {
  if (!volumeInfo?.imageLinks) return undefined;
  
  // Try to get the highest quality image available
  const imageLinks = volumeInfo.imageLinks;
  
  if (imageLinks.extraLarge) return imageLinks.extraLarge;
  if (imageLinks.large) return imageLinks.large;
  if (imageLinks.medium) return imageLinks.medium;
  if (imageLinks.small) return imageLinks.small;
  if (imageLinks.thumbnail) return imageLinks.thumbnail;
  if (imageLinks.smallThumbnail) return imageLinks.smallThumbnail;
  
  return undefined;
};

export const cleanGoogleBooksData = (item: any): CleanBookData => {
  const volumeInfo = item.volumeInfo || {};
  
  return {
    id: item.id || '',
    title: volumeInfo.title || 'Unknown Title',
    author: volumeInfo.authors?.join(', ') || 'Unknown Author',
    description: volumeInfo.description || '',
    imageUrl: constructImageUrl(volumeInfo),
    source: 'google_books',
    isbn: volumeInfo.industryIdentifiers?.[0]?.identifier || '',
    publishedDate: volumeInfo.publishedDate || '',
    pageCount: volumeInfo.pageCount || 0,
    language: volumeInfo.language || 'en',
    genre: volumeInfo.categories?.[0] || 'General'
  };
};

export const cleanInternetArchiveData = (item: any): CleanBookData => {
  return {
    id: item.identifier || '',
    title: item.title || 'Unknown Title',
    author: item.creator?.join(', ') || 'Unknown Author',
    description: item.description || '',
    imageUrl: item.identifier ? `https://archive.org/services/img/${item.identifier}` : undefined,
    source: 'internet_archive',
    publishedDate: item.date || '',
    pageCount: 0,
    language: item.language?.[0] || 'en',
    genre: item.subject?.[0] || 'General'
  };
};

export const prepareBookForLibrary = (bookData: CleanBookData) => {
  // Only send essential, clean data to the API
  return {
    title: bookData.title,
    author: bookData.author,
    description: bookData.description,
    cover_image_url: bookData.imageUrl,
    isbn: bookData.isbn,
    publication_year: bookData.publishedDate ? parseInt(bookData.publishedDate.split('-')[0]) : undefined,
    pages: bookData.pageCount,
    language: bookData.language,
    genre: bookData.genre,
    source: bookData.source
  };
};
