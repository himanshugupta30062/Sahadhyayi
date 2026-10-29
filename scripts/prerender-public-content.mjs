import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const DIST_DIR = path.resolve("dist");
const TEMPLATE_PATH = path.join(DIST_DIR, "index.html");
const SITE_URL = "https://sahadhyayi.com";

if (!fs.existsSync(TEMPLATE_PATH)) {
  throw new Error("Cannot prerender public content: dist/index.html is missing. Run this after vite build.");
}

const template = fs.readFileSync(TEMPLATE_PATH, "utf8");
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

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

const slugify = (value) =>
  String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

function setMeta(html, attribute, key, content) {
  const escaped = escapeHtml(content);
  const pattern = new RegExp(
    `<meta\\s+[^>]*${attribute}=["']${key}["'][^>]*>`,
    "i",
  );
  const tag = `<meta ${attribute}="${key}" content="${escaped}" />`;
  return pattern.test(html) ? html.replace(pattern, tag) : html.replace("</head>", `  ${tag}\\n</head>`);
}

function createPage({ title, description, route, image, type }) {
  const canonical = `${SITE_URL}${route}`;
  let html = template.replace(/<title>[\\s\\S]*?<\\/title>/i, `<title>${escapeHtml(title)}</title>`);
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
  const canonicalPattern = /<link\\s+[^>]*rel=["']canonical["'][^>]*>/i;
  html = canonicalPattern.test(html)
    ? html.replace(canonicalPattern, canonicalTag)
    : html.replace("</head>", `  ${canonicalTag}\\n</head>`);
  return html;
}

function writeRoute(route, html) {
  const outputPath = path.join(DIST_DIR, route.replace(/^\\//, ""), "index.html");
  if (!outputPath.startsWith(DIST_DIR + path.sep)) {
    throw new Error(`Refusing to write outside dist: ${route}`);
  }
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, html);
}

if (!supabaseUrl || !supabaseKey) {
  console.warn("[prerender] Supabase read-only build credentials are not configured; dynamic book/author HTML was skipped.");
  process.exit(0);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
let bookCount = 0;
let authorCount = 0;

const { data: books, error: booksError } = await supabase
  .from("books_library")
  .select("id,title,description,cover_image_url")
  .not("id", "is", null)
  .not("title", "is", null)
  .limit(10000);

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

const { data: authors, error: authorsError } = await supabase
  .from("authors")
  .select("name,bio")
  .not("name", "is", null)
  .limit(5000);

if (authorsError) {
  console.warn(`[prerender] Could not fetch public authors: ${authorsError.message}`);
} else {
  for (const author of authors ?? []) {
    const name = String(author.name ?? "").trim();
    const slug = slugify(name);
    if (!name || !slug) continue;
    const route = `/author/${slug}`;
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
