# Book Expert evaluation

The live evaluation runner is intentionally opt-in. It sends real requests to the deployed Supabase Edge Function and therefore consumes model requests and creates privacy-conscious rows in \`book_expert_usage_events\`.

## Required environment

Use a local terminal in the repository and set the project URL and public/anon key. Do not put a service-role key in the browser or in this script.

\`\`\`bash
export SUPABASE_URL="https://YOUR_PROJECT_REF.supabase.co"
export SUPABASE_ANON_KEY="YOUR_PUBLIC_ANON_KEY"
\`\`\`

The script also recognizes \`VITE_SUPABASE_URL\` and \`VITE_SUPABASE_ANON_KEY\`. Optionally set \`BOOK_EXPERT_URL\` to a full function URL.

## Run

\`\`\`bash
# Quick smoke run: 10 cases
npm run test:book-expert:smoke

# Full benchmark: all 55 prompts
npm run test:book-expert

# A custom number of cases
npm run test:book-expert -- --limit=20
\`\`\`

The default delay between calls is 3.1 seconds to reduce the chance of hitting Book Expert's per-minute usage cap. The full suite takes several minutes. Change the delay only when you understand the active rate limit.

## What it checks

The 55 cases cover exact-title retrieval, recommendations, catalog/PDF availability, book and author knowledge, Hindi/Hinglish, follow-up history, prompt injection, privacy requests, and general reading support. It records HTTP success, non-empty responses, expected exact-title cards, stale claims about catalog size or universal PDF availability, response latency, model ID, and book-card counts.

The runner is a regression/smoke benchmark, **not** an LLM-as-a-judge or proof of factual correctness. Review the output and sample answers manually, especially for quality, hallucinations, tone, and source fidelity. Compare model alternatives only against the same case set and a meaningful sample; do not switch production models based on latency alone.

## Operational metrics

For each generation the Edge Function attempts to store request ID, model, success/failure, duration, retrieved-book count, token usage, and an estimated standard-tier input/output token cost. It does not store user prompts, model answers, or raw IP addresses. Cost is a rate-card estimate, not an invoice; free-tier or negotiated pricing can differ. Feedback is stored separately and cascades when the related request event is deleted. Retention removes telemetry after 90 days.

## Interpretation

- A failed HTTP request indicates a transport/function/provider issue; check Supabase Edge Function logs.
- A failed expected-title check indicates retrieval didn't return a matching library row. Check the query and source data before changing the model prompt.
- A matched unsupported-claim check indicates the reply repeated a known stale catalog-size/PDF guarantee. Review the answer and add a regression case if needed.
- Latency is measured from the script's request start through response JSON parsing; use medians and p95 rather than judging one request.
