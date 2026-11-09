// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  detectPostSchemaCapabilities,
  setCachedPostCapabilities,
  isValidUuid,
} from './postSchemaCapabilities';

const mocks = vi.hoisted(() => ({
  selectFn: vi.fn(),
}));

vi.mock('@/integrations/supabase/client-universal', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        limit: mocks.selectFn,
      }),
    }),
  },
}));

describe('postSchemaCapabilities utility', () => {
  beforeEach(() => {
    sessionStorage.clear();
    setCachedPostCapabilities({ hasExtendedColumns: false, checked: false });
    vi.clearAllMocks();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('detects when extended columns exist (no error)', async () => {
    mocks.selectFn.mockResolvedValueOnce({ data: [], error: null });
    const caps = await detectPostSchemaCapabilities();
    expect(caps.hasExtendedColumns).toBe(true);
    expect(caps.checked).toBe(true);
  });

  it('detects when extended columns exist from RLS 42501 response', async () => {
    mocks.selectFn.mockResolvedValueOnce({
      data: null,
      error: { code: '42501', message: 'permission denied for table posts' },
    });
    const caps = await detectPostSchemaCapabilities();
    expect(caps.hasExtendedColumns).toBe(true);
    expect(caps.checked).toBe(true);
  });

  it('detects when extended columns do not exist from 42703 error', async () => {
    mocks.selectFn.mockResolvedValueOnce({
      data: null,
      error: { code: '42703', message: 'column posts.post_kind does not exist' },
    });
    const caps = await detectPostSchemaCapabilities();
    expect(caps.hasExtendedColumns).toBe(false);
    expect(caps.checked).toBe(true);
  });

  it('validates UUID format accurately', () => {
    expect(isValidUuid('1abb59ef-0a5e-4849-b799-ebf7d4c57fa5')).toBe(true);
    expect(isValidUuid('c1688518-1234-4567-89ab-cdef01234567')).toBe(true);
    expect(isValidUuid('zyTCAlFPjgYC')).toBe(false);
    expect(isValidUuid('temp-173111-0')).toBe(false);
    expect(isValidUuid('')).toBe(false);
    expect(isValidUuid(null)).toBe(false);
    expect(isValidUuid(undefined)).toBe(false);
    expect(isValidUuid(123)).toBe(false);
  });
});
