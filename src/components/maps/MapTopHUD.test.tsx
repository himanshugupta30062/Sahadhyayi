import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi } from 'vitest';
import { MapTopHUD } from './MapTopHUD';

describe('MapTopHUD', () => {
  it('renders mode switch and dispatches mode selection', () => {
    const onModeChange = vi.fn();
    const onSearchChange = vi.fn();
    const onToggleSharing = vi.fn();
    const onOpenAvatarModal = vi.fn();

    render(
      <MapTopHUD
        mode="explore"
        onModeChange={onModeChange}
        searchQuery=""
        onSearchChange={onSearchChange}
        isSharing={false}
        onToggleSharing={onToggleSharing}
        onOpenAvatarModal={onOpenAvatarModal}
        readersCount={5}
        friendsCount={3}
        exploreCount={12}
      />
    );

    expect(screen.getByRole('button', { name: /Explore/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Readers/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Friends/ })).toBeInTheDocument();
    expect(screen.getByText('Ghost Mode')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Readers/ }));
    expect(onModeChange).toHaveBeenCalledWith('readers');

    fireEvent.click(screen.getByRole('button', { name: /Friends/ }));
    expect(onModeChange).toHaveBeenCalledWith('friends');
  });

  it('triggers search change and toggle sharing', () => {
    const onSearchChange = vi.fn();
    const onToggleSharing = vi.fn();

    render(
      <MapTopHUD
        mode="readers"
        onModeChange={vi.fn()}
        searchQuery="Kabir"
        onSearchChange={onSearchChange}
        isSharing={true}
        onToggleSharing={onToggleSharing}
        onOpenAvatarModal={vi.fn()}
      />
    );

    expect(screen.getByText('Sharing')).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText('Filter by book title or author...');
    expect(searchInput).toHaveValue('Kabir');

    fireEvent.change(searchInput, { target: { value: 'Premchand' } });
    expect(onSearchChange).toHaveBeenCalledWith('Premchand');

    const ghostBtn = screen.getByTitle('Sharing is active. Click to switch to Ghost Mode.');
    fireEvent.click(ghostBtn);
    expect(onToggleSharing).toHaveBeenCalled();
  });
});
