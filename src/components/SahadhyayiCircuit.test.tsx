// @vitest-environment jsdom
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import SahadhyayiCircuit from './SahadhyayiCircuit';

const auth = vi.hoisted(() => ({ user: null as null | { id: string } }));
const mobile = vi.hoisted(() => ({ value: false }));
vi.mock('@/hooks/use-mobile', () => ({ useIsMobile: () => mobile.value }));
vi.mock('@/contexts/authHelpers', () => ({ useAuth: () => ({ user: auth.user }) }));

const renderCircuit = () => render(<MemoryRouter><SahadhyayiCircuit /></MemoryRouter>);

describe('SahadhyayiCircuit', () => {
  it('renders desktop circuit with eight feature bubbles and guest CTA', () => {
    mobile.value = false; auth.user = null;
    renderCircuit();
    expect(screen.getByText('Want an intellectual friend from reading community?')).toBeTruthy();
    expect(screen.getByRole('link', { name: /Join the Reading Circle/i }).getAttribute('href')).toBe('/signup');
    expect(screen.getAllByRole('button')).toHaveLength(8);
    expect(screen.getByText('Sahadhyayi')).toBeTruthy();
    expect(document.querySelectorAll('svg line')).toHaveLength(8);
  });

  it('shows dashboard CTA for signed-in readers on desktop', () => {
    mobile.value = false; auth.user = { id: 'reader-1' };
    renderCircuit();
    expect(screen.getByRole('link', { name: /Open your Sahadhyayi dashboard/i }).getAttribute('href')).toBe('/dashboard');
  });

  it('renders mobile feature list and guest CTA', () => {
    mobile.value = true; auth.user = null;
    renderCircuit();
    expect(screen.getByRole('heading', { name: 'Sahadhyayi Features' })).toBeTruthy();
    expect(screen.getByRole('link', { name: /Join the Reading Circle/i }).getAttribute('href')).toBe('/signup');
    expect(screen.getByText("Who's reading the same book nearby?")).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('renders mobile dashboard CTA for authenticated readers', () => {
    mobile.value = true; auth.user = { id: 'reader-1' };
    renderCircuit();
    expect(screen.getByRole('link', { name: 'Open your dashboard' }).getAttribute('href')).toBe('/dashboard');
  });

  it('shows and clears tooltip on hover and focus interactions', () => {
    mobile.value = false; auth.user = null;
    renderCircuit();
    const bubble = screen.getByRole('button', { name: 'Find the desired ebook in library' });
    fireEvent.mouseEnter(bubble);
    expect(screen.getByRole('tooltip')).toBeTruthy();
    fireEvent.mouseLeave(bubble);
    expect(screen.queryByRole('tooltip')).toBeNull();
    fireEvent.focus(bubble);
    expect(screen.getByRole('tooltip')).toBeTruthy();
    fireEvent.blur(bubble);
    expect(screen.queryByRole('tooltip')).toBeNull();
    fireEvent.keyPress(bubble, { key: 'Enter' });
  });
});
