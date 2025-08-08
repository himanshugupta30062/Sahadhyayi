import { onCLS, onINP, onLCP, onTTFB, onFCP } from 'web-vitals';

function log(metric: any) {
  console.log('[web-vitals]', metric.name, metric.value);
}

onCLS(log);
onINP(log);
onLCP(log);
onTTFB(log);
onFCP(log);
