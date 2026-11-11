// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import SignInLink from './SignInLink';

const LocationProbe = () => {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}{location.search}</output>;
};

describe('SignInLink', () => {
  afterEach(() => {
    cleanup();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it('preserves current path, query and hash in sign-in redirect', () => {
    render(<MemoryRouter initialEntries={['/books/abc?tab=reviews#comments']}><SignInLink>Sign in</SignInLink></MemoryRouter>);
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute(
      'href', '/signin?redirect=%2Fbooks%2Fabc%3Ftab%3Dreviews%23comments',
    );
  });

  it('adds intent and book id to query and router state', () => {
    render(<MemoryRouter initialEntries={['/books/abc']}><SignInLink intent="review" bookId="abc">Review</SignInLink><LocationProbe /></MemoryRouter>);
    const link = screen.getByRole('link', { name: 'Review' });
    expect(link).toHaveAttribute('href', '/signin?redirect=%2Fbooks%2Fabc&intent=review&book_id=abc');
    fireEvent.click(link);
    expect(screen.getByTestId('location')).toHaveTextContent('/signin');
  });

  it('uses explicit redirectPath and forwards click callback', () => {
    const onClick = vi.fn();
    render(<MemoryRouter><SignInLink redirectPath="/dashboard?source=reader" onClick={onClick}>Continue</SignInLink></MemoryRouter>);
    const link = screen.getByRole('link', { name: 'Continue' });
    fireEvent.click(link);
    expect(link).toHaveAttribute('href', '/signin?redirect=%2Fdashboard%3Fsource%3Dreader');
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(sessionStorage.getItem('redirectScrollY')).toBe(String(window.scrollY));
  });
});
