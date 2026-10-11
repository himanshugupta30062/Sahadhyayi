import type { Edition } from '@/types/bookCatalog';
import type { BookProviderAdapter } from './providerAdapter';
import { normalizeAuthor, normalizeTitle } from '../metadataNormalization';
import { evaluateBookQuality } from '../qualityScoring';

export interface OpenTextbookRawItem {
  id: number | string;
  title: string;
  author: string;
  description?: string;
  cover_url?: string;
  pdf_url?: string;
  ebook_url?: string;
  read_online_url?: string;
  subject?: string;
  publisher?: string;
  publication_year?: number;
  license?: string;
  reviews_count?: number;
}

/**
 * Open Textbook Library Adapter: Handles openly licensed, educator-reviewed college textbooks.
 */
export class OpenTextbookAdapter implements BookProviderAdapter {
  readonly id = 'open_textbook_library';
  readonly name = 'Open Textbook Library';
  readonly tier = 'A' as const;
  readonly isFreeToRead = true;

  transformItem(item: OpenTextbookRawItem): Edition {
    const normTitle = normalizeTitle(item.title);
    const normAuthor = normalizeAuthor(item.author);

    const evalResult = evaluateBookQuality({
      title: normTitle.cleanTitle,
      author: normAuthor.normalizedAuthor,
      description: item.description,
      coverImageUrl: item.cover_url,
      pdfUrl: item.pdf_url,
      epubUrl: item.ebook_url,
      publicationYear: item.publication_year,
      genre: item.subject || 'Textbook',
      sourceProvider: 'opentextbook',
      isPeerReviewed: (item.reviews_count || 0) > 0,
      licenseEvidence: 'open_access',
    });

    const assets = [];
    if (item.ebook_url) {
      assets.push({
        format: 'epub' as const,
        downloadUrl: item.ebook_url,
        isDirectDownload: true,
        isDirectRead: true,
        verified: true,
        sourceProvider: 'open_textbook_library',
      });
    }
    if (item.pdf_url) {
      assets.push({
        format: 'pdf' as const,
        downloadUrl: item.pdf_url,
        isDirectDownload: true,
        isDirectRead: true,
        verified: true,
        sourceProvider: 'open_textbook_library',
      });
    }
    if (item.read_online_url) {
      assets.push({
        format: 'html' as const,
        readerUrl: item.read_online_url,
        isDirectDownload: false,
        isDirectRead: true,
        verified: true,
        sourceProvider: 'open_textbook_library',
      });
    }

    return {
      id: `otl-${item.id}`,
      workId: `${normTitle.cleanTitle.toLowerCase()}::${normAuthor.normalizedAuthor.toLowerCase()}`,
      title: normTitle.cleanTitle,
      subtitle: normTitle.subtitle,
      editionTag: 'Open Textbook Edition',
      author: normAuthor.normalizedAuthor,
      publisher: item.publisher || 'Open Textbook Network',
      publicationYear: item.publication_year,
      language: 'English',
      genre: item.subject || 'Textbook',
      description: item.description,
      coverImageUrl: item.cover_url,
      accessStatus: 'open_textbook',
      licenseEvidence: 'open_access',
      qualityScore: evalResult.score,
      qualityBreakdown: evalResult.breakdown,
      qualityReasons: evalResult.reasons,
      isPreferredEdition: true,
      whyThisEdition: 'Peer-reviewed complete open textbook with educator evaluation and open educational licensing.',
      assets,
      sources: [
        {
          provider: 'open_textbook_library',
          providerId: String(item.id),
          sourceUrl: item.pdf_url || item.read_online_url || `https://open.umn.edu/opentextbooks/books/${item.id}`,
          license: 'open_access',
          importedAt: new Date().toISOString(),
        },
      ],
    };
  }

  async search(query: string, limit = 10): Promise<Edition[]> {
    try {
      // Open Textbook Library discovery API
      const url = `https://open.umn.edu/opentextbooks/books.json?q=${encodeURIComponent(query)}`;
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!res.ok) return [];

      const data = await res.json();
      const items: OpenTextbookRawItem[] = Array.isArray(data) ? data : data.books || [];

      return items.slice(0, limit).map(item => this.transformItem(item));
    } catch (err) {
      console.warn('Open Textbook search failed:', err);
      return [];
    }
  }
}

