import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  queryOptions: [] as Array<Record<string, any>>,
  mutationOptions: [] as Array<Record<string, any>>,
  invalidateQueries: vi.fn().mockResolvedValue(undefined),
  toast: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  refetch: vi.fn(),
  stories: [] as Array<Record<string, any>>,
  queryError: null as Error | null,
  loading: false,
  fetching: false,
}));

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: mocks.invalidateQueries }),
  useQuery: (options: Record<string, any>) => {
    mocks.queryOptions.push(options);
    return { data: mocks.stories, error: mocks.queryError, isLoading: mocks.loading, isFetching: mocks.fetching, refetch: mocks.refetch };
  },
  useMutation: (options: Record<string, any>) => {
    mocks.mutationOptions.push(options);
    return {
      isPending: false,
      mutate: async (variables: unknown) => {
        try { const result = await options.mutationFn(variables); await options.onSuccess?.(result, variables); }
        catch (error) { options.onError?.(error); }
      },
    };
  },
}));

vi.mock('@/integrations/supabase/client-universal', () => ({
  supabase: { from: () => ({
    select: () => ({ order: () => ({ limit: async () => ({ data: mocks.stories, error: mocks.queryError }) }) }),
    insert: (...args: unknown[]) => mocks.insert(...args),
    update: (...args: unknown[]) => mocks.update(...args),
  }) },
}));
vi.mock('@/hooks/use-toast', () => ({ toast: mocks.toast }));
vi.mock('@/components/ui/button', () => ({ Button: ({ children, ...props }: any) => <button {...props}>{children}</button> }));
vi.mock('@/components/ui/input', () => ({ Input: (props: any) => <input {...props} /> }));
vi.mock('@/components/ui/textarea', () => ({ Textarea: (props: any) => <textarea {...props} /> }));
vi.mock('@/components/ui/badge', () => ({ Badge: ({ children }: any) => <span>{children}</span> }));
vi.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange }: any) => <div data-value={value}>{children}<button type="button" onClick={() => onValueChange('research')}>Choose research</button></div>,
  SelectTrigger: ({ children }: any) => <div>{children}</div>, SelectValue: () => <span />, SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children }: any) => <span>{children}</span>,
}));

import { MemoryRouter } from 'react-router-dom';
import AdminNews from '@/pages/AdminNews';

const renderAdminNews = () => render(<MemoryRouter><AdminNews /></MemoryRouter>);

describe('AdminNews', () => {
  beforeEach(() => {
    mocks.queryOptions = []; mocks.mutationOptions = []; mocks.stories = []; mocks.queryError = null;
    mocks.loading = false; mocks.fetching = false; mocks.toast.mockReset(); mocks.invalidateQueries.mockClear();
    mocks.insert.mockReset().mockResolvedValue({ error: null });
    mocks.update.mockReset().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
    mocks.refetch.mockReset();
  });
  afterEach(() => cleanup());

  it('loads recent stories and exposes the query function', async () => {
    mocks.stories = [{ id: 'n1', title: 'Research breakthrough', slug: 'research-breakthrough', summary: 'A summary', status: 'published', category: 'research' }];
    renderAdminNews();
    expect(screen.getByText('Research breakthrough')).toBeInTheDocument();
    expect(screen.getAllByText('Research & Science News')[0]).toBeInTheDocument();
    expect(mocks.queryOptions[0].queryKey).toEqual(['admin-news']);
    await expect(mocks.queryOptions[0].queryFn()).resolves.toEqual(mocks.stories);
  });

  it('renders loading, error and empty collection states', () => {
    mocks.loading = true; const first = renderAdminNews();
    expect(screen.getByText('Loading stories...')).toBeInTheDocument(); first.unmount();
    mocks.loading = false; mocks.queryError = new Error('offline'); const second = renderAdminNews();
    expect(screen.getByText(/Could not load stories: offline/)).toBeInTheDocument(); second.unmount();
    mocks.queryError = null; renderAdminNews();
    expect(screen.getByText('No stories created yet.')).toBeInTheDocument();
  });

  it('validates story content and unsafe source URLs', async () => {
    renderAdminNews();
    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }));
    await waitFor(() => expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Could not save news', description: expect.stringContaining('headline') })));
    fireEvent.change(screen.getByPlaceholderText('Write a clear, factual headline'), { target: { value: 'A sufficiently long headline' } });
    fireEvent.change(screen.getByPlaceholderText('Write the original story, context and key details...'), { target: { value: 'This story contains more than thirty characters of useful original content.' } });
    fireEvent.change(screen.getAllByPlaceholderText('https://...')[1], { target: { value: 'javascript:alert(1)' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }));
    await waitFor(() => expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({ description: 'Source URL must use HTTP or HTTPS.' })));
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it('saves a draft, resets the form and invalidates the list', async () => {
    renderAdminNews();
    fireEvent.change(screen.getByPlaceholderText('Write a clear, factual headline'), { target: { value: 'A sufficiently long headline' } });
    fireEvent.change(screen.getByPlaceholderText('Write the original story, context and key details...'), { target: { value: 'This story contains more than thirty characters of useful original content.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }));
    await waitFor(() => expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({ title: 'A sufficiently long headline', status: 'draft', published_at: null })));
    expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Draft saved' }));
    expect(mocks.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['admin-news'] });
    expect(screen.getByPlaceholderText('Write a clear, factual headline')).toHaveValue('');
  });

  it('publishes a story with selected category and reports insert failures', async () => {
    renderAdminNews();
    fireEvent.change(screen.getByPlaceholderText('Write a clear, factual headline'), { target: { value: 'A sufficiently long headline' } });
    fireEvent.change(screen.getByPlaceholderText('Write the original story, context and key details...'), { target: { value: 'This story contains more than thirty characters of useful original content.' } });
    fireEvent.click(screen.getByText('Choose research'));
    fireEvent.click(screen.getByRole('button', { name: 'Publish story' }));
    await waitFor(() => expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({ category: 'research', status: 'published', published_at: expect.any(String) })));
    expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({ title: 'News published' }));

    mocks.insert.mockResolvedValueOnce({ error: new Error('insert denied') });
    fireEvent.change(screen.getByPlaceholderText('Write a clear, factual headline'), { target: { value: 'Another sufficiently long headline' } });
    fireEvent.change(screen.getByPlaceholderText('Write the original story, context and key details...'), { target: { value: 'This story contains more than thirty characters of useful original content.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Publish story' }));
    await waitFor(() => expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Could not save news', description: 'insert denied' })));
  });

  it('updates draft and published story statuses', async () => {
    mocks.stories = [
      { id: 'draft-1', title: 'Draft headline', slug: 'draft-headline', summary: '', status: 'draft', category: 'books' },
      { id: 'published-1', title: 'Published headline', slug: 'published-headline', summary: '', status: 'published', category: 'authors' },
    ];
    renderAdminNews();
    fireEvent.click(screen.getByRole('button', { name: 'Publish' }));
    await waitFor(() => expect(mocks.update).toHaveBeenCalledWith({ status: 'published', published_at: expect.any(String) }));
    fireEvent.click(screen.getAllByRole('button', { name: 'Archive' })[0]);
    await waitFor(() => expect(mocks.update).toHaveBeenCalledWith({ status: 'archived', published_at: null }));
  });
});
