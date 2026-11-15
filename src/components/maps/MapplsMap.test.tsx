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
    expect(delhiMarker.icon).toBe('https://cdn.example.test/delhi.svg');
    expect(delhiMarker.width).toBe(58);
    expect(delhiMarker.height).toBe(68);
    expect(mumbaiMarker.icon).toContain('data:image/svg+xml;charset=UTF-8,');
    expect(decodeURIComponent(mumbaiMarker.icon.split(',')[1])).toContain('>M</text>');
    expect(mumbaiMarker.icon).not.toContain('javascript:alert(1)');
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

  it('filters out invalid coordinates (0,0) and marks valid points', async () => {
    const listeners: Record<string, (event?: unknown) => void> = {};
    const Marker = vi.fn().mockImplementation(function () { return {}; });
    const map = {
      addListener: (eventName: string, callback: (event?: unknown) => void) => { listeners[eventName] = callback; },
      loaded: () => true,
      setCenter: vi.fn(),
      setZoom: vi.fn(),
      remove: vi.fn()
    };
    const MapConstructor = vi.fn().mockImplementation(function () { return map; });
    window.mappls = { Map: MapConstructor, Marker, remove: vi.fn() };

    render(<MapplsMap apiKey="valid-key" points={[
      { id: 'valid', lat: 12.9, lng: 77.6, title: 'Valid' },
      { id: 'invalid', lat: 0, lng: 0, title: 'Invalid' },
      { id: 'nan', lat: NaN, lng: 77.6, title: 'NaN' },
    ]} />);

    await waitFor(() => expect(Marker).toHaveBeenCalledTimes(1));
  });

  it('calls onMarkerClick when a marker is clicked', async () => {
    const onMarkerClick = vi.fn();
    const markerListeners: Record<string, (event?: unknown) => void> = {};
    const mapListeners: Record<string, (event?: unknown) => void> = {};
    const Marker = vi.fn().mockImplementation(function () {
      return { addListener: (event: string, cb: () => void) => { markerListeners[event] = cb; } };
    });
    const map = {
      addListener: (eventName: string, callback: (event?: unknown) => void) => { mapListeners[eventName] = callback; },
      loaded: () => true,
      setCenter: vi.fn(),
      setZoom: vi.fn(),
      remove: vi.fn(),
      getZoom: () => 10,
      getCenter: () => ({ lat: 12.9, lng: 77.6 }),
    };
    const MapConstructor = vi.fn().mockImplementation(function () { return map; });
    window.mappls = { Map: MapConstructor, Marker, remove: vi.fn() };

    render(<MapplsMap apiKey="valid-key" points={[
      { id: 'point-1', lat: 12.9, lng: 77.6, title: 'Test Point' },
    ]} onMarkerClick={onMarkerClick} />);

    await waitFor(() => expect(Marker).toHaveBeenCalledTimes(1));

    // Trigger the marker's click handler
    if (markerListeners.click) {
      markerListeners.click();
    }
    expect(onMarkerClick).toHaveBeenCalledWith(expect.objectContaining({ id: 'point-1' }));
  });

  it('rejects if a different key is already active in window or currently loading', async () => {
    window.mappls = { Map: vi.fn() as any, Marker: vi.fn() as any };
    window.mapplsLoadingKey = 'key-existing';

    render(<MapplsMap apiKey="key-new" points={[]} />);
    expect(await screen.findByRole('alert')).toHaveTextContent('A different Mappls key is already active');

    cleanup();
    delete window.mappls;
    window.mapplsLoadingKey = 'loading-key-1';
    window.mapplsLoadingPromise = new Promise(() => {});

    render(<MapplsMap apiKey="loading-key-2" points={[]} />);
    expect(await screen.findByRole('alert')).toHaveTextContent('A Mappls SDK request is already loading with a different key');
  });

  it('reuses existing in-flight loading promise when same key is passed', async () => {
    let resolved = false;
    window.mapplsLoadingKey = 'key-shared';
    window.mapplsLoadingPromise = new Promise<void>((resolve) => {
      setTimeout(() => {
        window.mappls = {
          Map: vi.fn().mockImplementation(function () { return { addListener: vi.fn(), loaded: () => true, remove: vi.fn() }; }),
          Marker: vi.fn().mockImplementation(function () { return {}; }),
        };
        resolved = true;
        resolve();
      }, 10);
    });

    render(<MapplsMap apiKey="key-shared" points={[]} />);
    await waitFor(() => expect(resolved).toBe(true));
  });

  it('handles SDK load without exposing Map and Marker APIs', async () => {
    render(<MapplsMap apiKey="valid-key" points={[]} />);
    const script = document.querySelector<HTMLScriptElement>('script[data-mappls-sdk="true"]');
    expect(script).not.toBeNull();
    window.mappls = {}; // empty, no Map or Marker
    script!.onload?.(new Event('load'));

    expect(await screen.findByRole('alert')).toHaveTextContent('Mappls SDK downloaded, but Map and Marker APIs were not exposed');
  });

  it('handles WebGL context lost and restored events', async () => {
    const listeners: Record<string, (event?: unknown) => void> = {};
    const resize = vi.fn();
    window.mappls = {
      Map: vi.fn().mockImplementation(function () {
        return {
          addListener: (event: string, cb: () => void) => { listeners[event] = cb; },
          loaded: () => true,
          resize,
          remove: vi.fn(),
        };
      }),
      Marker: vi.fn().mockImplementation(function () { return {}; }),
    };

    render(<MapplsMap apiKey="valid-key" points={[]} />);
    await waitFor(() => expect(listeners.webglcontextlost).toBeDefined());

    // Lose context
    listeners.webglcontextlost();
    expect(await screen.findByRole('alert')).toHaveTextContent('Map rendering paused because the browser lost its WebGL context');

    // Restore context
    listeners.webglcontextrestored();
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
  });

  it('supports map event listeners via map.on and reports error if neither exists', async () => {
    const onListeners: Record<string, (event?: unknown) => void> = {};
    const mapWithOn = {
      on: (event: string, cb: () => void) => { onListeners[event] = cb; },
      loaded: () => true,
      remove: vi.fn(),
    };
    window.mappls = {
      Map: vi.fn().mockImplementation(function () { return mapWithOn; }),
      Marker: vi.fn().mockImplementation(function () { return {}; }),
    };

    const { unmount } = render(<MapplsMap apiKey="valid-key" points={[]} />);
    await waitFor(() => expect(onListeners.error).toBeDefined());
    unmount();

    // Map with neither addListener nor on
    const brokenMap = {
      loaded: () => true,
      remove: vi.fn(),
    };
    window.mappls = {
      Map: vi.fn().mockImplementation(function () { return brokenMap; }),
      Marker: vi.fn().mockImplementation(function () { return {}; }),
    };
    render(<MapplsMap apiKey="valid-key" points={[]} />);
    expect(await screen.findByRole('alert')).toHaveTextContent('The loaded Mappls SDK does not expose the documented map event API');
  });

  it('handles marker creation errors gracefully', async () => {
    const map = {
      addListener: vi.fn(),
      loaded: () => true,
      setCenter: vi.fn(),
      setZoom: vi.fn(),
      remove: vi.fn(),
    };
    window.mappls = {
      Map: vi.fn().mockImplementation(function () { return map; }),
      Marker: vi.fn().mockImplementation(function () {
        throw new Error('Marker creation failed');
      }),
    };

    render(<MapplsMap apiKey="valid-key" points={[{ id: 'p1', lat: 12.9, lng: 77.6, title: 'Bangalore' }]} />);
    expect(await screen.findByRole('status')).toHaveTextContent('reader marker could not be added');
    expect(screen.getByLabelText('Interactive Mappls map')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry markers' })).toBeInTheDocument();
  });

  it('falls back to average center when fitBounds throws an error', async () => {
    const setCenter = vi.fn();
    const setZoom = vi.fn();
    const map = {
      addListener: vi.fn(),
      loaded: () => true,
      setCenter,
      setZoom,
      remove: vi.fn(),
    };
    const fitBounds = vi.fn().mockImplementation(function () {
      throw new Error('fitBounds failed');
    });
    window.mappls = {
      Map: vi.fn().mockImplementation(function () { return map; }),
      Marker: vi.fn().mockImplementation(function () { return {}; }),
      fitBounds,
    };

    render(<MapplsMap apiKey="valid-key" points={[
      { id: 'p1', lat: 10, lng: 20, title: 'Point 1' },
      { id: 'p2', lat: 20, lng: 40, title: 'Point 2' },
    ]} />);

    await waitFor(() => expect(setCenter).toHaveBeenCalledWith({ lat: 15, lng: 30 }));
    expect(setZoom).toHaveBeenCalledWith(5);
  });

  it('falls back to marker.remove when window.mappls.remove throws', async () => {
    const markerRemove = vi.fn();
    const map = { addListener: vi.fn(), loaded: () => true, remove: vi.fn() };
    window.mappls = {
      Map: vi.fn().mockImplementation(function () { return map; }),
      Marker: vi.fn().mockImplementation(function () { return { remove: markerRemove }; }),
      remove: vi.fn().mockImplementation(function () {
        throw new Error('SDK remove failed');
      }),
    };

    const { rerender } = render(<MapplsMap apiKey="valid-key" points={[{ id: 'p1', lat: 10, lng: 20, title: 'Point 1' }]} />);
    await waitFor(() => expect(window.mappls?.Marker).toHaveBeenCalledTimes(1));

    rerender(<MapplsMap apiKey="valid-key" points={[]} />);
    await waitFor(() => expect(markerRemove).toHaveBeenCalled());
  });

  it('handles avatar image load error and replaces it with fallback letter', async () => {
    let markerHtmlElement: HTMLElement | undefined;
    const map = { addListener: vi.fn(), loaded: () => true, remove: vi.fn() };
    window.mappls = {
      Map: vi.fn().mockImplementation(function () { return map; }),
      Marker: vi.fn().mockImplementation(function (opts: any) {
        markerHtmlElement = opts.html;
        return {};
      }),
    };

    render(<MapplsMap apiKey="valid-key" points={[{ id: 'p1', lat: 10, lng: 20, title: 'Alice', avatarUrl: 'https://example.com/alice.jpg' }]} />);
    await waitFor(() => expect(markerHtmlElement).toBeDefined());

    const img = markerHtmlElement?.querySelector('img');
    expect(img).not.toBeNull();
    img?.dispatchEvent(new Event('error'));

    expect(markerHtmlElement?.querySelector('img')).toBeNull();
    expect(markerHtmlElement?.textContent).toContain('A');
  });

  it('formats unknown token error messages and generic map event messages', async () => {
    let mapOptions: Record<string, unknown> | undefined;
    const listeners: Record<string, (event?: unknown) => void> = {};
    window.mappls = {
      Map: vi.fn().mockImplementation(function (_container: string, opts: Record<string, unknown>) {
        mapOptions = opts;
        return {
          addListener: (event: string, cb: () => void) => { listeners[event] = cb; },
          loaded: () => true,
          remove: vi.fn(),
        };
      }),
      Marker: vi.fn().mockImplementation(function () { return {}; }),
    };

    render(<MapplsMap apiKey="valid-key" points={[]} />);
    await waitFor(() => expect(mapOptions).toBeDefined());

    // Test unmapped token error code
    (mapOptions?.token_callback as (event: unknown) => void)({ code: 505, error: 'Custom gateway error' });
    expect(await screen.findByRole('alert')).toHaveTextContent('Mappls reported an authentication error (505)');

    // This instance is already in the fatal token state; recoverable resource
    // events are covered independently so they cannot mask an auth failure.
  });

  it('handles Map constructor throwing an error on initialization', async () => {
    window.mappls = {
      Map: vi.fn().mockImplementation(function () {
        throw new Error('Fatal Map constructor error');
      }),
      Marker: vi.fn().mockImplementation(function () { return {}; }),
    };

    render(<MapplsMap apiKey="valid-key" points={[]} />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Fatal Map constructor error');
  });

  it('handles ResizeObserver resize callback on mounted map container', async () => {
    let resizeCallback: (() => void) | undefined;
    class MockResizeObserver {
      constructor(cb: () => void) {
        resizeCallback = cb;
      }
      observe = vi.fn();
      disconnect = vi.fn();
    }
    vi.stubGlobal('ResizeObserver', MockResizeObserver);

    const resize = vi.fn();
    const map = { addListener: vi.fn(), loaded: () => true, resize, remove: vi.fn() };
    window.mappls = {
      Map: vi.fn().mockImplementation(function () { return map; }),
      Marker: vi.fn().mockImplementation(function () { return {}; }),
    };

    render(<MapplsMap apiKey="valid-key" points={[]} />);
    await waitFor(() => expect(resizeCallback).toBeDefined());

    const container = screen.getByLabelText('Interactive Mappls map');
    Object.defineProperty(container, 'clientWidth', { configurable: true, value: 500 });
    Object.defineProperty(container, 'clientHeight', { configurable: true, value: 500 });

    resizeCallback?.();
    expect(resize).toHaveBeenCalled();
  });
  it('retries only failed avatar markers without tearing down the map', async () => {
    const map = { addListener: vi.fn(), loaded: () => true, remove: vi.fn() };
    const Marker = vi.fn()
      .mockImplementationOnce(function () { throw new Error('temporary marker renderer error'); })
      .mockImplementation(function () { return { remove: vi.fn() }; });
    window.mappls = {
      Map: vi.fn().mockImplementation(function () { return map; }),
      Marker,
      remove: vi.fn(),
    };

    render(<MapplsMap apiKey="valid-key" points={[
      { id: 'reader-1', lat: 28.6, lng: 77.2, title: 'Reader One', avatarUrl: 'https://cdn.example.test/reader.svg' },
    ]} />);

    expect(await screen.findByRole('status')).toHaveTextContent('reader marker could not be added');
    expect(screen.getByLabelText('Interactive Mappls map')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Retry markers' }));
    await waitFor(() => expect(Marker).toHaveBeenCalledTimes(2));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Interactive Mappls map')).toBeInTheDocument();
  });

  it('keeps the map visible when Mappls reports a transient 500 resource error', async () => {
    const listeners: Record<string, (event?: unknown) => void> = {};
    const map = {
      addListener: (event: string, callback: (event?: unknown) => void) => { listeners[event] = callback; },
      loaded: () => true,
      remove: vi.fn(),
    };
    window.mappls = {
      Map: vi.fn().mockImplementation(function () { return map; }),
      Marker: vi.fn().mockImplementation(function () { return {}; }),
    };

    render(<MapplsMap apiKey="valid-key" points={[]} />);
    await waitFor(() => expect(listeners.error).toBeDefined());

    listeners.error?.({ error: { status: 500 } });
    expect(await screen.findByRole('status')).toHaveTextContent('Some map tiles or resources did not load');
    expect(screen.getByLabelText('Interactive Mappls map')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('supports PNG, WebP and JPEG base64 data avatars in addition to SVG and HTTPS URLs', async () => {
    const createdMarkers: Array<Record<string, unknown>> = [];
    const Marker = vi.fn().mockImplementation(function (options: Record<string, unknown>) {
      createdMarkers.push(options);
      return { options, remove: vi.fn() };
    });
    const map = { addListener: vi.fn(), loaded: () => true, setCenter: vi.fn(), setZoom: vi.fn(), remove: vi.fn() };
    window.mappls = {
      Map: vi.fn().mockImplementation(function () { return map; }),
      Marker,
      remove: vi.fn(),
    };

    const pngDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const webpDataUrl = 'data:image/webp;base64,UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA=';

    render(<MapplsMap apiKey="valid-key" points={[
      { id: 'self', lat: 28.5, lng: 77.2, title: 'You', avatarUrl: pngDataUrl },
      { id: 'friend-webp', lat: 28.6, lng: 77.3, title: 'Rohan', avatarUrl: webpDataUrl },
    ]} />);

    await waitFor(() => expect(Marker).toHaveBeenCalledTimes(2));

    const selfMarker = createdMarkers[0];
    const friendMarker = createdMarkers[1];

    const selfHtml = selfMarker.html as HTMLElement;
    const friendHtml = friendMarker.html as HTMLElement;

    // Self marker contains 'YOU' label and golden border
    expect(selfHtml.textContent).toContain('YOU');
    expect(selfHtml.querySelector('img')?.getAttribute('src')).toBe(pngDataUrl);

    // Friend marker contains initial fallback and WebP image
    expect(friendHtml.textContent).not.toContain('YOU');
    expect(friendHtml.querySelector('img')?.getAttribute('src')).toBe(webpDataUrl);
    expect(friendHtml.textContent).toContain('R');
  });

  it('gracefully hides broken images on image error without removing the fallback initial', async () => {
    const createdMarkers: Array<Record<string, unknown>> = [];
    const Marker = vi.fn().mockImplementation(function (options: Record<string, unknown>) {
      createdMarkers.push(options);
      return { options, remove: vi.fn() };
    });
    const map = { addListener: vi.fn(), loaded: () => true, setCenter: vi.fn(), setZoom: vi.fn(), remove: vi.fn() };
    window.mappls = {
      Map: vi.fn().mockImplementation(function () { return map; }),
      Marker,
      remove: vi.fn(),
    };

    render(<MapplsMap apiKey="valid-key" points={[
      { id: 'broken-img-user', lat: 28.5, lng: 77.2, title: 'Neha', avatarUrl: 'https://cdn.example.com/broken-avatar.png' },
    ]} />);

    await waitFor(() => expect(Marker).toHaveBeenCalledTimes(1));

    const markerHtml = createdMarkers[0].html as HTMLElement;
    const img = markerHtml.querySelector('img') as HTMLImageElement;
    expect(img).not.toBeNull();
    expect(img.getAttribute('src')).toBe('https://cdn.example.com/broken-avatar.png');
    expect(markerHtml.textContent).toContain('N');

    // Simulate image error event
    fireEvent.error(img);

    // Fallback initial remains visible and broken image is hidden
    expect(markerHtml.textContent).toContain('N');
    expect(img.style.display).toBe('none');
  });
});