import fs from "fs";
import path from "path";

import { basePages, books, authors } from "./seoData.js";

const template = fs.readFileSync('index.html', 'utf8');


const slugify = text => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function createHtml(title, description) {
  let html = template.replace(/<title>(.|\n)*?<\/title>/, `<title>${title}</title>`);
  html = html.replace(/<meta name="description" content=".*?" \/>/, `<meta name="description" content="${description}" />`);
  return html;
}

function writePage(filePath, html) {
  const fullPath = path.join('public', 'prerender', filePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, html);
}

basePages.forEach(p => {
  writePage(p.path === '/' ? 'index.html' : p.path.slice(1) + '.html', createHtml(p.title, p.description));
});

books.forEach(b => {
  writePage(`book/${b.id}.html`, createHtml(`${b.title} - Sahadhyayi`, b.description));
});

authors.forEach(a => {
  writePage(`authors/${slugify(a.name)}.html`, createHtml(`${a.name} - Sahadhyayi`, a.bio));
});

console.log('Pre-rendered HTML pages created in public/prerender');
