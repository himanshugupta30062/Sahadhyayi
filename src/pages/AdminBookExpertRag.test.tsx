import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AdminBookExpertRag from './AdminBookExpertRag';
import { supabase } from '@/integrations/supabase/client-universal';

const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

vi.mock('@/components/SEO', () => ({
  default: () => <div data-testid="seo-tag" />,
}));

vi.mock('@/integrations/supabase/client-universal', () => ({
  supabase: {
    from: vi.fn(),
    functions: {
      invoke: vi.fn(),
    },
  },
}));

describe('AdminBookExpertRag Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    (supabase.from as any).mockImplementation((table: string) => {
      const queryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        then: (resolve: any) =>
          resolve({
            count: table === 'book_expert_documents' ? 120 : 450,
            error: null,
          }),
      };
      return queryBuilder;
    });

    (supabase.functions.invoke as any).mockResolvedValue({
      data: {
        requested: 5,
        indexed: 4,
        unchanged: 1,
        failed: 0,
        nextOffset: 5,
      },
      error: null,
    });
  });

  it('renders RAG statistics and index controls', async () => {
    render(<AdminBookExpertRag />);

    expect(screen.getByText('Book Expert · RAG')).toBeInTheDocument();
    expect(screen.getByText('Index catalog metadata')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getAllByText('120').length).toBeGreaterThan(0);
      expect(screen.getAllByText('450').length).toBeGreaterThan(0);
    });
  });

  it('runs a single batch indexing for catalog metadata', async () => {
    render(<AdminBookExpertRag />);

    const indexBatchBtns = screen.getAllByRole('button', { name: /index next 5/i });
    fireEvent.click(indexBatchBtns[0]);

    await waitFor(() => {
      expect(supabase.functions.invoke).toHaveBeenCalledWith('book-expert-ingest', {
        body: expect.objectContaining({
          action: 'seed_catalog',
          sourceType: 'book_metadata',
        }),
      });
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Indexing batch complete',
        })
      );
    });
  });

  it('validates required source details when rights are confirmed but text is missing', async () => {
    render(<AdminBookExpertRag />);

    const rightsCheckbox = screen.getByRole('checkbox');
    fireEvent.click(rightsCheckbox);

    const licenseInput = screen.getByPlaceholderText(/Public domain, CC BY 4.0/i);
    fireEvent.change(licenseInput, { target: { value: 'CC BY 4.0' } });

    const ingestBtn = screen.getByRole('button', { name: /index approved text/i });
    fireEvent.click(ingestBtn);

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'More source details required',
        variant: 'destructive',
      })
    );
  });

  it('successfully ingests valid approved text', async () => {
    (supabase.functions.invoke as any).mockResolvedValue({
      data: { success: true },
      error: null,
    });

    render(<AdminBookExpertRag />);

    const titleInput = screen.getByPlaceholderText('Source title');
    const refInput = screen.getByPlaceholderText('article:slug or public-domain:book-id');
    const licenseInput = screen.getByPlaceholderText(/Public domain, CC BY 4.0/i);
    const contentInput = screen.getByPlaceholderText(/Paste only text Sahadhyayi is permitted to index/i);
    const rightsCheckbox = screen.getByRole('checkbox');

    fireEvent.change(titleInput, { target: { value: 'Discovery of India' } });
    fireEvent.change(refInput, { target: { value: 'doi-ch1' } });
    fireEvent.change(licenseInput, { target: { value: 'Public Domain' } });
    fireEvent.change(contentInput, {
      target: {
        value: 'This is a long passage from the book containing historical records and essays that exceed eighty characters easily.',
      },
    });
    fireEvent.click(rightsCheckbox);

    const ingestBtn = screen.getByRole('button', { name: /index approved text/i });
    fireEvent.click(ingestBtn);

    await waitFor(() => {
      expect(supabase.functions.invoke).toHaveBeenCalledWith('book-expert-ingest', {
        body: expect.objectContaining({
          action: 'ingest_text',
          sourceType: 'approved_text',
          title: 'Discovery of India',
          sourceRef: 'doi-ch1',
          rightsConfirmed: true,
        }),
      });
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Source indexed',
        })
      );
    });
  });
});
