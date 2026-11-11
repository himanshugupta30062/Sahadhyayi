import { describe, expect, it } from 'vitest';
import { mergeQuotes, type Quote } from './quotesHelpers';

const quote = (id: number | string, text: string): Quote => ({ id, text });

describe('mergeQuotes', () => {
  it('keeps cloud records canonical when an ID exists locally and remotely', () => {
    const result = mergeQuotes([quote('q1', 'Cloud edit')], [quote('q1', 'Stale local'), quote('q2', 'Local')]);
    expect(result).toEqual([quote('q1', 'Cloud edit'), quote('q2', 'Local')]);
  });

  it('preserves local-only quotes when cloud is empty or incomplete', () => {
    expect(mergeQuotes([], [quote('a', 'A'), quote('b', 'B')])).toEqual([quote('a', 'A'), quote('b', 'B')]);
    expect(mergeQuotes([quote('a', 'A')], [quote('b', 'B')])).toEqual([quote('a', 'A'), quote('b', 'B')]);
  });

  it('treats numeric and string IDs as the same stable client ID', () => {
    expect(mergeQuotes([quote('42', 'Cloud')], [quote(42, 'Local')])).toEqual([quote('42', 'Cloud')]);
  });

  it('removes duplicate IDs from local input without dropping distinct quotes', () => {
    expect(mergeQuotes([], [quote('x', 'First'), quote('x', 'Duplicate'), quote('y', 'Other')]))
      .toEqual([quote('x', 'First'), quote('y', 'Other')]);
  });

  it('does not mutate either input collection', () => {
    const cloud = [quote('c', 'Cloud')];
    const local = [quote('l', 'Local')];
    const cloudBefore = structuredClone(cloud);
    const localBefore = structuredClone(local);
    mergeQuotes(cloud, local);
    expect(cloud).toEqual(cloudBefore);
    expect(local).toEqual(localBefore);
  });
});
