import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  callGeminiWithRetry,
  getSecureRandomInt,
  secureShuffle,
} from '@/lib/geminiRetry';

const baseOptions = {
  model: 'gemini-test',
  apiKey: 'unit-test-key',
  history: [{ role: 'user' as const, text: 'previous question' }],
  latestPrompt: 'recommend a book',
  systemInstruction: 'Be helpful and spoiler-conscious.',
  sleep: vi.fn().mockResolvedValue(undefined),
};

afterEach(() => {
  vi.restoreAllMocks();
  baseOptions.sleep.mockClear();
});

function response(status: number, body: string, headers?: HeadersInit): Response {
  return new Response(body, { status, headers });
}

describe('Gemini retry and secure random helpers', () => {
  it('returns a successful first response without retrying', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      response(200, '{"candidates":[{"content":{"parts":[{"text":"Hello"}]}}]}'),
    );

    const result = await callGeminiWithRetry({ ...baseOptions, fetchImpl });

    expect(result).toMatchObject({ ok: true, status: 200, body: { candidates: expect.any(Array) } });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(baseOptions.sleep).not.toHaveBeenCalled();
  });

  it('retries one transient HTTP failure and honours Retry-After', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const fetchImpl = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(response(503, '{"error":"temporarily unavailable"}', { 'retry-after': '1' }))
      .mockResolvedValueOnce(response(200, '{"candidates":[]}'));

    const result = await callGeminiWithRetry({ ...baseOptions, fetchImpl });

    expect(result.status).toBe(200);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(baseOptions.sleep).toHaveBeenCalledTimes(1);
    expect(baseOptions.sleep.mock.calls[0][0]).toBeGreaterThanOrEqual(1_000);
  });

  it('retries a transient network failure once', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const fetchImpl = vi.fn<typeof fetch>()
      .mockRejectedValueOnce(new Error('temporary network failure'))
      .mockResolvedValueOnce(response(200, '{"candidates":[]}'));

    const result = await callGeminiWithRetry({ ...baseOptions, fetchImpl });

    expect(result.ok).toBe(true);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(baseOptions.sleep).toHaveBeenCalledTimes(1);
  });

  it('does not retry a non-retryable HTTP status and safely handles invalid JSON', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(response(400, 'not-json'));

    const result = await callGeminiWithRetry({ ...baseOptions, fetchImpl });

    expect(result).toMatchObject({ ok: false, status: 400, body: null, raw: 'not-json' });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(baseOptions.sleep).not.toHaveBeenCalled();
  });

  it('propagates a network failure after the retry is exhausted', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const fetchImpl = vi.fn<typeof fetch>()
      .mockRejectedValueOnce(new Error('first failure'))
      .mockRejectedValueOnce(new Error('final failure'));

    await expect(callGeminiWithRetry({ ...baseOptions, fetchImpl })).rejects.toThrow('final failure');
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(baseOptions.sleep).toHaveBeenCalledTimes(1);
  });

  it('returns a bounded cryptographic integer and rejects invalid bounds', () => {
    expect(getSecureRandomInt(1)).toBe(0);
    const value = getSecureRandomInt(17);
    expect(Number.isInteger(value)).toBe(true);
    expect(value).toBeGreaterThanOrEqual(0);
    expect(value).toBeLessThan(17);
    expect(() => getSecureRandomInt(0)).toThrow(/positive integer/i);
    expect(() => getSecureRandomInt(1.5)).toThrow(/positive integer/i);
  });

  it('shuffles without dropping or duplicating any input item', () => {
    const source = ['a', 'b', 'c', 'd', 'e'];
    const shuffled = secureShuffle(source);

    expect(shuffled).not.toBe(source);
    expect(shuffled).toHaveLength(source.length);
    expect([...shuffled].sort()).toEqual([...source].sort());
    expect(source).toEqual(['a', 'b', 'c', 'd', 'e']);
    expect(secureShuffle(['only'])).toEqual(['only']);
  });
});
