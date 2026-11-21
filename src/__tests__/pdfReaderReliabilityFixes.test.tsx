// @vitest-environment jsdom

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { PdfCanvasViewer } from '@/components/books/PdfCanvasViewer';
import { loadPdfJs, isPdfJsLoaded, resetPdfJsPromiseForTesting } from '@/utils/pdfLoader';
import { validateReaderUrl, buildSafePdfEmbedUrl } from '@/utils/bookReaderPreview';
import { isWhitelistedProxyHost } from '@/utils/pdfProxyHelper';

describe('PDF Reader Reliability Fixes', () => {
  beforeEach(() => {
    vi.resetModules();
    resetPdfJsPromiseForTesting();
    document.querySelectorAll('script[src*="pdf.min.js"]').forEach((s) => s.remove());
    delete (window as any).pdfjsLib;

    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
      setTransform: vi.fn(),
      drawImage: vi.fn(),
      fillRect: vi.fn(),
      clearRect: vi.fn(),
    });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('pdfLoader script race resilience', () => {
    it('immediately resolves if script tag exists and window.pdfjsLib is already set', async () => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      document.head.appendChild(script);

      const fakeLib = { GlobalWorkerOptions: { workerSrc: '' } };
      (window as any).pdfjsLib = fakeLib;

      const loaded = await loadPdfJs();
      expect(loaded).toBe(fakeLib);
      expect(fakeLib.GlobalWorkerOptions.workerSrc).toContain('pdf.worker.min.js');
    });

    it('recovers via polling if window.pdfjsLib is set shortly after script tag is discovered', async () => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      document.head.appendChild(script);

      const fakeLib = { GlobalWorkerOptions: { workerSrc: '' } };
      const promise = loadPdfJs();

      setTimeout(() => {
        (window as any).pdfjsLib = fakeLib;
      }, 30);

      const loaded = await promise;
      expect(loaded).toBe(fakeLib);
    });
  });

  describe('PdfCanvasViewer timeout and error recovery', () => {
    it('does not get stuck on Loading PDF document when loading fails, triggers onBlocked and shows recovery actions', async () => {
      const onBlocked = vi.fn();
      const onTotalPages = vi.fn();

      (window as any).pdfjsLib = {
        GlobalWorkerOptions: {},
        getDocument: vi.fn().mockReturnValue({
          promise: Promise.reject(new Error('Failed to fetch due to CORS')),
        }),
      };

      render(
        <PdfCanvasViewer
          url="https://example.com/blocked-cross-origin.pdf"
          currentPage={1}
          readerTheme="light"
          onTotalPagesDetected={onTotalPages}
          onPageChange={vi.fn()}
          onBlocked={onBlocked}
        />
      );

      await waitFor(() => {
        expect(onBlocked).toHaveBeenCalled();
      });

      // The viewer must render clear recovery controls instead of spinning indefinitely
      expect(screen.getByText('Inline PDF Preview Restricted')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /switch to native embed/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('differentiates invalid PDF formats and renders clear message', async () => {
      const onBlocked = vi.fn();

      const invalidErr = new Error('Invalid PDF structure');
      invalidErr.name = 'InvalidPDFException';

      (window as any).pdfjsLib = {
        GlobalWorkerOptions: {},
        getDocument: vi.fn().mockReturnValue({
          promise: Promise.reject(invalidErr),
        }),
      };

      render(
        <PdfCanvasViewer
          url="https://archive.org/details/gunahokadevta"
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

      expect(screen.getByText(/file format is invalid or not a valid PDF/i)).toBeInTheDocument();
    });
  });

  describe('Archive.org and URL classification resilience', () => {
    it('does not classify archive.org details pages as direct streamable PDFs', () => {
      const result = validateReaderUrl('https://archive.org/details/gunahokadevta');
      expect(result.isValid).toBe(true);
      expect(result.isPdf).toBe(false);
      expect(result.isArchiveDetails).toBe(true);
    });

    it('correctly classifies genuine archive.org direct PDF downloads', () => {
      const result = validateReaderUrl('https://archive.org/download/gunahokadevta/Gunaho_Ka_Devta.pdf');
      expect(result.isValid).toBe(true);
      expect(result.isPdf).toBe(true);
      expect(result.isArchiveDetails).toBe(false);
    });

    it('transforms archive.org details URL to embed URL for iframe viewing', () => {
      const embedUrl = buildSafePdfEmbedUrl('https://archive.org/details/gunahokadevta');
      expect(embedUrl).toBe('https://archive.org/embed/gunahokadevta');
    });

    it('permits Cloudflare R2 and AWS S3 in proxy allowlist', () => {
      expect(isWhitelistedProxyHost('https://pub-1234.r2.dev/book.pdf')).toBe(true);
      expect(isWhitelistedProxyHost('https://my-bucket.s3.amazonaws.com/book.pdf')).toBe(true);
    });
  });
});
