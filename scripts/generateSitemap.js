import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { fetchPaginatedRows, slugify } from './seoBuildUtils.mjs';
import { getPublicSupabaseConfig } from './publicSupabaseConfig.mjs';

// Public, canonical pages only. Do not include authentication or account routes.
const staticPages = [
  '/library', '/articles', '/authors', '/groups', '/blog', '/discovery', '/scientists',
  '/games', '/quotes', '/community-stories', '/about', '/social', '/map',
  '/book-search', '/help-center', '/community-guidelines', '/privacy-policy',
  '/terms-of-service', '/cookie-policy', '/dmca'
];

const blogSlugs = [
  'what-is-sahadhyayi-meaning-story',
  'how-sahadhyayi-revives-reading-culture',
  'why-book-lovers-should-join-sahadhyayi',
  'build-a-reading-habit-that-lasts',
  'how-to-start-a-book-club',
  'how-to-read-classic-literature',
  'best-indian-short-story-collections',
  'books-for-when-life-feels-stuck',
  'exploring-indian-literature-in-translation',
  'choose-your-next-book-by-mood',
  'how-to-read-without-distractions',
  '30-day-reading-challenge',
  'osho-books-and-themes-in-his-discourses',
  'best-indian-books-to-read'
];

const SITE_URL = 'https://sahadhyayi.com';
const HOME_IMAGE = SITE_URL + '/lovable-uploads/sahadhyayi-logo-digital-reading.png';
const urls = [];
const xmlEscape = value => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\"/g, '&quot;').replace(/'/g, '&apos;');
function addUrl(loc, changefreq = 'weekly', priority = '0.6', image) {
  urls.push({ loc: SITE_URL + loc, changefreq, priority, image });
}

addUrl('/', 'weekly', '1.0', HOME_IMAGE);
staticPages.forEach(route => addUrl(route, 'weekly', route === '/library' || route === '/articles' ? '0.9' : '0.5'));
blogSlugs.forEach(slug => addUrl('/blog/' + slug, 'monthly', '0.6'));
const scientistSlugs = [
  'amal-kumar-raychaudhuri',
  'c-v-raman',
  'satyendra-nath-bose',
  'srinivasa-ramanujan',
  'marie-curie',
  'albert-einstein',
  'katherine-johnson'
];
scientistSlugs.forEach(slug => addUrl('/scientists/' + slug, 'monthly', '0.6'));

const { url: SUPABASE_URL, key: SUPABASE_KEY } = getPublicSupabaseConfig();
if (SUPABASE_URL && SUPABASE_KEY) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  const [booksResult, authorsResult] = await Promise.all([
    fetchPaginatedRows(supabase.from('books_library').select('id').not('id', 'is', null), 'books', 100000, (label) => console.warn(`[sitemap] Stopped ${label} pagination at 100,000 rows.`)),
    fetchPaginatedRows(supabase.from('authors').select('name').not('name', 'is', null), 'authors', 100000, (label) => console.warn(`[sitemap] Stopped ${label} pagination at 100,000 rows.`))
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
