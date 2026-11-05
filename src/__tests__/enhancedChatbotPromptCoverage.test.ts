import { describe, expect, it } from 'vitest';
import { generateEnhancedPrompt, type WebsiteContext } from '@/utils/enhancedChatbotKnowledge';

const baseContext: WebsiteContext = {
  totalBooks: 125,
  genres: ['Fiction', 'Science'],
  features: ['Reading progress', 'Author connections'],
  recentBooks: [
    { id: '1', title: 'The Alchemist', author: 'Paulo Coelho', genre: 'Fiction', description: '', language: 'en' },
    { id: '2', title: 'Cosmos', author: 'Carl Sagan', genre: 'Science', description: '', language: 'en' },
    { id: '3', title: 'Sapiens', author: 'Yuval Noah Harari', genre: 'History', description: '', language: 'en' },
    { id: '4', title: 'Fourth book', author: 'Author 4', genre: 'Fiction', description: '', language: 'en' },
  ],
};

describe('generateEnhancedPrompt', () => {
  it('includes catalog count, genres, features, first three recent books, and user query', () => {
    const prompt = generateEnhancedPrompt('recommend science books', baseContext);
    expect(prompt).toContain('Current catalog count: 125.');
    expect(prompt).toContain('Available genres include: Fiction, Science.');
    expect(prompt).toContain('Key features: Reading progress, Author connections.');
    expect(prompt).toContain('"The Alchemist" by Paulo Coelho (Fiction)');
    expect(prompt).toContain('"Cosmos" by Carl Sagan (Science)');
    expect(prompt).toContain('"Sapiens" by Yuval Noah Harari (History)');
    expect(prompt).not.toContain('Fourth book');
    expect(prompt).toContain('User query: recommend science books');
    expect(prompt).toContain('concise and helpful response');
  });

  it('does not invent a catalog count when unavailable', () => {
    const prompt = generateEnhancedPrompt('how many books?', { ...baseContext, totalBooks: null });
    expect(prompt).toContain('Current catalog count is unavailable; do not guess the number of books.');
    expect(prompt).not.toContain('Current catalog count:');
  });

  it('omits empty optional context sections', () => {
    const prompt = generateEnhancedPrompt('hello', { totalBooks: 0, genres: [], features: [], recentBooks: [] });
    expect(prompt).toContain('Current catalog count: 0.');
    expect(prompt).not.toContain('Available genres include:');
    expect(prompt).not.toContain('Key features:');
    expect(prompt).not.toContain('Recent books:');
  });

  it('handles an empty user message without losing instructions', () => {
    const prompt = generateEnhancedPrompt('', { totalBooks: null, genres: [], features: [], recentBooks: [] });
    expect(prompt).toContain('User query: \n');
    expect(prompt).toContain('Use the website context');
  });
});
