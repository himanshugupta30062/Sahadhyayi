import { cleanup, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MapplsMap } from '@/components/maps/MapplsMap';
import { createFriendInfoContent } from '@/components/social/FriendsLocationMap';

vi.mock('@/components/ui/card', () => ({ Card: ({ children }: any) => <div>{children}</div>, CardContent: ({ children }: any) => <div>{children}</div>, CardHeader: ({ children }: any) => <div>{children}</div>, CardTitle: ({ children }: any) => <h2>{children}</h2> }));
vi.mock('@/components/ui/button', () => ({ Button: ({ children, ...props }: any) => <button {...props}>{children}</button> }));
vi.mock('@/hooks/useFriends', () => ({ useFriends: () => ({ friends: [], loading: false, refresh: vi.fn() }) }));
vi.mock('@/contexts/authHelpers', () => ({ useAuth: () => ({ user: null }) }));
vi.mock('@/lib/locationService', () => ({ getCurrentLocation: vi.fn() }));
vi.mock('@/components/social/LocationConsentModal', () => ({ LocationConsentModal: () => null }));
vi.mock('@/components/social/LocationPermissionModal', () => ({ LocationPermissionModal: () => null }));

describe('MapplsMap', () => {
  afterEach(() => {
    cleanup();
    delete window.mappls;
    delete window.mapplsLoadingPromise;
  });

  it('explains missing configuration without attempting to load the SDK', () => {
    render(<MapplsMap apiKey=" " points={[]} />);
    expect(screen.getByText('Mappls is not configured yet')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open Mappls developer console' })).toHaveAttribute('href', 'https://auth.mappls.com/console');
  });

  it('initializes the map, places valid markers and fits multiple points', async () => {
    const setCenter = vi.fn();
    const setZoom = vi.fn();
    const fitBounds = vi.fn();
    const extend = vi.fn();
    const remove = vi.fn();
    const Map = vi.fn().mockImplementation(() => ({ setCenter, setZoom, fitBounds, remove }));
    const Marker = vi.fn().mockImplementation(() => ({ remove }));
    const LatLngBounds = vi.fn().mockImplementation(() => ({ extend }));
    window.mappls = { Map, Marker, LatLngBounds };

    render(<MapplsMap apiKey="valid-key" points={[
      { id: 'a', lat: 28.6, lng: 77.2, title: 'Delhi' },
      { id: 'b', lat: 19.0, lng: 72.8, title: 'Mumbai' },
      { id: 'invalid', lat: 0, lng: 0, title: 'Invalid' },
    ]} />);

    await waitFor(() => expect(Map).toHaveBeenCalledTimes(1));
    expect(Map).toHaveBeenCalledWith(expect.stringMatching(/^mappls-map-/), {
      center: { lat: 22.9734, lng: 78.6569 }, zoom: 4,
    });
    expect(Marker).toHaveBeenCalledTimes(2);
    expect(extend).toHaveBeenCalledTimes(2);
    expect(fitBounds).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText('Interactive Mappls map')).toBeInTheDocument();
  });

  it('centers and zooms for a single point and responds to center updates', async () => {
    const setCenter = vi.fn();
    const setZoom = vi.fn();
    window.mappls = {
      Map: vi.fn().mockImplementation(() => ({ setCenter, setZoom, remove: vi.fn() })),
      Marker: vi.fn(),
    };
    const { rerender } = render(<MapplsMap apiKey="valid-key" points={[
      { id: 'one', lat: 12.9, lng: 77.6, title: 'Bengaluru' },
    ]} center={{ lat: 12.9, lng: 77.6 }} />);
    await waitFor(() => expect(setZoom).toHaveBeenCalledWith(10));
    rerender(<MapplsMap apiKey="valid-key" points={[
      { id: 'one', lat: 12.9, lng: 77.6, title: 'Bengaluru' },
    ]} center={{ lat: 13, lng: 78 }} />);
    await waitFor(() => expect(setCenter).toHaveBeenCalledWith({ lat: 13, lng: 78 }));
  });

  it('renders an SDK failure as an accessible error', async () => {
    window.mappls = {};
    render(<MapplsMap apiKey="invalid-key" points={[]} />);
    const script = document.querySelector<HTMLScriptElement>('script[data-mappls-sdk="true"]');
    expect(script).not.toBeNull();
    script!.onerror?.(new Event('error'));
    expect(await screen.findByRole('alert')).toHaveTextContent('Mappls SDK could not be downloaded');
  });

  it('shows an empty-location hint after the map becomes ready', async () => {
    window.mappls = { Map: vi.fn().mockImplementation(() => ({ remove: vi.fn() })), Marker: vi.fn() };
    render(<MapplsMap apiKey="valid-key" points={[]} emptyMessage="No readers nearby" />);
    expect(await screen.findByText('No readers nearby')).toBeInTheDocument();
  });
});

