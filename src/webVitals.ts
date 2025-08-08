import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';
import * as Sentry from '@sentry/react';

function report(metric: any) {
  console.log('[web-vitals]', metric.name, metric.value);
  Sentry.captureMessage(metric.name, { level: 'info', extra: metric });
}

[onCLS, onFCP, onINP, onLCP, onTTFB].forEach(fn => fn(report));
