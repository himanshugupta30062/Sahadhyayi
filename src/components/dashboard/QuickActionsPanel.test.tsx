// @vitest-environment jsdom

import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter, useLocation } from 'react-router-dom';
import QuickActionsPanel from './QuickActionsPanel';

const LocationDisplay = () => {
  const location = useLocation();
  return <output aria-label="current route">{location.pathname}</output>;
};

const renderPanel = () => render(
  <MemoryRouter initialEntries={['/dashboard']}>
    <QuickActionsPanel />
    <LocationDisplay />
  </MemoryRouter>,
);

describe('QuickActionsPanel', () => {
  afterEach(() => cleanup());

  it('renders the five reader shortcuts', () => {
    renderPanel();

    expect(screen.getByRole('heading', { name: 'Quick Actions' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add Book/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Write Review/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Join Group/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /My Bookmarks/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reading Stats/ })).toBeInTheDocument();
  });

  it.each([
    ['Add Book', '/library'],
    ['Write Review', '/social'],
    ['Join Group', '/groups'],
    ['My Bookmarks', '/bookshelf'],
    ['Reading Stats', '/dashboard'],
  ])('navigates to the correct destination for %s', (action, destination) => {
    renderPanel();

    fireEvent.click(screen.getByRole('button', { name: new RegExp(action) }));

    expect(screen.getByLabelText('current route')).toHaveTextContent(destination);
  });
});
