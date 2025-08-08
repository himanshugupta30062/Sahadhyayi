import { createHash } from './utils/hash';
import { AiResponseSchema, type AiResponseParsed } from './schema';
import { TEMPLATES } from './templates';
import type { Intent, AiContext } from './types';
import { getWebsiteContext, searchRelevantBooks, getBookSummaries } from '@/utils/enhancedChatbotKnowledge';
import { supabase } from '@/integrations/supabase/client';

const ACTIVE_VER = (import.meta.env.VITE_AI_PROMPT_VERSION as 'V1' | 'V2') || 'V1';

// naive cache in-memory (frontend runtime). Replace with server cache later.
const cache = new Map<string, AiResponseParsed>();

function classifyIntent(q: string): Intent {
  const s = q.toLowerCase();
  if (/help|how to|what can you do/.test(s)) return 'help';
  if (/policy|terms|privacy/.test(s)) return 'policy';
  if (/(book|recommend|read|author|genre|summary)/.test(s)) return 'book_query';
  return 'general';
}

async function buildContext(question: string): Promise<AiContext> {
  const site = await getWebsiteContext();
  const candidates = await searchRelevantBooks(question);
  const top = candidates.slice(0, 3);
  const summaries = await getBookSummaries(top.map(b => b.id));
  const summaryMap: Record<string, string> = {};
  for (const s of summaries) {
    summaryMap[s.book_id] = s.content;
  }
  const books = top.map(b => ({
    id: b.id,
    title: b.title,
    author: b.author,
    snippet: summaryMap[b.id]?.slice(0, 200)
  }));
  return { site: { totalBooks: site.totalBooks, topGenres: site.genres.slice(0, 5) }, books };
}

async function callModel(prompt: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke('enhanced-book-summary', {
    body: { prompt, context: 'chatbot_response' }
  });
  if (error || !data?.response) {
    throw new Error(error?.message || 'AI HTTP error');
  }
  return data.response;
}

export async function ask(question: string): Promise<AiResponseParsed> {
  const intent = classifyIntent(question);
  const ctx = await buildContext(question);

  const key = createHash(JSON.stringify({ question, intent, ctx }));
  if (cache.has(key)) return cache.get(key)!;

  const tpl = TEMPLATES[ACTIVE_VER];
  const prompt = tpl({ question, intent, ctx, promptVersion: ACTIVE_VER });

  const t0 = performance.now();
  const raw = await callModel(prompt);
  const t1 = performance.now();

  let parsed: AiResponseParsed;
  try {
    parsed = AiResponseSchema.parse(JSON.parse(raw));
  } catch {
    parsed = { reply: String(raw).slice(0, 1200), references: [] };
  }

  cache.set(key, parsed);
  console.info('[ai]', {
    prompt_version: ACTIVE_VER,
    intent,
    ctx_sizes: { books: ctx.books.length },
    latency_ms: Math.round(t1 - t0)
  });

  return parsed;
}

export { classifyIntent }; // optional export for tests
