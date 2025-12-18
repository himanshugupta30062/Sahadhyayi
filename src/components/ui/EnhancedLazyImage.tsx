import { useState, useEffect, useRef, ReactNode, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface EnhancedLazyImageProps {
  src: string;
  alt: string;
  avif?: string;
  webp?: string;
  className?: string;
  width?: number;
  height?: number;
  placeholderSrc?: string;
  fallback?: ReactNode;
  onLoad?: () => void;
  onError?: () => void;
  priority?: boolean;
  sizes?: string;
  srcSet?: string;
  blurDataUrl?: string;
  retryCount?: number;
}

// Default placeholder SVG as data URL
const DEFAULT_PLACEHOLDER = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23f3f4f6" width="400" height="300"/%3E%3C/svg%3E';

export function EnhancedLazyImage({
  src,
  alt,
  avif,
  webp,
  className,
  width,
  height,
  placeholderSrc,
  fallback,
  onLoad,
  onError,
  priority = false,
  sizes,
  srcSet,
  blurDataUrl,
  retryCount = 2,
}: EnhancedLazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [hasError, setHasError] = useState(false);
  const [retries, setRetries] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || !containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '100px', // Start loading 100px before visible
        threshold: 0.01,
      }
    );

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [priority]);

  // Handle successful load
  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    setHasError(false);
    onLoad?.();
  }, [onLoad]);

  // Handle error with retry logic
  const handleError = useCallback(() => {
    if (retries < retryCount) {
      // Retry after a short delay
      setTimeout(() => {
        setRetries((r) => r + 1);
        // Force reload by updating src
        if (imgRef.current) {
          const currentSrc = imgRef.current.src;
          imgRef.current.src = '';
          imgRef.current.src = currentSrc + (currentSrc.includes('?') ? '&' : '?') + `retry=${retries + 1}`;
        }
      }, 1000 * (retries + 1)); // Exponential backoff
    } else {
      setHasError(true);
      onError?.();
    }
  }, [retries, retryCount, onError]);

  // Show fallback on error
  if (hasError && fallback) {
    return <>{fallback}</>;
  }

  // Show skeleton placeholder when error without fallback
  if (hasError) {
    return (
      <div
        ref={containerRef}
        className={cn(
          'bg-muted flex items-center justify-center',
          className
        )}
        style={{ width, height }}
      >
        <span className="text-muted-foreground text-sm">Failed to load</span>
      </div>
    );
  }

  const placeholder = placeholderSrc || blurDataUrl || DEFAULT_PLACEHOLDER;
  const shouldLoadImage = isInView || priority;

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-hidden', className)}
      style={{ width, height }}
    >
      {/* Blur placeholder background */}
      {blurDataUrl && !isLoaded && (
        <div
          className="absolute inset-0 bg-cover bg-center blur-lg scale-110 transition-opacity duration-300"
          style={{
            backgroundImage: `url(${blurDataUrl})`,
            opacity: isLoaded ? 0 : 1,
          }}
        />
      )}

      {/* Skeleton loading animation */}
      {!isLoaded && !blurDataUrl && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}

      {/* Main image with picture element for format support */}
      <picture className="contents">
        {shouldLoadImage && avif && (
          <source srcSet={avif} type="image/avif" />
        )}
        {shouldLoadImage && webp && (
          <source srcSet={webp} type="image/webp" />
        )}
        <img
          ref={imgRef}
          src={shouldLoadImage ? src : placeholder}
          srcSet={shouldLoadImage ? srcSet : undefined}
          sizes={sizes}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          referrerPolicy="no-referrer"
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'transition-opacity duration-300 w-full h-full object-cover',
            isLoaded ? 'opacity-100' : 'opacity-0',
            className
          )}
          style={{
            // Prevent layout shift
            aspectRatio: width && height ? `${width}/${height}` : undefined,
          }}
        />
      </picture>
    </div>
  );
}

// Utility function to generate srcSet for responsive images
export function generateSrcSet(
  baseUrl: string,
  widths: number[] = [320, 640, 768, 1024, 1280, 1920]
): string {
  // Check if the URL supports resizing (Supabase Storage, etc.)
  if (baseUrl.includes('supabase.co/storage')) {
    return widths
      .map((w) => {
        const url = new URL(baseUrl);
        url.searchParams.set('width', w.toString());
        return `${url.toString()} ${w}w`;
      })
      .join(', ');
  }

  // For other URLs, just return the original
  return `${baseUrl} 1x`;
}

// Utility function to generate sizes attribute
export function generateSizes(breakpoints: Record<string, string> = {}): string {
  const defaultBreakpoints = {
    '(max-width: 640px)': '100vw',
    '(max-width: 768px)': '50vw',
    '(max-width: 1024px)': '33vw',
    default: '25vw',
  };

  const merged = { ...defaultBreakpoints, ...breakpoints };
  
  return Object.entries(merged)
    .filter(([key]) => key !== 'default')
    .map(([query, size]) => `${query} ${size}`)
    .concat([merged.default || '100vw'])
    .join(', ');
}

// Hook for preloading critical images
export function useImagePreload(src: string, options?: { as?: string }) {
  useEffect(() => {
    if (!src) return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = options?.as || 'image';
    link.href = src;
    document.head.appendChild(link);

    return () => {
      document.head.removeChild(link);
    };
  }, [src, options?.as]);
}