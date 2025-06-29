
import { useQuery } from '@tanstack/react-query';

export interface InternetArchiveBook {
  identifier: string;
  metadata: {
    title: string;
    creator?: string;
    description?: string;
    publisher?: string;
    date?: string;
    language?: string;
  };
  files: Array<{
    name: string;
    format: string;
    size: string;
    source?: string;
  }>;
  server: string;
  dir: string;
}

export interface BookPage {
  pageNumber: number;
  imageUrl: string;
  text?: string;
}

export const useInternetArchiveBook = (identifier: string) => {
  return useQuery({
    queryKey: ['internet-archive-book', identifier],
    queryFn: async (): Promise<InternetArchiveBook> => {
      const response = await fetch(`https://archive.org/metadata/${identifier}`);
      if (!response.ok) {
        throw new Error('Failed to fetch book metadata');
      }
      return response.json();
    },
    enabled: !!identifier,
  });
};

export const useBookPages = (identifier: string) => {
  return useQuery({
    queryKey: ['book-pages', identifier],
    queryFn: async (): Promise<BookPage[]> => {
      // First get the book metadata to find page files
      const metadataResponse = await fetch(`https://archive.org/metadata/${identifier}`);
      if (!metadataResponse.ok) {
        throw new Error('Failed to fetch book metadata');
      }
      
      const metadata: InternetArchiveBook = await metadataResponse.json();
      
      // Find page image files (usually jp2 or jpg format)
      const pageFiles = metadata.files.filter(file => 
        file.name.includes('_jp2.zip') || 
        file.name.includes('.jp2') ||
        (file.name.includes('.jpg') && file.name.includes('page'))
      );

      // If we have a jp2.zip file, we need to extract individual pages
      const jp2ZipFile = pageFiles.find(file => file.name.includes('_jp2.zip'));
      
      if (jp2ZipFile) {
        // For simplicity, we'll generate page URLs based on common Internet Archive patterns
        // In a production app, you'd want to extract the actual zip contents
        const baseUrl = `https://${metadata.server}${metadata.dir}`;
        const pages: BookPage[] = [];
        
        // Generate page URLs for typical Internet Archive book structure
        // Most books have pages numbered from 0000 to NNNN
        for (let i = 0; i < 300; i++) { // Assume max 300 pages, adjust as needed
          const pageNum = i.toString().padStart(4, '0');
          pages.push({
            pageNumber: i + 1,
            imageUrl: `${baseUrl}/${identifier}_jp2/${identifier}_${pageNum}.jp2`,
          });
        }
        
        return pages;
      }

      // Fallback: create placeholder pages
      return Array.from({ length: 200 }, (_, i) => ({
        pageNumber: i + 1,
        imageUrl: `https://via.placeholder.com/600x800/f0f0f0/333333?text=Page+${i + 1}`,
      }));
    },
    enabled: !!identifier,
  });
};

export const getInternetArchiveBookId = (url: string): string | null => {
  // Extract book ID from Internet Archive URL
  const match = url.match(/archive\.org\/details\/([^\/\?]+)/);
  return match ? match[1] : null;
};
