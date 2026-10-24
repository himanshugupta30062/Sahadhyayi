import { rm } from 'node:fs/promises';
import { build } from 'esbuild';

// The API server uses only these three utility modules. Compile them with the
// already-locked esbuild dependency to keep clean installs reproducible.
await rm('server-utils', { recursive: true, force: true });

await build({
  entryPoints: [
    { in: 'src/utils/security.ts', out: 'security' },
    { in: 'src/utils/securityConfig.ts', out: 'securityConfig' },
    { in: 'src/utils/validation.ts', out: 'validation' },
  ],
  outdir: 'server-utils',
  bundle: false,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  sourcemap: false,
  logLevel: 'info',
});
