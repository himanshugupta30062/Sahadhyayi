import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CopyArticleButton from './CopyArticleButton';

const mockToastSuccess = vi.fn();
vi.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => mockToastSuccess(...args),
    error: vi.fn(),
  },
}));

describe('CopyArticleButton', () => {
  it('copies article title and content to clipboard and shows success feedback', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: { writeText: writeTextMock },
    });

    render(
      <CopyArticleButton
        title="Sample Title"
        subtitle="Sample Subtitle"
        content="This is the article content."
        variant="full"
      />
    );

    const button = screen.getByRole('button', { name: /copy/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalledWith(
        'Sample Title\n\nSample Subtitle\n\nThis is the article content.'
      );
      expect(mockToastSuccess).toHaveBeenCalledWith('Article copied to clipboard');
    });
  });
});
