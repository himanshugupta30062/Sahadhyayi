export function LazyImage({
  alt,
  src,
  avif,
  webp,
  className,
  width,
  height
}: {
  alt: string;
  src: string;
  avif?: string;
  webp?: string;
  className?: string;
  width?: number;
  height?: number;
}) {
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
      />
    </picture>
  );
}

