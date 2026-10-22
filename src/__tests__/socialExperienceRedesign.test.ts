import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');

describe('social experience redesign foundations', () => {
  const page = read('../../src/pages/SocialMedia.tsx');
  const composer = read('../../src/components/social/FeedComposer.tsx');
  const feed = read('../../src/components/social/EnhancedSocialFeed.tsx');
  const postsHook = read('../../src/hooks/useSocialPosts.ts');
  const imageAltMigration = read('../../supabase/migrations/20261023180000_add_social_post_image_alt.sql');

  it('keeps reading spaces discoverable without a permanent shortcut-card grid', () => {
    expect(page).toMatch(/Explore reading spaces/);
    expect(page).toMatch(/aria-label="Reading spaces"/);
    expect(page).toMatch(/value: 'threads'/);
    expect(page).toMatch(/value: 'margins'/);
    expect(page).toMatch(/value: 'groups'/);
  });

  it('validates uploaded image MIME type and size and exposes an alt-text field', () => {
    expect(composer).toMatch(/allowedImageTypes = new Set\(\['image\/jpeg', 'image\/png', 'image\/webp', 'image\/avif'\]\)/);
    expect(composer).toMatch(/file\.size > 5 \* 1024 \* 1024/);
    expect(composer).toMatch(/id="post-image-alt"/);
    expect(composer).toMatch(/image_alt: selectedImage \? imageAlt\.trim\(\)\.slice\(0, 250\)/);
    expect(postsHook).toMatch(/image_alt: postData\.image_alt\?\.trim\(\)\.slice\(0, 250\)/);
    expect(imageAltMigration).toMatch(/ADD COLUMN IF NOT EXISTS image_alt text/);
    expect(imageAltMigration).toMatch(/char_length\(image_alt\) <= 250/);
  });

  it('resolves shared post links through the authenticated query path and anchors the matching card', () => {
    expect(feed).toMatch(/searchParams\.get\('post'\)/);
    expect(feed).toMatch(/from\('posts'\)[\s\S]*\.eq\('id', requestedPostId\)/);
    expect(feed).toMatch(/social-post-/);
    expect(feed).toMatch(/scrollIntoView\(\{ behavior: 'smooth', block: 'center' \}\)/);
    expect(feed).toMatch(/Shareable literary quote/);
  });
});
