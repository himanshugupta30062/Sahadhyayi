import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MapBottomSheetPreview } from './MapBottomSheetPreview';

vi.mock('@/hooks/useExploreSpots', () => ({
  useSavedMapPlaces: () => ({
    isSaved: (id: string) => id === 'saved-spot-1',
    savePlace: vi.fn(),
    removePlace: vi.fn(),
    isSaving: false,
  }),
}));

describe('MapBottomSheetPreview', () => {
  const queryClient = new QueryClient();

  it('renders reader profile preview with Say Hello action', () => {
    const onClose = vi.fn();
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <MapBottomSheetPreview
            marker={{
              type: 'user',
              id: 'u-1',
              userId: 'u-1',
              title: 'Rohan Verma',
              readingActivity: 'Atomic Habits',
              lat: 28.5,
              lng: 77.2,
              distanceKm: 3.2,
            }}
            onClose={onClose}
          />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText('Rohan Verma')).toBeInTheDocument();
    expect(screen.getByText(/Reader/i)).toBeInTheDocument();
    expect(screen.getByText('3.2 km away')).toBeInTheDocument();
    expect(screen.getByText(/Atomic Habits/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Say Hello/ })).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Close preview'));
    expect(onClose).toHaveBeenCalled();
  });

  it('renders reading spot preview with directions and save button', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <MapBottomSheetPreview
            marker={{
              type: 'spot',
              id: 'spot-1',
              title: 'National Library of India',
              category: 'Library',
              address: 'Belvedere Estate, Alipore',
              city: 'Kolkata',
              lat: 22.53,
              lng: 88.33,
              distanceKm: 1.5,
              description: 'Largest library in India.',
            }}
            onClose={vi.fn()}
          />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText('National Library of India')).toBeInTheDocument();
    expect(screen.getAllByText(/Library/i).length).toBeGreaterThan(0);
    expect(screen.getByText('Save Place')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Directions/ })).toBeInTheDocument();
  });

  it('renders literary event preview with registration button', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <MapBottomSheetPreview
            marker={{
              type: 'event',
              id: 'ev-1',
              title: 'Jaipur Literature Festival',
              category: 'Literary Event',
              address: 'Hotel Clarks Amer, JLN Marg',
              city: 'Jaipur',
              lat: 26.88,
              lng: 75.80,
              startAt: '2027-01-28T04:30:00Z',
              priceType: 'registration-required',
              registrationUrl: 'https://jaipurliteraturefestival.org',
            }}
            onClose={vi.fn()}
          />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText('Jaipur Literature Festival')).toBeInTheDocument();
    expect(screen.getByText(/Literary Event/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Register \/ Details/ })).toBeInTheDocument();
  });
});
