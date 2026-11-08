import { describe, expect, it } from 'vitest';
import { ProviderRegistry, providerRegistry, type BookProviderAdapter } from './providerAdapter';

const adapter = (id: string, tier: 'A' | 'B'): BookProviderAdapter => ({
  id,
  name: id,
  tier,
  isFreeToRead: tier === 'A',
  search: async () => [],
});

describe('ProviderRegistry', () => {
  it('registers adapters, retrieves by id, and preserves registration order', () => {
    const registry = new ProviderRegistry();
    const first = adapter('first', 'A');
    const second = adapter('second', 'B');

    registry.register(first);
    registry.register(second);

    expect(registry.get('first')).toBe(first);
    expect(registry.get('missing')).toBeUndefined();
    expect(registry.getAll()).toEqual([first, second]);
  });

  it('replaces an adapter with the same id without duplicating it', () => {
    const registry = new ProviderRegistry();
    const original = adapter('same', 'A');
    const replacement = adapter('same', 'B');

    registry.register(original);
    registry.register(replacement);

    expect(registry.get('same')).toBe(replacement);
    expect(registry.getAll()).toEqual([replacement]);
  });

  it('filters tier A providers and exposes the built-in free catalog adapters', () => {
    const registry = new ProviderRegistry();
    registry.register(adapter('tier-a', 'A'));
    registry.register(adapter('tier-b', 'B'));

    expect(registry.getTierA().map((item) => item.id)).toEqual(['tier-a']);
    expect(providerRegistry.getTierA().map((item) => item.id)).toEqual([
      'standard_ebooks',
      'project_gutenberg',
      'open_textbook_library',
    ]);
  });
});
