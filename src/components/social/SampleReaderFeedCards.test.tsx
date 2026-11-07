// @vitest-environment jsdom

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';
import { SampleReaderFeedCards } from './SampleReaderFeedCards';
import { SAMPLE_EVERYDAY_POSTS } from '@/data/sampleSocialPosts';

describe('SampleReaderFeedCards', () => {
  it('renders everyday reader posts and handles like toggle', () => {
    render(
      <MemoryRouter>
        <SampleReaderFeedCards posts={SAMPLE_EVERYDAY_POSTS} isGuest={true} />
      </MemoryRouter>
    );

    expect(screen.getByText('Priya Sharma')).toBeInTheDocument();
    expect(screen.getByText('Aarav Mehta')).toBeInTheDocument();
    expect(screen.getByText('Kabir D.')).toBeInTheDocument();
    expect(screen.getByText('Sneha Rao')).toBeInTheDocument();

    const likeButton = screen.getByRole('button', { name: /like post, currently 142 likes/i });
    expect(likeButton).toBeInTheDocument();

    fireEvent.click(likeButton);
    expect(screen.getByRole('button', { name: /like post, currently 143 likes/i })).toBeInTheDocument();
  });
});

