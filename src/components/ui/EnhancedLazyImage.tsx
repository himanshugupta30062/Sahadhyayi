import { useState, useEffect, useRef } from 'react';
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
  onLoad?: () => void;
  onError?: () => void;
}

export function EnhancedLazyImage({
  src,
  alt,
  avif,
  webp,
  className,
  width,
  height,
  placeholderSrc,
  onLoad,
  onError,
}: EnhancedLazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!imgRef.current) return;

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
        rootMargin: '50px',
      }
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  return (
    <picture className={cn('block', className)}>
      {isInView && avif && <source srcSet={avif} type="image/avif" />}
      {isInView && webp && <source srcSet={webp} type="image/webp" />}
      <img
        ref={imgRef}
        src={isInView ? src : placeholderSrc || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23f3f4f6" width="400" height="300"/%3E%3C/svg%3E'}
        alt={alt}
        width={width}
        height={height}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          'transition-opacity duration-300',
          isLoaded ? 'opacity-100' : 'opacity-0',
          hasError && 'bg-muted',
          className
        )}
      />
    </picture>
  );
}
