import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = readFileSync(resolve(process.cwd(), 'src/components/dashboard/EnhancedBookshelf.tsx'), 'utf8');

describe('shareable reading updates', () => {
  it('requires an explicit share action instead of publishing shelf changes automatically', () => {
    expect(source).toMatch(/onClick=\{\(\) => void shareReadingUpdate\(item\)\}/);
    expect(source).toMatch(/Reading updates are only posted when you choose Share/);
  });

  it('attaches the real book ID and uses a limited default audience', () => {
    expect(source).toMatch(/book_id: item\.book_id/);
    expect(source).toMatch(/audience: 'friends'/);
  });

  it('generates copy from the actual bookshelf status', () => {
    expect(source).toMatch(/I finished reading/);
    expect(source).toMatch(/I started reading/);
    expect(source).toMatch(/want-to-read list/);
  });
});
