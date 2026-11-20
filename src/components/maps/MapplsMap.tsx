import { useEffect, useId, useRef, useState } from 'react';
import { generateMarkerHtml } from './utils/mapMarkerGenerators';
import { MapFloatingControls } from './MapFloatingControls';

export interface MapplsRuntimeMap {
  addListener?: (eventName: string, callback: (event?: unknown) => void) => unknown;
  on?: (eventName: string, callback: (event?: unknown) => void) => unknown;
  loaded?: () => boolean;
  setCenter?: (center: { lat: number; lng: number } | [number, number]) => void;
  getCenter?: () => { lat: number; lng: number } | [number, number];
  setZoom?: (zoom: number) => void;
  getZoom?: () => number;
  zoomIn?: () => void;
  zoomOut?: () => void;
  setPitch?: (pitch: number) => void;
  getPitch?: () => number;
  setTilt?: (tilt: number) => void;
  getTilt?: () => number;
  setBearing?: (bearing: number) => void;
  getBearing?: () => number;
  easeTo?: (options: Record<string, unknown>) => void;
  flyTo?: (options: Record<string, unknown>) => void;
  resize?: () => void;
  remove?: () => void;
  [key: string]: unknown;
}

export interface MapplsMapActions {
  zoomIn: () => void;
  zoomOut: () => void;
  setZoom: (zoom: number) => void;
  getZoom: () => number;
  toggle3D: () => boolean;
  set3D: (enable3D: boolean) => void;
  is3D: () => boolean;
  recenter: (coords?: { lat: number; lng: number } | null) => void;
  resetView: () => void;
  fitAllPoints: () => void;
  getRawMap: () => MapplsRuntimeMap | null;
}

interface MapplsRuntimeMarker {
  setPosition?: (position: { lat: number; lng: number }) => void;
  addListener?: (eventName: string, callback: (event?: unknown) => void) => unknown;
  on?: (eventName: string, callback: (event?: unknown) => void) => unknown;
  getElement?: () => HTMLElement | null;
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
  /** Stable identifier used only to seed a local fallback portrait. */
  avatarSeed?: string | null;
  markerType?: 'avatar' | 'place' | 'event' | 'book';
  category?: string;
  data?: unknown;
}

export interface MapplsMapProps {
  apiKey: string;
  points: MapplsPoint[];
  center?: { lat: number; lng: number } | null;
  emptyMessage?: string;
  onMarkerClick?: (point: MapplsPoint) => void;
  onMapActionsReady?: (actions: MapplsMapActions) => void;
  showFloatingControls?: boolean;
  hasUserLocation?: boolean;
  onRecenterRequested?: () => void;
  className?: string;
}

// Use Mappls' documented raster layer as the default. The vector layer can
// initialize its controls while its style/tiles remain blank on restricted or
// partially provisioned Web Maps applications.
const SDK_URL = 'https://sdk.mappls.com/map/sdk/web?v=3.0&layer=raster';
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
  if (loadingPromise !== undefined && loadingPromise !== null) {
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

const isAuthorizationMapEvent = (event: unknown): boolean => {
  const details = event && typeof event === 'object' ? event as Record<string, unknown> : {};
  const error = details.error && typeof details.error === 'object'
    ? details.error as Record<string, unknown>
    : {};
  const status = String(error.status ?? details.status ?? '');
  const message = [details.message, details.error, error.message]
    .map((value) => typeof value === 'string' ? value.toLowerCase() : '')
    .join(' ');
  return status === '401' || status === '403' ||
    message.includes('unauthorized') ||
    message.includes('domain validation') ||
    message.includes('token rejected');
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

const createMarkerHtml = (point: MapplsPoint): string => generateMarkerHtml(point);

const observeAvatarMarkerImages = (container: HTMLElement): (() => void) => {
  if (typeof MutationObserver === 'undefined') return () => undefined;

  const observedImages = new WeakSet<HTMLImageElement>();
  const attachErrorFallback = (image: HTMLImageElement) => {
    if (observedImages.has(image)) return;
    observedImages.add(image);
    image.dataset.sahadhyayiAvatarObserved = 'true';
    image.addEventListener('error', () => image.remove(), { once: true });
  };
  const scan = (root: ParentNode) => {
    if (root instanceof HTMLImageElement && root.hasAttribute('data-sahadhyayi-avatar')) {
      attachErrorFallback(root);
    }
    root.querySelectorAll?.('img[data-sahadhyayi-avatar]').forEach((image) => {
      attachErrorFallback(image as HTMLImageElement);
    });
  };

  scan(container);
  const observer = new MutationObserver((records) => {
    records.forEach((record) => {
      record.addedNodes.forEach((node) => {
        if (node instanceof HTMLElement) scan(node);
      });
    });
  });
  observer.observe(container, { childList: true, subtree: true });
  return () => observer.disconnect();
};

const getMarkerSignature = (point: MapplsPoint) => JSON.stringify([
  point.id,
  point.lat,
  point.lng,
  point.title,
  point.markerType ?? 'avatar',
  point.category ?? '',
  point.description ?? '',
  point.avatarUrl ?? '',
  point.avatarSeed ?? '',
]);

const getPointBoundsSignature = (points: MapplsPoint[]) => JSON.stringify(
  points.map((point) => [point.id, point.lat, point.lng]).sort((a, b) => String(a[0]).localeCompare(String(b[0]))),
);

const removeMarker = (map: MapplsRuntimeMap, marker: MapplsRuntimeMarker) => {
  if (typeof window.mappls?.remove === 'function') {
    try {
      window.mappls.remove({ map, layer: marker });
      return;
    } catch {
      // Some SDK builds expose remove but reject a marker created by another build.
    }
  }

  try {
    marker.remove?.();
  } catch {
    // Map teardown remains the final cleanup fallback.
  }
};

const removeMarkers = (map: MapplsRuntimeMap, markers: Map<string, MapplsMarkerRecord>) => {
  markers.forEach(({ marker }) => removeMarker(map, marker));
  markers.clear();
};

const isValidPoint = (point: MapplsPoint) =>
  typeof point.id === 'string' &&
  point.id.trim().length > 0 &&
  typeof point.title === 'string' &&
  point.title.trim().length > 0 &&
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
  onMarkerClick,
  onMapActionsReady,
  showFloatingControls = false,
  hasUserLocation,
  onRecenterRequested,
  className,
}: MapplsMapProps) {
  const generatedId = useId().replace(/:/g, '');
  const containerId = `mappls-map-${generatedId}`;
  const mapElement = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<MapplsRuntimeMap | null>(null);
  const markers = useRef<Map<string, MapplsMarkerRecord>>(new Map());
  const lastBoundsSignature = useRef('');
  const onMarkerClickRef = useRef(onMarkerClick);
  onMarkerClickRef.current = onMarkerClick;
  const onMapActionsReadyRef = useRef(onMapActionsReady);
  onMapActionsReadyRef.current = onMapActionsReady;
  const is3DActive = useRef(false);
  const [is3DState, setIs3DState] = useState(false);
  const [mapActions, setMapActions] = useState<MapplsMapActions | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error' | 'missing-key'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [mapWarning, setMapWarning] = useState('');
  const [markerIssue, setMarkerIssue] = useState('');
  const [markerRetryCount, setMarkerRetryCount] = useState(0);
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
      setMapWarning('');
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
              pitch: 0,
              bearing: 0,
              maxPitch: 85,
              pitchWithRotate: true,
              dragRotate: true,
              rotateControl: true,
              zoomControl: false,
              token_callback: tokenCallback,
            });
            mapInstance.current = map;
          } catch (error) {
            reportFatalError(error instanceof Error ? error.message : 'Map initialization failed.');
            return;
          }

          const markReady = () => {
            if (cancelled || hasFatalError) return;
            setMapWarning('');
            if (markedReady) return;
            markedReady = true;
            setErrorMessage('');
            setStatus('ready');
            window.requestAnimationFrame(() => {
              if (cancelled) return;
              try {
                map.resize?.();
              } catch (error) {
                console.warn('Mappls resize after load failed; the map will retry on the next layout change:', error);
              }
            });

            const actions: MapplsMapActions = {
              zoomIn: () => {
                const runtimeMap = mapInstance.current;
                if (!runtimeMap) return;
                try {
                  if (typeof runtimeMap.zoomIn === 'function') {
                    runtimeMap.zoomIn();
                    return;
                  }
                  const current = typeof runtimeMap.getZoom === 'function' ? runtimeMap.getZoom() : 10;
                  const target = Math.min(Math.round(current) + 1, 22);
                  if (typeof runtimeMap.easeTo === 'function') {
                    runtimeMap.easeTo({ zoom: target, duration: 300 });
                  } else if (typeof runtimeMap.setZoom === 'function') {
                    runtimeMap.setZoom(target);
                  }
                } catch (e) {
                  console.warn('Mappls zoom in error:', e);
                }
              },
              zoomOut: () => {
                const runtimeMap = mapInstance.current;
                if (!runtimeMap) return;
                try {
                  if (typeof runtimeMap.zoomOut === 'function') {
                    runtimeMap.zoomOut();
                    return;
                  }
                  const current = typeof runtimeMap.getZoom === 'function' ? runtimeMap.getZoom() : 10;
                  const target = Math.max(Math.round(current) - 1, 2);
                  if (typeof runtimeMap.easeTo === 'function') {
                    runtimeMap.easeTo({ zoom: target, duration: 300 });
                  } else if (typeof runtimeMap.setZoom === 'function') {
                    runtimeMap.setZoom(target);
                  }
                } catch (e) {
                  console.warn('Mappls zoom out error:', e);
                }
              },
              setZoom: (targetZoom: number) => {
                const runtimeMap = mapInstance.current;
                if (!runtimeMap) return;
                try {
                  if (typeof runtimeMap.easeTo === 'function') {
                    runtimeMap.easeTo({ zoom: targetZoom, duration: 300 });
                  } else if (typeof runtimeMap.setZoom === 'function') {
                    runtimeMap.setZoom(targetZoom);
                  }
                } catch (e) {
                  console.warn('Mappls setZoom error:', e);
                }
              },
              getZoom: () => {
                const runtimeMap = mapInstance.current;
                return typeof runtimeMap?.getZoom === 'function' ? runtimeMap.getZoom() : 10;
              },
              toggle3D: () => {
                const runtimeMap = mapInstance.current;
                if (!runtimeMap) return false;
                const next3D = !is3DActive.current;
                is3DActive.current = next3D;
                setIs3DState(next3D);
                const targetPitch = next3D ? 60 : 0;
                const targetBearing = next3D ? 15 : 0;
                try {
                  if (typeof runtimeMap.easeTo === 'function') {
                    runtimeMap.easeTo({ pitch: targetPitch, bearing: targetBearing, duration: 800 });
                  } else {
                    if (typeof runtimeMap.setPitch === 'function') {
                      runtimeMap.setPitch(targetPitch);
                    } else if (typeof runtimeMap.setTilt === 'function') {
                      runtimeMap.setTilt(targetPitch);
                    }
                    if (typeof runtimeMap.setBearing === 'function') {
                      runtimeMap.setBearing(targetBearing);
                    }
                  }
                } catch (e) {
                  console.warn('Mappls 3D toggle error:', e);
                }
                return next3D;
              },
              set3D: (enable3D: boolean) => {
                const runtimeMap = mapInstance.current;
                if (!runtimeMap) return;
                is3DActive.current = enable3D;
                setIs3DState(enable3D);
                const targetPitch = enable3D ? 60 : 0;
                const targetBearing = enable3D ? 15 : 0;
                try {
                  if (typeof runtimeMap.easeTo === 'function') {
                    runtimeMap.easeTo({ pitch: targetPitch, bearing: targetBearing, duration: 800 });
                  } else {
                    if (typeof runtimeMap.setPitch === 'function') {
                      runtimeMap.setPitch(targetPitch);
                    } else if (typeof runtimeMap.setTilt === 'function') {
                      runtimeMap.setTilt(targetPitch);
                    }
                    if (typeof runtimeMap.setBearing === 'function') {
                      runtimeMap.setBearing(targetBearing);
                    }
                  }
                } catch (e) {
                  console.warn('Mappls set3D error:', e);
                }
              },
              is3D: () => is3DActive.current,
              recenter: (coords?: { lat: number; lng: number } | null) => {
                const runtimeMap = mapInstance.current;
                if (!runtimeMap) return;
                const target = coords ?? center;
                if (!target || !isValidPoint({ id: 'target', title: 'Target', lat: target.lat, lng: target.lng })) {
                  return;
                }
                try {
                  if (typeof runtimeMap.flyTo === 'function') {
                    runtimeMap.flyTo({ center: { lat: target.lat, lng: target.lng }, zoom: 12, duration: 1000 });
                  } else if (typeof runtimeMap.easeTo === 'function') {
                    runtimeMap.easeTo({ center: { lat: target.lat, lng: target.lng }, zoom: 12, duration: 800 });
                  } else if (typeof runtimeMap.setCenter === 'function') {
                    runtimeMap.setCenter({ lat: target.lat, lng: target.lng });
                    runtimeMap.setZoom?.(12);
                  }
                } catch (e) {
                  console.warn('Mappls recenter error:', e);
                }
              },
              resetView: () => {
                const runtimeMap = mapInstance.current;
                if (!runtimeMap) return;
                is3DActive.current = false;
                setIs3DState(false);
                try {
                  if (typeof runtimeMap.easeTo === 'function') {
                    runtimeMap.easeTo({ pitch: 0, bearing: 0, duration: 600 });
                  } else {
                    runtimeMap.setPitch?.(0);
                    runtimeMap.setTilt?.(0);
                    runtimeMap.setBearing?.(0);
                  }
                } catch {
                  // non-critical
                }

                const validPoints = points.filter(isValidPoint);
                if (validPoints.length > 1 && typeof window.mappls?.fitBounds === 'function') {
                  try {
                    const boundsData = validPoints.map((p) => ({ lat: p.lat, lng: p.lng }));
                    new window.mappls.fitBounds({ map: runtimeMap, bounds: boundsData });
                    return;
                  } catch {
                    // fallback to India center
                  }
                }
                const defaultCenter = { lat: 22.9734, lng: 78.6569 };
                try {
                  if (typeof runtimeMap.flyTo === 'function') {
                    runtimeMap.flyTo({ center: defaultCenter, zoom: 5, duration: 800 });
                  } else if (typeof runtimeMap.setCenter === 'function') {
                    runtimeMap.setCenter(defaultCenter);
                    runtimeMap.setZoom?.(5);
                  }
                } catch {
                  // non-critical
                }
              },
              fitAllPoints: () => {
                const runtimeMap = mapInstance.current;
                if (!runtimeMap) return;
                const validPoints = points.filter(isValidPoint);
                if (validPoints.length > 1 && typeof window.mappls?.fitBounds === 'function') {
                  try {
                    const boundsData = validPoints.map((p) => ({ lat: p.lat, lng: p.lng }));
                    new window.mappls.fitBounds({ map: runtimeMap, bounds: boundsData });
                  } catch {
                    // non-critical
                  }
                }
              },
              getRawMap: () => mapInstance.current,
            };

            setMapActions(actions);
            onMapActionsReadyRef.current?.(actions);
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

          if (!addMapListener('error', (event) => {
            const message = getMapEventMessage(event);
            // The SDK emits "error" for tile/source/resource failures as well as
            // authentication failures. Only rejected credentials should block the
            // map; transient tile failures must not hide working controls/markers.
            if (isAuthorizationMapEvent(event)) {
              reportFatalError(message);
            } else if (!cancelled) {
              console.warn('Mappls reported a recoverable map resource error:', message);
              setMapWarning('Some map tiles or resources did not load. The map is still available; retry if the issue continues.');
            }
          })) {
            reportFatalError('The loaded Mappls SDK does not expose the documented map event API.');
            return;
          }

          addMapListener('webglcontextlost', () => {
            if (cancelled) return;
            setErrorMessage('Map rendering paused because the browser lost its WebGL context. Retry the map or reload the page.');
            setStatus('error');
          });

          addMapListener('webglcontextrestored', () => {
            if (cancelled) return;
            hasFatalError = false;
            setErrorMessage('');
            setStatus('ready');
            window.requestAnimationFrame(() => {
              try {
                map.resize?.();
              } catch (error) {
                console.warn('Mappls resize after WebGL recovery failed:', error);
              }
            });
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

    const handleWindowResize = () => {
      const container = mapElement.current;
      if (!container || container.clientWidth === 0 || container.clientHeight === 0) return;
      if (mapInstance.current) {
        try {
          mapInstance.current.resize?.();
        } catch {
          // Resize failures are recoverable and should not destroy the map.
        }
      } else {
        initializeMap();
      }
    };
    window.addEventListener('resize', handleWindowResize);

    const currentMarkers = markers.current;
    initializeMap();

    return () => {
      cancelled = true;
      observer?.disconnect();
      window.removeEventListener('resize', handleWindowResize);

      const map = mapInstance.current;
      if (map) {
        removeMarkers(map, currentMarkers);
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
      try {
        map.setCenter?.({ lat: center.lat, lng: center.lng });
      } catch (error) {
        console.warn('Mappls could not update its center:', error);
      }
    }
  }, [center, status]);

  useEffect(() => {
    const container = mapElement.current;
    if (status !== 'ready' || !container) return;
    return observeAvatarMarkerImages(container);
  }, [status]);

  useEffect(() => {
    const map = mapInstance.current;
    const MarkerConstructor = window.mappls?.Marker;
    if (status !== 'ready' || !map || !MarkerConstructor) return;

    const validPoints = points.filter(isValidPoint);
    const desiredPoints = new Map(validPoints.map((point) => [point.id, point]));
    let failedMarkers = 0;

    // Remove only disappeared or changed markers. This keeps avatar nodes stable
    // across React renders and avoids accumulating SDK layers over time.
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
        const marker = new MarkerConstructor({
          map,
          position: { lat: point.lat, lng: point.lng },
          title: point.title,
          // Mappls' HTML marker API is fed a markup string. Passing a DOM node
          // through a custom toString() fallback causes some SDK builds to use
          // their stock question-mark icon instead of the supplied avatar.
          html: createMarkerHtml(point),
          // Compact the HTML marker on phones to prevent avatar overflow.
          width: window.matchMedia('(max-width: 640px)').matches ? 48 : 58,
          height: window.matchMedia('(max-width: 640px)').matches ? 58 : 68,
          offset: [0, window.matchMedia('(max-width: 640px)').matches ? -8 : -12],
          popupHtml,
        });
        try {
          marker.addListener?.('click', () => onMarkerClickRef.current?.(point));
        } catch (error) {
          console.warn('Mappls marker click listener could not be attached:', error);
        }
        try {
          marker.on?.('click', () => onMarkerClickRef.current?.(point));
        } catch {
          // Ignore
        }
        markers.current.set(point.id, { marker, signature: getMarkerSignature(point) });
      } catch (error) {
        failedMarkers += 1;
        console.error('Mappls could not create a reader avatar marker:', error);
      }
    });

    setMarkerIssue(failedMarkers > 0
      ? `${failedMarkers} reader marker${failedMarkers === 1 ? '' : 's'} could not be added. The map is still usable; retry marker loading.`
      : '');

    const boundsSignature = getPointBoundsSignature(validPoints);
    if (boundsSignature !== lastBoundsSignature.current) {
      lastBoundsSignature.current = boundsSignature;

      try {
        if (validPoints.length === 1) {
          map.setCenter?.({ lat: validPoints[0].lat, lng: validPoints[0].lng });
          map.setZoom?.(13);
        } else if (validPoints.length > 1) {
          const fitBounds = window.mappls?.fitBounds;
          const bounds = validPoints.map((point) => [point.lng, point.lat]);

          if (fitBounds) {
            new fitBounds({
              map,
              cType: 0,
              bounds,
              options: { padding: 96, duration: 650 },
            });
          } else {
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
      } catch (error) {
        console.warn('Mappls could not fit all reader markers; using an approximate center:', error);
        if (validPoints.length > 1) {
          const averageCenter = validPoints.reduce(
            (result, point) => ({
              lat: result.lat + point.lat / validPoints.length,
              lng: result.lng + point.lng / validPoints.length,
            }),
            { lat: 0, lng: 0 },
          );
          try {
            map.setCenter?.(averageCenter);
            map.setZoom?.(5);
          } catch {
            // The map remains interactive even if camera adjustment fails.
          }
        }
      }
    }
  }, [points, status, markerRetryCount]);

  useEffect(() => {
    const el = mapElement.current;
    if (!el || !mapActions) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        mapActions.zoomIn();
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        mapActions.zoomOut();
      } else if (e.key === '3') {
        e.preventDefault();
        mapActions.toggle3D();
      } else if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        mapActions.resetView();
      }
    };

    el.addEventListener('keydown', handleKeyDown);
    return () => {
      el.removeEventListener('keydown', handleKeyDown);
    };
  }, [mapActions]);

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
      <style>{`
        .sahadhyayi-reader-map-marker {
          cursor: pointer !important;
          pointer-events: auto !important;
          user-select: none !important;
        }
        .sahadhyayi-reader-map-marker img {
          border-radius: 50% !important;
          object-fit: cover !important;
          max-width: 100% !important;
          max-height: 100% !important;
        }
        @media (max-width: 640px) {
          .sahadhyayi-reader-map-marker {
            width: 48px !important;
            height: 58px !important;
            max-width: 48px !important;
            max-height: 58px !important;
          }
          .sahadhyayi-reader-map-marker > div:first-child {
            width: 44px !important;
            height: 44px !important;
            flex-basis: 44px !important;
          }
        }
        /* Suppress Mappls SDK duplicate default controls so our floating controls are clean and responsive */
        .maplibregl-ctrl-top-right,
        .mapboxgl-ctrl-top-right,
        .mappls-ctrl-top-right,
        .maplibregl-ctrl-bottom-right,
        .mapboxgl-ctrl-bottom-right,
        .mappls-ctrl-bottom-right {
          display: none !important;
        }
      `}</style>
      <div
        id={containerId}
        ref={mapElement}
        role="region"
        className={className || "h-[500px] w-full overflow-hidden rounded-xl border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C442D] dark:focus-visible:ring-[#D5B16D]"}
        aria-label="Interactive Mappls map"
        title="Interactive Mappls map. Use plus (+) and minus (-) or underscore (_) keys to zoom, 3 to toggle 3D view, or r to reset view."
      />
      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/80" aria-label="Loading map" aria-busy="true">
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
      {status === 'ready' && markerIssue && (
        <div className={`absolute ${mapWarning ? 'bottom-16' : 'bottom-4'} left-4 right-4 flex items-center justify-between gap-3 rounded-lg border border-amber-300 bg-background/95 px-3 py-2 text-xs shadow`} role="status">
          <span>{markerIssue}</span>
          <button type="button" onClick={() => setMarkerRetryCount((count) => count + 1)} className="shrink-0 underline underline-offset-2">
            Retry markers
          </button>
        </div>
      )}
      {status === 'ready' && mapWarning && (
        <div className={`absolute ${markerIssue ? 'bottom-16' : 'bottom-4'} left-4 right-4 rounded-lg border border-amber-300 bg-background/95 px-3 py-2 text-xs shadow`} role="status">
          {mapWarning}
        </div>
      )}
      {status === 'ready' && validPointCount === 0 && (
        <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-lg bg-background/95 px-4 py-2 text-sm shadow">
          {emptyMessage}
        </div>
      )}
      {showFloatingControls && status === 'ready' && mapActions && (
        <MapFloatingControls
          hasUserLocation={Boolean(hasUserLocation ?? center)}
          is3D={is3DState}
          onToggle3D={() => mapActions.toggle3D()}
          onZoomIn={() => mapActions.zoomIn()}
          onZoomOut={() => mapActions.zoomOut()}
          onRecenter={() => {
            if (onRecenterRequested) {
              onRecenterRequested();
            } else if (center) {
              mapActions.recenter(center);
            }
          }}
          onResetView={() => mapActions.resetView()}
        />
      )}
    </div>
  );
}
