import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const removePdfScripts = () => {
  document.querySelectorAll('script[src*="pdf.min.js"]').forEach((script) => script.remove());
  delete (window as Window & { pdfjsLib?: unknown }).pdfjsLib;
};

describe('pdfLoader', () => {
  beforeEach(() => {
    vi.resetModules();
    removePdfScripts();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    removePdfScripts();
  });

  it('reports whether PDF.js is already available on the window', async () => {
    const loader = await import('./pdfLoader');
    expect(loader.isPdfJsLoaded()).toBe(false);

    (window as Window & { pdfjsLib?: unknown }).pdfjsLib = {};
    expect(loader.isPdfJsLoaded()).toBe(true);
  });

  it('returns null in server-side environments without a window', async () => {
    const loader = await import('./pdfLoader');
    vi.stubGlobal('window', undefined);

    expect(loader.isPdfJsLoaded()).toBe(false);
    await expect(loader.loadPdfJs()).resolves.toBeNull();
  });

  it('returns an existing library and configures its missing worker URL', async () => {
    const lib = { GlobalWorkerOptions: { workerSrc: '' } };
    (window as Window & { pdfjsLib?: unknown }).pdfjsLib = lib;
    const loader = await import('./pdfLoader');

    await expect(loader.loadPdfJs()).resolves.toBe(lib);
    expect(lib.GlobalWorkerOptions.workerSrc).toContain('pdf.worker.min.js');
  });

  it('preserves a worker URL configured by the host application', async () => {
    const lib = { GlobalWorkerOptions: { workerSrc: '/custom/pdf.worker.js' } };
    (window as Window & { pdfjsLib?: unknown }).pdfjsLib = lib;
    const loader = await import('./pdfLoader');

    await loader.loadPdfJs();
    expect(lib.GlobalWorkerOptions.workerSrc).toBe('/custom/pdf.worker.js');
  });

  it('injects a CDN script with integrity and privacy attributes', async () => {
    const loader = await import('./pdfLoader');
    const pending = loader.loadPdfJs();
    const script = document.querySelector<HTMLScriptElement>('script[src*="pdf.min.js"]');

    expect(script).not.toBeNull();
    expect(script?.src).toContain('pdf.min.js');
    expect(script?.integrity).toMatch(/^sha512-/);
    expect(script?.crossOrigin).toBe('anonymous');
    expect(script?.referrerPolicy).toBe('no-referrer');

    const lib = { GlobalWorkerOptions: { workerSrc: '' } };
    (window as Window & { pdfjsLib?: unknown }).pdfjsLib = lib;
    script?.dispatchEvent(new Event('load'));

    await expect(pending).resolves.toBe(lib);
    expect(lib.GlobalWorkerOptions.workerSrc).toContain('pdf.worker.min.js');
  });

  it('shares a single injected script across concurrent load requests', async () => {
    const loader = await import('./pdfLoader');
    const first = loader.loadPdfJs();
    const second = loader.loadPdfJs();

    expect(document.querySelectorAll('script[src*="pdf.min.js"]')).toHaveLength(1);

    const lib = { GlobalWorkerOptions: { workerSrc: '' } };
    (window as Window & { pdfjsLib?: unknown }).pdfjsLib = lib;
    document.querySelector('script[src*="pdf.min.js"]')?.dispatchEvent(new Event('load'));

    await expect(Promise.all([first, second])).resolves.toEqual([lib, lib]);
  });

  it('rejects CDN load errors and clears the failed promise for retry', async () => {
    const loader = await import('./pdfLoader');
    const pending = loader.loadPdfJs();
    document.querySelector('script[src*="pdf.min.js"]')?.dispatchEvent(new Event('error'));

    await expect(pending).rejects.toThrow('Failed to load PDF.js script from CDN');
    expect(loader.loadPdfJs()).not.toBe(pending);
  });

  it('attaches to an existing PDF.js script instead of injecting a duplicate', async () => {
    const existing = document.createElement('script');
    existing.src = 'https://cdn.example.test/pdf.min.js';
    document.head.appendChild(existing);
    const loader = await import('./pdfLoader');
    const pending = loader.loadPdfJs();

    expect(document.querySelectorAll('script[src*="pdf.min.js"]')).toHaveLength(1);
    const lib = { GlobalWorkerOptions: { workerSrc: '' } };
    (window as Window & { pdfjsLib?: unknown }).pdfjsLib = lib;
    existing.dispatchEvent(new Event('load'));

    await expect(pending).resolves.toBe(lib);
    expect(lib.GlobalWorkerOptions.workerSrc).toContain('pdf.worker.min.js');
  });

  it('rejects when an existing PDF.js script fails to load', async () => {
    const existing = document.createElement('script');
    existing.src = 'https://cdn.example.test/pdf.min.js';
    document.head.appendChild(existing);
    const loader = await import('./pdfLoader');
    const pending = loader.loadPdfJs();

    existing.dispatchEvent(new Event('error'));
    await expect(pending).rejects.toThrow('Failed to load PDF.js script from CDN');
  });

  it('resolves immediately when attaching to an existing script if window.pdfjsLib is already set', async () => {
    const existing = document.createElement('script');
    existing.src = 'https://cdn.example.test/pdf.min.js';
    document.head.appendChild(existing);

    const lib = { GlobalWorkerOptions: { workerSrc: '' } };
    (window as Window & { pdfjsLib?: unknown }).pdfjsLib = lib;

    const loader = await import('./pdfLoader');
    const result = await loader.loadPdfJs();

    expect(result).toBe(lib);
    expect(lib.GlobalWorkerOptions.workerSrc).toContain('pdf.worker.min.js');
  });

  it('resolves via polling when window.pdfjsLib is assigned asynchronously to an existing script', async () => {
    const existing = document.createElement('script');
    existing.src = 'https://cdn.example.test/pdf.min.js';
    document.head.appendChild(existing);

    const loader = await import('./pdfLoader');
    const pending = loader.loadPdfJs();

    const lib = { GlobalWorkerOptions: { workerSrc: '' } };
    setTimeout(() => {
      (window as Window & { pdfjsLib?: unknown }).pdfjsLib = lib;
    }, 60);

    const result = await pending;
    expect(result).toBe(lib);
  });
});
