// eslint-disable-next-line @typescript-eslint/no-var-requires
const { getCLS, getFID, getLCP, getTTFB, getFCP } = require('web-vitals');

function log(metric: { name: string; value: number }) {
  console.log('[web-vitals]', metric.name, metric.value);
}

[getCLS, getFID, getLCP, getTTFB, getFCP].forEach((fn: any) => fn(log));
