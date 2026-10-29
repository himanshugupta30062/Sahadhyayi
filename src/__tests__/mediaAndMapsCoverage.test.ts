// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const storageMocks = vi.hoisted(() => ({
  createSignedUrls: vi.fn(),
  from: vi.fn(),
}));
vi.mock('@/integrations/supabase/client-universal', () => ({
  supabase: { storage: { from: (...args: unknown[]) => storageMocks.from(...args) } },
}));

import { getPrivateSocialPostMediaPath, resolveSocialPostImages } from '@/lib/socialPostMedia';
import { loadGoogleMaps } from '@/lib/googleMapsLoader';

describe('private social-post media resolution', () => {
  beforeEach(() => {
    storageMocks.from.mockReset().mockReturnValue({ createSignedUrls: storageMocks.createSignedUrls });
    storageMocks.createSignedUrls.mockReset().mockResolvedValue({
      data: [
        { path: 'reader/post/image.jpg', signedUrl: 'https://signed.example/image.jpg', error: null },
        { path: 'reader/post/broken.jpg', signedUrl: null, error: { message: 'not permitted' } },
      ],
      error: null,
    });
  });

  it.each([
    [undefined, null],
    [null, null],
    ['https://example.com/public.jpg', null],
    ['storage://social-post-media/', null],
    ['storage://social-post-media//secret.jpg', null],
    ['storage://social-post-media/../secret.jpg', null],
    ['storage://social-post-media/reader//secret.jpg', null],
    ['storage://social-post-media/reader/post/image.jpg', 'reader/post/image.jpg'],
  ])('validates private media marker %s', (input, expected) => {
    expect(getPrivateSocialPostMediaPath(input)).toBe(expected);
  });

  it('signs unique private paths and preserves public image URLs', async () => {
    const rows = [
      { id: 1, image_url: 'storage://social-post-media/reader/post/image.jpg' },
      { id: 2, image_url: 'storage://social-post-media/reader/post/image.jpg' },
      { id: 3, image_url: 'https://cdn.example/public.jpg' },
      { id: 4, image_url: 'storage://social-post-media/reader/post/broken.jpg' },
    ];
    const resolved = await resolveSocialPostImages(rows);
    expect(storageMocks.from).toHaveBeenCalledWith('social-post-media');
    expect(storageMocks.createSignedUrls).toHaveBeenCalledWith(
      ['reader/post/image.jpg', 'reader/post/broken.jpg'],
      900,
    );
    expect(resolved.map((row) => row.image_url)).toEqual([
      'https://signed.example/image.jpg',
      'https://signed.example/image.jpg',
      'https://cdn.example/public.jpg',
      undefined,
    ]);
    expect(rows[0].image_url).toBe('storage://social-post-media/reader/post/image.jpg');
  });

  it('returns unchanged rows when no private media paths need signing', async () => {
    const rows = [{ image_url: 'https://cdn.example/public.jpg' }];
    await expect(resolveSocialPostImages(rows)).resolves.toBe(rows);
    expect(storageMocks.createSignedUrls).not.toHaveBeenCalled();
  });

  it('fails closed for private markers when signing throws', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    storageMocks.createSignedUrls.mockRejectedValueOnce(new Error('storage offline'));
    const result = await resolveSocialPostImages([{ image_url: 'storage://social-post-media/private.jpg' }]);
    expect(result[0].image_url).toBeUndefined();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe('Google Maps script loader', () => {
  beforeEach(() => {
    delete window.google;
    delete window.googleMapsLoadingPromise;
    delete window.initGoogleMaps;
  });

  afterEach(() => {
    document.querySelectorAll('script[src*="maps.googleapis.com/maps/api/js"]').forEach((script) => script.remove());
    delete window.google;
    delete window.googleMapsLoadingPromise;
    delete window.initGoogleMaps;
  });

  it.each(['', '   ', 'short'])('rejects invalid API key %j before adding a script', async (key) => {
    await expect(loadGoogleMaps(key)).rejects.toThrow('Invalid Google Maps API key');
    expect(document.querySelector('script[src*="maps.googleapis.com"]')).toBeNull();
  });

  it('resolves immediately if Maps is already available', async () => {
    window.google = { maps: {} };
    await expect(loadGoogleMaps('a-valid-google-maps-key-123')).resolves.toBeUndefined();
    expect(document.querySelector('script[src*="maps.googleapis.com"]')).toBeNull();
  });

  it('reuses the in-flight promise and resolves from the script callback', async () => {
    const promise = loadGoogleMaps('a-valid-google-maps-key-123');
    expect(loadGoogleMaps('a-valid-google-maps-key-123')).toBe(promise);
    const script = document.querySelector<HTMLScriptElement>('script[src*="maps.googleapis.com/maps/api/js"]');
    expect(script?.src).toContain('libraries=places');
    expect(script?.src).toContain('callback=initGoogleMaps');
    window.initGoogleMaps?.();
    await expect(promise).resolves.toBeUndefined();
    expect(window.initGoogleMaps).toBeUndefined();
  });

  it('rejects script failures and clears the cached promise for retry', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const promise = loadGoogleMaps('a-valid-google-maps-key-123');
    const script = document.querySelector<HTMLScriptElement>('script[src*="maps.googleapis.com/maps/api/js"]');
    script?.dispatchEvent(new Event('error'));
    await expect(promise).rejects.toThrow('Failed to load Google Maps');
    expect(window.googleMapsLoadingPromise).toBeUndefined();
    expect(window.initGoogleMaps).toBeUndefined();
    error.mockRestore();
  });
});
