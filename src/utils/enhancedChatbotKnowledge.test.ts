import { describe, expect, it } from 'vitest';
import { generateEnhancedPrompt, type WebsiteContext } from './enhancedChatbotKnowledge';

const book = (id: string, title: string): WebsiteContext['recentBooks'][number] => ({
  id,
  title,
  author: `Author ${id}`,
  genre: 'Fiction',
  description: 'A short description',
  language: 'en',
});

describe('generateEnhancedPrompt', () => {
  it('includes catalog count, genres, features, and only the three most recent books', () => {
    const context: WebsiteContext = {
      totalBooks: 42,
      genres: ['Fiction', 'Science'],
      features: ['Reading goals', 'Author connections'],
      recentBooks: [book('1', 'First'), book('2', 'Second'), book('3', 'Third'), book('4', 'Fourth')],
    };

    const prompt = generateEnhancedPrompt('Suggest a novel', context);

    expect(prompt).toContain('Current catalog count: 42.');
    expect(prompt).toContain('Available genres include: Fiction, Science.');
    expect(prompt).toContain('Key features: Reading goals, Author connections.');
    expect(prompt).toContain('"First" by Author 1 (Fiction)');
    expect(prompt).toContain('"Third" by Author 3 (Fiction)');
    expect(prompt).not.toContain('"Fourth"');
    expect(prompt).toContain('User query: Suggest a novel');
  });

  it('explicitly avoids guessing when the catalog count is unavailable', () => {
    const context: WebsiteContext = {
      totalBooks: null,
      genres: [],
      features: [],
      recentBooks: [],
    };

    const prompt = generateEnhancedPrompt('How many books?', context);

    expect(prompt).toContain('Current catalog count is unavailable; do not guess the number of books.');
    expect(prompt).not.toContain('Available genres include:');
    expect(prompt).not.toContain('Key features:');
    expect(prompt).not.toContain('Recent books:');
  });

  it('omits empty context sections while retaining the user query and response guidance', () => {
    const prompt = generateEnhancedPrompt('Hello', {
      totalBooks: 0,
      genres: [],
      features: [],
      recentBooks: [],
    });

    expect(prompt).toContain('Current catalog count: 0.');
    expect(prompt).toContain('User query: Hello');
    expect(prompt).toContain('Provide a concise and helpful response');
    expect(prompt).not.toContain('Recent books:');
  });

  it('formats multiple recent books as individual prompt lines', () => {
    const prompt = generateEnhancedPrompt('Compare these', {
      totalBooks: 2,
      genres: ['History'],
      features: [],
      recentBooks: [book('a', 'A'), book('b', 'B')],
    });

    expect(prompt).toContain('- "A" by Author a (Fiction)');
    expect(prompt).toContain('- "B" by Author b (Fiction)');
  });
});
