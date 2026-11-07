import { describe, expect, it } from 'vitest';
import {
  extractPagesFromText,
  normalizeBookText,
  prepareBookChunksForIngest,
} from './pdfTextExtractor';

describe('pdfTextExtractor', () => {
  it('normalizes raw text and whitespace', () => {
    const raw = '  First line\r\n\r\n\r\nSecond line   \t with spaces\n\n\nThird line.  ';
    const normalized = normalizeBookText(raw);
    expect(normalized).toBe('First line\n\nSecond line with spaces\n\nThird line.');
  });

  it('extracts pages using form feed delimiters', () => {
    const text = 'Page one content about history.\fPage two with chapter details.\fPage three concludes.';
    const pages = extractPagesFromText(text, 1);

    expect(pages).toHaveLength(3);
    expect(pages[0].pageNumber).toBe(1);
    expect(pages[0].text).toBe('Page one content about history.');
    expect(pages[1].pageNumber).toBe(2);
    expect(pages[2].pageNumber).toBe(3);
  });

  it('extracts pages and chapters using explicit delimiters', () => {
    const text = `
--- Page 1 ---
Chapter 1: The Beginning
It was a quiet morning in Varanasi.

--- Page 2 ---
The boatman drifted across the Ganges.
`;
    const pages = extractPagesFromText(text);
    expect(pages).toHaveLength(2);
    expect(pages[0].pageNumber).toBe(1);
    expect(pages[0].chapterTitle).toContain('The Beginning');
    expect(pages[1].pageNumber).toBe(2);
  });

  it('prepares chunks for RAG ingest with page metadata', () => {
    const pages = [
      { pageNumber: 12, chapterTitle: 'Ghats of Kashi', text: 'Morning bells echoed across the ancient city.', wordCount: 7 },
      { pageNumber: 13, chapterTitle: 'Ghats of Kashi', text: 'Evening lamps lit the holy river.', wordCount: 6 },
    ];

    const chunks = prepareBookChunksForIngest('book-123', 'Godaan', 'Premchand', pages, 1400);
    expect(chunks).toHaveLength(2);
    expect(chunks[0].bookId).toBe('book-123');
    expect(chunks[0].metadata.page_number).toBe(12);
    expect(chunks[0].metadata.chapter_title).toBe('Ghats of Kashi');
    expect(chunks[0].content).toContain('[Book: Godaan | Page 12 | Chapter: Ghats of Kashi]');
    expect(chunks[1].metadata.page_number).toBe(13);
  });
});

