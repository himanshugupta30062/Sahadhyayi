import { describe, expect, it } from 'vitest';
import { normalizeCoverUrl } from './normalizeCoverUrl';

describe('normalizeCoverUrl', () => {
  it('normalizes empty and placeholder values to null', () => {
    expect(normalizeCoverUrl()).toBeNull();
    expect(normalizeCoverUrl(null)).toBeNull();
    expect(normalizeCoverUrl('')).toBeNull();
    expect(normalizeCoverUrl('   ')).toBeNull();
    expect(normalizeCoverUrl('null')).toBeNull();
    expect(normalizeCoverUrl('undefined')).toBeNull();
  });

  it('trims valid URLs without changing their content', () => {
    expect(normalizeCoverUrl('  https://example.com/cover.jpg  ')).toBe('https://example.com/cover.jpg');
  });
});
