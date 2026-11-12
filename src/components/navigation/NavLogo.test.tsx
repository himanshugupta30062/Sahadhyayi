import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NavLogo from './NavLogo';

describe('NavLogo', () => {
  it('renders the accessible home link and brand text', () => {
    render(
      <MemoryRouter>
        <NavLogo />
      </MemoryRouter>,
    );

    const homeLink = screen.getByRole('link', { name: 'Sahadhyayi home' });
    expect(homeLink).toHaveAttribute('href', '/');
    expect(screen.getByText('Sahadhyayi')).toBeInTheDocument();
  });

  it('uses a decorative logo image hidden from assistive technology', () => {
    render(
      <MemoryRouter>
        <NavLogo />
      </MemoryRouter>,
    );

    const logo = screen.getByRole('link', { name: 'Sahadhyayi home' }).querySelector('img');
    expect(logo).toHaveAttribute('src', '/brand/sahadhyayi-connected-readers.svg');
    expect(logo).toHaveAttribute('alt', '');
    expect(logo).toHaveAttribute('aria-hidden', 'true');
  });
});
