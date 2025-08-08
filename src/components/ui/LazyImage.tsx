import React from 'react';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  alt: string;
  src: string;
  avif?: string;
  webp?: string;
}

export function LazyImage({ alt, src, avif, webp, ...props }: LazyImageProps) {
  return (
    <picture>
      {avif && <source srcSet={avif} type="image/avif" />}
      {webp && <source srcSet={webp} type="image/webp" />}
      <img loading="lazy" decoding="async" alt={alt} src={src} {...props} />
    </picture>
  );
}

export default LazyImage;
