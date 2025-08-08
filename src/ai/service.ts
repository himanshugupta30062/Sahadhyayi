import { templates } from './templates';
import { AiAnswer, AiAnswerType } from './schema';
import type { AiContext, Intent } from './types';
import { getWebsiteContext, searchRelevantBooks, getBookSummaries } from '@/utils/enhancedChatbotKnowledge';

export function parseIntent(question: string): Intent {
  const q = question.toLowerCase();
  if (/policy|terms|privacy/.test(q)) return 'policy';
  if (/help|how do i|\?/.test(q)) return 'help';
  if (/book|novel|author|read|recommend|library|title|genre/.test(q)) return 'book_query';
  return 'general';
}

function trimTokens(text: string, maxTokens: number): string {
  const words = text.split(/\s+/).slice(0, maxTokens);
  return words.join(' ');
}

export async function buildContext(question: string): Promise<AiContext> {
  const site = await getWebsiteContext();
  let books = await searchRelevantBooks(question, 5);
  books = books.slice(0, 3);
  const summaries = books.length > 0 ? await getBookSummaries(books.map(b => b.id)) : [];
  let remaining = 600;
  const booksWithSnippets = books.map(b => {
    const summary = summaries.find(s => s.book_id === b.id)?.content as string | undefined;
    if (summary && remaining > 0) {
      const snippet = trimTokens(summary, remaining);
      remaining -= snippet.split(/\s+/).length;
      return { ...b, snippet };
    }
    return b;
  });
  return {
    site: { totalBooks: site.totalBooks, topGenres: site.genres.slice(0,5) },
    books: booksWithSnippets,
  };
}

export async function generatePrompt(question: string) {
  let intent = parseIntent(question);
  const ctx = await buildContext(question);
  if (ctx.books.length === 0 && intent === 'book_query') {
    intent = 'general';
  }
  const version = (import.meta as any).env?.VITE_AI_PROMPT_VERSION || 'V1';
  const template = templates[version as keyof typeof templates] || templates.V1;
  const prompt = template({ intent, question, ctx }) + '\n\nRespond as valid JSON with keys: reply, references[], followup.';
  return { prompt, ctx, intent, version };
}

export function validateResponse(modelText: string): AiAnswerType {
  try {
    const parsed = JSON.parse(modelText);
    const result = AiAnswer.safeParse(parsed);
    if (result.success) return result.data;
  } catch {
    // ignore
  }
  return { reply: modelText, references: [] };
}
