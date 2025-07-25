import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const staticPages = [
  '/',
  '/library',
  '/authors',
  '/groups',
  '/map',
  '/blog',
  '/community-stories',
  '/quotes',
  '/about',
  '/social',
  '/help',
  '/feedback',
  '/signin',
  '/signup',
  '/privacy',
  '/terms',
  '/cookies',
  '/dmca',
  '/investors'
];

let books = [];
let authors = [];

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (SUPABASE_URL && SUPABASE_KEY) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  try {
    const { data: bookData } = await supabase
      .from('books_library')
      .select('id, title');
    books = bookData || [];

    const { data: authorData } = await supabase
      .from('authors')
      .select('name');
    authors = authorData || [];
  } catch (error) {
    console.error('Failed to fetch data from Supabase:', error.message);
  }
}

if (books.length === 0) {
  books = [
    { id: '1', title: 'A Brief History of Time' },
    { id: '2', title: 'गोदान' },
    { id: '3', title: 'Pride and Prejudice' },
    { id: '4', title: 'Sapiens' },
    { id: '5', title: 'गुनाहों का देवता' }
  ];
}

if (authors.length === 0) {
  authors = [
    { name: 'Rabindranath Tagore' },
    { name: 'Haruki Murakami' }
  ];
}

const slugify = text => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const urls = [];
const today = new Date().toISOString().split('T')[0];

function addUrl(loc, changefreq='weekly', priority='0.6') {
  urls.push({ loc: `https://sahadhyayi.com${loc}`, lastmod: today, changefreq, priority });
}

staticPages.forEach(p => addUrl(p, p === '/' ? 'weekly' : 'monthly', p === '/' ? '1.0' : '0.5'));
books.forEach(b => addUrl(`/book/${b.id}`, 'weekly', '0.5'));
authors.forEach(a => addUrl(`/authors/${slugify(a.name)}`, 'weekly', '0.6'));

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  urls.map(u => {
    return `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`;}).join('\n') +
  '\n</urlset>\n';

fs.writeFileSync(path.join('public','sitemap.xml'), xml, 'utf8');
console.log('sitemap.xml generated with', urls.length, 'urls');
