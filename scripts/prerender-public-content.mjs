import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { fetchPaginatedRows, slugify } from "./seoBuildUtils.mjs";
import { getPublicSupabaseConfig } from "./publicSupabaseConfig.mjs";

const DIST_DIR = path.resolve("dist");
const TEMPLATE_PATH = path.join(DIST_DIR, "index.html");
const SITE_URL = "https://sahadhyayi.com";

if (!fs.existsSync(TEMPLATE_PATH)) {
  throw new Error("Cannot prerender public content: dist/index.html is missing. Run this after vite build.");
}

const template = fs.readFileSync(TEMPLATE_PATH, "utf8");
const { url: supabaseUrl, key: supabaseKey } = getPublicSupabaseConfig();

const escapeHtml = (value = "") =>
  String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);

const plainText = (value, maxLength = 160) => {
  const text = String(value ?? "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;|&#34;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= maxLength) return text;
  const excerpt = text.slice(0, maxLength - 1);
  const lastSpace = excerpt.lastIndexOf(" ");
  return (lastSpace > maxLength * 0.6 ? excerpt.slice(0, lastSpace) : excerpt).trimEnd() + "…";
};

function setMeta(html, attribute, key, content) {
  const escaped = escapeHtml(content);
  const pattern = new RegExp(
    `<meta\\s+[^>]*${attribute}=["']${key}["'][^>]*>`,
    "i",
  );
  const tag = `<meta ${attribute}="${key}" content="${escaped}" />`;
  return pattern.test(html) ? html.replace(pattern, tag) : html.replace("</head>", `  ${tag}\n</head>`);
}

function createPage({ title, description, route, image, type }) {
  const canonical = `${SITE_URL}${route}`;
  let html = template.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);
  html = setMeta(html, "name", "description", description);
  html = setMeta(html, "property", "og:title", title);
  html = setMeta(html, "property", "og:description", description);
  html = setMeta(html, "property", "og:url", canonical);
  html = setMeta(html, "property", "og:type", type || "website");
  html = setMeta(html, "name", "twitter:title", title);
  html = setMeta(html, "name", "twitter:description", description);
  if (image && /^https:\/\//i.test(image)) {
    html = setMeta(html, "property", "og:image", image);
    html = setMeta(html, "name", "twitter:image", image);
  }
  const canonicalTag = `<link rel="canonical" href="${escapeHtml(canonical)}" />`;
  const canonicalPattern = /<link\s+[^>]*rel="canonical"[^>]*>/i;
  html = canonicalPattern.test(html)
    ? html.replace(canonicalPattern, canonicalTag)
    : html.replace("</head>", `  ${canonicalTag}\n</head>`);
  // Keep useful, route-specific HTML in the initial response for crawlers and
  // visitors with JavaScript disabled. React replaces this fallback when it mounts.
  const fallback = `<main id="seo-fallback" style="max-width:900px;margin:3rem auto;padding:0 1.25rem;font-family:system-ui,sans-serif;line-height:1.65">
    <h1>${escapeHtml(title.replace(/\s*\|\s*Sahadhyayi$/i, ""))}</h1>
    <p>${escapeHtml(description)}</p>
    <p><a href="/library">Explore the library</a> · <a href="/articles">Read articles</a> · <a href="/groups">Find reading groups</a> · <a href="/authors">Discover authors</a></p>
  </main>`;
  html = html.replace(/<div id="root">[^]*?div>/i, `<div id="root">${fallback}</div>`);
  return html;
}

function writeRoute(route, html) {
  const outputPath = path.join(DIST_DIR, route.replace(/^\//, ""), "index.html");
  if (!outputPath.startsWith(DIST_DIR + path.sep)) {
    throw new Error(`Refusing to write outside dist: ${route}`);
  }
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, html);
}

// Generate high-intent public landing pages on every build, even when the
// deployment does not provide Supabase credentials. This ensures each URL
// returns a unique title, description, canonical URL, and useful initial HTML.
const publicPages = [
  { route: "/library", title: "Online Book Library - Discover Books to Read | Sahadhyayi", description: "Discover books across genres, explore your next read, and build a consistent reading habit with Sahadhyayi's online book library." },
  { route: "/research-papers", title: "Research Papers & Academic Studies | Sahadhyayi", description: "Discover research papers, academic studies, preprints and technical reports across disciplines." },
  { route: "/articles", title: "Reading Articles, Book Ideas & Literary Insights | Sahadhyayi", description: "Explore thoughtful articles about books, reading habits, literature, and ideas from the Sahadhyayi reading community." },
  { route: "/authors", title: "Discover Authors and Their Books | Sahadhyayi", description: "Explore author profiles, discover their books, and connect with the people behind the stories on Sahadhyayi." },
  { route: "/scientists", title: "Scientists & Their Discoveries | Sahadhyayi", description: "Explore the lives, ideas and discoveries of Indian scientists and remarkable researchers from around the world, with biographies and references." },
  { route: "/groups", title: "Online Book Clubs and Reading Groups | Sahadhyayi", description: "Find a book club, join reading groups, discuss books with fellow readers, and make reading a shared experience." },
  { route: "/blog", title: "Sahadhyayi Blog - Book Recommendations & Reading Culture", description: "Read guides on building a reading habit, choosing books, exploring literature, and joining a community of readers." },
  { route: "/discovery", title: "Discover Books, Readers and New Ideas | Sahadhyayi", description: "Discover books, reading inspiration, literary ideas, and fellow readers with Sahadhyayi." },
  { route: "/about", title: "About Sahadhyayi - A Community for Readers", description: "Learn about Sahadhyayi's mission to bring readers together, support deeper reading, and make literature more social." },
  { route: "/community-stories", title: "Reader Stories and Reading Experiences | Sahadhyayi", description: "Explore stories and perspectives from readers who share a love of books, literature, and learning together." },
  { route: "/quotes", title: "Book Quotes and Literary Inspiration | Sahadhyayi", description: "Discover memorable literary quotes and ideas that inspire reflection, reading, and conversation." },
  { route: "/games", title: "Literary Games and Book Quizzes | Sahadhyayi", description: "Challenge your book knowledge with literary games, reading quizzes, and activities for book lovers." },
];

for (const page of publicPages) {
  writeRoute(page.route, createPage({ ...page, type: "website" }));
}

const scientistProfiles = [
  { slug: "amal-kumar-raychaudhuri", name: "Amal Kumar Raychaudhuri", description: "Explore the life and work of Indian physicist Amal Kumar Raychaudhuri, whose equation became a key result in general relativity and cosmology." },
  { slug: "c-v-raman", name: "C. V. Raman", description: "Learn about C. V. Raman, the Indian physicist whose discovery of the Raman Effect earned the 1930 Nobel Prize in Physics." },
  { slug: "satyendra-nath-bose", name: "Satyendra Nath Bose", description: "Discover the life and quantum physics contributions of Satyendra Nath Bose, whose work led to Bose–Einstein statistics." },
  { slug: "srinivasa-ramanujan", name: "Srinivasa Ramanujan", description: "Explore the life, notebooks and mathematical contributions of Srinivasa Ramanujan, one of India's most influential mathematicians." },
  { slug: "marie-curie", name: "Marie Curie", description: "Explore Marie Curie's pioneering research on radioactivity and the discoveries of polonium and radium." },
  { slug: "albert-einstein", name: "Albert Einstein", description: "Learn about Albert Einstein's life and contributions to relativity, quantum theory and modern physics." },
  { slug: "katherine-johnson", name: "Katherine Johnson", description: "Discover NASA mathematician Katherine Johnson's calculations for Mercury, Apollo and early human spaceflight." }
];

for (const scientist of scientistProfiles) {
  const route = `/scientists/${scientist.slug}`;
  writeRoute(route, createPage({
    title: `${scientist.name} — Life, Work & Discoveries | Sahadhyayi`,
    description: scientist.description,
    route,
    type: "profile"
  }));
}

if (!supabaseUrl || !supabaseKey) {
  console.warn("[prerender] Supabase read-only build credentials are not configured; generated static public landing pages, but skipped dynamic book/author HTML.");
  process.exit(0);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
let bookCount = 0;
let authorCount = 0;

const { data: books, error: booksError } = await fetchPaginatedRows(
  supabase.from("books_library")
    .select("id,title,description,cover_image_url")
    .not("id", "is", null)
    .not("title", "is", null),
  "books",
  10000,
  (label, maxRows) => console.warn(`[prerender] Reached the ${maxRows}-row ${label} safety cap; additional records were not prerendered.`),
);

if (booksError) {
  console.warn(`[prerender] Could not fetch public books: ${booksError.message}`);
} else {
  for (const book of books ?? []) {
    const id = String(book.id ?? "").trim();
    const title = String(book.title ?? "").trim();
    if (!id || !title || id.includes("/") || id === "." || id === "..") continue;
    const route = `/book/${encodeURIComponent(id)}`;
    const description = plainText(book.description) ||
      `Explore ${title} on Sahadhyayi, the digital reading community for fellow readers.`;
    writeRoute(route, createPage({
      title: `${title} - Read Online | Sahadhyayi`,
      description,
      route,
      image: book.cover_image_url,
      type: "book",
    }));
    bookCount += 1;
  }
}

const { data: authors, error: authorsError } = await fetchPaginatedRows(
  supabase.from("authors")
    .select("name,bio")
    .not("name", "is", null),
  "authors",
  5000,
  (label, maxRows) => console.warn(`[prerender] Reached the ${maxRows}-row ${label} safety cap; additional records were not prerendered.`),
);

if (authorsError) {
  console.warn(`[prerender] Could not fetch public authors: ${authorsError.message}`);
} else {
  for (const author of authors ?? []) {
    const name = String(author.name ?? "").trim();
    const slug = slugify(name);
    if (!name || !slug) continue;
    const route = `/authors/${slug}`;
    const description = plainText(author.bio) ||
      `Discover books and learn about ${name} on Sahadhyayi.`;
    writeRoute(route, createPage({
      title: `${name} - Author Profile | Sahadhyayi`,
      description,
      route,
      type: "profile",
    }));
    authorCount += 1;
  }
}

console.log(`[prerender] Generated ${bookCount} book and ${authorCount} author HTML routes in dist/.`);
