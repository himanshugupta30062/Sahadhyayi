import { onCLS, onINP, onLCP } from 'web-vitals';
import * as Sentry from '@sentry/react';

onCLS(metric => Sentry.captureMessage(`CLS: ${metric.value}`));
onINP(metric => Sentry.captureMessage(`INP: ${metric.value}`));
onLCP(metric => Sentry.captureMessage(`LCP: ${metric.value}`));
