// @vitest-environment jsdom

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { PdfCanvasViewer } from '@/components/books/PdfCanvasViewer';
import {
  isWhitelistedProxyHost,
  isCorsRestrictedPdf,
  getProxiedPdfUrl,
  SUPABASE_PDF_PROXY_URL,
} from '@/utils/pdfProxyHelper';

describe('PDF Proxy Helper', () => {
  it('correctly identifies whitelisted hosts', () => {
    expect(isWhitelistedProxyHost('https://www.gutenberg.org/files/1342/1342-pdf.pdf')).toBe(true);
    expect(isWhitelistedProxyHost('https://archive.org/download/book/book.pdf')).toBe(true);
    expect(isWhitelistedProxyHost('https://openlibrary.org/books/OL1234M.pdf')).toBe(true);
    expect(isWhitelistedProxyHost('https://library.harvard.edu/manuscript.pdf')).toBe(true);
    expect(isWhitelistedProxyHost('https://ncert.nic.in/textbook/pdf.pdf')).toBe(true);
    expect(isWhitelistedProxyHost('https://random-unknown-malicious-site.com/evil.pdf')).toBe(false);
  });

  it('determines when a PDF requires proxy due to CORS restrictions', () => {
    expect(isCorsRestrictedPdf('https://archive.org/download/book.pdf')).toBe(true);
    expect(isCorsRestrictedPdf('https://rknxtatvlzunatpyqxro.supabase.co/storage/v1/object/public/book.pdf')).toBe(false);
    expect(isCorsRestrictedPdf('blob:http://localhost:3000/uuid-123')).toBe(false);
  });

  it('constructs correct proxied URLs with encoded parameters', () => {
    const rawUrl = 'https://www.gutenberg.org/ebooks/1342.pdf';
    const proxied = getProxiedPdfUrl(rawUrl, true, 'PrideAndPrejudice.pdf');

    expect(proxied).toContain(SUPABASE_PDF_PROXY_URL);
    expect(proxied).toContain(encodeURIComponent(rawUrl));
    expect(proxied).toContain('download=1');
    expect(proxied).toContain('filename=PrideAndPrejudice.pdf');
  });

  it('returns raw URL unchanged if already proxied or not in whitelist', () => {
    const alreadyProxied = `${SUPABASE_PDF_PROXY_URL}?url=xyz`;
    expect(getProxiedPdfUrl(alreadyProxied)).toBe(alreadyProxied);

    const nonWhitelisted = 'https://untrusted-host.example.com/doc.pdf';
    expect(getProxiedPdfUrl(nonWhitelisted)).toBe(nonWhitelisted);
  });
});

describe('PdfCanvasViewer Component', () => {
  let mockGetDocument: ReturnType<typeof vi.fn>;
  let mockPageRender: ReturnType<typeof vi.fn>;
  let mockGetPage: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
      setTransform: vi.fn(),
      drawImage: vi.fn(),
      fillRect: vi.fn(),
      clearRect: vi.fn(),
    });

    mockPageRender = vi.fn().mockReturnValue({
      promise: Promise.resolve(),
    });

    mockGetPage = vi.fn().mockResolvedValue({
      getViewport: ({ scale }: { scale: number }) => ({
        width: 600 * scale,
        height: 800 * scale,
      }),
      render: mockPageRender,
    });

    mockGetDocument = vi.fn().mockReturnValue({
      promise: Promise.resolve({
        numPages: 42,
        getPage: mockGetPage,
      }),
    });

    (window as any).pdfjsLib = {
      GlobalWorkerOptions: {},
      getDocument: mockGetDocument,
    };
  });

  afterEach(() => {
    cleanup();
    delete (window as any).pdfjsLib;
    vi.restoreAllMocks();
  });

  it('initializes PDF.js and notifies parent of detected total pages', async () => {
    const onTotalPages = vi.fn();
    const onPageChange = vi.fn();
    const onBlocked = vi.fn();

    render(
      <PdfCanvasViewer
        url="https://archive.org/download/pride/pandp.pdf"
        currentPage={1}
        readerTheme="light"
        onTotalPagesDetected={onTotalPages}
        onPageChange={onPageChange}
        onBlocked={onBlocked}
      />
    );

    await waitFor(() => {
      expect(onTotalPages).toHaveBeenCalledWith(42);
    });

    expect(mockGetPage).toHaveBeenCalledWith(1);
    expect(mockPageRender).toHaveBeenCalled();
    expect(onBlocked).not.toHaveBeenCalled();
  });

  it('provides zoom in and zoom out controls', async () => {
    render(
      <PdfCanvasViewer
        url="https://archive.org/download/pride/pandp.pdf"
        currentPage={1}
        readerTheme="sepia"
        onTotalPagesDetected={vi.fn()}
        onPageChange={vi.fn()}
        onBlocked={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('115%')).toBeInTheDocument();
    });

    const zoomInBtn = screen.getByTitle('Zoom in');
    fireEvent.click(zoomInBtn);

    await waitFor(() => {
      expect(screen.getByText('135%')).toBeInTheDocument();
    });

    const zoomOutBtn = screen.getByTitle('Zoom out');
    fireEvent.click(zoomOutBtn);

    await waitFor(() => {
      expect(screen.getByText('115%')).toBeInTheDocument();
    });
  });

  it('automatically falls back to proxy when direct PDF loading fails with CORS error', async () => {
    // First call (direct) fails with CORS NetworkError
    // Second call (proxied) succeeds
    mockGetDocument
      .mockReturnValueOnce({
        promise: Promise.reject(new Error('Failed to fetch due to CORS restrictions')),
      })
      .mockReturnValueOnce({
        promise: Promise.resolve({
          numPages: 25,
          getPage: mockGetPage,
        }),
      });

    const onTotalPages = vi.fn();
    const onBlocked = vi.fn();

    render(
      <PdfCanvasViewer
        url="https://archive.org/download/restricted-cors.pdf"
        currentPage={1}
        readerTheme="dark"
        onTotalPagesDetected={onTotalPages}
        onPageChange={vi.fn()}
        onBlocked={onBlocked}
      />
    );

    await waitFor(() => {
      expect(onTotalPages).toHaveBeenCalledWith(25);
    });

    // Verify it called proxy on second attempt
    expect(mockGetDocument).toHaveBeenCalledTimes(2);
    const secondCallArg = mockGetDocument.mock.calls[1][0];
    expect(secondCallArg.url).toContain(SUPABASE_PDF_PROXY_URL);
    expect(onBlocked).not.toHaveBeenCalled();
  });

  it('triggers onBlocked when both direct and proxy loading fail', async () => {
    mockGetDocument.mockReturnValue({
      promise: Promise.reject(new Error('File not found 404')),
    });

    const onBlocked = vi.fn();

    render(
      <PdfCanvasViewer
        url="https://archive.org/download/missing.pdf"
        currentPage={1}
        readerTheme="light"
        onTotalPagesDetected={vi.fn()}
        onPageChange={vi.fn()}
        onBlocked={onBlocked}
      />
    );

    await waitFor(() => {
      expect(onBlocked).toHaveBeenCalled();
    });
  });
});
