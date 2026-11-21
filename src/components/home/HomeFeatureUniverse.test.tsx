// @vitest-environment jsdom

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';
import HomeFeatureUniverse from './HomeFeatureUniverse';

describe('HomeFeatureUniverse Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders section title, subtitle, and all 4 feature pillars', () => {
    render(
      <MemoryRouter>
        <HomeFeatureUniverse />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /A reading universe,/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Discover' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Connect' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Create' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Grow' })).toBeInTheDocument();
  });

  it('renders key navigation links for pillars', () => {
    render(
      <MemoryRouter>
        <HomeFeatureUniverse />
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: /Digital Library/i })).toHaveAttribute('href', '/library');
    expect(screen.getByRole('link', { name: /Friends Feed/i })).toHaveAttribute('href', '/social');
    expect(screen.getByRole('link', { name: /Short Stories/i })).toHaveAttribute('href', '/stories');
    expect(screen.getByRole('link', { name: /Reading Challenges/i })).toHaveAttribute('href', '/games');
  });

  it('updates mood message and recommendations link when a mood button is selected', () => {
    render(
      <MemoryRouter>
        <HomeFeatureUniverse />
      </MemoryRouter>
    );

    const moodBtn = screen.getByRole('button', { name: /Make me think/i });
    expect(moodBtn).toBeInTheDocument();
    fireEvent.click(moodBtn);

    expect(moodBtn).toHaveAttribute('aria-pressed', 'true');
    expect(
      screen.getByText(/Explore books and ideas that stay with you after the last page/i)
    ).toBeInTheDocument();

    const exploreLink = screen.getByRole('link', { name: /Explore "Make me think" recommendations/i });
    expect(exploreLink).toHaveAttribute('href', expect.stringContaining('mood=thought-provoking'));
  });

  it('renders One Book Many Journeys showcase with direct paths', () => {
    render(
      <MemoryRouter>
        <HomeFeatureUniverse />
      </MemoryRouter>
    );

    expect(screen.getByText('One book. Many journeys.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Meet readers/i })).toHaveAttribute('href', '/reader-map');
    expect(screen.getByRole('link', { name: /Share ideas/i })).toHaveAttribute('href', '/articles');
  });

  it('renders Explore the Whole Experience quick tiles and curiosity events/challenges', () => {
    render(
      <MemoryRouter>
        <HomeFeatureUniverse />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'Explore the whole experience' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'The Library' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Reader community' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Research & ideas' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Literary stories' })).toBeInTheDocument();

    const eventLinks = screen.getAllByRole('link', { name: /Events/i });
    expect(eventLinks.length).toBeGreaterThanOrEqual(1);
    expect(eventLinks[0]).toHaveAttribute('href', '/events');

    const challengeLinks = screen.getAllByRole('link', { name: /Challenges/i });
    expect(challengeLinks.length).toBeGreaterThanOrEqual(1);
    expect(challengeLinks[0]).toHaveAttribute('href', '/games');
  });
});
