// @vitest-environment jsdom
import React from 'react';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import AdminLiteraryCreators from './AdminLiteraryCreators';
import { supabase } from '@/integrations/supabase/client';

describe('AdminLiteraryCreators', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.confirm = vi.fn().mockReturnValue(true);
    window.scrollTo = vi.fn();
    vi.stubGlobal(
      'ResizeObserver',
      class ResizeObserverMock {
        observe() {}
        unobserve() {}
        disconnect() {}
      }
    );

    const mockCreators = [
      {
        id: 'creator-1',
        name: 'Jane Doe',
        slug: 'jane-doe',
        bio: 'Book critic and reviewer',
        avatar_url: 'https://example.com/avatar.jpg',
        creator_roles: ['reviewer', 'critic'],
        genres: ['Fiction'],
        languages: ['English'],
        website_url: 'https://janedoe.com',
        featured: true,
        verified: true,
        status: 'published',
      },
    ];

    vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
      if (table === 'literary_creators') {
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data: mockCreators, error: null }),
            }),
          }),
          insert: vi.fn().mockResolvedValue({ error: null }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        } as any;
      }
      if (table === 'creator_social_links') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [{ id: 'soc-1', creator_id: 'creator-1', platform: 'youtube', url: 'https://youtube.com/jane' }],
                error: null,
              }),
            }),
          }),
          insert: vi.fn().mockResolvedValue({ error: null }),
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        } as any;
      }
      if (table === 'creator_publications') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [{ id: 'pub-1', creator_id: 'creator-1', title: 'Top 10 Books', publication_type: 'review', source_url: 'https://example.com', status: 'published' }],
                error: null,
              }),
            }),
          }),
          insert: vi.fn().mockResolvedValue({ error: null }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        } as any;
      }
      return {
        select: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      } as any;
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('renders literary voices header and existing creator profiles', async () => {
    render(<AdminLiteraryCreators />);

    expect(screen.getByText('Literary voices')).toBeInTheDocument();
    const janeElements = await screen.findAllByText('Jane Doe');
    expect(janeElements.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/jane-doe/)).toBeInTheDocument();
  });

  it('populates creator profile into form for editing', async () => {
    render(<AdminLiteraryCreators />);

    const editButton = await screen.findByRole('button', { name: /Edit/i });
    fireEvent.click(editButton);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Jane Doe')).toBeInTheDocument();
      expect(screen.getByDisplayValue('jane-doe')).toBeInTheDocument();
    });
  });

  it('deletes a creator profile when delete button is clicked', async () => {
    render(<AdminLiteraryCreators />);

    const deleteButton = await screen.findByRole('button', { name: /Delete/i });
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalledWith(
        'Delete this creator and their linked publications/social links?'
      );
    });
  });
});
