// @vitest-environment jsdom

import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';

vi.mock('@/components/SEO', () => ({ default: () => null }));

import Blog from '@/pages/Blog';

describe('Blog journal page', () => {
  afterEach(() => cleanup());

  it('renders the editorial journal, featured story, and separate library/article destinations', () => {
    render(<MemoryRouter><Blog /></MemoryRouter>);
    expect(screen.getByRole('heading', { name: 'Stories for curious readers.' })).toBeInTheDocument();
    expect(screen.getByText('Sahadhyayi Journal · Official Editorial')).toBeInTheDocument();
    expect(screen.getByText(/published stories in the journal/)).toBeInTheDocument();
    expect(screen.getByText("Editor's pick")).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /25 Best Indian Books to Read/ })).toHaveAttribute('href', '/blog/best-indian-books-to-read');
    expect(screen.getByRole('link', { name: 'Explore library' })).toHaveAttribute('href', '/library');
    expect(screen.getByRole('link', { name: 'Community articles' })).toHaveAttribute('href', '/articles');
  });

  it('filters journal stories by category and updates the visible heading', () => {
    render(<MemoryRouter><Blog /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: 'Reading Tips' }));
    expect(screen.getByRole('heading', { name: 'Reading Tips' })).toBeInTheDocument();
    expect(screen.getByText('Digital vs Physical Books: Finding Your Perfect Reading Balance')).toBeInTheDocument();
    expect(screen.queryByText('How to Start a Book Club: A Practical Guide for Readers')).not.toBeInTheDocument();
  });

  it('searches titles, excerpts, authors and categories without showing a featured card', () => {
    render(<MemoryRouter><Blog /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText('Search journal stories'), { target: { value: 'Premchand' } });
    expect(screen.getByText('25 Best Indian Books to Read: Classics, Novels & Regional Literature')).toBeInTheDocument();
    expect(screen.queryByText("Editor's pick")).not.toBeInTheDocument();
    expect(screen.getByText('1 story')).toBeInTheDocument();
  });

  it('shows an empty state for unmatched searches and clears both filters', () => {
    render(<MemoryRouter><Blog /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: 'Reading Science' }));
    fireEvent.change(screen.getByLabelText('Search journal stories'), { target: { value: 'nothing matches this query' } });
    expect(screen.getByRole('heading', { name: 'No stories found' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(screen.getByRole('heading', { name: 'Latest stories' })).toBeInTheDocument();
    expect(screen.getByLabelText('Search journal stories')).toHaveValue('');
    expect(screen.getByText("Editor's pick")).toBeInTheDocument();
  });
});
