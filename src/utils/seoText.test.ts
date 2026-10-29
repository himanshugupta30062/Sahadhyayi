import { describe, expect, it } from 'vitest';
import { toSeoDescription } from './seoText';

describe('toSeoDescription', () => {
  it('converts HTML blog content into readable plain text', () => {
    expect(toSeoDescription('<h2>Books &amp; ideas</h2><p>Read <strong>together</strong>.</p>'))
      .toBe('Books & ideas Read together.');
  });

  it('removes common Markdown syntax and preserves link labels', () => {
    expect(toSeoDescription('## Reading well\n\n**Share ideas** with [readers](https://example.com).'))
      .toBe('Reading well Share ideas with readers.');
  });

  it('normalizes whitespace and truncates at a word boundary', () => {
    const description = toSeoDescription('A long description that should be shortened cleanly.', 24);
    expect(description.length).toBeLessThanOrEqual(24);
    expect(description.endsWith('…')).toBe(true);
    expect(description).not.toContain('<');
  });

  it('returns an empty string for missing content or invalid limits', () => {
    expect(toSeoDescription(undefined)).toBe('');
    expect(toSeoDescription('Some content', 0)).toBe('');
  });

  it('removes embedded script and style content', () => {
    expect(toSeoDescription('<p>Useful text</p><script>alert(1)</script><style>.x{}</style>'))
      .toBe('Useful text');
  });
});
