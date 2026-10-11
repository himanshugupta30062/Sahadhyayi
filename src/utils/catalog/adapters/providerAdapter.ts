import type { Edition } from '@/types/bookCatalog';

export interface BookProviderAdapter {
  readonly id: string;
  readonly name: string;
  readonly tier: 'A' | 'B';
  readonly isFreeToRead: boolean;
  search(query: string, limit?: number): Promise<Edition[]>;
}

export class ProviderRegistry {
  private adapters: Map<string, BookProviderAdapter> = new Map();

  register(adapter: BookProviderAdapter): void {
    this.adapters.set(adapter.id, adapter);
  }

  get(id: string): BookProviderAdapter | undefined {
    return this.adapters.get(id);
  }

  getAll(): BookProviderAdapter[] {
    return Array.from(this.adapters.values());
  }

  getTierA(): BookProviderAdapter[] {
    return this.getAll().filter(a => a.tier === 'A');
  }
}

export const providerRegistry = new ProviderRegistry();

import { StandardEbooksAdapter } from './standardEbooksAdapter';
import { GutenbergAdapter } from './gutenbergAdapter';
import { OpenTextbookAdapter } from './openTextbookAdapter';

providerRegistry.register(new StandardEbooksAdapter());
providerRegistry.register(new GutenbergAdapter());
providerRegistry.register(new OpenTextbookAdapter());

