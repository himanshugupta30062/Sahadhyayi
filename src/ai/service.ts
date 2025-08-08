import { createHash } from './utils/hash';
import { AiResponseSchema, type AiResponseParsed } from './schema';
import { TEMPLATES } from './templates';
import type { AiRequest, Intent, AiContext } from './types';
import { getWebsiteContext, searchRelevantBooks, getBookSummaries } from '@/utils/enhancedChatbotKnowledge';
import { supabase } from '@/integrations/supabase/client';

const ACTIVE_VER = (import.meta.env.VITE_AI_PROMPT_VERSION as 'V1' | 'V2') || 'V1';

// naive cache in-memory (frontend runtime). Replace with server cache later.
const cache = new Map<string, AiResponseParsed>();

export function classifyIntent(q: string): Intent {
  const s = q.toLowerCase();
  if (/help|how to|what can you do/.test(s)) return 'help';
  if (/policy|terms|privacy/.test(s)) return 'policy';
  if (/(book|recommend|read|author|genre|summary)/.test(s)) return 'book_query';
  return 'general';
}

async function buildContext(question: string): Promise<AiContext> {
  const site = await getWebsiteContext();
  const candidates = await searchRelevantBooks(question, 5);
  const top = candidates.slice(0, 3);
  const summariesArr = await getBookSummaries(top.map(b => b.id));
  const summaryMap: Record<string, string> = {};
  summariesArr.forEach(s => {
    if (s.book_id && typeof s.content === 'string') {
      summaryMap[s.book_id] = s.content;
    }
  });
  const books = top.map(b => ({
    id: b.id,
    title: b.title,
    author: b.author,
    snippet: summaryMap[b.id]?.slice(0, 200)
  }));
  return { site: { totalBooks: site.totalBooks, topGenres: site.genres }, books };
}

async function callModel(prompt: string, books: AiContext['books']): Promise<string> {
  const { data, error } = await supabase.functions.invoke('enhanced-book-summary', {
    body: {
      prompt,
      context: 'chatbot_response',
      bookContext: books.length > 0 ? books : undefined
    }
  });
  if (error) throw new Error(`AI HTTP ${error.message}`);
  return data?.response ?? '';
}

export async function ask(question: string): Promise<AiResponseParsed> {
  const intent = classifyIntent(question);
  const ctx = await buildContext(question);

  const key = createHash(JSON.stringify({ question, intent, ctx }));
  if (cache.has(key)) return cache.get(key)!;

  const tpl = TEMPLATES[ACTIVE_VER];
  const prompt = tpl({ question, intent, ctx, promptVersion: ACTIVE_VER } as AiRequest);

  const t0 = performance.now();
  const raw = await callModel(prompt, ctx.books);
  const t1 = performance.now();

  let parsed: AiResponseParsed;
  try {
    parsed = AiResponseSchema.parse(JSON.parse(raw));
  } catch {
    parsed = { reply: String(raw).slice(0, 1200), references: [] };
  }

  cache.set(key, parsed);

  const tokensIn = Math.round(prompt.length / 4);
  const tokensOut = Math.round(raw.length / 4);
  console.info('[ai]', {
    prompt_version: ACTIVE_VER,
    intent,
    ctx_sizes: { books: ctx.books.length, genres: ctx.site.topGenres.length },
    latency_ms: Math.round(t1 - t0),
    model: 'enhanced-book-summary',
    tokens_in: tokensIn,
    tokens_out: tokensOut
  });

  return parsed;
}
