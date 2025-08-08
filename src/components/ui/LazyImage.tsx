import React from 'react';

interface LazyImageProps {
  alt: string;
  src: string;
  avif?: string;
  webp?: string;
  className?: string;
  width?: number;
  height?: number;
  onError?: React.ReactEventHandler<HTMLImageElement>;
}

export function LazyImage({ alt, src, avif, webp, className, width, height, onError }: LazyImageProps) {
  return (
    <picture>
      {avif && <source srcSet={avif} type="image/avif" />}
      {webp && <source srcSet={webp} type="image/webp" />}
      <img
        loading="lazy"
        decoding="async"
        alt={alt}
        src={src}
        className={className}
        width={width}
        height={height}
        onError={onError}
      />
    </picture>
  );
}
