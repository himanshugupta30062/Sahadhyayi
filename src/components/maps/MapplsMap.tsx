import { useEffect, useId, useRef, useState } from 'react';

interface MapplsRuntimeMap {
  addListener?: (eventName: string, callback: (event?: unknown) => void) => unknown;
  on?: (eventName: string, callback: (event?: unknown) => void) => unknown;
  loaded?: () => boolean;
  setCenter?: (center: { lat: number; lng: number }) => void;
  setZoom?: (zoom: number) => void;
  resize?: () => void;
  remove?: () => void;
}

interface MapplsRuntimeMarker {
  setPosition?: (position: { lat: number; lng: number }) => void;
  addListener?: (eventName: string, callback: (event?: unknown) => void) => unknown;
  remove?: () => void;
  [key: string]: unknown;
}

interface MapplsMarkerRecord {
  marker: MapplsRuntimeMarker;
  signature: string;
}

interface MapplsRuntime {
  Map?: new (container: string | HTMLElement, options: Record<string, unknown>) => MapplsRuntimeMap;
  Marker?: new (options: Record<string, unknown>) => MapplsRuntimeMarker;
  fitBounds?: new (options: Record<string, unknown>) => unknown;
  remove?: (options: { map: MapplsRuntimeMap; layer: MapplsRuntimeMarker }) => void;
}

declare global {
  interface Window {
    mappls?: MapplsRuntime;
    mapplsLoadingPromise?: Promise<void>;
    mapplsLoadingKey?: string;
  }
}

export interface MapplsPoint {
  id: string;
  lat: number;
  lng: number;
  title: string;
  description?: string;
  avatarUrl?: string | null;
}

interface MapplsMapProps {
  apiKey: string;
  points: MapplsPoint[];
  center?: { lat: number; lng: number } | null;
  emptyMessage?: string;
}

const SDK_URL = 'https://sdk.mappls.com/map/sdk/web?v=3.0';
const SDK_LOAD_TIMEOUT_MS = 15_000;

const loadMappls = (apiKey: string): Promise<void> => {
  if (window.mappls?.Map && window.mappls?.Marker) {
    const existingKey = window.mapplsLoadingKey;
    if (typeof existingKey === 'string' && existingKey !== apiKey) {
      return Promise.reject(new Error('A different Mappls key is already active in this page. Reload the page after changing the key.'));
    }
    return Promise.resolve();
  }

  const loadingPromise = window.mapplsLoadingPromise;
  if (loadingPromise) {
    const existingKey = window.mapplsLoadingKey;
    if (typeof existingKey === 'string' && existingKey !== apiKey) {
      return Promise.reject(new Error('A Mappls SDK request is already loading with a different key. Reload the page and try again.'));
    }
    return loadingPromise;
  }

  const loadPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>('script[data-mappls-sdk="true"]');
    existingScript?.remove();

    const script = document.createElement('script');
    script.src = `${SDK_URL}&access_token=${encodeURIComponent(apiKey)}`;
    script.async = true;
    script.defer = true;
    script.dataset.mapplsSdk = 'true';

    let settled = false;
    const cleanupFailedLoad = () => {
      window.clearTimeout(timeout);
      script.remove();
      if (window.mapplsLoadingPromise === loadPromise) {
        window.mapplsLoadingPromise = undefined;
        window.mapplsLoadingKey = undefined;
      }
    };

    const timeout = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanupFailedLoad();
      reject(new Error('Mappls SDK timed out after 15 seconds. Check the SDK request status and allowed domains in Mappls Console.'));
    }, SDK_LOAD_TIMEOUT_MS);

    script.onload = () => {
      if (settled) return;
      if (window.mappls?.Map && window.mappls?.Marker) {
        settled = true;
        window.clearTimeout(timeout);
        resolve();
        return;
      }

      settled = true;
      cleanupFailedLoad();
      reject(new Error('Mappls SDK downloaded, but Map and Marker APIs were not exposed. Verify Web Maps SDK v3.0 access for this application.'));
    };

    script.onerror = () => {
      if (settled) return;
      settled = true;
      cleanupFailedLoad();
      reject(new Error('Mappls SDK request failed. Check its HTTP status in DevTools and verify the key domain whitelist.'));
    };

    document.head.appendChild(script);
  });

  window.mapplsLoadingKey = apiKey;
  window.mapplsLoadingPromise = loadPromise;
  return loadPromise;
};

const getTokenErrorMessage = (event: unknown): string => {
  const details = event && typeof event === 'object' ? event as Record<string, unknown> : {};
  const code = typeof details.code === 'number' || typeof details.code === 'string'
    ? String(details.code)
    : '';
  const isUnauthorized = code === '401' ||
    String(details.error ?? '').toLowerCase().includes('domain') ||
    String(details.error ?? '').toLowerCase().includes('unauthorized');

  if (isUnauthorized) {
    return `Mappls rejected the static key${code ? ` (${code})` : ''}. Verify Web Maps SDK access and the allowed domain/IP restrictions in Mappls Console.`;
  }

  return `Mappls reported an authentication error${code ? ` (${code})` : ''}. Verify the application credentials and Web Maps allocation.`;
};

const getMapEventMessage = (event: unknown): string => {
  const details = event && typeof event === 'object' ? event as Record<string, unknown> : {};
  const error = details.error && typeof details.error === 'object'
    ? details.error as Record<string, unknown>
    : {};
  const status = typeof error.status === 'number' || typeof error.status === 'string'
    ? String(error.status)
    : typeof details.status === 'number' || typeof details.status === 'string'
      ? String(details.status)
      : '';

  if (status === '401' || status === '403') {
    return `Mappls map resources were rejected (${status}). Check Web Maps access and domain/IP restrictions.`;
  }

  return 'Mappls could not load one or more map resources. Check the Network panel for failed styles or tile requests.';
};


const escapeHtml = (value: string) => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const getSafeAvatarUrl = (value?: string | null): string | null => {
  if (!value) return null;
  const trimmed = value.trim();
  const [dataHeader, dataPayload] = trimmed.split(',', 2);
  if (
    dataHeader?.toLowerCase() === 'data:image/svg+xml;base64' &&
    !!dataPayload &&
    /^[A-Za-z0-9+/]+={0,2}$/.test(dataPayload)
  ) {
    return trimmed;
  }
  try {
    const url = new URL(trimmed);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null;
  } catch {
    return null;
  }
};

const createAvatarMarkerElement = (point: MapplsPoint): HTMLElement => {
  const avatarUrl = getSafeAvatarUrl(point.avatarUrl);
  const isSelf = point.id === 'self';
  const borderColor = isSelf ? '#D5B16D' : '#1C442D';
  const root = document.createElement('div');
  root.className = 'sahadhyayi-reader-map-marker';
  root.setAttribute('role', 'img');
  root.setAttribute('aria-label', isSelf ? 'Your reading avatar' : `${point.title} reading avatar`);
  root.title = point.title;
  root.style.cssText = 'display:flex;flex-direction:column;align-items:center;justify-content:flex-start;width:58px;height:68px;overflow:visible;pointer-events:auto;';

  const shell = document.createElement('div');
  shell.style.cssText = `box-sizing:border-box;display:flex;align-items:center;justify-content:center;width:52px;height:52px;padding:3px;border:3px solid ${borderColor};border-radius:50%;background:#fff;box-shadow:0 3px 12px rgba(20,35,25,.28),0 0 0 2px rgba(255,255,255,.96);overflow:hidden;`;

  const fallback = document.createElement('span');
  fallback.textContent = (point.title.trim().charAt(0) || 'R').toUpperCase();
  fallback.setAttribute('aria-hidden', 'true');
  fallback.style.cssText = 'display:flex;width:100%;height:100%;align-items:center;justify-content:center;border-radius:50%;background:#E8EFE9;color:#1C442D;font:700 18px/1 system-ui,sans-serif;';

  if (avatarUrl) {
    const image = document.createElement('img');
    image.src = avatarUrl;
    image.alt = '';
    image.decoding = 'async';
    image.referrerPolicy = 'no-referrer';
    image.style.cssText = 'display:block;width:100%;height:100%;object-fit:cover;border-radius:50%;';
    image.addEventListener('error', () => {
      if (image.parentElement === shell) image.replaceWith(fallback);
    }, { once: true });
    shell.appendChild(image);
  } else {
    shell.appendChild(fallback);
  }

  root.appendChild(shell);
  if (isSelf) {
    const label = document.createElement('span');
    label.textContent = 'YOU';
    label.style.cssText = 'margin-top:1px;padding:1px 5px;border-radius:999px;background:#1C442D;color:#fff;font:700 8px/1.4 system-ui,sans-serif;letter-spacing:.06em;box-shadow:0 1px 4px rgba(0,0,0,.2);';
    root.appendChild(label);
  }
  return root;
};

const getMarkerSignature = (point: MapplsPoint) => JSON.stringify([
  point.lat,
  point.lng,
  point.title,
  point.description ?? '',
  point.avatarUrl ?? '',
]);

const getPointBoundsSignature = (points: MapplsPoint[]) => JSON.stringify(
  points.map((point) => [point.id, point.lat, point.lng]).sort((a, b) => String(a[0]).localeCompare(String(b[0]))),
);

const removeMarker = (map: MapplsRuntimeMap, marker: MapplsRuntimeMarker) => {
  try {
    window.mappls?.remove?.({ map, layer: marker });
  } catch {
    try { marker.remove?.(); } catch { /* map teardown is the final fallback */ }
  }
};

const removeMarkers = (map: MapplsRuntimeMap, markers: Map<string, MapplsMarkerRecord>) => {
  markers.forEach(({ marker }) => removeMarker(map, marker));
  markers.clear();
};

const isValidPoint = (point: MapplsPoint) =>
  Number.isFinite(point.lat) &&
  Number.isFinite(point.lng) &&
  Math.abs(point.lat) <= 90 &&
  Math.abs(point.lng) <= 180 &&
  !(point.lat === 0 && point.lng === 0);

export function MapplsMap({
  apiKey,
  points,
  center,
  emptyMessage = 'No shared reader locations are available yet.',
}: MapplsMapProps) {
  const generatedId = useId().replace(/:/g, '');
  const containerId = `mappls-map-${generatedId}`;
  const mapElement = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<MapplsRuntimeMap | null>(null);
  const markers = useRef<Map<string, MapplsMarkerRecord>>(new Map());
  const lastBoundsSignature = useRef('');
  const [status, setStatus] = useState<'loading' | 'ready' | 'error' | 'missing-key'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    if (!apiKey.trim()) {
      setStatus('missing-key');
      setErrorMessage('');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    let observer: ResizeObserver | undefined;
    let initializationStarted = false;
    let markedReady = false;
    let hasFatalError = false;

    const reportFatalError = (message: string) => {
      if (cancelled) return;
      hasFatalError = true;
      setErrorMessage(message);
      setStatus('error');
    };

    const initializeMap = () => {
      const container = mapElement.current;
      // Mappls needs a measurable container. Social tabs and dialogs can mount
      // their map while hidden, so wait until ResizeObserver reports a size.
      const isTestEnv = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';
      if (
        cancelled ||
        initializationStarted ||
        mapInstance.current ||
        !container ||
        (!isTestEnv && (container.clientWidth === 0 || container.clientHeight === 0))
      ) {
        return;
      }

      initializationStarted = true;

      void loadMappls(apiKey)
        .then(() => {
          if (cancelled || !mapElement.current || mapInstance.current) return;

          const initialCenter = center ?? { lat: 22.9734, lng: 78.6569 };
          const tokenCallback = (event: unknown) => reportFatalError(getTokenErrorMessage(event));

          let map: MapplsRuntimeMap;
          try {
            const MapConstructor = window.mappls?.Map;
            if (!MapConstructor) {
              throw new Error('Mappls Map constructor is unavailable after SDK loading.');
            }

            map = new MapConstructor(containerId, {
              center: { lat: initialCenter.lat, lng: initialCenter.lng },
              // The documented supported zoom range begins at level 5.
              zoom: center ? 10 : 5,
              token_callback: tokenCallback,
            });
            mapInstance.current = map;
          } catch (error) {
            reportFatalError(error instanceof Error ? error.message : 'Map initialization failed.');
            return;
          }

          const markReady = () => {
            if (cancelled || markedReady || hasFatalError) return;
            markedReady = true;
            setErrorMessage('');
            setStatus('ready');
            window.requestAnimationFrame(() => {
              if (!cancelled) map.resize?.();
            });
          };

          const addMapListener = (eventName: string, callback: (event?: unknown) => void) => {
            if (typeof map.addListener === 'function') {
              map.addListener(eventName, callback);
              return true;
            }
            // Keep compatibility with SDK builds exposing the underlying event emitter.
            if (typeof map.on === 'function') {
              map.on(eventName, callback);
              return true;
            }
            return false;
          };

          if (!addMapListener('error', (event) => reportFatalError(getMapEventMessage(event)))) {
            reportFatalError('The loaded Mappls SDK does not expose the documented map event API.');
            return;
          }

          addMapListener('webglcontextlost', () => {
            reportFatalError('Map rendering paused because the browser lost its WebGL context. Retry the map or reload the page.');
          });

          addMapListener('webglcontextrestored', () => {
            if (cancelled || hasFatalError) return;
            setErrorMessage('');
            setStatus('ready');
            window.requestAnimationFrame(() => map.resize?.());
          });

          addMapListener('load', markReady);
          // Mappls documents idle as the point where the current tiles and
          // transitions have finished; it is a useful fallback if load was missed.
          addMapListener('idle', markReady);

          try {
            if (typeof map.loaded === 'function' && map.loaded()) {
              markReady();
            }
          } catch {
            // The load/idle listeners remain the source of truth.
          }
        })
        .catch((error: unknown) => {
          if (cancelled) return;
          reportFatalError(error instanceof Error ? error.message : 'Map could not be loaded.');
        });
    };

    if (typeof ResizeObserver !== 'undefined' && mapElement.current) {
      observer = new ResizeObserver(() => {
        const container = mapElement.current;
        if (!container || container.clientWidth === 0 || container.clientHeight === 0) return;
        if (mapInstance.current) {
          try {
            mapInstance.current.resize?.();
          } catch {
            // Ignore SDK-specific resize differences.
          }
        } else {
          initializeMap();
        }
      });
      observer.observe(mapElement.current);
    }

    initializeMap();

    return () => {
      cancelled = true;
      observer?.disconnect();

      const map = mapInstance.current;
      if (map) {
        removeMarkers(map, markers.current);
        lastBoundsSignature.current = '';
        try {
          // Mappls documents map.remove() as the map teardown method.
          map.remove?.();
        } catch {
          // Ignore cleanup differences between SDK builds.
        }
      }
      mapInstance.current = null;
    };
    // Center changes are handled by the dedicated effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey, containerId, retryCount]);

  useEffect(() => {
    const map = mapInstance.current;
    if (status !== 'ready' || !map) return;

    if (center && Number.isFinite(center.lat) && Number.isFinite(center.lng)) {
      map.setCenter?.({ lat: center.lat, lng: center.lng });
    }
  }, [center, status]);

  useEffect(() => {
    const map = mapInstance.current;
    const MarkerConstructor = window.mappls?.Marker;
    if (status !== 'ready' || !map || !MarkerConstructor) return;

    const validPoints = points.filter(isValidPoint);
    const desiredPoints = new Map(validPoints.map((point) => [point.id, point]));

    // Keep stable markers in place. Only remove markers that disappeared or
    // whose displayed data/position actually changed.
    markers.current.forEach((record, id) => {
      const nextPoint = desiredPoints.get(id);
      if (!nextPoint || getMarkerSignature(nextPoint) !== record.signature) {
        removeMarker(map, record.marker);
        markers.current.delete(id);
      }
    });

    validPoints.forEach((point) => {
      if (markers.current.has(point.id)) return;

      const escapedTitle = escapeHtml(point.title);
      const escapedDesc = escapeHtml(point.description || '');
      const isSelf = point.id === 'self';
      const badgeHtml = isSelf
        ? '<span style="display:inline-block;padding:2px 6px;margin-bottom:4px;border-radius:9999px;font-size:10px;font-weight:700;background:#DCFCE7;color:#166534;letter-spacing:0.025em;text-transform:uppercase;">You</span>'
        : '';
      const popupHtml = `<div style="font-family:sans-serif;padding:4px 6px;min-width:140px;color:#1C201D;">${badgeHtml}<strong style="font-size:13px;display:block;">${escapedTitle}</strong>${escapedDesc ? `<span style="font-size:12px;color:#636B65;display:block;margin-top:2px;">${escapedDesc}</span>` : ''}</div>`;

      try {
        // Mappls markerProperties documents html as a DOM element, not an HTML string.
        const marker = new MarkerConstructor({
          map,
          position: { lat: point.lat, lng: point.lng },
          title: point.title,
          html: createAvatarMarkerElement(point),
          width: 58,
          height: 68,
          offset: [0, -12],
          popupHtml,
        });
        markers.current.set(point.id, { marker, signature: getMarkerSignature(point) });
      } catch (error) {
        console.error('Mappls could not create a reader avatar marker:', error);
        setErrorMessage('The map loaded, but a reader avatar marker could not be created. Try reloading the map.');
        setStatus('error');
      }
    });

    const boundsSignature = getPointBoundsSignature(validPoints);
    if (boundsSignature !== lastBoundsSignature.current) {
      lastBoundsSignature.current = boundsSignature;

      if (validPoints.length === 1) {
        map.setCenter?.({ lat: validPoints[0].lat, lng: validPoints[0].lng });
        map.setZoom?.(13);
      } else if (validPoints.length > 1) {
        const fitBounds = window.mappls?.fitBounds;
        const bounds = validPoints.map((point) => [point.lng, point.lat]);

        if (fitBounds) {
          try {
            new fitBounds({
              map,
              cType: 0,
              bounds,
              options: { padding: 96, duration: 650 },
            });
          } catch {
            const averageCenter = validPoints.reduce(
              (result, point) => ({
                lat: result.lat + point.lat / validPoints.length,
                lng: result.lng + point.lng / validPoints.length,
              }),
              { lat: 0, lng: 0 },
            );
            map.setCenter?.(averageCenter);
            map.setZoom?.(5);
          }
        }
      }
    }
  }, [points, status]);

  if (status === 'missing-key') {
    return (
      <div className="flex h-[500px] items-center justify-center rounded-xl border bg-muted/30 p-6 text-center">
        <div className="max-w-md space-y-2">
          <p className="font-semibold">Mappls is not configured yet</p>
          <p className="text-sm text-muted-foreground">
            Add VITE_MAPPLS_API_KEY to the Cloudflare Pages build environment and enable the Mappls Web Maps SDK for this application.
          </p>
          <a className="text-sm underline" href="https://auth.mappls.com/console" target="_blank" rel="noreferrer">
            Open Mappls developer console
          </a>
        </div>
      </div>
    );
  }

  const validPointCount = points.filter(isValidPoint).length;

  return (
    <div className="relative">
      <div
        id={containerId}
        ref={mapElement}
        className="h-[500px] w-full overflow-hidden rounded-xl border"
        aria-label="Interactive Mappls map"
      />
      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/80" role="status">
          <p className="text-sm text-muted-foreground">Loading Mappls map…</p>
        </div>
      )}
      {status === 'error' && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/95 p-6 text-center" role="alert">
          <div className="max-w-md space-y-3">
            <p className="font-semibold">Mappls could not load</p>
            <p className="text-sm text-muted-foreground">{errorMessage || 'Check the Mappls Web Maps key, domain restrictions, and map resource requests.'}</p>
            <button
              type="button"
              onClick={() => setRetryCount((count) => count + 1)}
              className="inline-flex min-h-9 items-center justify-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Retry map
            </button>
          </div>
        </div>
      )}
      {status === 'ready' && validPointCount === 0 && (
        <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-lg bg-background/95 px-4 py-2 text-sm shadow">
          {emptyMessage}
        </div>
      )}
    </div>
  );
}
