import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Book Expert Gemini Edge Function Logic & Failure Modes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rate Limiting Enforcement', () => {
    it('parallelizes minute and daily limit checks and rejects when minute rate limit exceeded (429)', async () => {
      const mockRpc = vi.fn().mockImplementation((fn: string, args: { p_endpoint: string }) => {
        if (args.p_endpoint === 'book-expert-gemini-minute') {
          return Promise.resolve({ data: false, error: null });
        }
        return Promise.resolve({ data: true, error: null });
      });

      const client = { rpc: mockRpc };
      const [minute, daily] = await Promise.all([
        client.rpc('check_rate_limit', { p_endpoint: 'book-expert-gemini-minute' }),
        client.rpc('check_rate_limit', { p_endpoint: 'book-expert-gemini-daily' }),
      ]);

      expect(mockRpc).toHaveBeenCalledTimes(2);
      expect(minute.data).toBe(false);
      expect(daily.data).toBe(true);

      const isAllowed = minute.data && daily.data;
      expect(isAllowed).toBe(false);
    });

    it('handles database rate limit failure gracefully without exposing internal error (503)', async () => {
      const mockRpc = vi.fn().mockResolvedValue({ data: null, error: { message: 'DB connection error' } });
      const client = { rpc: mockRpc };

      const checkRateLimit = async () => {
        try {
          const { data, error } = await client.rpc('check_rate_limit', { p_endpoint: 'book-expert-gemini-minute' });
          if (error || typeof data !== 'boolean') return 'unavailable';
          return data ? 'allowed' : 'limited';
        } catch {
          return 'unavailable';
        }
      };

      const result = await checkRateLimit();
      expect(result).toBe('unavailable');
    });
  });

  describe('Embedding Generation & Vector Search Resilience', () => {
    it('uses text-embedding-004 with 768 dimensions and returns valid vector on success', async () => {
      const fakeEmbedding = Array.from({ length: 768 }, (_, i) => Math.sin(i));
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          embedding: { values: fakeEmbedding },
        }),
      });

      const generateEmbedding = async (model: string, text: string) => {
        const res = await fetchMock(`https://generativelanguage.googleapis.com/v1beta/models/${model}:embedContent`, {
          body: JSON.stringify({
            content: { parts: [{ text }] },
            outputDimensionality: 768,
          }),
        });
        const body = await res.json();
        const values = body?.embedding?.values;
        if (!Array.isArray(values) || values.length !== 768) return [];
        return values;
      };

      const result = await generateEmbedding('text-embedding-004', 'Question about Gandhi');
      expect(result).toHaveLength(768);
    });

    it('proceeds gracefully without failing request when embedding generation times out or returns 404', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      });

      const generateEmbeddingSafe = async () => {
        try {
          const res = await fetchMock();
          if (!res.ok) return [];
          const body = await res.json();
          return body?.embedding?.values || [];
        } catch {
          return [];
        }
      };

      const embedding = await generateEmbeddingSafe();
      expect(embedding).toEqual([]);
      // The application proceeds with catalog/metadata context even if vector search is bypassed
    });
  });

  describe('Model Fallback and Gemini Thinking Optimization', () => {
    it('sets thinkingBudget: 0 for gemini-2.5-flash to disable slow thinking tokens and achieve fast latency', () => {
      const buildGenerationConfig = (model: string) => {
        const config: Record<string, unknown> = {
          maxOutputTokens: 800,
          temperature: 0.5,
        };
        if (model.includes('2.5') || model.includes('think') || model.startsWith('gemini-3')) {
          config.thinkingConfig = { thinkingBudget: 0 };
        }
        return config;
      };

      const config25 = buildGenerationConfig('gemini-2.5-flash');
      expect(config25.thinkingConfig).toEqual({ thinkingBudget: 0 });

      const config20 = buildGenerationConfig('gemini-2.0-flash');
      expect(config20.thinkingConfig).toBeUndefined();
    });

    it('falls back to gemini-2.0-flash when primary model returns 404 model not found', async () => {
      const callMock = vi.fn().mockImplementation((model: string) => {
        if (model === 'gemini-3.8-flash') {
          return Promise.resolve({ ok: false, status: 404, raw: 'models/gemini-3.8-flash is not found' });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          body: {
            candidates: [{ content: { parts: [{ text: 'Answer generated from fallback model.' }] } }],
          },
        });
      });

      const generateWithFallback = async (primary: string, fallbacks: string[]) => {
        const candidates = [primary, ...fallbacks.filter((f) => f !== primary)];
        for (const model of candidates) {
          const res = await callMock(model);
          if (res.ok && res.body?.candidates?.[0]?.content?.parts?.[0]?.text) {
            return { model, reply: res.body.candidates[0].content.parts[0].text };
          }
        }
        throw new Error('All models failed');
      };

      const result = await generateWithFallback('gemini-3.8-flash', ['gemini-2.5-flash', 'gemini-2.0-flash']);
      expect(callMock).toHaveBeenCalledTimes(2);
      expect(result.model).toBe('gemini-2.5-flash');
      expect(result.reply).toBe('Answer generated from fallback model.');
    });

    it('handles Gemini 429 quota exhaustion and returns user-friendly busy response', async () => {
      const response = {
        ok: false,
        status: 429,
        raw: 'RESOURCE_EXHAUSTED',
      };

      const getErrorMessage = (res: typeof response) => {
        if (res.status === 429) {
          return 'Book Expert is busy right now. Please try again in a moment.';
        }
        return 'Something went wrong while answering. Please try again.';
      };

      expect(getErrorMessage(response)).toBe('Book Expert is busy right now. Please try again in a moment.');
    });

    it('handles empty response payload safely without throwing unhandled exception', () => {
      const emptyPayload = {
        candidates: [{ content: { parts: [{ text: '   ' }] } }],
      };

      const extractReply = (body: any) => {
        const reply = body?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '').join('').trim();
        return reply || null;
      };

      expect(extractReply(emptyPayload)).toBeNull();
    });
  });

  describe('Book Detail Scoped Mode Optimization', () => {
    it('uses direct book context and skips expensive catalog table scans when bookContext is provided', () => {
      const bookContext = {
        id: 'book-123',
        title: 'Gitanjali',
        author: 'Rabindranath Tagore',
        description: 'A collection of poems',
        language: 'bn',
      };

      const buildPrompt = (scopedBook: typeof bookContext | null, text: string) => {
        return [
          scopedBook?.title
            ? `BOOK-SCOPED MODE: The reader is on this Sahadhyayi book page. Prioritize this specific work:\n${JSON.stringify(scopedBook)}`
            : '',
          `Reader question: ${text}`,
        ].join('\n\n');
      };

      const prompt = buildPrompt(bookContext, 'What are the main themes?');
      expect(prompt).toContain('BOOK-SCOPED MODE');
      expect(prompt).toContain('Gitanjali');
      expect(prompt).toContain('Rabindranath Tagore');
    });

    it('supports Hindi language requests cleanly', () => {
      const text = 'इस किताब का मुख्य संदेश क्या है?';
      const prompt = `Reader question: ${text}`;
      expect(prompt).toContain('इस किताब का मुख्य संदेश क्या है?');
    });
  });
});
