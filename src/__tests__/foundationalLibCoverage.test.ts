import { describe, expect, it, vi } from 'vitest';
import { safeFormatDistanceToNow } from '@/lib/dateUtils';
import { safeJson, toAppError } from '@/lib/errors';
import { makeAbortable } from '@/lib/fetchAbort';
import { isCompleteScientistProfile, parseScientistJson, validateScientistProfile } from '@/lib/scientistProfileValidation';

describe('dateUtils', () => {
  it.each([null, undefined, '', 0])('returns fallback for empty date %s', (date) => {
    expect(safeFormatDistanceToNow(date as null | undefined | string | number)).toBe('recently');
  });

  it('uses a custom fallback and rejects invalid dates', () => {
    expect(safeFormatDistanceToNow('not-a-date', undefined, 'just now')).toBe('just now');
    expect(safeFormatDistanceToNow('not-a-date')).toBe('recently');
  });

  it('formats a valid date with suffix options', () => {
    const formatted = safeFormatDistanceToNow(new Date(Date.now() - 60_000), { addSuffix: true });
    expect(formatted).toMatch(/ago$/);
  });
});

describe('error utilities', () => {
  it('normalizes arbitrary values into AppError', () => {
    const error = toAppError('offline', { severity: 'network', context: { page: 'feed' } });
    expect(error).toMatchObject({ name: 'AppError', message: 'offline', severity: 'network', context: { page: 'feed' } });
  });

  it('preserves Error identity/message and merges source context over fallback', () => {
    const source = Object.assign(new Error('failed'), { status: 503, code: 'UPSTREAM', context: { requestId: 'r1' }, details: 'trace' });
    const result = toAppError(source, { severity: 'medium', context: { page: 'home', requestId: 'fallback' } });
    expect(result).toBe(source);
    expect(result).toMatchObject({ name: 'AppError', status: 503, code: 'UPSTREAM', severity: 'medium', details: 'trace' });
    expect(result.context).toEqual({ page: 'home', requestId: 'r1' });
  });

  it('parses JSON, returns empty object for empty response and raw text for malformed JSON', async () => {
    expect(await safeJson(new Response('{"ok":true}'))).toEqual({ ok: true });
    expect(await safeJson(new Response(''))).toEqual({});
    expect(await safeJson(new Response('oops'))).toEqual({ raw: 'oops' });
  });

  it('returns empty object if response text rejects', async () => {
    const response = { text: () => Promise.reject(new Error('body unavailable')) } as unknown as Response;
    expect(await safeJson(response)).toEqual({});
  });
});

describe('makeAbortable', () => {
  it('aborts the previous request before starting a new one', async () => {
    const signals: AbortSignal[] = [];
    const abortable = makeAbortable(async (signal) => {
      signals.push(signal);
      return signals.length;
    });
    expect(await abortable.run()).toBe(1);
    expect(signals[0].aborted).toBe(false);
    expect(await abortable.run()).toBe(2);
    expect(signals[0].aborted).toBe(true);
    expect(signals[1].aborted).toBe(false);
  });

  it('supports explicit abort and propagates promise results', async () => {
    const abortable = makeAbortable(async (signal) => signal.aborted);
    const pending = abortable.run();
    abortable.abort();
    expect(await pending).toBe(false);
    expect(abortable.run()).toBeInstanceOf(Promise);
  });
});

describe('scientist profile validation', () => {
  const validProfile = {
    initials: 'AC', birthplace: 'London', headline: 'Scientist', legacy: 'A lasting contribution',
    knownFor: ['Discovery'], lifeStory: ['A meaningful life story.'],
    work: [{ title: 'Research', description: 'Important work' }],
    milestones: [{ year: '1901', title: 'Award', description: 'Received award' }],
    sources: [{ label: 'Biography', publisher: 'Publisher', url: 'https://example.com/source' }],
  };

  it('parses JSON and gives a useful label-specific parse error', () => {
    expect(parseScientistJson<{ ok: boolean }>('{ "ok": true }', 'Profile')).toEqual({ ok: true });
    expect(() => parseScientistJson('{broken', 'Profile')).toThrow('Profile must contain valid JSON.');
  });

  it('accepts complete profile and rejects each missing required field', () => {
    expect(() => validateScientistProfile(validProfile)).not.toThrow();
    for (const field of ['initials', 'birthplace', 'headline', 'legacy']) {
      expect(() => validateScientistProfile({ ...validProfile, [field]: '  ' })).toThrow();
    }
    expect(() => validateScientistProfile({ ...validProfile, knownFor: 'not-array' })).toThrow(/valid arrays/);
  });

  it('validates array entries and source URL protocols', () => {
    expect(() => validateScientistProfile({ ...validProfile, knownFor: [''] })).toThrow(/knownFor/);
    expect(() => validateScientistProfile({ ...validProfile, lifeStory: [null] })).toThrow(/lifeStory/);
    expect(() => validateScientistProfile({ ...validProfile, work: [{ title: ' ', description: 'x' }] })).toThrow(/work item/);
    expect(() => validateScientistProfile({ ...validProfile, milestones: [{ year: '2020', title: 'x' }] })).toThrow(/milestone/);
    expect(() => validateScientistProfile({ ...validProfile, sources: [{ label: 'x', publisher: 'y', url: 'ftp://example.com' }] })).toThrow(/http or https/);
  });

  it('checks completeness separately from structural validity', () => {
    expect(isCompleteScientistProfile(validProfile)).toBe(true);
    expect(isCompleteScientistProfile({ ...validProfile, work: [] })).toBe(false);
    expect(isCompleteScientistProfile({ ...validProfile, legacy: '' })).toBe(false);
  });
});
