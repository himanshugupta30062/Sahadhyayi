import { useEffect, useId, useRef, useState } from 'react';

declare global {
  interface Window {
    mappls?: any;
    mapplsLoadingPromise?: Promise<void>;
    L?: any;
    leafletLoadingPromise?: Promise<void>;
  }
}

export interface MapplsPoint {
  id: string;
  lat: number;
  lng: number;
  title: string;
  description?: string;
}

interface MapplsMapProps {
  apiKey: string;
  points: MapplsPoint[];
  center?: { lat: number; lng: number } | null;
  emptyMessage?: string;
}

const loadMappls = (apiKey: string): Promise<void> => {
  if (window.mappls?.Map && window.mappls?.Marker) return Promise.resolve();
  if (window.mapplsLoadingPromise) return window.mapplsLoadingPromise;

  window.mapplsLoadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://sdk.mappls.com/map/sdk/web?v=3.0&access_token=${encodeURIComponent(apiKey)}`;
    script.async = true;
    script.defer = true;
    script.dataset.mapplsSdk = 'true';

    const resetPromise = () => {
      window.mapplsLoadingPromise = undefined;
      script.remove();
    };

    script.onload = () => {
      if (window.mappls?.Map && window.mappls?.Marker) {
        resolve();
      } else {
        resetPromise();
        reject(new Error('Mappls SDK loaded, but the map API was not available. Verify that this key is enabled for Web Maps.'));
      }
    };
    script.onerror = () => {
      resetPromise();
      reject(new Error('Mappls SDK could not be downloaded. Verify the static key, Web Maps access, and allowed domains.'));
    };
    document.head.appendChild(script);
  });

  return window.mapplsLoadingPromise;
};


const loadLeaflet = (): Promise<void> => {
  if (window.L?.map) return Promise.resolve();
  if (window.leafletLoadingPromise) return window.leafletLoadingPromise;

  window.leafletLoadingPromise = new Promise((resolve, reject) => {
    if (!document.querySelector('link[data-leaflet-css]')) {
      const css = document.createElement('link');
      css.rel = 'stylesheet';
      css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      css.dataset.leafletCss = 'true';
      document.head.appendChild(css);
    }
    const existing = document.querySelector<HTMLScriptElement>('script[data-leaflet-sdk]');
    const script = existing ?? document.createElement('script');
    const reset = () => {
      window.leafletLoadingPromise = undefined;
      if (!window.L?.map) script.remove();
    };
    script.onload = () => window.L?.map ? resolve() : (reset(), reject(new Error('Fallback map library did not initialize.')));
    script.onerror = () => (reset(), reject(new Error('Fallback map library could not be downloaded.')));
    if (!existing) {
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      script.dataset.leafletSdk = 'true';
      document.head.appendChild(script);
    }
  });
  return window.leafletLoadingPromise;
};

function LeafletFallback({ points, center }: { points: MapplsPoint[]; center?: { lat: number; lng: number } | null }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<any>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let cancelled = false;
    loadLeaflet().then(() => {
      if (cancelled || !mapRef.current || instanceRef.current) return;
      const L = window.L;
      const initial = center ?? { lat: 22.9734, lng: 78.6569 };
      const map = L.map(mapRef.current, { scrollWheelZoom: false }).setView([initial.lat, initial.lng], center ? 10 : 5);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);
      const valid = points.filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lng) && Math.abs(p.lat) <= 90 && Math.abs(p.lng) <= 180 && !(p.lat === 0 && p.lng === 0));
      valid.forEach(p => {
        const marker = L.circleMarker([p.lat, p.lng], { radius: 7, color: '#2563eb', fillColor: '#60a5fa', fillOpacity: 0.9 }).addTo(map);
        const popup = document.createElement('div');
        popup.textContent = p.title + (p.description ? ' — ' + p.description : '');
        marker.bindPopup(popup);
      });
      if (valid.length === 1) map.setView([valid[0].lat, valid[0].lng], 10);
      else if (valid.length > 1) {
        const bounds = L.latLngBounds(valid.map(p => [p.lat, p.lng]));
        map.fitBounds(bounds, { padding: [30, 30], maxZoom: 12 });
      }
      instanceRef.current = map;
      window.setTimeout(() => map.invalidateSize(), 0);
    }).catch(() => { if (!cancelled) setFailed(true); });
    return () => {
      cancelled = true;
      instanceRef.current?.remove();
      instanceRef.current = null;
    };
  }, [points, center]);
  return (
    <div className="space-y-2">
      <div ref={mapRef} className="h-[500px] w-full overflow-hidden rounded-xl border" aria-label="Interactive OpenStreetMap fallback" />
      <p className="text-xs text-muted-foreground">
        {failed ? 'The map service could not load. Please check your connection and retry.' : 'Using OpenStreetMap fallback because Mappls is unavailable.'}
      </p>
    </div>
  );
}

export function MapplsMap({
  apiKey,
  points,
  center,
  emptyMessage = 'No shared reader locations are available yet.',
}: MapplsMapProps) {
  const generatedId = useId().replace(/:/g, '');
  const containerId = `mappls-map-${generatedId}`;
  const mapElement = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markers = useRef<any[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error' | 'missing-key'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let cancelled = false;

    if (!apiKey.trim()) {
      setStatus('missing-key');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    loadMappls(apiKey)
      .then(() => {
        if (cancelled || !mapElement.current || mapInstance.current) return;
        const initialCenter = center ?? { lat: 22.9734, lng: 78.6569 };
        // The Web SDK examples initialize the map using the container element's ID.
        mapInstance.current = new window.mappls!.Map(containerId, {
          center: { lat: initialCenter.lat, lng: initialCenter.lng },
          zoom: center ? 10 : 4,
        });
        setStatus('ready');
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setErrorMessage(error instanceof Error ? error.message : 'Map could not be loaded.');
        setStatus('error');
      });

    return () => {
      cancelled = true;
      markers.current.forEach((marker) => {
        try {
          marker.remove?.();
          marker.setMap?.(null);
        } catch {
          // Ignore SDK-specific cleanup differences.
        }
      });
      markers.current = [];
      try {
        mapInstance.current?.remove?.();
        mapInstance.current?.destroy?.();
      } catch {
        // Some SDK builds do not expose explicit map disposal.
      }
      mapInstance.current = null;
    };
    // Recreate only when the key/container changes; center changes are handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey, containerId]);

  useEffect(() => {
    const map = mapInstance.current;
    if (status !== 'ready' || !map) return;
    if (center && Number.isFinite(center.lat) && Number.isFinite(center.lng)) {
      map.setCenter?.({ lat: center.lat, lng: center.lng });
    }
  }, [center, status]);

  useEffect(() => {
    const map = mapInstance.current;
    if (status !== 'ready' || !map || !window.mappls?.Marker) return;

    markers.current.forEach((marker) => {
      try {
        marker.remove?.();
        marker.setMap?.(null);
      } catch {
        // Some SDK versions remove markers when their map is disposed.
      }
    });
    markers.current = [];

    const validPoints = points.filter(
      (point) =>
        Number.isFinite(point.lat) &&
        Number.isFinite(point.lng) &&
        Math.abs(point.lat) <= 90 &&
        Math.abs(point.lng) <= 180 &&
        !(point.lat === 0 && point.lng === 0),
    );

    validPoints.forEach((point) => {
      const marker = new window.mappls!.Marker({
        map,
        position: { lat: point.lat, lng: point.lng },
        title: point.title,
      });
      markers.current.push(marker);
    });

    if (validPoints.length === 1) {
      map.setCenter?.({ lat: validPoints[0].lat, lng: validPoints[0].lng });
      map.setZoom?.(10);
    } else if (validPoints.length > 1 && window.mappls?.LatLngBounds) {
      const bounds = new window.mappls.LatLngBounds();
      validPoints.forEach((point) => bounds.extend({ lat: point.lat, lng: point.lng }));
      map.fitBounds?.(bounds);
    }
  }, [points, status]);

  if (status === 'missing-key') {
    return (
      <div className="flex h-[500px] items-center justify-center rounded-xl border bg-muted/30 p-6 text-center">
        <div className="max-w-md space-y-2">
          <p className="font-semibold">Mappls is not configured yet</p>
          <p className="text-sm text-muted-foreground">
            Add VITE_MAPPLS_API_KEY to the Cloudflare Pages build environment, enable the Mappls Web Maps SDK,
            and allow sahadhyayi.com and www.sahadhyayi.com in the Mappls Console.
          </p>
          <a className="text-sm underline" href="https://auth.mappls.com/console" target="_blank" rel="noreferrer">
            Open Mappls developer console
          </a>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return <LeafletFallback points={points} center={center} />;
  }

  const validPointCount = points.filter(
    (point) =>
      Number.isFinite(point.lat) &&
      Number.isFinite(point.lng) &&
      Math.abs(point.lat) <= 90 &&
      Math.abs(point.lng) <= 180 &&
      !(point.lat === 0 && point.lng === 0),
  ).length;

  return (
    <div className="relative">
      <div
        id={containerId}
        ref={mapElement}
        className="h-[500px] w-full overflow-hidden rounded-xl border"
        aria-label="Interactive Mappls map"
      />
      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/80">
          <p className="text-sm text-muted-foreground">Loading Mappls map…</p>
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
