// @vitest-environment jsdom
import React from 'react';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import TableOfContents from './TableOfContents';

class MockIntersectionObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

describe('TableOfContents', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
  });

  afterEach(() => {
    cleanup();
  });

  it('renders nothing when there are fewer than two headings', () => {
    const { container } = render(<TableOfContents content="# Just One Heading\nParagraph text" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders navigation links for headings when two or more exist', () => {
    const content = `
# First Chapter
Introduction text.
## Subsection Alpha
Details here.
### Deep Insight
More details.
`;
    render(<TableOfContents content={content} />);

    expect(screen.getByText('On this page')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'First Chapter' })).toHaveAttribute('href', '#first-chapter');
    expect(screen.getByRole('link', { name: 'Subsection Alpha' })).toHaveAttribute('href', '#subsection-alpha');
    expect(screen.getByRole('link', { name: 'Deep Insight' })).toHaveAttribute('href', '#deep-insight');
  });

  it('scrolls into view when a heading link is clicked', () => {
    const targetElement = document.createElement('div');
    targetElement.id = 'target-heading';
    targetElement.scrollIntoView = vi.fn();
    document.body.appendChild(targetElement);

    const content = `
# Other Heading
## Target Heading
`;
    render(<TableOfContents content={content} />);

    const link = screen.getByRole('link', { name: 'Target Heading' });
    fireEvent.click(link);

    expect(targetElement.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
    document.body.removeChild(targetElement);
  });
});
