// @vitest-environment jsdom
import React from 'react';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import ReadNowButton from './ReadNowButton';
import * as readNowHook from '@/hooks/useReadNow';

describe('ReadNowButton', () => {
  const mockHandleReadNow = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders idle state and triggers read now action on click', () => {
    vi.spyOn(readNowHook, 'useReadNow').mockReturnValue({
      handleReadNow: mockHandleReadNow,
      isLoading: false,
    });

    render(
      <ReadNowButton bookId="book-42" bookTitle="1984" />
    );

    const button = screen.getByRole('button', { name: /Read Now/i });
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();

    fireEvent.click(button);
    expect(mockHandleReadNow).toHaveBeenCalledWith('book-42', '1984');
  });

  it('renders loading state when isLoading is true', () => {
    vi.spyOn(readNowHook, 'useReadNow').mockReturnValue({
      handleReadNow: mockHandleReadNow,
      isLoading: true,
    });

    render(
      <ReadNowButton bookId="book-42" bookTitle="1984" />
    );

    const button = screen.getByRole('button', { name: /Adding.../i });
    expect(button).toBeInTheDocument();
    expect(button).toBeDisabled();
  });
});

