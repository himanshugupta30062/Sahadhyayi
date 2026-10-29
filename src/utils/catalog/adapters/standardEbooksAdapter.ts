import type { Edition } from '@/types/bookCatalog';
import type { BookProviderAdapter } from './providerAdapter';
import { normalizeAuthor, normalizeTitle } from '../metadataNormalization';
import { evaluateBookQuality } from '../qualityScoring';

/** Extract text inside the first matching XML-like tag without a wildcard regex. */
function extractTagText(source: string, tagName: string): string | null {
  const openStart = source.indexOf(\`<\${tagName}\`);
  if (openStart < 0) return null;
  const contentStart = source.indexOf('>', openStart);
  if (contentStart < 0) return null;
  const closeStart = source.indexOf(\`</\${tagName}>\`, contentStart + 1);
  if (closeStart < 0) return null;
  return source.slice(contentStart + 1, closeStart);
}

/** Extract the first complete tag block, such as an author block. */
function extractTagBlock(source: string, tagName: string): string | null {
  const openStart = source.indexOf(\`<\${tagName}\`);
  if (openStart < 0) return null;
  const openEnd = source.indexOf('>', openStart);
  if (openEnd < 0) return null;
  const closeStart = source.indexOf(\`</\${tagName}>\`, openEnd + 1);
  if (closeStart < 0) return null;
  return source.slice(openStart, closeStart + tagName.length + 3);
}

export interface StandardEbooksEntry {
  id: string;
  title: string;
  author: string;
  summary: string;
  epubUrl: string;
  coverUrl?: string;
  published: string;
}

/**
 * Standard Ebooks Adapter: Parses official Standard Ebooks releases.
 * Standard Ebooks releases are meticulously curated, formatted, and proofread.
 */
export class StandardEbooksAdapter implements BookProviderAdapter {
  readonly id = 'standard_ebooks';
  readonly name = 'Standard Ebooks';
  readonly tier = 'A' as const;
  readonly isFreeToRead = true;

  /**
   * Parses Standard Ebooks Atom XML text into structured entries.
   * Can run in browser or server environments without external XML libraries.
   */
  parseAtomFeed(xmlText: string): StandardEbooksEntry[] {
    const entries: StandardEbooksEntry[] = [];
    const entryBlocks = xmlText.split('<entry>');

    for (let i = 1; i < entryBlocks.length; i++) {
      const block = entryBlocks[i].split('</entry>')[0];

      const id = extractTagText(block, 'id');
      const title = extractTagText(block, 'title');
      const authorBlock = extractTagBlock(block, 'author');
      const author = authorBlock ? extractTagText(authorBlock, 'name') : null;
      const summary = extractTagText(block, 'summary');

      // Match href values directly rather than backtracking across whole link tags.
      const epubMatch = block.match(/href="([^"]*\.epub)"/i);
      const coverMatch = block.match(/href="([^"]*\.jpg)"/i);
      const published = extractTagText(block, 'published');

      if (title) {
        entries.push({
          id: id || `se-${i}`,
          title: title.trim(),
          author: author?.trim() || 'Unknown Author',
          summary: summary?.replace(/<[^>]+>/g, '').trim() || '',
          epubUrl: epubMatch ? epubMatch[1] : '',
          coverUrl: coverMatch ? coverMatch[1] : undefined,
          published: published || '',
        });
      }
    }

    return entries;
  }

  async search(query: string, limit = 10): Promise<Edition[]> {
    try {
      // Official public Atom feed
      const feedUrl = 'https://standardebooks.org/feeds/atom/new-releases';
      const res = await fetch(feedUrl, { headers: { Accept: 'application/atom+xml, text/xml' } });
      if (!res.ok) return [];

      const text = await res.text();
      const entries = this.parseAtomFeed(text);

      const q = query.toLowerCase().trim();
      const matched = q
        ? entries.filter(e => e.title.toLowerCase().includes(q) || e.author.toLowerCase().includes(q))
        : entries;

      return matched.slice(0, limit).map(entry => {
        const normTitle = normalizeTitle(entry.title);
        const normAuthor = normalizeAuthor(entry.author);

        const evalResult = evaluateBookQuality({
          title: normTitle.cleanTitle,
          author: normAuthor.normalizedAuthor,
          description: entry.summary,
          coverImageUrl: entry.coverUrl,
          epubUrl: entry.epubUrl,
          sourceProvider: 'standardebooks',
          hasTableOfContents: true,
          licenseEvidence: 'public_domain',
        });

        return {
          id: entry.id,
          workId: `${normTitle.cleanTitle.toLowerCase()}::${normAuthor.normalizedAuthor.toLowerCase()}`,
          title: normTitle.cleanTitle,
          subtitle: normTitle.subtitle,
          editionTag: 'Standard Ebooks Edition',
          author: normAuthor.normalizedAuthor,
          publisher: 'Standard Ebooks',
          language: 'English',
          description: entry.summary,
          coverImageUrl: entry.coverUrl,
          accessStatus: 'carefully_edited',
          licenseEvidence: 'public_domain',
          qualityScore: evalResult.score,
          qualityBreakdown: evalResult.breakdown,
          qualityReasons: evalResult.reasons,
          isPreferredEdition: true,
          whyThisEdition: 'Professionally prepared public-domain edition with verified typography and chapter navigation by Standard Ebooks.',
          assets: [
            {
              format: 'epub',
              downloadUrl: entry.epubUrl,
              isDirectDownload: true,
              isDirectRead: true,
              verified: true,
              sourceProvider: 'standardebooks',
            },
          ],
          sources: [
            {
              provider: 'standardebooks',
              providerId: entry.id,
              sourceUrl: entry.epubUrl || entry.id,
              license: 'public_domain',
              importedAt: new Date().toISOString(),
            },
          ],
        };
      });
    } catch (err) {
      console.warn('Standard Ebooks search failed:', err);
      return [];
    }
  }
}

