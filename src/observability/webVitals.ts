import { getCLS, getFID, getLCP, getTTFB, getFCP } from 'web-vitals';

function send(metric: any) {
  // Option A: console
  console.log('[web-vitals]', metric.name, Math.round(metric.value), metric);

  // Option B: POST to backend (comment in if enabling)
  // navigator.sendBeacon?.('/observability/vitals', new Blob([JSON.stringify(metric)], { type: 'application/json' }));
}

[getCLS, getFID, getLCP, getTTFB, getFCP].forEach(fn => fn(send));
