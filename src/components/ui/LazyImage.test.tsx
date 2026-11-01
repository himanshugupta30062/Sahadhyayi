import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LazyImage } from '@/components/ui/LazyImage';

describe('LazyImage', () => {
  afterEach(() => cleanup());

  it('renders the requested image with responsive sources and safe defaults', () => {
    const { container } = render(
      <LazyImage
        src="/cover.jpg"
        avif="/cover.avif"
        webp="/cover.webp"
        alt="Book cover"
        data-testid="book-cover"
      />,
    );
    expect(screen.getByTestId('book-cover')).toHaveAttribute('src', '/cover.jpg');
    expect(screen.getByTestId('book-cover')).toHaveAttribute('loading', 'lazy');
    expect(screen.getByTestId('book-cover')).toHaveAttribute('decoding', 'async');
    expect(screen.getByTestId('book-cover')).toHaveAttribute('referrerpolicy', 'no-referrer');
    expect(container.querySelector('source[type="image/avif"]')).toHaveAttribute('srcset', '/cover.avif');
    expect(container.querySelector('source[type="image/webp"]')).toHaveAttribute('srcset', '/cover.webp');
  });

  it('switches to a supplied fallback after the original image fails', () => {
    const onError = vi.fn();
    render(<LazyImage src="/missing.jpg" fallbackSrc="/fallback.jpg" alt="Book cover" onError={onError} />);
    const image = screen.getByAltText('Book cover');
    fireEvent.error(image);
    expect(onError).toHaveBeenCalledTimes(1);
    expect(image).toHaveAttribute('src', '/fallback.jpg');
  });

  it('uses the inline placeholder when the custom fallback also fails', () => {
    render(<LazyImage src="/missing.jpg" fallbackSrc="/fallback.jpg" alt="Book cover" />);
    const image = screen.getByAltText('Book cover');
    fireEvent.error(image);
    fireEvent.error(image);
    expect(image.getAttribute('src')).toContain('data:image/svg+xml');
  });

  it('uses the inline placeholder directly when no custom fallback is supplied', () => {
    render(<LazyImage src="/missing.jpg" alt="Book cover" />);
    const image = screen.getByAltText('Book cover');
    fireEvent.error(image);
    expect(image.getAttribute('src')).toContain('data:image/svg+xml');
  });
});
