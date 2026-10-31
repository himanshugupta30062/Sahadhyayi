import { describe, expect, it } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn class-name utility', () => {
  it('joins ordinary class names', () => {
    expect(cn('font-medium', 'text-sm')).toBe('font-medium text-sm');
  });

  it('omits false, null, undefined, and empty conditional values', () => {
    const hidden = false;
    expect(cn('base', hidden && 'hidden', null, undefined, '')).toBe('base');
  });

  it('supports arrays and object conditions from clsx', () => {
    expect(cn(['flex', 'items-center'], { hidden: false, 'font-semibold': true })).toBe(
      'flex items-center font-semibold',
    );
  });

  it('resolves conflicting Tailwind utilities in favor of the later class', () => {
    expect(cn('px-2 py-1', 'px-6')).toBe('py-1 px-6');
  });

  it('preserves unrelated Tailwind utilities', () => {
    expect(cn('text-sm text-red-600', 'font-semibold')).toBe(
      'text-sm text-red-600 font-semibold',
    );
  });
});
