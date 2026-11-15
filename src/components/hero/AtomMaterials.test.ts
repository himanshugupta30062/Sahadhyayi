import { describe, expect, it } from 'vitest';
import { ATOM_MATERIALS } from '@/components/hero/AtomMaterials';

describe('ATOM_MATERIALS', () => {
  it('defines valid library, author, and social materials', () => {
    expect(ATOM_MATERIALS.library).toBeDefined();
    expect(ATOM_MATERIALS.author).toBeDefined();
    expect(ATOM_MATERIALS.social).toBeDefined();

    expect(ATOM_MATERIALS.library.name).toBe('Library');
    expect(ATOM_MATERIALS.author.name).toBe('Authors');
    expect(ATOM_MATERIALS.social.name).toBe('Social Media');

    for (const key of Object.keys(ATOM_MATERIALS)) {
      const mat = ATOM_MATERIALS[key];
      expect(mat.id).toBe(key);
      expect(mat.background).toBeDefined();
      expect(mat.textColor).toBeDefined();
      expect(mat.border).toBeDefined();
      expect(mat.glowEffect).toBeDefined();
    }
  });
});
