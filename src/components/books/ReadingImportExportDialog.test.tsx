import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReadingImportExportDialog } from './ReadingImportExportDialog';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock Auth
vi.mock('@/contexts/authHelpers', () => ({
  useAuth: () => ({
    user: { id: 'test-user-123', email: 'reader@example.com' },
  }),
}));

// Mock Supabase
vi.mock('@/integrations/supabase/client-universal', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [] }),
      upsert: vi.fn().mockResolvedValue({ error: null }),
      insert: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'mock-id' }, error: null }),
    })),
  },
}));

// Mock Bookshelf hook
vi.mock('@/hooks/useUserBookshelf', () => ({
  useUserBookshelf: () => ({
    data: [
      {
        id: 'shelf-1',
        book_id: 'book-1',
        status: 'completed',
        rating: 5,
        books_library: { title: 'Dune', author: 'Frank Herbert' },
      },
    ],
    isLoading: false,
  }),
}));

// Mock Toast
const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

const renderWithClient = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
};

describe('ReadingImportExportDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dialog with Import and Export tabs when open', () => {
    renderWithClient(
      <ReadingImportExportDialog open={true} onOpenChange={vi.fn()} />
    );

    expect(screen.getByText(/Reading Data Mobility & Library Migration/i)).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Import Library/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Export Data/i })).toBeInTheDocument();
    expect(screen.getByText(/Upload Goodreads, StoryGraph, or Sahadhyayi Export/i)).toBeInTheDocument();
  });

  it('switches to Export tab and renders export formats', () => {
    renderWithClient(
      <ReadingImportExportDialog open={true} onOpenChange={vi.fn()} />
    );

    const exportTab = screen.getByRole('tab', { name: /Export Data/i });
    fireEvent.pointerDown(exportTab, { button: 0 });
    fireEvent.click(exportTab);
    fireEvent.keyDown(exportTab, { key: 'Enter', code: 'Enter' });

    expect(screen.getByRole('heading', { name: /Bookshelf CSV/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Complete JSON Archive/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Journal Markdown \(\.md\)/i })).toBeInTheDocument();
    expect(screen.getByText(/Your Data, Your Ownership/i)).toBeInTheDocument();
  });

  it('triggers bookshelf CSV export download', () => {
    renderWithClient(
      <ReadingImportExportDialog open={true} onOpenChange={vi.fn()} />
    );

    const exportTab = screen.getByRole('tab', { name: /Export Data/i });
    fireEvent.pointerDown(exportTab, { button: 0 });
    fireEvent.click(exportTab);
    fireEvent.keyDown(exportTab, { key: 'Enter', code: 'Enter' });

    const downloadCsvBtn = screen.getByRole('button', { name: /Download Bookshelf CSV/i });
    fireEvent.click(downloadCsvBtn);

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Bookshelf Exported',
      })
    );
  });
});
