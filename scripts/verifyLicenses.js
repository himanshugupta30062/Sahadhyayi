import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

async function main() {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const deps = Object.keys(pkg.dependencies || {});
  for (const dep of deps) {
    try {
      const depPkgPath = require.resolve(path.join(dep, 'package.json'));
      const depPkg = JSON.parse(fs.readFileSync(depPkgPath, 'utf8'));
      const version = depPkg.version;
      const res = await fetch(`https://api.deps.dev/v3alpha/systems/NPM/packages/${dep}/versions/${version}`);
      if (!res.ok) {
        console.warn('Failed to fetch license for', dep);
        continue;
      }
      const data = await res.json();
      const remoteLicenses = (data.licenses || []).map(l => l.spdxId).join(', ');
      if (depPkg.license && !remoteLicenses.includes(depPkg.license)) {
        console.warn(`License mismatch for ${dep}@${version}: package.json says ${depPkg.license}, deps.dev says ${remoteLicenses}`);
      }
    } catch (err) {
      console.warn('Error verifying', dep, err.message);
    }
  }
}

main();
