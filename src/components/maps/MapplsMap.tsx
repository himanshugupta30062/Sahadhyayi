import { useEffect, useId, useRef, useState, useCallback, useMemo } from 'react';

interface MapplsRuntimeMap {
  addListener?: (eventName: string, callback: (event?: unknown) => void) => unknown;
  on?: (eventName: string, callback: (event?: unknown) => void) => unknown;
  loaded?: () => boolean;
  setCenter?: (center: { lat: number; lng: number }) => void;
  setZoom?: (zoom: number) => void;
  resize?: () => void;
  remove?: () => void;
  getZoom?: () => number;
  getCenter?: () => { lat: number; lng: number };
}

interface MapplsRuntimeMarker {
  [key: string]: unknown;
}

interface MapplsRuntime {
  Map?: new (container: string | HTMLElement, options: Record<string, unknown>) => MapplsRuntimeMap;
  Marker?: new (options: Record<string, unknown>) => MapplsRuntimeMarker;
  fitBounds?: new (options: Record<string, unknown>) => unknown;
  remove?: (options: { map: MapplsRuntimeMap; layer: MapplsRuntimeMarker }) => void;
  Cluster?: new (options: Record<string, unknown>) => MapplsRuntimeMarker;
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
  isCurrentUser?: boolean;
  isFriend?: boolean;
  readingStatus?: string;
  clusterCount?: number;
}

interface MapplsMapProps {
  apiKey: string;
  points: MapplsPoint[];
  center?: { lat: number; lng: number } | null;
  emptyMessage?: string;
  onMarkerClick?: (point: MapplsPoint) => void;
  onMapReady?: () => void;
  onMapError?: (error: string) => void;
  enableClustering?: boolean;
  maxClusterZoom?: number;
}

const SDK_URL = 'https://sdk.mappls.com/map/sdk/web?v=3.0';
const SDK_LOAD_TIMEOUT_MS = 15_000;

const loadMappls = (apiKey: string): Promise<void> => {
  if (window.mappls?.Map && window.mappls?.Marker) {
    if (window.mapplsLoadingKey && window.mapplsLoadingKey !== apiKey) {
      return Promise.reject(new Error('A different Mappls key is already active in this page. Reload the page after changing the key.'));
    }
    return Promise.resolve();
  }

  if (window.mapplsLoadingPromise) {
    if (window.mapplsLoadingKey !== apiKey) {
      return Promise.reject(new Error('A Mappls SDK request is already loading with a different key. Reload the page and try again.'));
    }
    return window.mapplsLoadingPromise;
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
  .replace(/&/g, '&')
  .replace(/</g, '<')
  .replace(/>/g, '>')
  .replace(/"/g, '"')
  .replace(/'/g, '&' + '#39;');

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

const createAvatarMarkerHtml = (point: MapplsPoint, isSelected: boolean = false, zoom: number = 10): string => {
  const avatarUrl = getSafeAvatarUrl(point.avatarUrl);
  const initial = escapeHtml((point.title.trim().charAt(0) || 'R').toUpperCase());

  // Determine border color based on point type
  let borderColor = '#1C442D';
  if (point.isCurrentUser) borderColor = '#D5B16D';
  else if (point.isFriend) borderColor = '#10b981';
  else if (point.clusterCount) borderColor = '#8b5cf6';

  // Adjust size based on zoom and selection
  let size = 44;
  if (isSelected) size = 52;
  else if (point.clusterCount) size = Math.max(44, Math.min(60, 44 + Math.log2(point.clusterCount) * 4));

  const avatarContent = avatarUrl
    ? `<img src="${escapeHtml(avatarUrl)}" alt="" style="display:block;width:100%;height:100%;object-fit:cover;border-radius:50%;" loading="lazy" />`
    : `<span aria-hidden="true" style="display:flex;width:100%;height:100%;align-items:center;justify-content:center;border-radius:50%;background:#E8EFE9;color:#1C442D;font:700 ${Math.round(size * 0.36)}px/1 system-ui,sans-serif;">${initial}</span>`;

  const selectedRing = isSelected
    ? 'box-shadow:0 0 0 3px #fff,0 0 0 6px ${borderColor},0 4px 16px rgba(0,0,0,.35);'
    : 'box-shadow:0 2px 8px rgba(0,0,0,.28);';

  // Status ring for current user
  const statusRing = point.isCurrentUser
    ? '<div style="position:absolute;bottom:-2px;right:-2px;width:14px;height:14px;background:#10b981;border:3px solid #fff;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,.2);" aria-label="You are here"></div>'
    : '';

  // Cluster count badge
  const clusterBadge = point.clusterCount && point.clusterCount > 1
    ? `<div style="position:absolute;top:-4px;right:-4px;min-width:20px;height:20px;background:#8b5cf6;color:#fff;border-radius:9999px;display:flex;align-items:center;justify-content:center;padding:0 6px;font:600 11px/1 system-ui,sans-serif;box-shadow:0 2px 6px rgba(139,92,246,.4);">${point.clusterCount}</div>`
    : '';

  return `<div title="${escapeHtml(point.title)}" style="box-sizing:border-box;width:${size}px;height:${size}px;overflow:hidden;border:3px solid ${borderColor};border-radius:50%;background:#fff;${selectedRing}position:relative;cursor:pointer;transition:transform 0.15s ease, box-shadow 0.15s ease;">${avatarContent}${statusRing}${clusterBadge}</div>`;
};

const createClusterMarkerHtml = (count: number): string => {
  const size = Math.max(44, Math.min(70, 44 + Math.log2(count) * 5));
  return `<div style="box-sizing:border-box;width:${size}px;height:${size}px;border:3px solid #8b5cf6;border-radius:50%;background:linear-gradient(135deg,#8b5cf6,#a855f7);color:#fff;display:flex;align-items:center;justify-content:center;font:700 ${Math.round(size * 0.35)}px/1 system-ui,sans-serif;box-shadow:0 4px 16px rgba(139,92,246,.4);cursor:pointer;">${count}</div>`;
};

const removeMarkers = (map: MapplsRuntimeMap, markers: MapplsRuntimeMarker[]) => {
  markers.forEach((marker) => {
    try {
      window.mappls?.remove?.({ map, layer: marker });
    } catch {
      // map.remove() on teardown also disposes any remaining marker layers.
    }
  });
};

const isValidPoint = (point: MapplsPoint) =>
  Number.isFinite(point.lat) &&
  Number.isFinite(point.lng) &&
  Math.abs(point.lat) <= 90 &&
  Math.abs(point.lng) <= 180 &&
  !(point.lat === 0 && point.lng === 0);

// Simple clustering algorithm for client-side clustering
const clusterPoints = (points: MapplsPoint[], zoom: number, maxClusterZoom: number): MapplsPoint[] => {
  if (zoom >= maxClusterZoom) return points;

  const clustered: MapplsPoint[] = [];
  const processed = new Set<string>();
  const clusterRadius = 0.01 * Math.pow(2, maxClusterZoom - zoom); // degrees

  points.forEach(point => {
    if (processed.has(point.id)) return;
    if (point.clusterCount) {
      clustered.push(point);
      processed.add(point.id);
      return;
    }

    const nearby = points.filter(p =>
      !processed.has(p.id) &&
      p.id !== point.id &&
      Math.abs(p.lat - point.lat) < clusterRadius &&
      Math.abs(p.lng - point.lng) < clusterRadius
    );

    if (nearby.length > 0) {
      const clusterPoints = [point, ...nearby];
      const avgLat = clusterPoints.reduce((sum, p) => sum + p.lat, 0) / clusterPoints.length;
      const avgLng = clusterPoints.reduce((sum, p) => sum + p.lng, 0) / clusterPoints.length;

      clustered.push({
        id: `cluster-${point.id}`,
        lat: avgLat,
        lng: avgLng,
        title: `${clusterPoints.length} readers`,
        description: `${clusterPoints.length} readers nearby`,
        clusterCount: clusterPoints.length,
        avatarUrl: null,
      });

      clusterPoints.forEach(p => processed.add(p.id));
    } else {
      clustered.push(point);
      processed.add(point.id);
    }
  });

  return clustered;
};

export function MapplsMap({
  apiKey,
  points,
  center,
  emptyMessage = 'No shared reader locations are available yet.',
  onMarkerClick,
  onMapReady,
  onMapError,
  enableClustering = true,
  maxClusterZoom = 14,
}: MapplsMapProps) {
  const generatedId = useId().replace(/:/g, '');
  const containerId = `mappls-map-${generatedId}`;
  const mapElement = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<MapplsRuntimeMap | null>(null);
  const markers = useRef<MapplsRuntimeMarker[]>([]);
  const clusterMarkers = useRef<MapplsRuntimeMarker[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error' | 'missing-key'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [currentZoom, setCurrentZoom] = useState(5);
  const currentZoomRef = useRef(currentZoom);
  currentZoomRef.current = currentZoom;
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);

  // Use refs for callbacks to avoid adding them to useEffect dependencies
  const onMapReadyRef = useRef(onMapReady);
  const onMapErrorRef = useRef(onMapError);
  onMapReadyRef.current = onMapReady;
  onMapErrorRef.current = onMapError;

  // Memoize valid points to avoid recalculation
  const validPoints = useMemo(() => points.filter(isValidPoint), [points]);

  // Handle clustering when points or zoom changes
  const displayPoints = useMemo(() => {
    if (!enableClustering || currentZoom >= maxClusterZoom) return validPoints;
    return clusterPoints(validPoints, currentZoom, maxClusterZoom);
  }, [validPoints, currentZoom, enableClustering, maxClusterZoom]);

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
      onMapErrorRef.current?.(message);
    };

    const initializeMap = () => {
      const container = mapElement.current;
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
            onMapReadyRef.current?.();
            window.requestAnimationFrame(() => {
              if (!cancelled) map.resize?.();
            });
          };

          const addMapListener = (eventName: string, callback: (event?: unknown) => void) => {
            if (typeof map.addListener === 'function') {
              map.addListener(eventName, callback);
              return true;
            }
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
          addMapListener('idle', markReady);

          // Track zoom changes for clustering
          const handleZoomChange = () => {
            const newZoom = map.getZoom?.();
            if (newZoom !== undefined && newZoom !== currentZoomRef.current) {
              setCurrentZoom(newZoom);
            }
          };

          const handleCenterChange = () => {
            const newCenter = map.getCenter?.();
            if (newCenter) {
              // Optionally update center state
            }
          };

          addMapListener('zoom_changed', handleZoomChange);
          addMapListener('zoom_end', handleZoomChange);
          addMapListener('center_changed', handleCenterChange);
          addMapListener('idle', handleZoomChange);

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
        removeMarkers(map, clusterMarkers.current);
        markers.current = [];
        clusterMarkers.current = [];
        try {
          map.remove?.();
        } catch {
          // Ignore cleanup differences between SDK builds.
        }
      }
      mapInstance.current = null;
    };
  }, [apiKey, containerId, retryCount, center]);

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

    // Remove existing markers
    removeMarkers(map, markers.current);
    removeMarkers(map, clusterMarkers.current);
    markers.current = [];
    clusterMarkers.current = [];

    displayPoints.forEach((point) => {
      const escapedTitle = point.title
        .replace(/&/g, '&')
        .replace(/</g, '<')
        .replace(/>/g, '>')
        .replace(/"/g, '"')
          .replace(/'/g, '&' + '#39;');
      const escapedDesc = (point.description || '')
        .replace(/&/g, '&')
        .replace(/</g, '<')
        .replace(/>/g, '>')
        .replace(/"/g, '"')
          .replace(/'/g, '&' + '#39;');
      const isSelf = point.isCurrentUser;
      const isSelected = point.id === selectedPointId;
      const badgeHtml = isSelf
        ? '<span style="display:inline-block;padding:2px 6px;margin-bottom:4px;border-radius:9999px;font-size:10px;font-weight:700;background:#DCFCE7;color:#166534;letter-spacing:0.025em;text-transform:uppercase;">You</span>'
        : point.isFriend
          ? '<span style="display:inline-block;padding:2px 6px;margin-bottom:4px;border-radius:9999px;font-size:10px;font-weight:700;background:#D1FAE5;color:#065F46;letter-spacing:0.025em;text-transform:uppercase;">Friend</span>'
          : point.clusterCount
            ? `<span style="display:inline-block;padding:2px 6px;margin-bottom:4px;border-radius:9999px;font-size:10px;font-weight:700;background:#EDE9FE;color:#5B21B6;letter-spacing:0.025em;text-transform:uppercase;">${point.clusterCount} readers</span>`
            : '';

      const readingStatusHtml = point.readingStatus
        ? `<span style="font-size:12px;color:#1C442D;display:block;margin-top:2px;">📖 ${escapeHtml(point.readingStatus)}</span>`
        : '';

      const popupHtml = `<div style="font-family:sans-serif;padding:8px 10px;min-width:160px;color:#1C201D;">${badgeHtml}<strong style="font-size:14px;display:block;">${escapedTitle}</strong>${escapedDesc ? `<span style="font-size:13px;color:#636B65;display:block;margin-top:2px;">${escapedDesc}</span>` : ''}${readingStatusHtml}</div>`;

      try {
        const isCluster = !!point.clusterCount;
        const markerHtml = isCluster ? createClusterMarkerHtml(point.clusterCount!) : createAvatarMarkerHtml(point, isSelected, currentZoom);

        const marker = new MarkerConstructor({
          map,
          position: { lat: point.lat, lng: point.lng },
          title: point.title,
          html: markerHtml,
          width: isCluster ? undefined : (isSelected ? 52 : 44),
          height: isCluster ? undefined : (isSelected ? 52 : 44),
          popupHtml,
        });

        // Add click handler for marker selection
        if (typeof marker.addListener === 'function') {
          marker.addListener('click', () => {
            setSelectedPointId(point.id);
            onMarkerClick?.(point);
          });
        } else if (typeof marker.on === 'function') {
          marker.on('click', () => {
            setSelectedPointId(point.id);
            onMarkerClick?.(point);
          });
        }

        if (isCluster) {
          clusterMarkers.current.push(marker);
        } else {
          markers.current.push(marker);
        }
      } catch {
        setErrorMessage('The map loaded, but one or more reader markers could not be added.');
        setStatus('error');
      }
    });

    // Fit bounds for multiple points
    if (validPoints.length === 1) {
      map.setCenter?.({ lat: validPoints[0].lat, lng: validPoints[0].lng });
      map.setZoom?.(10);
    } else if (validPoints.length > 1) {
      const fitBounds = window.mappls?.fitBounds;
      const bounds = validPoints.map((point) => [point.lng, point.lat]);

      if (fitBounds) {
        try {
          new fitBounds({
            map,
            cType: 0,
            bounds,
            options: { padding: 80, duration: 700 },
          });
        } catch {
          const averageCenter = validPoints.reduce(
            (result, point) => ({ lat: result.lat + point.lat / validPoints.length, lng: result.lng + point.lng / validPoints.length }),
            { lat: 0, lng: 0 },
          );
          map.setCenter?.(averageCenter);
          map.setZoom?.(5);
        }
      } else {
        const averageCenter = validPoints.reduce(
          (result, point) => ({ lat: result.lat + point.lat / validPoints.length, lng: result.lng + point.lng / validPoints.length }),
          { lat: 0, lng: 0 },
        );
        map.setCenter?.(averageCenter);
        map.setZoom?.(5);
      }
    }
  }, [displayPoints, status, currentZoom, selectedPointId, onMarkerClick, validPoints]);

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

  const validPointCount = validPoints.length;

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
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-4 border-[#1C442D] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">Loading Mappls map…</p>
          </div>
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