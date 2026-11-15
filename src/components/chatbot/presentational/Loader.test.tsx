import { cleanup, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it } from 'vitest';
import { Loader } from '@/components/chatbot/presentational/Loader';

describe('Chatbot Loader', () => {
  afterEach(() => cleanup());

  it('renders default label', () => {
    render(<Loader />);
    expect(screen.getByText('Thinking…')).toBeInTheDocument();
  });

  it('renders custom label', () => {
    render(<Loader label="Searching catalog…" />);
    expect(screen.getByText('Searching catalog…')).toBeInTheDocument();
  });
});
