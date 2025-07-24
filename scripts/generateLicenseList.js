import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const pkgPath = path.join(process.cwd(), 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

const deps = Object.keys(pkg.dependencies || {});

const licenses = [];

for (const dep of deps) {
  try {
    const depPkgPath = require.resolve(path.join(dep, 'package.json'));
    const depPkg = JSON.parse(fs.readFileSync(depPkgPath, 'utf8'));
    licenses.push({
      name: dep,
      version: depPkg.version,
      license: depPkg.license || 'UNKNOWN'
    });
  } catch (err) {
    licenses.push({ name: dep, version: 'N/A', license: 'UNKNOWN' });
  }
}

licenses.sort((a, b) => a.name.localeCompare(b.name));

fs.mkdirSync(path.join('public'), { recursive: true });
fs.writeFileSync(
  path.join('public', 'licenses.json'),
  JSON.stringify(licenses, null, 2)
);
console.log('Generated public/licenses.json with', licenses.length, 'entries');
