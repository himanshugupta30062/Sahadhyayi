import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

// Public, canonical pages only. Do not include authentication or account routes.
const staticPages = [
  '/library', '/articles', '/authors', '/groups', '/blog', '/discovery',
  '/games', '/quotes', '/community-stories', '/about', '/social', '/map',
  '/book-search', '/help-center', '/community-guidelines', '/privacy-policy',
  '/terms-of-service', '/cookie-policy', '/dmca'
];

const SITE_URL = 'https://sahadhyayi.com';
const HOME_IMAGE = SITE_URL + '/lovable-uploads/sahadhyayi-logo-digital-reading.png';
const urls = [];
const xmlEscape = value => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\"/g, '&quot;').replace(/'/g, '&apos;');
const slugify = value => value.toLowerCase().trim().replace(/[^\p{L}\p{N}\p{M}]+/gu, '-').replace(/^-+|-+$/g, '');

function addUrl(loc, changefreq = 'weekly', priority = '0.6', image) {
  urls.push({ loc: SITE_URL + loc, changefreq, priority, image });
}

addUrl('/', 'weekly', '1.0', HOME_IMAGE);
staticPages.forEach(route => addUrl(route, 'weekly', route === '/library' || route === '/articles' ? '0.9' : '0.5'));

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
if (SUPABASE_URL && SUPABASE_KEY) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  const [booksResult, authorsResult] = await Promise.all([
    supabase.from('books_library').select('id').not('id', 'is', null),
    supabase.from('authors').select('name').not('name', 'is', null)
  ]);
  if (booksResult.error) console.warn('[sitemap] Could not fetch books:', booksResult.error.message);
  else (booksResult.data || []).forEach(book => addUrl('/book/' + encodeURIComponent(book.id), 'monthly', '0.5'));
  if (authorsResult.error) console.warn('[sitemap] Could not fetch authors:', authorsResult.error.message);
  else (authorsResult.data || []).filter(author => author.name).forEach(author => addUrl('/authors/' + encodeURIComponent(slugify(author.name)), 'monthly', '0.5'));
} else {
  console.warn('[sitemap] Supabase environment variables are missing; only static public URLs will be generated. No placeholder book or author URLs will be added.');
}

const xml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n' +
  urls.map(({ loc, changefreq, priority, image }) => {
    const imageTag = image ? '\n    <image:image>\n      <image:loc>' + xmlEscape(image) + '</image:loc>\n    </image:image>' : '';
    return '  <url>\n    <loc>' + xmlEscape(loc) + '</loc>\n    <changefreq>' + changefreq + '</changefreq>\n    <priority>' + priority + '</priority>' + imageTag + '\n  </url>';
  }).join('\n') + '\n</urlset>\n';

fs.mkdirSync('public', { recursive: true });
fs.writeFileSync(path.join('public', 'sitemap.xml'), xml, 'utf8');
console.log('[sitemap] Generated ' + urls.length + ' canonical public URLs.');
