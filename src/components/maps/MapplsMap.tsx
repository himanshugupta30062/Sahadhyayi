import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    mappls?: any;
    mapplsLoadingPromise?: Promise<void>;
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
    script.onload = () => {
      if (window.mappls?.Map && window.mappls?.Marker) resolve();
      else reject(new Error('Mappls SDK loaded but its map API was not available.'));
    };
    script.onerror = () => {
      window.mapplsLoadingPromise = undefined;
      reject(new Error('Unable to load Mappls Maps SDK. Check the key, web SDK access and domain allowlist.'));
    };
    document.head.appendChild(script);
  });
  return window.mapplsLoadingPromise;
};

export function MapplsMap({
  apiKey,
  points,
  center,
  emptyMessage = 'No shared reader locations are available yet.'
}: MapplsMapProps) {
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

    loadMappls(apiKey)
      .then(() => {
        if (cancelled || !mapElement.current || mapInstance.current) return;
        const initialCenter = center ?? { lat: 22.9734, lng: 78.6569 };
        mapInstance.current = new window.mappls!.Map(mapElement.current, {
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
    };
  }, [apiKey]);

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
        !(point.lat === 0 && point.lng === 0)
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
            Add VITE_MAPPLS_API_KEY to the production build environment, enable the Mappls Web Maps SDK,
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
    return (
      <div className="flex h-[500px] items-center justify-center rounded-xl border bg-muted/30 p-6 text-center">
        <div className="max-w-md space-y-2">
          <p className="font-semibold">Mappls could not load</p>
          <p className="text-sm text-muted-foreground">{errorMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div ref={mapElement} className="h-[500px] w-full overflow-hidden rounded-xl border" aria-label="Interactive Mappls map" />
      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/80">
          <p className="text-sm text-muted-foreground">Loading Mappls map…</p>
        </div>
      )}
      {status === 'ready' && points.filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng) && !(point.lat === 0 && point.lng === 0)).length === 0 && (
        <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-lg bg-background/95 px-4 py-2 text-sm shadow">
          {emptyMessage}
        </div>
      )}
    </div>
  );
}
