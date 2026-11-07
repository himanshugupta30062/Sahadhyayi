// @vitest-environment jsdom
import React from 'react';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { StoryEditorDialog } from './StoryEditorDialog';

const mockCreateStory = vi.fn().mockResolvedValue({ id: 'new-story-1' });
const mockCreatePart = vi.fn().mockResolvedValue({ id: 'new-part-2' });
const mockUpdateStory = vi.fn().mockResolvedValue({});
const mockUpdatePart = vi.fn().mockResolvedValue({});

vi.mock('@/hooks/useStories', () => ({
  useCreateStory: () => ({
    mutateAsync: mockCreateStory,
    isPending: false,
  }),
  useCreateStoryPart: () => ({
    mutateAsync: mockCreatePart,
    isPending: false,
  }),
  useUpdateStory: () => ({
    mutateAsync: mockUpdateStory,
    isPending: false,
  }),
  useUpdateStoryPart: () => ({
    mutateAsync: mockUpdatePart,
    isPending: false,
  }),
}));

describe('StoryEditorDialog Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders story overview, format selector, and character counters', () => {
    render(
      <StoryEditorDialog open={true} onOpenChange={vi.fn()} />
    );

    expect(screen.getByText(/Write a Short Story/i)).toBeInTheDocument();
    expect(screen.getByText(/Standalone Story/i)).toBeInTheDocument();
    expect(screen.getByText(/Series \/ Multi-Part/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Story Title/i)).toBeInTheDocument();
    expect(screen.getByText(/0 \/ 100 characters/i)).toBeInTheDocument();
  });

  it('allows switching to Series format and adding multiple chapters', () => {
    render(
      <StoryEditorDialog open={true} onOpenChange={vi.fn()} />
    );

    // Switch to series
    fireEvent.click(screen.getAllByText(/Series \/ Multi-Part/i)[0]);

    // Fill title
    fireEvent.change(screen.getByPlaceholderText(/e\.g\. The Monsoon Letter/i), {
      target: { value: 'Tales of the Old Silk Route' },
    });

    // Proceed to Content
    fireEvent.click(screen.getByRole('button', { name: /Proceed to Content/i }));

    // Verify series chapter manager is visible
    expect(screen.getByText(/Series Chapters/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add Chapter/i })).toBeInTheDocument();

    // Click Add Chapter
    fireEvent.click(screen.getByRole('button', { name: /Add Chapter/i }));
    expect(screen.getAllByText(/Part 2/i).length).toBeGreaterThan(0);
  });
});
