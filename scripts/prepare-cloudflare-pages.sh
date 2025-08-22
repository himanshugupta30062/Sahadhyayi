#!/usr/bin/env bash
set -e

# Remove bun lockfile if it exists
if [ -f bun.lockb ]; then
  rm bun.lockb
fi

# Refresh npm lockfile
npm install

# Set Node version for Cloudflare Pages
echo "18" > .nvmrc

# Lint and build before committing
npm run lint
npm run build

# Revert generated files we don't want to commit
git checkout -- sbom.json public/licenses.json public/sitemap.xml 2>/dev/null || true

# Commit and push changes
git add -A
git commit -m "chore: prepare for Cloudflare Pages deployment" || echo "Nothing to commit"
git push || echo "No remote configured or push failed"
