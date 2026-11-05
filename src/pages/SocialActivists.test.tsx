/** @vitest-environment jsdom */
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import SocialActivists from './SocialActivists';

vi.mock('@/components/people/PeopleCollectionPage', () => ({
  PeopleCollectionPage: ({ collectionKey }: { collectionKey: string }) => (
    <div data-testid="people-collection-page" data-key={collectionKey} />
  ),
}));

describe('SocialActivists', () => {
  it('renders PeopleCollectionPage with social-activists collectionKey', () => {
    render(<SocialActivists />);

    const el = screen.getByTestId('people-collection-page');
    expect(el).toBeInTheDocument();
    expect(el).toHaveAttribute('data-key', 'social-activists');
  });
});

