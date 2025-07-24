import fs from 'fs';
import path from 'path';

const template = fs.readFileSync('index.html', 'utf8');

const basePages = [
  { path: '/', title: 'Sahadhyayi - Digital Reading Community & Book Library | Fellow Readers Platform', description: 'Sahadhyayi means \"fellow reader\" in Sanskrit. Join our vibrant digital reading community and explore thousands of books.' },
  { path: '/library', title: 'Library - Sahadhyayi', description: 'Browse thousands of free books in our online library.' },
  { path: '/authors', title: 'Authors - Sahadhyayi', description: 'Discover authors on the Sahadhyayi reading platform.' },
  { path: '/about', title: 'About Sahadhyayi', description: 'Learn about the Sahadhyayi mission and community.' }
];

const books = [
  { id: '1', title: 'A Brief History of Time', description: 'An overview of cosmology and the origins of the universe.' },
  { id: '2', title: 'गोदान', description: 'A classic Hindi novel depicting rural life in India.' },
  { id: '3', title: 'Pride and Prejudice', description: 'A romantic novel that critiques the British landed gentry.' },
  { id: '4', title: 'Sapiens', description: 'A brief history of humankind.' },
  { id: '5', title: 'गुनाहों का देवता', description: 'A popular Hindi novel exploring a tragic love story.' }
];

const authors = [
  { name: 'Rabindranath Tagore', bio: 'Nobel Prize-winning Bengali polymath who reshaped Bengali literature and music.' },
  { name: 'Haruki Murakami', bio: 'Japanese writer known for works blending surrealism with pop culture and magical realism.' }
];

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
