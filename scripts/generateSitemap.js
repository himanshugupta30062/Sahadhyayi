import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://rknxtatvlzunatpyqxro.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrbnh0YXR2bHp1bmF0cHlxeHJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MzI0MjUsImV4cCI6MjA2NTUwODQyNX0.NXIWEwm8NlvzHnxf55cgdsy1ljX2IbFKQL7OS8xlb-U';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const slugify = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const fallbackBooks = [
  { id: '1', created_at: new Date().toISOString() },
  { id: '2', created_at: new Date().toISOString() },
  { id: '3', created_at: new Date().toISOString() }
];

async function fetchBooks() {
  const { data, error } = await supabase
    .from('books_library')
    .select('id, created_at, updated_at');
  if (error || !data) {
    console.error('Error fetching books:', error?.message);
    return fallbackBooks;
  }
  return data;
}

const fallbackAuthors = [
  { name: 'Rabindranath Tagore', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { name: 'Haruki Murakami', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];

async function fetchAuthors() {
  const { data, error } = await supabase.rpc('get_authors_with_books');
  if (error || !data) {
    console.error('Error fetching authors:', error?.message);
    return fallbackAuthors;
  }
  return data;
}

function buildUrl({ loc, lastmod, changefreq, priority }) {
  return [
    '  <url>',
    `    <loc>${loc}</loc>`,
    lastmod ? `    <lastmod>${lastmod}</lastmod>` : undefined,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    '  </url>'
  ].filter(Boolean).join('\n');
}

async function main() {
  const [books, authors] = await Promise.all([fetchBooks(), fetchAuthors()]);
  const today = new Date().toISOString().split('T')[0];

  const urls = [
    { loc: 'https://sahadhyayi.com/', changefreq: 'weekly', priority: '1.0', lastmod: today },
    { loc: 'https://sahadhyayi.com/library', changefreq: 'daily', priority: '0.9', lastmod: today },
    { loc: 'https://sahadhyayi.com/authors', changefreq: 'weekly', priority: '0.8', lastmod: today },
    { loc: 'https://sahadhyayi.com/about', changefreq: 'monthly', priority: '0.6', lastmod: today },
    { loc: 'https://sahadhyayi.com/blog', changefreq: 'weekly', priority: '0.8', lastmod: today },
  ];

  books.forEach((b) => {
    const date = (b.updated_at || b.created_at || today).split('T')[0];
    urls.push({
      loc: `https://sahadhyayi.com/book/${b.id}`,
      changefreq: 'monthly',
      priority: '0.7',
      lastmod: date,
    });
  });

  authors.forEach((a) => {
    const date = (a.updated_at || a.created_at || today).split('T')[0];
    const slug = slugify(a.name);
    urls.push({
      loc: `https://sahadhyayi.com/authors/${slug}`,
      changefreq: 'monthly',
      priority: '0.7',
      lastmod: date,
    });
  });

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map(buildUrl),
    '</urlset>'
  ].join('\n');

  const outPath = path.join('public', 'sitemap.xml');
  fs.writeFileSync(outPath, xml);
  console.log(`Generated sitemap with ${urls.length} entries at ${outPath}`);
}

main();
