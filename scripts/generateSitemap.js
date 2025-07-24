import fs from 'fs';
import path from 'path';

import { staticPages, books, authors } from './seoData.js';

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
