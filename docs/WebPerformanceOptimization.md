# Web Performance Optimization Guide

This document outlines steps to optimise the Sahadhyayi website for Google PageSpeed Insights, Lighthouse and GTmetrix. Each section includes code snippets that can be applied to the React + Supabase stack.

## 1. Image Optimisation

- **Convert images to modern formats** – export graphics as `.webp` or `.avif` during the build process. Vite will include them thanks to `assetsInclude` in `vite.config.ts`.
- **Responsive sizes** – specify `width` and `height` attributes and use the `sizes` attribute for responsive layouts.
- **Lazy loading** – add `loading="lazy"` to images below the fold.
- **Blur placeholder** – show a tiny placeholder until the full image loads:

```tsx
import React, { useState } from 'react';

export function OptimisedImage({ src, alt, width, height }: {
  src: string;
  alt: string;
  width: number;
  height: number;
}) {
  const [loaded, setLoaded] = useState(false);
  return (
    <img
      src={src}
      width={width}
      height={height}
      alt={alt}
      loading="lazy"
      className={loaded ? '' : 'blur-sm'}
      onLoad={() => setLoaded(true)}
    />
  );
}
```

## 2. Lazy Loading Offscreen Content

Use `IntersectionObserver` to load components only when visible:

```tsx
import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';

const Map = lazy(() => import('./Map'));

export function LazyMap() {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => e.isIntersecting && setShow(true));
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ minHeight: 300 }}>
      {show && (
        <Suspense fallback={<p>Loading map…</p>}>
          <Map />
        </Suspense>
      )}
    </div>
  );
}
```

## 3. CDN and Caching

- Host static assets on a CDN such as Cloudflare or AWS CloudFront.
- Add long term caching headers in the Express server:

```ts
app.use(
  express.static('public', {
    maxAge: '1y',
    setHeaders(res) {
      res.setHeader('Cache-Control', 'public, immutable');
    },
  })
);
```

- Consider Redis or Supabase edge functions for server side caching.

## 4. Server-side Optimisations

- Ensure database columns used in filters are indexed.
- Enable HTTP/2 and keep-alive on the hosting platform.
- Gzip and Brotli compression is already configured in `vite.config.ts` via `vite-plugin-compression`.

## 5. Code Splitting and Minification

- `vite.config.ts` defines `manualChunks` so pages load only necessary code.
- Dynamically import heavy components:

```ts
const Dashboard = lazy(() => import('./pages/Dashboard'));
```

- Vite automatically minifies with Terser and removes `console` statements.

## 6. Font Optimisation

```css
@font-face {
  font-family: 'Inter';
  src: url('/fonts/Inter.woff2') format('woff2');
  font-display: swap;
}
```

```html
<link rel="preload" href="/fonts/Inter.woff2" as="font" type="font/woff2" crossorigin>
```

Limit loaded weights and subset the font files to reduce size.

## 7. Cumulative Layout Shift (CLS)

- Always set `width` and `height` on `<img>` and `<iframe>` elements.
- Reserve space in CSS for dynamically injected content.

## 8. JavaScript Efficiency (FID)

- Use `async` on external scripts and defer non critical code with `requestIdleCallback`.
- Break up large tasks with `setTimeout` or `requestIdleCallback` to avoid blocking the main thread.

## 9. Framework and Rendering Enhancements

- Migrating to **Next.js** or **Astro** can provide static generation and built-in optimisation.
- Alternatively, inline critical CSS and pre-render static pages during the build step.

## 10. Continuous Monitoring

Integrate [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci) in your GitHub Actions pipeline:

```yaml
name: Lighthouse
on: [push]

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npx @lhci/cli autorun
```

This automatically checks performance after each deployment.
