import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ReadersNearMeMap } from './ReadersNearMeMap';

const mocks = vi.hoisted(() => ({
  user: { id: 'user-1', email: 'reader@example.com', user_metadata: { full_name: 'Current Reader' } } as null | {
    id: string;
    email: string;
    user_metadata: { full_name: string };
  },
  profile: null as null | { location_sharing?: boolean; location_lat?: number; location_lng?: number },
  rpc: vi.fn(),
  from: vi.fn(),
  getCurrentLocation: vi.fn(),
}));

vi.mock('@/contexts/authHelpers', () => ({
  useAuth: () => ({ user: mocks.user }),
}));

vi.mock('@/integrations/supabase/client-universal', () => {
  const makeQuery = () => {
    const query: Record<string, unknown> = {};
    query.select = vi.fn(() => query);
    query.update = vi.fn(() => query);
    query.insert = vi.fn(() => query);
    query.eq = vi.fn(() => query);
    query.maybeSingle = vi.fn(async () => ({ data: mocks.profile, error: null }));
    query.then = (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) =>
      Promise.resolve({ data: null, error: null }).then(resolve, reject);
    return query;
  };
  mocks.from.mockImplementation(() => makeQuery());
  return { supabase: { from: mocks.from, rpc: mocks.rpc } };
});

vi.mock('@/lib/locationService', () => ({
  getCurrentLocation: mocks.getCurrentLocation,
}));

vi.mock('@/components/social/BookFilterDropdown', () => ({
  BookFilterDropdown: ({ onBookSelect }: { onBookSelect: (book: { id: string; title: string }) => void }) => (
    <button type="button" onClick={() => onBookSelect({ id: 'book-1', title: 'The Test Book' })}>
      Choose test book
    </button>
  ),
}));

vi.mock('@/components/social/LocationConsentModal', () => ({
  LocationConsentModal: ({ isOpen, onConsentGiven }: { isOpen: boolean; onConsentGiven: () => void }) =>
    isOpen ? <button type="button" onClick={onConsentGiven}>Confirm consent</button> : null,
}));

vi.mock('@/components/social/LocationPermissionModal', () => ({
  LocationPermissionModal: () => null,
}));

vi.mock('@/components/social/ChatWindow', () => ({
  ChatWindow: ({ friendId }: { friendId: string }) => <div data-testid="chat-window">Chat with {friendId}</div>,
}));

vi.mock('@/components/maps/MapplsMap', () => ({
  MapplsMap: ({ points }: { points: Array<{ id: string; title: string }> }) => (
    <div data-testid="map-points">{points.map((point) => point.title).join(', ')}</div>
  ),
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

describe('ReadersNearMeMap', () => {
  beforeEach(() => {
    mocks.user = { id: 'user-1', email: 'reader@example.com', user_metadata: { full_name: 'Current Reader' } };
    mocks.profile = null;
    mocks.rpc.mockReset();
    mocks.from.mockClear();
    mocks.getCurrentLocation.mockReset();
    mocks.getCurrentLocation.mockResolvedValue({ lat: 28.4595, lng: 77.0266 });
    mocks.rpc.mockImplementation((name: string) => {
      if (name === 'has_location_consent') return Promise.resolve({ data: false, error: null });
      if (name === 'get_nearby_book_readers') return Promise.resolve({ data: [], error: null });
      return Promise.resolve({ data: null, error: null });
    });
  });

  it('does not request GPS or nearby readers just because the map is opened', async () => {
    mocks.user = null;
    render(<ReadersNearMeMap />);

    expect(await screen.findByText('Location sharing is off')).toBeInTheDocument();
    expect(mocks.getCurrentLocation).not.toHaveBeenCalled();
    expect(mocks.rpc).not.toHaveBeenCalledWith('get_nearby_book_readers', expect.anything());
    expect(screen.getByText(/Your location is not requested or saved unless you choose/)).toBeInTheDocument();
  });

  it('requests GPS only after the user enables sharing and confirms consent', async () => {
    render(<ReadersNearMeMap />);

    await screen.findByText('Location sharing is off');
    fireEvent.click(screen.getByRole('button', { name: 'Enable location sharing' }));
    expect(screen.getByRole('button', { name: 'Confirm consent' })).toBeInTheDocument();
    expect(mocks.getCurrentLocation).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Confirm consent' }));

    await waitFor(() => expect(mocks.getCurrentLocation).toHaveBeenCalledTimes(1));
    expect(await screen.findByText('Location sharing is on')).toBeInTheDocument();
    expect(screen.getByTestId('map-points')).toHaveTextContent('Your saved location');
    expect(mocks.from).toHaveBeenCalledWith('profiles');
  });

  it('shows distance-only nearby matches and opens chat only for friends', async () => {
    mocks.profile = { location_sharing: true, location_lat: 28.4595, location_lng: 77.0266 };
    mocks.rpc.mockImplementation((name: string) => {
      if (name === 'has_location_consent') return Promise.resolve({ data: true, error: null });
      if (name === 'get_nearby_book_readers') {
        return Promise.resolve({
          data: [
            { reader_id: 'friend-1', reader_name: 'Jane Reader', distance_km: 12.4, is_friend: true },
            { reader_id: 'stranger-1', reader_name: 'New Reader', distance_km: 4.2, is_friend: false },
            { reader_id: 'invalid-1', reader_name: 'Invalid Distance', distance_km: -2, is_friend: true },
          ],
          error: null,
        });
      }
      return Promise.resolve({ data: null, error: null });
    });

    render(<ReadersNearMeMap />);
    await screen.findByText('Location sharing is on');
    fireEvent.click(screen.getByRole('button', { name: 'Choose test book' }));

    expect(await screen.findByText('Jane Reader')).toBeInTheDocument();
    expect(screen.getByText('12.4 km away · The Test Book')).toBeInTheDocument();
    expect(screen.getByText('New Reader')).toBeInTheDocument();
    expect(screen.queryByText('Invalid Distance')).not.toBeInTheDocument();
    expect(mocks.rpc).toHaveBeenCalledWith('get_nearby_book_readers', {
      book_uuid: 'book-1',
      radius_km: 50,
    });

    expect(screen.getByTestId('map-points')).toHaveTextContent('Your saved location');
    expect(screen.getByTestId('map-points')).not.toHaveTextContent('Jane Reader');
    expect(screen.getByTestId('map-points')).not.toHaveTextContent('New Reader');

    fireEvent.click(screen.getAllByRole('button', { name: 'Chat' })[0]);
    expect(screen.getByTestId('chat-window')).toHaveTextContent('Chat with friend-1');
    expect(screen.getAllByRole('button', { name: 'Chat' })[1]).toBeDisabled();
  });

  it('clears nearby results when sharing is disabled', async () => {
    mocks.profile = { location_sharing: true, location_lat: 28.4595, location_lng: 77.0266 };
    mocks.rpc.mockImplementation((name: string) => {
      if (name === 'has_location_consent') return Promise.resolve({ data: true, error: null });
      if (name === 'get_nearby_book_readers') {
        return Promise.resolve({
          data: [{ reader_id: 'friend-1', reader_name: 'Jane Reader', distance_km: 2, is_friend: true }],
          error: null,
        });
      }
      return Promise.resolve({ data: null, error: null });
    });

    render(<ReadersNearMeMap />);
    await screen.findByText('Location sharing is on');
    fireEvent.click(screen.getByRole('button', { name: 'Choose test book' }));
    expect(await screen.findByText('Jane Reader')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Stop sharing' }));
    await waitFor(() => expect(screen.getByText('Location sharing is off')).toBeInTheDocument());
    expect(screen.queryByText('Jane Reader')).not.toBeInTheDocument();
    expect(screen.getByTestId('map-points')).toBeEmptyDOMElement();
  });
});
