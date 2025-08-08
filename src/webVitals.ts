import { onCLS, onINP, onLCP } from 'web-vitals';
import * as Sentry from '@sentry/react';

onCLS((metric) => Sentry.captureMessage('CLS', { level: 'info', extra: metric }));
onINP((metric) => Sentry.captureMessage('INP', { level: 'info', extra: metric }));
onLCP((metric) => Sentry.captureMessage('LCP', { level: 'info', extra: metric }));
