/**
 * Sahadhyayi PDF & Full-Book Page-Aware Text Extractor & Chunking Engine
 *
 * Segments book text page-by-page and chapter-by-chapter, preserving exact
 * page numbers and chapter headings for verified RAG citations in Book Expert.
 */

export interface ExtractedPage {
  pageNumber: number;
  chapterTitle?: string;
  chapterNumber?: number;
  text: string;
  wordCount: number;
}

export interface IngestibleBookChunk {
  sourceType: 'book_content' | 'book_chapter';
  sourceRef: string;
  bookId: string;
  title: string;
  author?: string | null;
  content: string;
  metadata: {
    page_number?: number;
    chapter_title?: string;
    chapter_number?: number;
    word_count: number;
    chunk_index: number;
  };
}

const PAGE_DELIMITER_REGEX = /(?:^|\n)(?:[-=]{3,}\s*(?:Page|पृष्ठ)\s*(\d+)\s*[-=]{3,}|\f|(?:Page|पृष्ठ)\s+(\d+)\s*(?:of|\/)\s*\d+)/i;
const CHAPTER_REGEX = /(?:^|\n)(?:(?:Chapter|अध्याय|Section|खंड)\s*([0-9IVXLCDM]+|[०-९]+)(?:\s*[:.\-–]\s*([^\n]+))?|([A-Z0-9\s]{4,40})\n={3,})/i;

/**
 * Normalizes text extracted from PDFs or book documents.
 */
export function normalizeBookText(rawText: string): string {
  if (!rawText) return '';
  return rawText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[\t ]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Splits paginated or delimiter-separated book text into distinct pages.
 */
export function extractPagesFromText(rawText: string, defaultStartingPage = 1): ExtractedPage[] {
  const normalized = normalizeBookText(rawText);
  if (!normalized) return [];

  // If text contains form feed characters (\f), split by form feed
  if (normalized.includes('\f')) {
    const rawPages = normalized.split('\f');
    return rawPages.map((pageText, idx) => {
      const cleaned = pageText.trim();
      const detectedChapter = detectChapter(cleaned);
      return {
        pageNumber: defaultStartingPage + idx,
        chapterTitle: detectedChapter?.title,
        chapterNumber: detectedChapter?.number,
        text: cleaned,
        wordCount: countWords(cleaned),
      };
    }).filter((p) => p.text.length > 0);
  }

  // Check for explicit "--- Page X ---" or "Page X of Y" delimiters
  const lines = normalized.split('\n');
  const pages: ExtractedPage[] = [];
  let currentPageNumber = defaultStartingPage;
  let currentLines: string[] = [];
  let currentChapter: { title?: string; number?: number } | undefined;

  for (const line of lines) {
    const pageMatch = line.match(PAGE_DELIMITER_REGEX);
    if (pageMatch) {
      if (currentLines.length > 0) {
        const text = currentLines.join('\n').trim();
        if (text) {
          pages.push({
            pageNumber: currentPageNumber,
            chapterTitle: currentChapter?.title,
            chapterNumber: currentChapter?.number,
            text,
            wordCount: countWords(text),
          });
        }
        currentLines = [];
      }
      const explicitNum = parseInt(pageMatch[1] || pageMatch[2] || '', 10);
      currentPageNumber = !isNaN(explicitNum) ? explicitNum : currentPageNumber + 1;
      continue;
    }

    const chapterMatch = line.match(CHAPTER_REGEX);
    if (chapterMatch) {
      const numStr = chapterMatch[1];
      const parsedNum = numStr ? parseInt(numStr, 10) : undefined;
      currentChapter = {
        number: !isNaN(parsedNum ?? NaN) ? parsedNum : undefined,
        title: (chapterMatch[2] || chapterMatch[3] || line).trim(),
      };
    }

    currentLines.push(line);
  }

  if (currentLines.length > 0) {
    const text = currentLines.join('\n').trim();
    if (text) {
      pages.push({
        pageNumber: currentPageNumber,
        chapterTitle: currentChapter?.title,
        chapterNumber: currentChapter?.number,
        text,
        wordCount: countWords(text),
      });
    }
  }

  // Fallback: If no page delimiters were found, split every ~2,500 characters into synthetic pages
  if (pages.length <= 1 && normalized.length > 3000) {
    const syntheticPages: ExtractedPage[] = [];
    const chunkSize = 2500;
    let pageNum = defaultStartingPage;
    let offset = 0;

    while (offset < normalized.length) {
      let end = Math.min(offset + chunkSize, normalized.length);
      if (end < normalized.length) {
        const lastNewline = normalized.lastIndexOf('\n\n', end);
        if (lastNewline > offset + chunkSize * 0.6) {
          end = lastNewline;
        }
      }
      const pageText = normalized.slice(offset, end).trim();
      const detectedChapter = detectChapter(pageText);
      syntheticPages.push({
        pageNumber: pageNum++,
        chapterTitle: detectedChapter?.title,
        chapterNumber: detectedChapter?.number,
        text: pageText,
        wordCount: countWords(pageText),
      });
      offset = end;
    }
    return syntheticPages.filter((p) => p.text.length > 0);
  }

  return pages;
}

/**
 * Chunks extracted book pages into RAG-ready chunks (≤1,400 chars) with metadata.
 */
export function prepareBookChunksForIngest(
  bookId: string,
  bookTitle: string,
  bookAuthor: string | null | undefined,
  pages: ExtractedPage[],
  maxChunkChars = 1400
): IngestibleBookChunk[] {
  const result: IngestibleBookChunk[] = [];
  let globalChunkIndex = 0;

  for (const page of pages) {
    if (!page.text.trim()) continue;

    // If page fits in one chunk
    if (page.text.length <= maxChunkChars) {
      result.push({
        sourceType: 'book_content',
        sourceRef: `${bookId}-p${page.pageNumber}-${globalChunkIndex}`,
        bookId,
        title: bookTitle,
        author: bookAuthor ?? null,
        content: `[Book: ${bookTitle} | Page ${page.pageNumber}${page.chapterTitle ? ` | Chapter: ${page.chapterTitle}` : ''}]\n${page.text}`,
        metadata: {
          page_number: page.pageNumber,
          chapter_title: page.chapterTitle,
          chapter_number: page.chapterNumber,
          word_count: page.wordCount,
          chunk_index: globalChunkIndex++,
        },
      });
      continue;
    }

    // Split page into multiple chunks at paragraph or sentence boundaries
    let offset = 0;
    let subIndex = 1;
    while (offset < page.text.length) {
      let end = Math.min(offset + maxChunkChars, page.text.length);
      if (end < page.text.length) {
        const boundary = Math.max(
          page.text.lastIndexOf('\n\n', end),
          page.text.lastIndexOf('. ', end),
          page.text.lastIndexOf('। ', end),
          page.text.lastIndexOf('? ', end),
          page.text.lastIndexOf('! ', end)
        );
        if (boundary > offset + maxChunkChars * 0.5) {
          end = boundary + 1;
        }
      }

      const chunkContent = page.text.slice(offset, end).trim();
      if (chunkContent) {
        result.push({
          sourceType: 'book_content',
          sourceRef: `${bookId}-p${page.pageNumber}-c${subIndex++}`,
          bookId,
          title: bookTitle,
          author: bookAuthor ?? null,
          content: `[Book: ${bookTitle} | Page ${page.pageNumber}${page.chapterTitle ? ` | Chapter: ${page.chapterTitle}` : ''}]\n${chunkContent}`,
          metadata: {
            page_number: page.pageNumber,
            chapter_title: page.chapterTitle,
            chapter_number: page.chapterNumber,
            word_count: countWords(chunkContent),
            chunk_index: globalChunkIndex++,
          },
        });
      }
      offset = end;
    }
  }

  return result;
}

function detectChapter(text: string): { title?: string; number?: number } | undefined {
  const match = text.match(CHAPTER_REGEX);
  if (!match) return undefined;
  const numStr = match[1];
  const parsedNum = numStr ? parseInt(numStr, 10) : undefined;
  return {
    number: !isNaN(parsedNum ?? NaN) ? parsedNum : undefined,
    title: (match[2] || match[3] || match[0]).trim(),
  };
}

function countWords(str: string): number {
  return str.trim().split(/\s+/).filter(Boolean).length;
}

