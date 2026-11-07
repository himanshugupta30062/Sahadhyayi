import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  BOOK_CATEGORIES,
  PLATFORM_FEATURES,
  RESPONSE_PATTERNS,
  generateContextualResponse,
} from './chatbotKnowledge';

describe('chatbot knowledge catalog', () => {
  it('exposes the supported book categories and platform routes', () => {
    expect(BOOK_CATEGORIES.map(({ name }) => name)).toEqual([
      'Fiction', 'Science', 'Hindi Literature', 'Devotional', 'Biography', 'History',
    ]);
    expect(PLATFORM_FEATURES.map(({ route }) => route)).toEqual([
      '/library', '/dashboard', '/authors', '/social', '/profile',
    ]);
    expect(RESPONSE_PATTERNS.generalHelp.length).toBeGreaterThan(0);
  });
});

describe('generateContextualResponse', () => {
  beforeEach(() => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('handles book discovery requests', () => {
    expect(generateContextualResponse('Can you help me find a book?')).toContain('perfect book');
  });

  it('handles recommendations before other matching patterns', () => {
    expect(generateContextualResponse('recommend a book')).toContain('recommend some great reads');
    expect(generateContextualResponse('what should I read?')).toContain('recommend some great reads');
  });

  it('guides readers tracking progress', () => {
    expect(generateContextualResponse('track my reading progress')).toContain('Dashboard');
  });

  it('explains author connection options', () => {
    expect(generateContextualResponse('connect with an author')).toContain('Author connections');
  });

  it('explains social and group reading features', () => {
    expect(generateContextualResponse('find reading groups')).toContain('Social section');
    expect(generateContextualResponse('meet friends')).toContain('Social features');
  });

  it('clarifies title-specific PDF and download availability', () => {
    expect(generateContextualResponse('is this book free to download?')).toContain('availability varies');
    expect(generateContextualResponse('PDF please')).toContain('detail page');
  });

  it('responds to Hindi literature queries in English or Hindi', () => {
    expect(generateContextualResponse('हिंदी books')).toContain('Hindi Literature');
    expect(generateContextualResponse('Hindi authors')).toContain('Hindi Literature');
  });

  it('offers guidance for specific book information', () => {
    expect(generateContextualResponse('tell me about this book')).toContain('specific books');
  });

  it('uses category details for genre requests', () => {
    const response = generateContextualResponse('fiction');
    expect(response).toContain('Fiction collection');
    expect(response).toContain('Literary masterpieces');
  });

  it('uses feature descriptions and routes for feature requests', () => {
    expect(generateContextualResponse('dashboard')).toContain('/dashboard');
    expect(generateContextualResponse('digital library')).toContain('/library');
  });

  it('falls back to a helpful response for unrelated input', () => {
    expect(generateContextualResponse('hello there')).toContain('Sahadhyayi');
  });

  it('handles empty input without throwing', () => {
    expect(generateContextualResponse('')).toBeTruthy();
  });
});
