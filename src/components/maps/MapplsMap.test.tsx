import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MapplsMap } from '@/components/maps/MapplsMap';

describe('MapplsMap', () => {
  afterEach(() => {
    cleanup();
    delete window.mappls;
    delete window.mapplsLoadingPromise;
    delete window.mapplsLoadingKey;
    document.querySelectorAll('script[data-mappls-sdk="true"]').forEach((script) => script.remove());
  });

  it('explains missing configuration without attempting to load the SDK', () => {
    render(<MapplsMap apiKey=" " points={[]} />);
    expect(screen.getByText('Mappls is not configured yet')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open Mappls developer console' })).toHaveAttribute('href', 'https://auth.mappls.com/console');
    expect(document.querySelector('script[data-mappls-sdk="true"]')).toBeNull();
  });

  it('uses the documented Map constructor, load events, marker API and fitBounds API', async () => {
    const listeners: Record<string, (event?: unknown) => void> = {};
    const setCenter = vi.fn();
    const setZoom = vi.fn();
    const removeMap = vi.fn();
    const addListener = vi.fn((eventName: string, callback: (event?: unknown) => void) => {
      listeners[eventName] = callback;
    });
    const map = { addListener, loaded: () => true, setCenter, setZoom, remove: removeMap };
    const Map = vi.fn().mockImplementation(function () { return map; });
    const Marker = vi.fn().mockImplementation(function (options: Record<string, unknown>) { return { options, remove: vi.fn() }; });
    const fitBounds = vi.fn();
    const removeLayer = vi.fn();
    window.mappls = { Map, Marker, fitBounds, remove: removeLayer };

    render(<MapplsMap apiKey="valid-key" points={[
      { id: 'a', lat: 28.6, lng: 77.2, title: 'Delhi', avatarUrl: 'https://cdn.example.test/delhi.svg' },
      { id: 'b', lat: 19, lng: 72.8, title: 'Mumbai', avatarUrl: 'javascript:alert(1)' },
      { id: 'invalid', lat: 0, lng: 0, title: 'Invalid' },
    ]} />);

    await waitFor(() => expect(Marker).toHaveBeenCalledTimes(2));
    expect(Map).toHaveBeenCalledWith(expect.stringMatching(/^mappls-map-/), expect.objectContaining({
      center: { lat: 22.9734, lng: 78.6569 },
      zoom: 5,
      token_callback: expect.any(Function),
    }));
    expect(addListener).toHaveBeenCalledWith('load', expect.any(Function));
    expect(addListener).toHaveBeenCalledWith('idle', expect.any(Function));
    expect(addListener).toHaveBeenCalledWith('error', expect.any(Function));
    const delhiMarker = (Marker as any).mock.calls[0][0];
    const mumbaiMarker = (Marker as any).mock.calls[1][0];
    expect(delhiMarker.html).toBeInstanceOf(HTMLElement);
    expect(delhiMarker.html.querySelector('img')?.getAttribute('src')).toBe('https://cdn.example.test/delhi.svg');
    expect(delhiMarker.html.querySelector('img')?.referrerPolicy).toBe('no-referrer');
    expect(delhiMarker.width).toBe(58);
    expect(delhiMarker.height).toBe(68);
    expect(mumbaiMarker.html.querySelector('img')).toBeNull();
    expect(mumbaiMarker.html.textContent).toContain('M');
    expect(fitBounds).toHaveBeenCalledWith(expect.objectContaining({
      map,
      cType: 0,
      bounds: [[77.2, 28.6], [72.8, 19]],
      options: { padding: 96, duration: 650 },
    }));
    expect(screen.getByLabelText('Interactive Mappls map')).toBeInTheDocument();
    expect(screen.queryByText('Loading Mappls map…')).not.toBeInTheDocument();
  });

  it('keeps stable avatar markers instead of removing and recreating them on unrelated rerenders', async () => {
    const markerInstances: Array<Record<string, unknown>> = [];
    const removeLayer = vi.fn();
    const Marker = vi.fn().mockImplementation(function (options: Record<string, unknown>) {
      const marker = { options, setPosition: vi.fn(), remove: vi.fn() };
      markerInstances.push(marker);
      return marker;
    });
    const map = { addListener: vi.fn(), loaded: () => true, setCenter: vi.fn(), setZoom: vi.fn(), remove: vi.fn() };
    window.mappls = {
      Map: vi.fn().mockImplementation(function () { return map; }),
      Marker,
      remove: removeLayer,
    };

    const stablePoints = [
      { id: 'self', lat: 28.45, lng: 77.02, title: 'You', avatarUrl: 'data:image/svg+xml;base64,PHN2Zy8+' },
      { id: 'friend', lat: 28.46, lng: 77.03, title: 'Friend' },
    ];
    const { rerender } = render(<MapplsMap apiKey="valid-key" points={stablePoints} />);
    await waitFor(() => expect(Marker).toHaveBeenCalledTimes(2));

    rerender(<MapplsMap apiKey="valid-key" points={stablePoints} emptyMessage="Still here" />);
    expect(Marker).toHaveBeenCalledTimes(2);
    expect(removeLayer).not.toHaveBeenCalled();

    const updatedPoints = [
      { ...stablePoints[0], description: 'Reading a book' },
      stablePoints[1],
    ];
    rerender(<MapplsMap apiKey="valid-key" points={updatedPoints} />);
    await waitFor(() => expect(Marker).toHaveBeenCalledTimes(3));
    expect(removeLayer).toHaveBeenCalledTimes(1);
  });

  it('centers and zooms for a single point and responds to center updates', async () => {
    const setCenter = vi.fn();
    const setZoom = vi.fn();
    window.mappls = {
      Map: vi.fn().mockImplementation(function () {
        return { addListener: vi.fn(), loaded: () => true, setCenter, setZoom, remove: vi.fn() };
      }),
      Marker: vi.fn().mockImplementation(function () { return {}; }),
      remove: vi.fn(),
    };

    const points = [{ id: 'one', lat: 12.9, lng: 77.6, title: 'Bengaluru' }];
    const { rerender } = render(<MapplsMap apiKey="valid-key" points={points} center={{ lat: 12.9, lng: 77.6 }} />);

    await waitFor(() => expect(setZoom).toHaveBeenCalledWith(13));
    rerender(<MapplsMap apiKey="valid-key" points={points} center={{ lat: 13, lng: 78 }} />);
    await waitFor(() => expect(setCenter).toHaveBeenCalledWith({ lat: 13, lng: 78 }));
  });

  it('uses Mappls token_callback to explain rejected credentials', async () => {
    let mapOptions: Record<string, unknown> | undefined;
    window.mappls = {
      Map: vi.fn().mockImplementation(function (_container: string, options: Record<string, unknown>) {
        mapOptions = options;
        return { addListener: vi.fn(), loaded: () => true, remove: vi.fn() };
      }),
      Marker: vi.fn(),
      remove: vi.fn(),
    };

    render(<MapplsMap apiKey="restricted-key" points={[]} />);
    await waitFor(() => expect(mapOptions).toBeDefined());
    (mapOptions?.token_callback as (event: unknown) => void)({ code: 401, error: 'IP/Domain validation failed' });

    expect(await screen.findByRole('alert')).toHaveTextContent('Mappls rejected the static key (401)');
    expect(screen.getByText(/allowed domain\/IP restrictions/)).toBeInTheDocument();
  });

  it('surfaces map resource errors reported by the official error event', async () => {
    const listeners: Record<string, (event?: unknown) => void> = {};
    window.mappls = {
      Map: vi.fn().mockImplementation(function () {
        return {
          addListener: (eventName: string, callback: (event?: unknown) => void) => {
            listeners[eventName] = callback;
          },
          loaded: () => false,
          remove: vi.fn(),
        };
      }),
      Marker: vi.fn(),
    };

    render(<MapplsMap apiKey="valid-key" points={[]} />);
    await waitFor(() => expect(listeners.error).toBeDefined());
    listeners.error?.({ error: { status: 403 } });

    expect(await screen.findByRole('alert')).toHaveTextContent('Mappls map resources were rejected (403)');
  });

  it('allows retry after an SDK script request fails', async () => {
    window.mappls = {};
    render(<MapplsMap apiKey="valid-key" points={[]} />);

    const firstScript = document.querySelector<HTMLScriptElement>('script[data-mappls-sdk="true"]');
    expect(firstScript).not.toBeNull();
    firstScript!.onerror?.(new Event('error'));

    expect(await screen.findByRole('alert')).toHaveTextContent('Mappls SDK request failed');
    fireEvent.click(screen.getByRole('button', { name: 'Retry map' }));

    await waitFor(() => {
      expect(document.querySelectorAll('script[data-mappls-sdk="true"]')).toHaveLength(1);
    });
    expect(document.querySelector('script[data-mappls-sdk="true"]')).not.toBe(firstScript);
  });

  it('uses documented Mappls removal for markers and map.remove for teardown', async () => {
    const removeMap = vi.fn();
    const removeLayer = vi.fn();
    const marker = {};
    const Marker = vi.fn().mockImplementation(function () { return marker; });
    window.mappls = {
      Map: vi.fn().mockImplementation(function () {
        return { addListener: vi.fn(), loaded: () => true, remove: removeMap };
      }),
      Marker,
      remove: removeLayer,
    };

    const points = [{ id: 'one', lat: 12.9, lng: 77.6, title: 'Bengaluru' }];
    const { unmount, rerender } = render(<MapplsMap apiKey="valid-key" points={points} />);
    await waitFor(() => expect(Marker).toHaveBeenCalledTimes(1));

    rerender(<MapplsMap apiKey="valid-key" points={[]} />);
    await waitFor(() => expect(removeLayer).toHaveBeenCalledWith(expect.objectContaining({ layer: marker })));
    unmount();
    expect(removeMap).toHaveBeenCalledTimes(1);
  });

  it('shows an empty-location hint after the map becomes ready', async () => {
    window.mappls = {
      Map: vi.fn().mockImplementation(function () {
        return { addListener: vi.fn(), loaded: () => true, remove: vi.fn() };
      }),
      Marker: vi.fn(),
    };
    render(<MapplsMap apiKey="valid-key" points={[]} emptyMessage="No readers nearby" />);
    expect(await screen.findByText('No readers nearby')).toBeInTheDocument();
  });
});
