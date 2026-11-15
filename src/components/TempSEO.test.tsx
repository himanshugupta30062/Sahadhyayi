import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import TempSEO from '@/components/TempSEO';

describe('TempSEO', () => {
  afterEach(() => cleanup());

  it('updates document.title and appends Sahadhyayi if not present', () => {
    render(<TempSEO title="Book Discovery" description="Discover great books" />);
    expect(document.title).toBe('Book Discovery | Sahadhyayi');
  });

  it('does not duplicate Sahadhyayi in document.title if already present', () => {
    render(<TempSEO title="Sahadhyayi Books" description="Catalog" />);
    expect(document.title).toBe('Sahadhyayi Books');
  });

  it('renders null without DOM elements', () => {
    const { container } = render(
      <TempSEO title="Home" description="Home page" />
    );
    expect(container).toBeEmptyDOMElement();
  });
});
