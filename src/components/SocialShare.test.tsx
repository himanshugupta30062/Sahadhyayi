import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SocialShare from './SocialShare';

describe('SocialShare', () => {
  it('opens twitter and facebook share dialogs with encoded params', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    render(<SocialShare text="Reading an awesome book!" url="https://sahadhyayi.com/book/123" />);

    const twitterBtn = screen.getByRole('button', { name: /share on twitter/i });
    const facebookBtn = screen.getByRole('button', { name: /share on facebook/i });

    fireEvent.click(twitterBtn);
    expect(openSpy).toHaveBeenCalledWith(
      expect.stringContaining('twitter.com/intent/tweet?url=https%3A%2F%2Fsahadhyayi.com%2Fbook%2F123'),
      '_blank',
      'noopener,noreferrer'
    );

    fireEvent.click(facebookBtn);
    expect(openSpy).toHaveBeenCalledWith(
      expect.stringContaining('facebook.com/sharer/sharer.php?u=https%3A%2F%2Fsahadhyayi.com%2Fbook%2F123'),
      '_blank',
      'noopener,noreferrer'
    );

    openSpy.mockRestore();
  });
});
