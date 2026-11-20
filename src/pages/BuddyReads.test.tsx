import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import BuddyReads from './BuddyReads';

const mocks = vi.hoisted(() => ({
  user: { id: 'reader-1' } as { id: string } | null,
  toast: vi.fn(),
  from: vi.fn(),
  results: {} as Record<string, Record<string, { data?: any; error?: any }>>,
  calls: [] as Array<{ table: string; operation: string; payload?: any }>,
  singleResult: { data: { token: 'invite-token' }, error: null } as { data: any; error: any },
}));

vi.mock('@/contexts/authHelpers', () => ({
  useAuth: () => ({ user: mocks.user }),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: mocks.from },
}));

vi.mock('@/hooks/use-toast', () => ({
  toast: mocks.toast,
}));

vi.mock('@/components/SEO', () => ({
  default: () => null,
}));

function createQuery(table: string) {
  let operation = 'select';
  const query: any = {};

  query.select = vi.fn(() => query);
  query.order = vi.fn(() => query);
  query.eq = vi.fn(() => query);
  query.in = vi.fn(() => query);
  query.insert = vi.fn((payload: unknown) => {
    operation = 'insert';
    mocks.calls.push({ table, operation, payload });
    return query;
  });
  query.update = vi.fn((payload: unknown) => {
    operation = 'update';
    mocks.calls.push({ table, operation, payload });
    return query;
  });
  query.delete = vi.fn(() => {
    operation = 'delete';
    mocks.calls.push({ table, operation });
    return query;
  });
  query.single = vi.fn(() => Promise.resolve(mocks.singleResult));
  query.then = (resolve: (value: any) => unknown, reject: (reason: unknown) => unknown) => {
    const result = mocks.results[table]?.[operation] ?? mocks.results[table]?.select ?? { data: [], error: null };
    return Promise.resolve(result).then(resolve, reject);
  };

  return query;
}

const read = {
  id: 'read-1',
  title: 'November Together',
  book_title: 'The Gita',
  book_author: 'Vyasa',
  description: 'Read and reflect together.',
  target_date: '2026-12-15',
  status: 'active',
  created_at: '2026-11-01T00:00:00.000Z',
};

const milestone = {
  id: 'milestone-1',
  buddy_read_id: 'read-1',
  title: 'Finish chapter one',
  target_page: 20,
  target_date: null,
};

function seedRead(overrides: {
  members?: any[];
  milestones?: any[];
  posts?: any[];
  completions?: any[];
} = {}) {
  mocks.results = {
    buddy_reads: { select: { data: [read], error: null }, insert: { data: null, error: null } },
    buddy_read_members: { select: { data: overrides.members ?? [
      { buddy_read_id: 'read-1', user_id: 'reader-1', role: 'host', progress_percent: 25 },
      { buddy_read_id: 'read-1', user_id: 'reader-2', role: 'reader', progress_percent: 40 },
    ], error: null } },
    buddy_read_milestones: { select: { data: overrides.milestones ?? [milestone], error: null }, insert: { data: null, error: null } },
    buddy_read_discussions: { select: { data: overrides.posts ?? [], error: null }, insert: { data: null, error: null } },
    buddy_read_milestone_completions: { select: { data: overrides.completions ?? [], error: null }, insert: { data: null, error: null }, delete: { data: null, error: null } },
    buddy_read_invites: { insert: { data: null, error: null } },
  };
}

function renderPage() {
  return render(
    <MemoryRouter>
      <BuddyReads />
    </MemoryRouter>,
  );
}

describe('BuddyReads page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.user = { id: 'reader-1' };
    mocks.calls = [];
    mocks.singleResult = { data: { token: 'invite-token' }, error: null };
    mocks.results = {
      buddy_reads: { select: { data: [], error: null }, insert: { data: null, error: null } },
      buddy_read_members: { select: { data: [], error: null } },
      buddy_read_milestones: { select: { data: [], error: null }, insert: { data: null, error: null } },
      buddy_read_discussions: { select: { data: [], error: null }, insert: { data: null, error: null } },
      buddy_read_milestone_completions: { select: { data: [], error: null }, insert: { data: null, error: null }, delete: { data: null, error: null } },
      buddy_read_invites: { insert: { data: null, error: null } },
    };
    mocks.from.mockImplementation((table: string) => createQuery(table));
  });

  it('loads the empty state and exposes the create-plan form', async () => {
    renderPage();

    expect(await screen.findByText('Your first Buddy Read starts here')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Buddy Reads' })).toBeInTheDocument();
    expect(screen.getByLabelText('Reading plan name *')).toBeRequired();
    expect(screen.getByLabelText('Book title *')).toBeRequired();
    expect(screen.getByRole('button', { name: /Create Buddy Read/ })).toBeInTheDocument();
    expect(mocks.from).toHaveBeenCalledWith('buddy_reads');
  });

  it('shows a destructive toast when the Buddy Reads catalogue cannot be loaded', async () => {
    mocks.results.buddy_reads.select = { data: null, error: { message: 'read plans unavailable' } };
    renderPage();

    await waitFor(() => {
      expect(mocks.toast).toHaveBeenCalledWith({
        title: "Couldn't load Buddy Reads",
        description: 'read plans unavailable',
        variant: 'destructive',
      });
    });
    expect(screen.getByText('Your first Buddy Read starts here')).toBeInTheDocument();
  });

  it('validates required plan details before writing to Supabase', async () => {
    renderPage();
    await screen.findByText('Your first Buddy Read starts here');

    fireEvent.submit(screen.getByRole('button', { name: /Create Buddy Read/ }).closest('form')!);

    expect(mocks.calls.filter((call) => call.table === 'buddy_reads' && call.operation === 'insert')).toHaveLength(0);
  });

  it('trims and saves a new Buddy Read, clears the form, and reloads the plans', async () => {
    renderPage();
    await screen.findByText('Your first Buddy Read starts here');

    fireEvent.change(screen.getByLabelText('Reading plan name *'), { target: { value: '  November Together  ' } });
    fireEvent.change(screen.getByLabelText('Book title *'), { target: { value: '  The Gita  ' } });
    fireEvent.change(screen.getByLabelText('Author'), { target: { value: '  Vyasa  ' } });
    fireEvent.change(screen.getByLabelText('Reading intention'), { target: { value: '  Reflect on each chapter.  ' } });
    fireEvent.change(screen.getByLabelText('Target finish date'), { target: { value: '2026-12-15' } });
    fireEvent.click(screen.getByRole('button', { name: /Create Buddy Read/ }));

    await waitFor(() => {
      expect(mocks.calls).toContainEqual({
        table: 'buddy_reads',
        operation: 'insert',
        payload: {
          title: 'November Together',
          book_title: 'The Gita',
          book_author: 'Vyasa',
          description: 'Reflect on each chapter.',
          target_date: '2026-12-15',
          created_by: 'reader-1',
        },
      });
    });
    expect(mocks.toast).toHaveBeenCalledWith({
      title: 'Buddy Read created',
      description: "You're enrolled as the host. Invite friends from the share link soon.",
    });
    expect(screen.getByLabelText('Reading plan name *')).toHaveValue('');
    expect(screen.getByLabelText('Book title *')).toHaveValue('');
  });

  it('shows a toast and retains the form when plan creation fails', async () => {
    mocks.results.buddy_reads.insert = { data: null, error: { message: 'permission denied' } };
    renderPage();
    await screen.findByText('Your first Buddy Read starts here');

    fireEvent.change(screen.getByLabelText('Reading plan name *'), { target: { value: 'A shared plan' } });
    fireEvent.change(screen.getByLabelText('Book title *'), { target: { value: 'A book' } });
    fireEvent.click(screen.getByRole('button', { name: /Create Buddy Read/ }));

    await waitFor(() => {
      expect(mocks.toast).toHaveBeenCalledWith({
        title: "Buddy Read couldn't be created",
        description: 'permission denied',
        variant: 'destructive',
      });
    });
    expect(screen.getByLabelText('Reading plan name *')).toHaveValue('A shared plan');
  });

  it('renders a reading plan with participant progress and chapter milestones', async () => {
    seedRead();
    renderPage();

    expect(await screen.findByRole('heading', { name: 'November Together' })).toBeInTheDocument();
    expect(screen.getByText('The Gita')).toBeInTheDocument();
    expect(screen.getByText('by Vyasa')).toBeInTheDocument();
    expect(screen.getByText('25%')).toBeInTheDocument();
    expect(screen.getByText('Group progress · 2 readers')).toBeInTheDocument();
    expect(screen.getByText('You')).toBeInTheDocument();
    expect(screen.getByText('Reader')).toBeInTheDocument();
    expect(screen.getByText('Finish chapter one · page 20')).toBeInTheDocument();
  });

  it('saves the reader progress percentage and reports success', async () => {
    seedRead();
    renderPage();
    await screen.findByRole('heading', { name: 'November Together' });

    fireEvent.change(screen.getByRole('slider', { name: 'Reading progress percentage' }), { target: { value: '55' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save progress' }));

    await waitFor(() => {
      expect(mocks.calls).toContainEqual({
        table: 'buddy_read_members',
        operation: 'update',
        payload: { progress_percent: 55 },
      });
    });
    expect(mocks.toast).toHaveBeenCalledWith({ title: 'Progress updated' });
  });

  it('adds a trimmed milestone for a hosted Buddy Read', async () => {
    seedRead();
    renderPage();
    await screen.findByRole('heading', { name: 'November Together' });

    fireEvent.change(screen.getByPlaceholderText('Add checkpoint'), { target: { value: '  Finish chapter two  ' } });
    const addButton = screen.getByPlaceholderText('Add checkpoint').parentElement!.querySelector('button')!;
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(mocks.calls).toContainEqual({
        table: 'buddy_read_milestones',
        operation: 'insert',
        payload: { buddy_read_id: 'read-1', title: 'Finish chapter two', position: 1 },
      });
    });
    expect(mocks.toast).toHaveBeenCalledWith({ title: 'Milestone added' });
  });

  it('marks a milestone complete and removes the completion when toggled again', async () => {
    seedRead();
    renderPage();
    await screen.findByRole('heading', { name: 'November Together' });

    const checkbox = screen.getByRole('checkbox', { name: 'Complete Finish chapter one' });
    fireEvent.click(checkbox);
    await waitFor(() => {
      expect(mocks.calls).toContainEqual({
        table: 'buddy_read_milestone_completions',
        operation: 'insert',
        payload: { milestone_id: 'milestone-1', user_id: 'reader-1' },
      });
    });
    expect(screen.getByRole('checkbox', { name: 'Complete Finish chapter one' })).toBeChecked();

    mocks.calls = [];
    fireEvent.click(screen.getByRole('checkbox', { name: 'Complete Finish chapter one' }));
    await waitFor(() => {
      expect(mocks.calls).toContainEqual({
        table: 'buddy_read_milestone_completions',
        operation: 'delete',
      });
    });
    expect(screen.getByRole('checkbox', { name: 'Complete Finish chapter one' })).not.toBeChecked();
  });

  it('posts a discussion message with its spoiler page and clears the composer', async () => {
    seedRead();
    renderPage();
    await screen.findByRole('heading', { name: 'November Together' });

    fireEvent.change(screen.getByPlaceholderText('Share a thought with your reading buddies…'), { target: { value: '  The ending surprised me.  ' } });
    fireEvent.change(screen.getByPlaceholderText('Spoiler page'), { target: { value: '42' } });
    fireEvent.click(screen.getByRole('button', { name: 'Post' }));

    await waitFor(() => {
      expect(mocks.calls).toContainEqual({
        table: 'buddy_read_discussions',
        operation: 'insert',
        payload: {
          buddy_read_id: 'read-1',
          author_id: 'reader-1',
          body: 'The ending surprised me.',
          spoiler_page: 42,
        },
      });
    });
    expect(screen.getByPlaceholderText('Share a thought with your reading buddies…')).toHaveValue('');
    expect(screen.getByPlaceholderText('Spoiler page')).toHaveValue('');
  });

  it('shows a destructive toast when a discussion post fails', async () => {
    seedRead();
    mocks.results.buddy_read_discussions.insert = { data: null, error: { message: 'discussion unavailable' } };
    renderPage();
    await screen.findByRole('heading', { name: 'November Together' });

    fireEvent.change(screen.getByPlaceholderText('Share a thought with your reading buddies…'), { target: { value: 'A thought' } });
    fireEvent.click(screen.getByRole('button', { name: 'Post' }));

    await waitFor(() => {
      expect(mocks.toast).toHaveBeenCalledWith({
        title: 'Message not posted',
        description: 'discussion unavailable',
        variant: 'destructive',
      });
    });
    expect(screen.getByPlaceholderText('Share a thought with your reading buddies…')).toHaveValue('A thought');
  });

  it('keeps spoiler text hidden until revealed and allows it to be hidden again', async () => {
    seedRead({
      posts: [{
        id: 'post-1',
        buddy_read_id: 'read-1',
        author_id: 'reader-2',
        body: 'The final chapter changes everything.',
        spoiler_page: 42,
        created_at: '2026-11-10T10:00:00.000Z',
      }],
    });
    renderPage();
    await screen.findByRole('heading', { name: 'November Together' });

    expect(screen.queryByText('The final chapter changes everything.')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reveal spoiler' }));
    expect(screen.getByText('The final chapter changes everything.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Hide spoiler' }));
    expect(screen.queryByText('The final chapter changes everything.')).not.toBeInTheDocument();
  });

  it('creates and copies a private invite link for a Buddy Read', async () => {
    seedRead();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
    renderPage();
    await screen.findByRole('heading', { name: 'November Together' });

    fireEvent.click(screen.getByRole('button', { name: 'Invite a buddy' }));

    expect(await screen.findByText(/\/buddy-reads\?invite=invite-token/)).toBeInTheDocument();
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('/buddy-reads?invite=invite-token'));
    expect(mocks.toast).toHaveBeenCalledWith({
      title: 'Invite link copied',
      description: 'Share it with a friend. They must sign in to join.',
    });
  });
});
