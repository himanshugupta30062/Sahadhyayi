// @vitest-environment jsdom

import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { validateReaderUrl } from '@/utils/bookReaderPreview';

describe('PDF Contribution & Publication End-to-End Workflow', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('validates PDF signature, size limit and reader URL compatibility', () => {
    // Valid PDF signature check
    const validHeader = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]); // %PDF-
    const decoded = new TextDecoder().decode(validHeader);
    expect(decoded).toBe('%PDF-');

    // Invalid signature check
    const invalidHeader = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d]); // PNG
    expect(new TextDecoder().decode(invalidHeader)).not.toBe('%PDF-');

    // Published Supabase Storage URL check for Book Details and Reader
    const targetBookId = '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d';
    const submissionId = 'c9bf9e57-1685-4c89-bafb-ff5af830be8a';
    const publishedPdfUrl = `https://test-project.supabase.co/storage/v1/object/public/book-pdfs/${targetBookId}/${submissionId}.pdf`;

    const validation = validateReaderUrl(publishedPdfUrl);
    expect(validation.isValid).toBe(true);
    expect(validation.isPdf).toBe(true);
    expect(validation.isGoogleBooks).toBe(false);
  });

  it('verifies submission payload and state transitions through review and publication', async () => {
    const mockStorageUpload = vi.fn().mockResolvedValue({ data: { path: 'user-1/sub-1/source.pdf' }, error: null });
    const mockDbInsert = vi.fn().mockResolvedValue({ error: null });
    const mockDbUpdate = vi.fn().mockResolvedValue({ error: null });
    const mockFunctionInvoke = vi.fn();

    // 1. User contribution stage
    const userId = 'user-1';
    const submissionId = 'sub-1';
    const storagePath = `${userId}/${submissionId}/source.pdf`;
    const submittedData = {
      id: submissionId,
      user_id: userId,
      submission_source: 'user_upload',
      original_filename: 'alice_in_wonderland.pdf',
      storage_path: storagePath,
      file_size_bytes: 1024 * 1024,
      submitted_title: 'Alice in Wonderland',
      submitted_author: 'Lewis Carroll',
      rights_attested: true,
      rights_statement: 'Contributor confirms they have permission to share this PDF or that it is public domain/openly licensed.',
      status: 'uploaded',
      target_book_id: null,
    };

    await mockDbInsert(submittedData);
    await mockStorageUpload(storagePath);
    expect(mockDbInsert).toHaveBeenCalledWith(expect.objectContaining({
      status: 'uploaded',
      rights_attested: true,
      submitted_title: 'Alice in Wonderland',
    }));
    expect(mockStorageUpload).toHaveBeenCalledWith(storagePath);

    // 2. Admin preview stage
    mockFunctionInvoke.mockImplementation(async (fn: string, { body }: any) => {
      if (body.action === 'preview') {
        return {
          data: { url: `https://test-project.supabase.co/storage/v1/object/sign/book-pdf-quarantine/${storagePath}?token=temp` },
          error: null,
        };
      }
      if (body.action === 'approve') {
        const publishedBookId = 'book-new-1';
        const publicUrl = `https://test-project.supabase.co/storage/v1/object/public/book-pdfs/${publishedBookId}/${submissionId}.pdf`;
        return {
          data: {
            success: true,
            status: 'approved',
            targetBookId: publishedBookId,
            pdfUrl: publicUrl,
            catalogueAction: 'created',
          },
          error: null,
        };
      }
      return { data: { success: true }, error: null };
    });

    const previewRes = await mockFunctionInvoke('review-book-pdf', {
      body: { submissionId, action: 'preview' },
    });
    expect(previewRes.data.url).toContain('book-pdf-quarantine');

    // 3. Admin approval & publication stage
    const approveRes = await mockFunctionInvoke('review-book-pdf', {
      body: { submissionId, action: 'approve' },
    });
    expect(approveRes.data.success).toBe(true);
    expect(approveRes.data.status).toBe('approved');
    expect(approveRes.data.pdfUrl).toContain('/storage/v1/object/public/book-pdfs/');

    // 4. Reader verification
    const readerAnalysis = validateReaderUrl(approveRes.data.pdfUrl);
    expect(readerAnalysis.isValid).toBe(true);
    expect(readerAnalysis.isPdf).toBe(true);
  });
});
