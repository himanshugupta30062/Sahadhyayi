import { describe, expect, it } from 'vitest';
import { createDefaultMapAvatarSvg } from './mapAvatarSvg';

describe('createDefaultMapAvatarSvg', () => {
  it('renders a local illustrated portrait with recognizable facial features', () => {
    const svg = createDefaultMapAvatarSvg('reader-123');
    expect(svg).toContain('class="sahadhyayi-default-avatar"');
    expect(svg).toContain('data-face-shape="');
    expect(svg).toContain('<ellipse cx="39" cy="47"');
    expect(svg).toContain('<path d="M48 49 Q45 56 48 58');
    expect(svg).toContain('viewBox="0 0 96 96"');
  });

  it('generates the same portrait for the same seed and different portraits for different seeds', () => {
    expect(createDefaultMapAvatarSvg('same-reader')).toBe(createDefaultMapAvatarSvg('same-reader'));
    expect(createDefaultMapAvatarSvg('reader-a')).not.toBe(createDefaultMapAvatarSvg('reader-b'));
  });
});
