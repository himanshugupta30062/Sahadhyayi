import { beforeEach, describe, expect, it, vi } from 'vitest';

const invoke = vi.fn();
const getWebsiteContext = vi.fn();
const searchRelevantBooks = vi.fn();
const getBookSummaries = vi.fn();

vi.mock('@/integrations/supabase/client-universal', () => ({ supabase: { functions: { invoke } } }));
vi.mock('@/utils/enhancedChatbotKnowledge', () => ({ getWebsiteContext, searchRelevantBooks, getBookSummaries }));

import { ask, classifyIntent } from './service';

describe('AI service intent and response handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getWebsiteContext.mockResolvedValue({ totalBooks: 42, genres: ['fiction', 'history'] });
    searchRelevantBooks.mockResolvedValue([
      { id: 'b1', title: 'Book One', author: 'Author One' },
      { id: 'b2', title: 'Book Two' }, { id: 'b3', title: 'Book Three' }, { id: 'b4', title: 'Book Four' },
    ]);
    getBookSummaries.mockResolvedValue([{ book_id: 'b1', content: 'A useful summary' }]);
    invoke.mockResolvedValue({ data: { response: JSON.stringify({ reply: 'Try Book One.', references: [{ bookId: 'b1', title: 'Book One' }], followup: 'Want more?' }) }, error: null });
  });

  it('classifies help, policy, book queries and general questions', () => {
    expect(classifyIntent('What can you do?')).toBe('help');
    expect(classifyIntent('Explain privacy policy')).toBe('policy');
    expect(classifyIntent('privacy terms')).toBe('policy');
    expect(classifyIntent('recommend a book')).toBe('book_query');
    expect(classifyIntent('hello there')).toBe('general');
  });

  it('builds bounded book context and parses a valid model response', async () => {
    const result = await ask('Recommend a book');
    expect(result).toEqual({ reply: 'Try Book One.', references: [{ bookId: 'b1', title: 'Book One' }], followup: 'Want more?' });
    expect(searchRelevantBooks).toHaveBeenCalledWith('Recommend a book', 5);
    expect(getBookSummaries).toHaveBeenCalledWith(['b1', 'b2', 'b3']);
    expect(invoke).toHaveBeenCalledWith('enhanced-book-summary', expect.objectContaining({
      body: expect.objectContaining({ context: 'chatbot_response', bookContext: expect.arrayContaining([expect.objectContaining({ id: 'b1', snippet: 'A useful summary' })]) }),
    }));
  });

  it('falls back to a bounded plain-text reply when model output is invalid JSON', async () => {
    invoke.mockResolvedValue({ data: { response: 'x'.repeat(1400) }, error: null });
    const result = await ask('hello');
    expect(result.reply).toHaveLength(1200);
    expect(result.references).toEqual([]);
  });

  it('returns cached output for an identical question and context', async () => {
    const first = await ask('hello'); const second = await ask('hello');
    expect(second).toEqual(first);
    expect(invoke).toHaveBeenCalledTimes(1);
  });

  it('surfaces model invocation errors with a useful prefix', async () => {
    invoke.mockResolvedValue({ data: null, error: { message: 'edge unavailable' } });
    await expect(ask('hello')).rejects.toThrow('AI HTTP edge unavailable');
  });
});
