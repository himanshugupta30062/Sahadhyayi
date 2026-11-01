import { useState } from "react";
import type { ImgHTMLAttributes, SyntheticEvent } from "react";

const FALLBACK_IMAGE_SRC =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2'/%3E%3Ccircle cx='9' cy='9' r='2'/%3E%3Cpath d='m21 15-3-3-4 4-2-2-6 6'/%3E%3C/svg%3E";

export interface LazyImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  alt: string;
  src: string;
  avif?: string;
  webp?: string;
  fallbackSrc?: string;
}

export function LazyImage({
  alt,
  src,
  avif,
  webp,
  fallbackSrc,
  className,
  loading = "lazy",
  decoding = "async",
  onError,
  ...imageProps
}: LazyImageProps) {
  const [hasError, setHasError] = useState(false);
  const [fallbackFailed, setFallbackFailed] = useState(false);

  const handleError = (event: SyntheticEvent<HTMLImageElement, Event>) => {
    if (!hasError) {
      setHasError(true);
      onError?.(event);
      return;
    }

    // A custom fallback can fail too; use the bundled inline placeholder then.
    setFallbackFailed(true);
  };

  const resolvedSrc = hasError
    ? fallbackFailed || !fallbackSrc
      ? FALLBACK_IMAGE_SRC
      : fallbackSrc
    : src;

  return (
    <picture>
      {!hasError && avif && <source srcSet={avif} type="image/avif" />}
      {!hasError && webp && <source srcSet={webp} type="image/webp" />}
      <img
        {...imageProps}
        loading={loading}
        decoding={decoding}
        alt={alt}
        src={resolvedSrc}
        referrerPolicy="no-referrer"
        className={className}
        onError={handleError}
      />
    </picture>
  );
}

export default LazyImage;
