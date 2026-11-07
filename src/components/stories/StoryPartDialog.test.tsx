// @vitest-environment jsdom
import React from 'react';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { StoryPartDialog } from './StoryPartDialog';

const mockCreatePart = vi.fn().mockResolvedValue({ id: 'part-2', part_number: 2 });
const mockUpdatePart = vi.fn().mockResolvedValue({ id: 'part-1', part_number: 1 });

vi.mock('@/hooks/useStories', () => ({
  useCreateStoryPart: () => ({
    mutateAsync: mockCreatePart,
    isPending: false,
  }),
  useUpdateStoryPart: () => ({
    mutateAsync: mockUpdatePart,
    isPending: false,
  }),
}));

describe('StoryPartDialog Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders part number, title, and prose inputs for adding a chapter', () => {
    render(
      <StoryPartDialog
        open={true}
        onOpenChange={vi.fn()}
        storyId="story-123"
        storyTitle="The Golden River"
        suggestedPartNumber={2}
      />
    );

    expect(screen.getByText(/Add Chapter 2/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Chapter Title/i)).toHaveValue('Part 2');
    expect(screen.getByLabelText(/Chapter Prose/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Publish Chapter/i })).toBeInTheDocument();
  });

  it('validates paragraph length and shows warning when paragraph exceeds 500 characters', () => {
    render(
      <StoryPartDialog
        open={true}
        onOpenChange={vi.fn()}
        storyId="story-123"
        storyTitle="The Golden River"
        suggestedPartNumber={2}
      />
    );

    const proseInput = screen.getByPlaceholderText(/Write your chapter here/i);
    const oversizedParagraph = 'A'.repeat(550);
    fireEvent.change(proseInput, { target: { value: oversizedParagraph } });

    expect(screen.getByText(/Paragraph 1 is too long/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Publish Chapter/i })).toBeDisabled();
  });

  it('allows saving chapter as draft or publishing when valid', async () => {
    render(
      <StoryPartDialog
        open={true}
        onOpenChange={vi.fn()}
        storyId="story-123"
        storyTitle="The Golden River"
        suggestedPartNumber={2}
      />
    );

    const titleInput = screen.getByPlaceholderText(/Chapter 2/i);
    fireEvent.change(titleInput, { target: { value: 'Chapter 2: Mountain Path' } });

    const proseInput = screen.getByPlaceholderText(/Write your chapter here/i);
    fireEvent.change(proseInput, { target: { value: 'The morning light crept over the ridge.\n\nTwo travelers tightened their boots and began the ascent.' } });

    const publishBtn = screen.getByRole('button', { name: /Publish Chapter/i });
    expect(publishBtn).not.toBeDisabled();

    fireEvent.click(publishBtn);
    expect(mockCreatePart).toHaveBeenCalledWith({
      storyId: 'story-123',
      partNumber: 2,
      title: 'Chapter 2: Mountain Path',
      content: 'The morning light crept over the ridge.\n\nTwo travelers tightened their boots and began the ascent.',
      status: 'published',
    });
  });
});
