import type { Edition } from '@/types/bookCatalog';
import type { BookProviderAdapter } from './providerAdapter';
import { normalizeAuthor, normalizeTitle } from '../metadataNormalization';
import { evaluateBookQuality } from '../qualityScoring';

export class GutenbergAdapter implements BookProviderAdapter {
  readonly id = 'project_gutenberg';
  readonly name = 'Project Gutenberg';
  readonly tier = 'A' as const;
  readonly isFreeToRead = true;

  async search(query: string, limit = 10): Promise<Edition[]> {
    try {
      const url = `https://gutendex.com/books?search=${encodeURIComponent(query)}`;
      const res = await fetch(url);
      if (!res.ok) return [];

      const data = await res.json();
      if (!data.results || !Array.isArray(data.results)) return [];

      return data.results.slice(0, limit).map((book: any) => {
        const normTitle = normalizeTitle(book.title || 'Untitled');
        const rawAuthor = book.authors?.[0]?.name;
        const normAuthor = normalizeAuthor(rawAuthor);

        const epubUrl =
          book.formats?.['application/epub+zip'] ||
          book.formats?.['application/x-mobipocket-ebook'];
        const pdfUrl =
          book.formats?.['application/pdf'] ||
          book.formats?.['text/pdf'];
        const htmlUrl =
          book.formats?.['text/html'] ||
          book.formats?.['text/html; charset=utf-8'];
        const coverUrl =
          book.formats?.['image/jpeg'] ||
          (book.id ? `https://www.gutenberg.org/cache/epub/${book.id}/pg${book.id}.cover.medium.jpg` : undefined);

        const evalResult = evaluateBookQuality({
          title: normTitle.cleanTitle,
          author: normAuthor.normalizedAuthor,
          description: book.subjects ? `Subjects: ${book.subjects.slice(0, 3).join(', ')}` : undefined,
          coverImageUrl: coverUrl,
          pdfUrl,
          epubUrl,
          genre: book.subjects?.[0],
          language: book.languages?.[0] === 'en' ? 'English' : book.languages?.[0],
          sourceProvider: 'gutenberg',
          licenseEvidence: 'public_domain',
        });

        const assets = [];
        if (epubUrl) {
          assets.push({
            format: 'epub' as const,
            downloadUrl: epubUrl,
            isDirectDownload: true,
            isDirectRead: true,
            verified: true,
            sourceProvider: 'project_gutenberg',
          });
        }
        if (pdfUrl) {
          assets.push({
            format: 'pdf' as const,
            downloadUrl: pdfUrl,
            isDirectDownload: true,
            isDirectRead: true,
            verified: true,
            sourceProvider: 'project_gutenberg',
          });
        }
        if (htmlUrl) {
          assets.push({
            format: 'html' as const,
            readerUrl: htmlUrl,
            isDirectDownload: false,
            isDirectRead: true,
            verified: true,
            sourceProvider: 'project_gutenberg',
          });
        }

        return {
          id: `pg-${book.id}`,
          workId: `${normTitle.cleanTitle.toLowerCase()}::${normAuthor.normalizedAuthor.toLowerCase()}`,
          title: normTitle.cleanTitle,
          subtitle: normTitle.subtitle,
          editionTag: 'Project Gutenberg Public Domain Edition',
          author: normAuthor.normalizedAuthor,
          publisher: 'Project Gutenberg',
          language: book.languages?.[0] === 'en' ? 'English' : book.languages?.[0] || 'English',
          genre: book.subjects?.[0],
          description: book.subjects ? `Categories: ${book.subjects.join(', ')}` : undefined,
          coverImageUrl: coverUrl,
          accessStatus: 'public_domain',
          licenseEvidence: 'public_domain',
          qualityScore: evalResult.score,
          qualityBreakdown: evalResult.breakdown,
          qualityReasons: evalResult.reasons,
          isPreferredEdition: false,
          whyThisEdition: 'Complete public-domain full-text with multiple open formats from Project Gutenberg.',
          assets,
          sources: [
            {
              provider: 'project_gutenberg',
              providerId: String(book.id),
              sourceUrl: `https://www.gutenberg.org/ebooks/${book.id}`,
              license: 'public_domain',
              importedAt: new Date().toISOString(),
            },
          ],
        };
      });
    } catch (err) {
      console.warn('Gutenberg search failed:', err);
      return [];
    }
  }
}
