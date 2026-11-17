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
    .replace(/<[^>\r\n]{0,2048}>/g, " ")
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

function createPage({ title, description, route, image, type, entityType, entityName, bodyText, publishedAt, modifiedAt, authorName, wordCount, schemaType, about, breadcrumbs, relatedBooks, sameAs, bookAuthor, bookIsbn, bookGenre, bookLanguage, bookPages, bookPublicationYear }) {
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
  const mainEntity = entityType === "Book"
    ? {
        "@type": "Book",
        name: entityName,
        description,
        url: canonical,
        mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
        ...(image && /^https:\/\//i.test(image) ? { image } : {}),
        ...(bookAuthor ? { author: { "@type": "Person", name: bookAuthor.name, ...(bookAuthor.url ? { url: bookAuthor.url } : {}) } } : {}),
        ...(bookIsbn ? { isbn: bookIsbn } : {}),
        ...(bookGenre ? { genre: bookGenre } : {}),
        ...(bookLanguage ? { inLanguage: bookLanguage } : {}),
        ...(Number.isFinite(bookPages) && bookPages > 0 ? { numberOfPages: bookPages } : {}),
        ...(bookPublicationYear ? { datePublished: String(bookPublicationYear) } : {}),
      }
    : entityType === "Person"
      ? {
          "@type": "Person",
          name: entityName,
          description,
          url: canonical,
          mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
          ...(image && /^https:\/\/i.test(image) ? { image } : {}),
          ...(Array.isArray(sameAs) && sameAs.length ? { sameAs: sameAs.filter((value) => typeof value === "string" && /^https:\/\/i.test(value)) } : {}),
        }
      : entityType === "Article"
        ? {
            "@type": "Article",
            headline: entityName,
            description,
            url: canonical,
            ...(image && /^https:\/\//i.test(image) ? { image } : {}),
            ...(publishedAt ? { datePublished: publishedAt } : {}),
            ...(modifiedAt ? { dateModified: modifiedAt } : {}),
            ...(authorName ? { author: { "@type": "Person", name: authorName } } : {}),
            ...(Number.isFinite(wordCount) && wordCount > 0 ? { wordCount } : {}),
            publisher: { "@type": "Organization", name: "Sahadhyayi", url: SITE_URL },
            mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
          }
        : null;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": schemaType || "WebPage",
    name: title,
    description,
    url: canonical,
    isPartOf: { "@type": "WebSite", name: "Sahadhyayi", url: SITE_URL },
    ...(mainEntity ? { mainEntity } : {}),
    ...(Array.isArray(about) && about.length ? { about: about.map((name) => ({ "@type": "Thing", name })) } : {}),
    ...(Array.isArray(breadcrumbs) && breadcrumbs.length ? {
      breadcrumb: {
        "@type": "BreadcrumbList",
        itemListElement: breadcrumbs.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.name,
          item: `${SITE_URL}${item.route}`,
        })),
      },
    } : {}),
  };
  const jsonLd = JSON.stringify(structuredData).replace(/</g, "\\u003c");
  html = html.replace("</head>", `  <script type="application/ld+json">${jsonLd}</script>\n</head>`);
  const canonicalTag = `<link rel="canonical" href="${escapeHtml(canonical)}" />`;
  const canonicalPattern = /<link[ \t]{1,16}[^>\r\n]{0,2048}rel="canonical"[^>\r\n]{0,2048}>/i;
  html = canonicalPattern.test(html)
    ? html.replace(canonicalPattern, canonicalTag)
    : html.replace("</head>", `  ${canonicalTag}\n</head>`);
  // Keep useful, route-specific HTML in the initial response for crawlers and
  // visitors with JavaScript disabled. React replaces this fallback when it mounts.
  const safeBodyText = bodyText ? plainText(bodyText, 1800) : "";
  const fallback = `<main id="seo-fallback" style="max-width:900px;margin:3rem auto;padding:0 1.25rem;font-family:system-ui,sans-serif;line-height:1.65">
    <h1>${escapeHtml(title.replace(/[ \t]{0,16}\|[ \t]{0,16}Sahadhyayi$/i, ""))}</h1>
    <p>${escapeHtml(description)}</p>
    ${safeBodyText ? `<p>${escapeHtml(safeBodyText)}</p>` : ""}
    ${bookAuthor?.url ? `<p>By <a href="${escapeHtml(bookAuthor.url)}">${escapeHtml(bookAuthor.name)}</a></p>` : bookAuthor?.name ? `<p>By ${escapeHtml(bookAuthor.name)}</p>` : ""}
    ${Array.isArray(relatedBooks) && relatedBooks.length ? `<section aria-label="Books by this author"><h2>Books by ${escapeHtml(entityName || "this author")}</h2><ul>${relatedBooks.map((book) => `<li><a href="${escapeHtml(book.route)}">${escapeHtml(book.title)}</a></li>`).join("")}</ul></section>` : ""}
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
  { route: "/", title: "Sahadhyayi — Discover Books, Read & Connect with Readers", description: "Discover books, read stories and articles, explore authors, and connect with readers on Sahadhyayi—a welcoming online reading community built to make reading a shared habit." },
  { route: "/library", title: "Online Book Library - Discover Books to Read | Sahadhyayi", description: "Discover books across genres, explore your next read, and build a consistent reading habit with Sahadhyayi's online book library." },
  { route: "/research-papers", title: "Research Papers & Academic Studies | Sahadhyayi", description: "Discover research papers, academic studies, preprints and technical reports across disciplines.", schemaType: "CollectionPage", about: ["Artificial intelligence", "Machine learning", "Climate science", "Psychology", "Medicine", "Physics"], breadcrumbs: [{ name: "Home", route: "/" }, { name: "Research Papers", route: "/research-papers" }] },
  { route: "/articles", title: "Reading Articles, Book Ideas & Literary Insights | Sahadhyayi", description: "Explore thoughtful articles about books, reading habits, literature, and ideas from the Sahadhyayi reading community." },
  { route: "/authors", title: "Discover Authors and Their Books | Sahadhyayi", description: "Explore author profiles, discover their books, and connect with the people behind the stories on Sahadhyayi." },
  { route: "/scientists", title: "Scientists & Their Discoveries | Sahadhyayi", description: "Explore the lives, ideas and discoveries of Indian scientists and remarkable researchers from around the world, with biographies and references." },
  { route: "/groups", title: "Online Book Clubs and Reading Groups | Sahadhyayi", description: "Find a book club, join reading groups, discuss books with fellow readers, and make reading a shared experience." },
  { route: "/blog", title: "Sahadhyayi Blog - Book Recommendations & Reading Culture", description: "Read guides on building a reading habit, choosing books, exploring literature, and joining a community of readers." },
  { route: "/discovery", title: "Discover Books, Readers and New Ideas | Sahadhyayi", description: "Discover books, reading inspiration, literary ideas, and fellow readers with Sahadhyayi." },
  { route: "/about", title: "About Sahadhyayi - A Community for Readers", description: "Learn about Sahadhyayi's mission to bring readers together, support deeper reading, and make literature more social." },
  { route: "/community-stories", title: "Reader Stories and Reading Experiences | Sahadhyayi", description: "Explore stories and perspectives from readers who share a love of books, literature, and learning together." },
  { route: "/life-stories", title: "Life Stories — Real People, Remarkable Journeys | Sahadhyayi", description: "Discover true stories of remarkable people from India and around the world: their lives, challenges, achievements and the lessons they leave behind." },
  { route: "/social-activists", title: "Social Activists and Their Work | Sahadhyayi", description: "Discover source-linked profiles of activists organising for children's rights, workers, environmental justice and public accountability." },
  { route: "/freedom-fighters", title: "Indian Freedom Fighters | Sahadhyayi", description: "Explore source-linked profiles of people and movements that shaped India's struggle against colonial rule." },
  { route: "/quotes", title: "Book Quotes and Literary Inspiration | Sahadhyayi", description: "Discover memorable literary quotes and ideas that inspire reflection, reading, and conversation." },
  { route: "/games", title: "Literary Games and Book Quizzes | Sahadhyayi", description: "Challenge your book knowledge with literary games, reading quizzes, and activities for book lovers." },
];

for (const page of publicPages) {
  writeRoute(page.route, createPage({ ...page, type: "website" }));
}

const lifeStoryProfiles = [
  { slug: "kalpana-chawla", name: "Kalpana Chawla", description: "Explore the life of Kalpana Chawla, the astronaut and aerospace engineer from Karnal who became the first woman of Indian origin to travel to space." },
  { slug: "arunima-sinha", name: "Arunima Sinha", description: "Discover mountaineer Arunima Sinha's journey from recovery after a train accident to becoming the first female amputee to summit Mount Everest." },
  { slug: "a-p-j-abdul-kalam", name: "A. P. J. Abdul Kalam", description: "Learn about the aerospace scientist, former President of India and educator whose work helped shape India's space and defence programmes." },
  { slug: "sudha-murty", name: "Sudha Murty", description: "Explore the life of engineer, author, educator and philanthropist Sudha Murty and her work in technology, literature and social initiatives." },
  { slug: "mary-kom", name: "Mary Kom", description: "Discover the career of Indian boxer Mary Kom, a six-time world champion and Olympic bronze medalist." },
  { slug: "dashrath-manjhi", name: "Dashrath Manjhi", description: "Read about Dashrath Manjhi, the Mountain Man of Bihar, who spent years carving a passage through a hill for his community." }
];

for (const person of lifeStoryProfiles) {
  const route = `/life-stories/${person.slug}`;
  writeRoute(route, createPage({
    title: `${person.name} — Life Story | Sahadhyayi`,
    description: person.description,
    route,
    type: "profile",
    entityType: "Person",
    entityName: person.name,
  }));
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
    type: "profile",
    entityType: "Person",
    entityName: scientist.name,
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
let articleCount = 0;

const { data: articles, error: articlesError } = await fetchPaginatedRows(
  supabase.from("articles")
    .select("id,user_id,title,subtitle,content,cover_image_url,slug,published_at,updated_at,created_at")
    .eq("is_published", true)
    .not("slug", "is", null)
    .not("title", "is", null),
  "published articles",
  50000,
  (label, maxRows) => console.warn(`[prerender] Reached the ${maxRows}-row ${label} safety cap; additional records were not prerendered.`),
);

if (articlesError) {
  console.warn(`[prerender] Could not fetch published articles: ${articlesError.message}`);
} else {
  const userIds = [...new Set((articles ?? []).map(article => article.user_id).filter(Boolean))];
  let profiles = [];
  if (userIds.length) {
    const { data: publicProfiles, error: publicProfilesError } = await supabase
      .from("public_profiles")
      .select("id,full_name")
      .in("id", userIds);
    if (!publicProfilesError && publicProfiles?.length) {
      profiles = publicProfiles;
    } else {
      const { data: fallbackProfiles, error: fallbackProfilesError } = await supabase
        .from("profiles")
        .select("id,full_name")
        .in("id", userIds);
      if (!fallbackProfilesError) profiles = fallbackProfiles ?? [];
    }
  }
  const profileNames = new Map(profiles.map(profile => [profile.id, profile.full_name]));
  for (const article of articles ?? []) {
    const slug = String(article.slug ?? "").trim();
    const title = String(article.title ?? "").trim();
    if (!title || !/^[a-z0-9][a-z0-9-]{0,139}$/i.test(slug)) continue;
    const route = `/articles/${encodeURIComponent(slug)}`;
    const contentText = plainText(article.content, 1800);
    const description = plainText(article.subtitle || article.content) ||
      `Read ${title} on Sahadhyayi, a community for readers and thoughtful ideas.`;
    const authorName = String(profileNames.get(article.user_id) || "").trim();
    const image = typeof article.cover_image_url === "string" && /^https:\/\//i.test(article.cover_image_url)
      ? article.cover_image_url
      : undefined;
    const wordCount = contentText ? contentText.split(/\s+/).length : 0;
    writeRoute(route, createPage({
      title: `${title} | Sahadhyayi`,
      description,
      route,
      image,
      type: "article",
      entityType: "Article",
      entityName: title,
      bodyText: contentText,
      publishedAt: article.published_at || article.created_at,
      modifiedAt: article.updated_at || article.published_at || article.created_at,
      authorName,
      wordCount,
    }));
    articleCount += 1;
  }
}

const { data: books, error: booksError } = await fetchPaginatedRows(
  supabase.from("books_library")
    .select("id,title,description,cover_image_url,author_id,author,isbn,genre,language,pages,publication_year")
    .not("id", "is", null)
    .not("title", "is", null),
  "books",
  10000,
  (label, maxRows) => console.warn(`[prerender] Reached the ${maxRows}-row ${label} safety cap; additional records were not prerendered.`),
);

if (booksError) {
  console.warn(`[prerender] Could not fetch public books: ${booksError.message}`);
} else {
  const { data: bookAuthors, error: bookAuthorsError } = await fetchPaginatedRows(
    supabase.from("authors").select("id,name"),
    "book authors",
    5000,
    (label, maxRows) => console.warn(`[prerender] Reached the ${maxRows}-row ${label} safety cap; additional records were not prerendered.`),
  );
  if (bookAuthorsError) console.warn(`[prerender] Could not fetch book author links: ${bookAuthorsError.message}`);
  const authorById = new Map((bookAuthors ?? []).map((author) => [author.id, author]));
  const authorByName = new Map((bookAuthors ?? []).map((author) => [String(author.name ?? "").trim().toLowerCase(), author]));
  for (const book of books ?? []) {
    const id = String(book.id ?? "").trim();
    const title = String(book.title ?? "").trim();
    if (!id || !title || id.includes("/") || id === "." || id === "..") continue;
    const route = `/book/${encodeURIComponent(id)}`;
    const description = plainText(book.description) ||
      `Explore ${title} on Sahadhyayi, the digital reading community for fellow readers.`;
    const authorRecord = (book.author_id && authorById.get(book.author_id)) || authorByName.get(String(book.author ?? "").trim().toLowerCase());
    const authorName = String(authorRecord?.name || book.author || "").trim();
    const authorSlug = authorRecord?.name ? slugify(authorRecord.name) : "";
    const bookAuthor = authorName
      ? { name: authorName, ...(authorSlug ? { url: `/authors/${authorSlug}` } : {}) }
      : undefined;
    writeRoute(route, createPage({
      title: `${title} - Read Online & Book Details | Sahadhyayi`,
      description,
      route,
      image: book.cover_image_url,
      type: "book",
      entityType: "Book",
      entityName: title,
      bodyText: book.description,
      bookAuthor,
      bookIsbn: book.isbn,
      bookGenre: book.genre,
      bookLanguage: book.language,
      bookPages: Number(book.pages),
      bookPublicationYear: book.publication_year,
      breadcrumbs: [{ name: "Home", route: "/" }, { name: "Library", route: "/library" }, { name: title, route }],
    }));
    bookCount += 1;
  }
}

const { data: authors, error: authorsError } = await fetchPaginatedRows(
  supabase.from("authors")
    .select("id,name,bio,profile_image_url,website_url,location,genres,updated_at")
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
    const relatedBooks = (books ?? [])
      .filter((book) => (author.id && book.author_id === author.id) || (!book.author_id && String(book.author ?? "").trim().toLowerCase() === name.toLowerCase()))
      .map((book) => {
        const id = String(book.id ?? "").trim();
        const title = String(book.title ?? "").trim();
        return id && title && !id.includes("/") && id !== "." && id !== ".."
          ? { title, route: `/book/${encodeURIComponent(id)}` }
          : null;
      })
      .filter(Boolean);
    const authorImage = typeof author.profile_image_url === "string" && /^https:\/\/i.test(author.profile_image_url)
      ? author.profile_image_url
      : undefined;
    const sameAs = typeof author.website_url === "string" && /^https:\/\/i.test(author.website_url)
      ? [author.website_url]
      : [];
    writeRoute(route, createPage({
      title: `${name} - Author Profile | Sahadhyayi`,
      description,
      route,
      type: "profile",
      entityType: "Person",
      entityName: name,
      image: authorImage,
      bodyText: author.bio,
      sameAs,
      relatedBooks,
      breadcrumbs: [{ name: "Home", route: "/" }, { name: "Authors", route: "/authors" }, { name, route }],
    }));
    authorCount += 1;
  }
}

console.log(`[prerender] Generated ${articleCount} article, ${bookCount} book and ${authorCount} author HTML routes in dist/.`);
