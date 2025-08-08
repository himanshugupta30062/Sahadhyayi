import { AiContext, Intent } from './types';

export const PROMPT_V1 = (
  { intent, question, ctx }: { intent: Intent; question: string; ctx: AiContext }
) => `
You are Sahadhyayi’s reading assistant.
Rules:
- Be concise (2–3 sentences unless asked otherwise).
- Cite book titles when you reference them.
- If unsure, ask a clarifying question.

User intent: ${intent}
Question: "${question}"

Site context:
- Total books: ${ctx.site.totalBooks}
- Top genres: ${ctx.site.topGenres.slice(0,5).join(', ')}

Relevant books:
${ctx.books.slice(0,3).map(b => `- ${b.title} by ${b.author}${b.snippet ? ` — ${b.snippet}` : ''}`).join('\n')}
`;

export const templates = {
  V1: PROMPT_V1,
};
