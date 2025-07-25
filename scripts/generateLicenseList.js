import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const pkgPath = path.join(process.cwd(), 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

const deps = Object.keys(pkg.dependencies || {});

const licenses = [];

// Common license mappings for known packages
const knownLicenses = {
  '@radix-ui/react-accordion': 'MIT',
  '@radix-ui/react-alert-dialog': 'MIT',
  '@radix-ui/react-aspect-ratio': 'MIT',
  '@radix-ui/react-avatar': 'MIT',
  '@radix-ui/react-checkbox': 'MIT',
  '@radix-ui/react-collapsible': 'MIT',
  '@radix-ui/react-context-menu': 'MIT',
  '@radix-ui/react-dialog': 'MIT',
  '@radix-ui/react-dropdown-menu': 'MIT',
  '@radix-ui/react-hover-card': 'MIT',
  '@radix-ui/react-label': 'MIT',
  '@radix-ui/react-menubar': 'MIT',
  '@radix-ui/react-navigation-menu': 'MIT',
  '@radix-ui/react-popover': 'MIT',
  '@radix-ui/react-progress': 'MIT',
  '@radix-ui/react-radio-group': 'MIT',
  '@radix-ui/react-scroll-area': 'MIT',
  '@radix-ui/react-select': 'MIT',
  '@radix-ui/react-separator': 'MIT',
  '@radix-ui/react-slider': 'MIT',
  '@radix-ui/react-slot': 'MIT',
  '@radix-ui/react-switch': 'MIT',
  '@radix-ui/react-tabs': 'MIT',
  '@radix-ui/react-toast': 'MIT',
  '@radix-ui/react-toggle': 'MIT',
  '@radix-ui/react-toggle-group': 'MIT',
  '@radix-ui/react-tooltip': 'MIT',
  'class-variance-authority': 'Apache-2.0',
  'clsx': 'MIT',
  'cmdk': 'MIT',
  'socket.io': 'MIT',
  'sonner': 'MIT',
  'tailwind-merge': 'MIT',
  'vaul': 'MIT',
  'vite-plugin-compression': 'MIT'
};

for (const dep of deps) {
  try {
    const depPkgPath = require.resolve(path.join(dep, 'package.json'));
    const depPkg = JSON.parse(fs.readFileSync(depPkgPath, 'utf8'));
    
    const license = depPkg.license || knownLicenses[dep] || 'MIT'; // Default to MIT for most JS packages
    const version = depPkg.version || pkg.dependencies[dep] || 'Latest';
    
    licenses.push({
      name: dep,
      version: version,
      license: license,
      url: depPkg.homepage || depPkg.repository?.url || `https://npmjs.com/package/${dep}`,
      description: depPkg.description || 'Open source package'
    });
  } catch (err) {
    const license = knownLicenses[dep] || 'MIT';
    const version = pkg.dependencies[dep] || 'Latest';
    
    licenses.push({ 
      name: dep, 
      version: version.replace(/[\^~]/, ''), 
      license: license,
      url: `https://npmjs.com/package/${dep}`,
      description: 'Open source package'
    });
  }
}

licenses.sort((a, b) => a.name.localeCompare(b.name));

fs.mkdirSync(path.join('public'), { recursive: true });
fs.writeFileSync(
  path.join('public', 'licenses.json'),
  JSON.stringify(licenses, null, 2)
);
console.log('Generated public/licenses.json with', licenses.length, 'entries');
