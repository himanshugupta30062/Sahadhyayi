import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LocationPermissionModal } from './LocationPermissionModal';

describe('LocationPermissionModal', () => {
  it('renders instructions and triggers onRequestLocation', () => {
    const onRequestLocation = vi.fn();
    const onClose = vi.fn();

    render(
      <LocationPermissionModal
        isOpen={true}
        onClose={onClose}
        onRequestLocation={onRequestLocation}
      />
    );

    expect(screen.getByText('Location Permission Required')).toBeInTheDocument();

    const allowBtn = screen.getByRole('button', { name: /allow location/i });
    fireEvent.click(allowBtn);
    expect(onRequestLocation).toHaveBeenCalled();
  });

  it('renders error state and instructions when hasError is true', () => {
    render(
      <LocationPermissionModal
        isOpen={true}
        onClose={vi.fn()}
        onRequestLocation={vi.fn()}
        hasError={true}
        errorMessage="User denied Geolocation permission"
      />
    );

    expect(screen.getByText('Location Setup Failed')).toBeInTheDocument();
    expect(screen.getByText(/User denied Geolocation permission/i)).toBeInTheDocument();
  });
});
