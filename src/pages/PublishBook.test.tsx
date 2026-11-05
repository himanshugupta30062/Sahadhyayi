// @vitest-environment jsdom
import React from 'react';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PublishBook from './PublishBook';
import * as publishHook from '@/hooks/usePublishBook';
import { useAuth } from '@/contexts/authHelpers';

vi.mock('@/components/SEO', () => ({
  default: () => null,
}));

vi.mock('@/components/Breadcrumb', () => ({
  default: () => <nav data-testid="breadcrumb" />,
}));

vi.mock('@/contexts/authHelpers', () => ({
  useAuth: vi.fn(),
}));

describe('PublishBook', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.mocked(useAuth).mockReturnValue({ user: { id: 'user-1' } } as any);
    vi.spyOn(publishHook, 'usePublishBook').mockReturnValue({
      createBook: { mutateAsync: vi.fn() },
      createQuarantineSubmission: { mutateAsync: vi.fn() },
      deleteBook: { mutate: vi.fn() },
    } as any);
  });

  afterEach(() => {
    cleanup();
  });

  it('renders Step 1 form and requires Title and Author Name to proceed', () => {
    render(
      <MemoryRouter>
        <PublishBook />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /Book Details/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Title \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Author Name \*/i)).toBeInTheDocument();

    const nextBtn = screen.getByRole('button', { name: /^Next/i });
    expect(nextBtn).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/Title \*/i), { target: { value: 'My Masterpiece' } });
    fireEvent.change(screen.getByLabelText(/Author Name \*/i), { target: { value: 'Jane Author' } });

    expect(nextBtn).not.toBeDisabled();
    fireEvent.click(nextBtn);

    expect(screen.getByRole('heading', { name: /Upload Files/i })).toBeInTheDocument();
  });

  it('navigates back from Step 2 to Step 1', () => {
    render(
      <MemoryRouter>
        <PublishBook />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Title \*/i), { target: { value: 'My Masterpiece' } });
    fireEvent.change(screen.getByLabelText(/Author Name \*/i), { target: { value: 'Jane Author' } });

    const nextBtn = screen.getByRole('button', { name: /^Next/i });
    fireEvent.click(nextBtn);

    const backBtn = screen.getByRole('button', { name: /Back/i });
    fireEvent.click(backBtn);

    expect(screen.getByRole('heading', { name: /Book Details/i })).toBeInTheDocument();
    expect(screen.getByDisplayValue('My Masterpiece')).toBeInTheDocument();
  });
});
