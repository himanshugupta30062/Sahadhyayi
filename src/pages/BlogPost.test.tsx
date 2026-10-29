// @vitest-environment jsdom

import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import BlogPost from './BlogPost';

const renderPost = (slug: string) => render(
  <MemoryRouter initialEntries={[`/blog/${slug}`]}>
    <Routes>
      <Route path="/blog/:slug" element={<BlogPost />} />
    </Routes>
  </MemoryRouter>,
);

const posts = [
  ['what-is-sahadhyayi-meaning-story', 'What is Sahadhyayi? Meaning & Story Behind Our Name'],
  ['how-sahadhyayi-revives-reading-culture', 'How Sahadhyayi Revives the Reading Culture'],
  ['why-book-lovers-should-join-sahadhyayi', '5 Reasons Why Book Lovers Should Join Sahadhyayi'],
  ['build-a-reading-habit-that-lasts', 'How to Build a Reading Habit That Actually Lasts'],
  ['how-to-start-a-book-club', 'How to Start a Book Club: A Practical Guide for Readers'],
  ['how-to-read-classic-literature', 'A Beginner’s Guide to Reading Classic Literature'],
  ['best-indian-short-story-collections', 'Indian Short Story Collections to Start Reading Today'],
  ['books-for-when-life-feels-stuck', 'Books to Read When You Feel Stuck in Life'],
  ['exploring-indian-literature-in-translation', 'How to Explore Indian Literature Beyond English'],
  ['choose-your-next-book-by-mood', 'How to Choose Your Next Book by Mood'],
  ['how-to-read-without-distractions', 'How to Read Without Getting Distracted'],
  ['30-day-reading-challenge', 'A Gentle 30-Day Reading Challenge for Any Reader'],
  ['osho-books-and-themes-in-his-discourses', 'The Books Osho Read: Ashtavakra Gita, Vedas, Puranas, and the Worlds Explored in His Discourses'],
  ['best-indian-books-to-read', '25 Best Indian Books to Read: Classics, Novels & Regional Literature'],
] as const;

describe('BlogPost', () => {
  afterEach(() => cleanup());

  it.each(posts)('renders the article for slug %s', (slug, title) => {
    renderPost(slug);

    expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: title })).toBeInTheDocument();
    expect(screen.getByText(/^(Himanshu Gupta|Sahadhyayi Editorial)$/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to Blog' })).toHaveAttribute('href', '/blog');
    expect(screen.getByRole('link', { name: 'Join Sahadhyayi Today' })).toHaveAttribute('href', '/signup');
    expect(screen.getByRole('link', { name: 'Explore Our Library' })).toHaveAttribute('href', '/library');
  });

  it('builds working table-of-contents anchors from article headings', () => {
    renderPost('what-is-sahadhyayi-meaning-story');

    const navigation = screen.getByRole('navigation', { name: 'Article contents' });
    const links = within(navigation).getAllByRole('link');
    expect(links.length).toBeGreaterThanOrEqual(3);

    for (const link of links) {
      const href = link.getAttribute('href');
      expect(href).toMatch(/^#[a-z0-9-]+$/);
      expect(document.getElementById(href!.slice(1))).not.toBeNull();
    }
  });

  it('shows a not-found state for unknown slugs', () => {
    renderPost('this-article-does-not-exist');

    expect(screen.getByRole('heading', { name: 'Blog post not found' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to Blog' })).toHaveAttribute('href', '/blog');
    expect(screen.queryByText('Himanshu Gupta')).not.toBeInTheDocument();
  });
});
