import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import Breadcrumb from './Breadcrumb';

describe('Breadcrumb', () => {
  it('renders home link and navigable breadcrumb ancestors', () => {
    render(<MemoryRouter><Breadcrumb items={[{ name: 'Library', path: '/library' }, { name: 'Books', path: '/books' }]} /></MemoryRouter>);
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Library' })).toHaveAttribute('href', '/library');
    expect(screen.getByRole('link', { name: 'Books' })).toHaveAttribute('href', '/books');
  });

  it('marks the current item as the page and supports custom classes', () => {
    render(<MemoryRouter><Breadcrumb className="custom-crumb" items={[{ name: 'Library', path: '/library' }, { name: 'Current book', path: '/book/1', current: true }]} /></MemoryRouter>);
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toHaveClass('custom-crumb');
    expect(screen.getByText('Current book')).toHaveAttribute('aria-current', 'page');
    expect(screen.queryByRole('link', { name: 'Current book' })).not.toBeInTheDocument();
  });

  it('renders an empty trail without errors', () => {
    render(<MemoryRouter><Breadcrumb items={[]} /></MemoryRouter>);
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument();
  });
});
