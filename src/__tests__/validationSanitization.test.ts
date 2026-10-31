import { describe, expect, it } from 'vitest';
import { encodeHTML, sanitizeHTML } from '@/utils/validation';

describe('encodeHTML security encoding', () => {
  it('encodes each supported special character', () => {
    expect(encodeHTML("&<>\"'`=/")).toBe(
      '&amp;&lt;&gt;&quot;&#39;&#x60;&#x3D;&#x2F;',
    );
  });

  it('does not alter ordinary text', () => {
    expect(encodeHTML('A book for every reader 2026')).toBe('A book for every reader 2026');
  });

  it('converts non-string runtime values to strings before encoding', () => {
    expect(encodeHTML(42 as unknown as string)).toBe('42');
  });
});

describe('sanitizeHTML security branches', () => {
  it('removes a script block and its content before encoding the remaining markup', () => {
    expect(sanitizeHTML('<p>hello</p><script>alert(1)</script>')).toBe(
      '&lt;p&gt;hello&lt;&#x2F;p&gt;',
    );
  });

  it('matches script tags case-insensitively and removes nested-looking content', () => {
    expect(sanitizeHTML('<SCRIPT type="text/javascript">bad()</SCRIPT>safe')).toBe('safe');
  });

  it('strips javascript protocol text case-insensitively', () => {
    expect(sanitizeHTML('JaVaScRiPt:alert(1)')).toBe('alert(1)');
  });

  it('removes quoted inline event handlers', () => {
    const result = sanitizeHTML('<img src="cover.png" onerror="steal()" alt="cover">');
    expect(result).not.toMatch(/onerror|steal/);
    expect(result).toContain('cover.png');
  });

  it('removes quoted style attributes', () => {
    const result = sanitizeHTML('<span style="color:red">reader</span>');
    expect(result).not.toContain('style=');
    expect(result).toContain('reader');
  });

  it('removes non-image data protocol segments', () => {
    expect(sanitizeHTML('data:text/html;base64,PHNjcmlwdD4=')).not.toContain('data:text/html');
  });

  it('keeps image data URL text while still encoding HTML delimiters', () => {
    expect(sanitizeHTML('data:image/png;base64,abc')).toContain('data:image');
  });

  it('returns an empty string for empty input', () => {
    expect(sanitizeHTML('')).toBe('');
  });

  it('encodes leftover HTML tags rather than returning executable markup', () => {
    expect(sanitizeHTML('<strong>safe</strong>')).toBe(
      '&lt;strong&gt;safe&lt;&#x2F;strong&gt;',
    );
  });
});
