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

function createPage({ title, description, route, image, type, entityType, entityName, bodyText, publishedAt, modifiedAt, authorName, wordCount, schemaType, about, breadcrumbs, relatedBooks, relatedArticles, sameAs, personDetails, itemList, bookAuthor, bookIsbn, bookGenre, bookLanguage, bookPages, bookPublicationYear, relatedBooksTitle }) {
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
          ...(image && /^https:\/\//i.test(image) ? { image } : {}),
          ...(Array.isArray(sameAs) && sameAs.length ? { sameAs: sameAs.filter((value) => typeof value === "string" && /^https:\/\//i.test(value)) } : {}),
          ...(personDetails?.jobTitle ? { jobTitle: personDetails.jobTitle } : {}),
          ...(personDetails?.birthPlace ? { birthPlace: { "@type": "Place", name: personDetails.birthPlace } } : {}),
          ...(Array.isArray(personDetails?.knowsAbout) && personDetails.knowsAbout.length ? { knowsAbout: personDetails.knowsAbout } : {}),
          ...(Array.isArray(personDetails?.subjectOf) && personDetails.subjectOf.length ? {
            subjectOf: personDetails.subjectOf
              .filter((entry) => entry && typeof entry.name === "string" && typeof entry.url === "string" && /^https:\/\//i.test(entry.url))
              .map((entry) => ({ "@type": "CreativeWork", name: entry.name, url: entry.url })),
          } : {}),
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
    ...(Array.isArray(itemList) && itemList.length ? { mainEntity: { "@type": "ItemList", numberOfItems: itemList.length, itemListElement: itemList.map((entry, index) => ({ "@type": "ListItem", position: index + 1, item: { "@type": "Person", name: entry.name, url: `${SITE_URL}${route}#profile-${entry.slug}`, ...(entry.description ? { description: entry.description } : {}), ...(Array.isArray(entry.knowsAbout) && entry.knowsAbout.length ? { knowsAbout: entry.knowsAbout } : {}) } })) } } : {}),
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
    ${entityType === "Book" ? "<section aria-label=\"Book details\"><h2>About this book</h2><dl>" + (bookGenre ? "<dt>Genre</dt><dd>" + escapeHtml(bookGenre) + "</dd>" : "") + (bookPublicationYear ? "<dt>Publication year</dt><dd>" + escapeHtml(bookPublicationYear) + "</dd>" : "") + (bookLanguage ? "<dt>Language</dt><dd>" + escapeHtml(bookLanguage) + "</dd>" : "") + (bookIsbn ? "<dt>ISBN</dt><dd>" + escapeHtml(bookIsbn) + "</dd>" : "") + (bookPages ? "<dt>Pages</dt><dd>" + escapeHtml(bookPages) + "</dd>" : "") + "</dl></section>" : ""}
    ${Array.isArray(relatedBooks) && relatedBooks.length ? `<section aria-label="Related books"><h2>${escapeHtml(relatedBooksTitle || `Books by ${entityName || "this author"}`)}</h2><ul>${relatedBooks.map((book) => `<li><a href="${escapeHtml(book.route)}">${escapeHtml(book.title)}</a></li>`).join("")}</ul></section>` : ""}
    ${Array.isArray(relatedArticles) && relatedArticles.length ? `<nav aria-label="Related articles"><h2>More articles by this reader</h2><ul>${relatedArticles.map((article) => `<li><a href="${escapeHtml(article.route)}">${escapeHtml(article.title)}</a></li>`).join("")}</ul></nav>` : ""}
    ${Array.isArray(itemList) && itemList.length ? `<nav aria-label="People in this collection"><h2>Profiles in this collection</h2><ul>${itemList.map((entry) => `<li><a href="${escapeHtml(route)}#profile-${escapeHtml(entry.slug)}">${escapeHtml(entry.name)}</a></li>`).join("")}</ul></nav>` : ""}
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
  { route: "/social-activists", title: "Social Activists and Their Work | Sahadhyayi", description: "Discover source-linked profiles of activists organising for children's rights, workers, environmental justice and public accountability.", schemaType: "CollectionPage", about: ["Children's rights", "Workers' rights", "Environmental justice", "Women's rights", "Public accountability"], breadcrumbs: [{ name: "Home", route: "/" }, { name: "Social Activists", route: "/social-activists" }], itemList: [
    { slug: "kailash-satyarthi", name: "Kailash Satyarthi", description: "Children's rights activist and Nobel Peace Prize laureate." },
    { slug: "ela-bhatt", name: "Ela Bhatt", description: "Women's rights activist and founder of the Self-Employed Women's Association." },
    { slug: "medha-patkar", name: "Medha Patkar", description: "Environmental justice organiser associated with the Narmada Bachao Andolan." },
    { slug: "aruna-roy", name: "Aruna Roy", description: "Transparency and right-to-information campaigner." },
  ] },
  { route: "/freedom-fighters", title: "Indian Freedom Fighters | Sahadhyayi", description: "Explore source-linked profiles of people and movements that shaped India's struggle against colonial rule.", schemaType: "CollectionPage", about: ["Indian independence movement", "Anti-colonial resistance", "National movement", "Political history"], breadcrumbs: [{ name: "Home", route: "/" }, { name: "Freedom Fighters", route: "/freedom-fighters" }], itemList: [
    { slug: "subhas-chandra-bose", name: "Subhas Chandra Bose", description: "Nationalist leader associated with the Indian National Army." },
    { slug: "bhagat-singh", name: "Bhagat Singh", description: "Revolutionary and anti-colonial political writer." },
    { slug: "sarojini-naidu", name: "Sarojini Naidu", description: "Poet, women's rights campaigner and freedom fighter." },
    { slug: "rani-lakshmibai", name: "Rani Lakshmibai", description: "Queen of Jhansi and leader in the 1857 uprising." },
    { slug: "mahatma-gandhi", name: "Mahatma Gandhi", description: "Advocate of satyagraha and non-violent resistance." },
    { slug: "bal-gangadhar-tilak", name: "Bal Gangadhar Tilak", description: "Nationalist leader, journalist and Home Rule organiser." },
    { slug: "chandrashekhar-azad", name: "Chandrashekhar Azad", description: "Revolutionary organiser associated with the HSRA." },
    { slug: "maulana-abul-kalam-azad", name: "Maulana Abul Kalam Azad", description: "Nationalist leader and independent India's first education minister." },
    { slug: "begum-hazrat-mahal", name: "Begum Hazrat Mahal", description: "Leader of resistance in Awadh during the 1857 uprising." },
  ] },
  { route: "/quotes", title: "Book Quotes and Literary Inspiration | Sahadhyayi", description: "Discover memorable literary quotes and ideas that inspire reflection, reading, and conversation." },
  { route: "/games", title: "Literary Games and Book Quizzes | Sahadhyayi", description: "Challenge your book knowledge with literary games, reading quizzes, and activities for book lovers." },
];

for (const page of publicPages) {
  writeRoute(page.route, createPage({ ...page, type: "website" }));
}

const researchTopicPages = [
  {
    "slug": "artificial-intelligence",
    "name": "Artificial intelligence",
    "description": "Explore research papers on artificial intelligence, including machine reasoning, generative models, responsible AI, and real-world applications."
  },
  {
    "slug": "machine-learning",
    "name": "Machine learning",
    "description": "Discover machine learning research on algorithms, model training, evaluation, deep learning, and practical applications."
  },
  {
    "slug": "climate-science",
    "name": "Climate science",
    "description": "Explore climate science research on climate change, impacts, mitigation, adaptation, and evidence from environmental studies."
  },
  {
    "slug": "psychology",
    "name": "Psychology",
    "description": "Discover psychology research on cognition, behaviour, mental processes, development, and social experience."
  },
  {
    "slug": "medicine",
    "name": "Medicine",
    "description": "Explore medical and health research across clinical studies, public health, diagnosis, treatment, and biomedical science."
  },
  {
    "slug": "physics",
    "name": "Physics",
    "description": "Discover physics research across fundamental theory, materials, particles, quantum science, and the physical universe."
  }
];
for (const topic of researchTopicPages) {
  const route = `/research-papers/topic/${topic.slug}`;
  writeRoute(route, createPage({
    title: `${topic.name} Research Papers & Studies | Sahadhyayi`,
    description: topic.description,
    route,
    type: "website",
    schemaType: "CollectionPage",
    about: [topic.name, "Research papers", "Academic studies"],
    breadcrumbs: [{ name: "Home", route: "/" }, { name: "Research Papers", route: "/research-papers" }, { name: topic.name, route }],
    bodyText: topic.description,
  }));
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
  {
    "slug": "amal-kumar-raychaudhuri",
    "name": "Amal Kumar Raychaudhuri",
    "description": "Explore the life and work of Indian physicist Amal Kumar Raychaudhuri, whose equation became a key result in general relativity and cosmology.",
    "jobTitle": "Theoretical physicist",
    "birthPlace": "Barisal, Bengal Presidency (now in Bangladesh)",
    "knowsAbout": [
      "Raychaudhuri equation",
      "General relativity",
      "Relativistic cosmology"
    ],
    "references": [
      {
        "name": "Relativistic Cosmology. I (1955)",
        "url": "https://journals.aps.org/pr/abstract/10.1103/PhysRev.98.1123"
      },
      {
        "name": "Indian National Science Academy biography",
        "url": "https://insaindia.res.in/07062023_no.php?id=N87-0976"
      },
      {
        "name": "India Science profile",
        "url": "https://indiascience.dst.gov.in/videos/amal-kumar-raychaudhuri-e-1"
      }
    ]
  },
  {
    "slug": "c-v-raman",
    "name": "C. V. Raman",
    "description": "Learn about C. V. Raman, the Indian physicist whose discovery of the Raman Effect earned the 1930 Nobel Prize in Physics.",
    "jobTitle": "Physicist",
    "birthPlace": "Tiruchirappalli, Tamil Nadu, India",
    "knowsAbout": [
      "Raman effect",
      "Light scattering",
      "Optics"
    ],
    "image": "https://commons.wikimedia.org/wiki/Special:FilePath/Sir_CV_Raman.JPG",
    "references": [
      {
        "name": "A New Type of Secondary Radiation (1928)",
        "url": "https://www.nature.com/articles/121501c0"
      },
      {
        "name": "Nobel Prize biography",
        "url": "https://www.nobelprize.org/prizes/physics/1930/raman/biographical/"
      },
      {
        "name": "American Chemical Society landmark",
        "url": "https://www.acs.org/education/whatischemistry/landmarks/ramaneffect.html"
      }
    ]
  },
  {
    "slug": "satyendra-nath-bose",
    "name": "Satyendra Nath Bose",
    "description": "Discover the life and quantum physics contributions of Satyendra Nath Bose, whose work led to Bose–Einstein statistics.",
    "jobTitle": "Physicist",
    "birthPlace": "Calcutta (now Kolkata), India",
    "knowsAbout": [
      "Bose–Einstein statistics",
      "Quantum mechanics",
      "Bosons"
    ],
    "image": "https://commons.wikimedia.org/wiki/Special:FilePath/Satyendra-nath-bose.jpg",
    "references": [
      {
        "name": "Plancks Gesetz und Lichtquantenhypothese (1924)",
        "url": "https://doi.org/10.1007/BF01327326"
      },
      {
        "name": "BoseStat@100 · S. N. Bose National Centre for Basic Sciences",
        "url": "https://www.bose.res.in/sevents/bosestat100/index.jsp"
      }
    ]
  },
  {
    "slug": "srinivasa-ramanujan",
    "name": "Srinivasa Ramanujan",
    "description": "Explore the life, notebooks and mathematical contributions of Srinivasa Ramanujan, one of India's most influential mathematicians.",
    "jobTitle": "Mathematician",
    "birthPlace": "Erode, Tamil Nadu, India",
    "knowsAbout": [
      "Number theory",
      "Infinite series",
      "Partitions",
      "Mock theta functions"
    ],
    "image": "https://commons.wikimedia.org/wiki/Special:FilePath/Srinivasa_Ramanujan-_Add._MS_a947.jpg",
    "references": [
      {
        "name": "Highly Composite Numbers (1915)",
        "url": "https://ramanujan.sirinudi.org/Volumes/published/ram15.pdf"
      },
      {
        "name": "MacTutor · University of St Andrews",
        "url": "https://mathshistory.st-andrews.ac.uk/Biographies/Ramanujan/"
      },
      {
        "name": "Explore Trinity · University of Cambridge",
        "url": "https://explore.trin.cam.ac.uk/assets/ramanujan/"
      }
    ]
  },
  {
    "slug": "marie-curie",
    "name": "Marie Curie",
    "description": "Explore Marie Curie's pioneering research on radioactivity and the discoveries of polonium and radium.",
    "jobTitle": "Physicist and chemist",
    "birthPlace": "Warsaw, Poland",
    "knowsAbout": [
      "Radioactivity",
      "Polonium",
      "Radium"
    ],
    "references": [
      {
        "name": "Marie Curie — Nobel Prize facts",
        "url": "https://www.nobelprize.org/prizes/physics/1903/marie-curie/facts/"
      }
    ]
  },
  {
    "slug": "albert-einstein",
    "name": "Albert Einstein",
    "description": "Learn about Albert Einstein's life and contributions to relativity, quantum theory and modern physics.",
    "jobTitle": "Theoretical physicist",
    "birthPlace": "Ulm, German Empire (now Germany)",
    "knowsAbout": [
      "Special relativity",
      "General relativity",
      "Photoelectric effect",
      "Brownian motion"
    ],
    "references": [
      {
        "name": "Albert Einstein — Nobel Prize facts",
        "url": "https://www.nobelprize.org/prizes/physics/1921/einstein/facts/"
      }
    ]
  },
  {
    "slug": "katherine-johnson",
    "name": "Katherine Johnson",
    "description": "Discover NASA mathematician Katherine Johnson's calculations for Mercury, Apollo and early human spaceflight.",
    "jobTitle": "Mathematician",
    "birthPlace": "White Sulphur Springs, West Virginia, United States",
    "knowsAbout": [
      "Orbital mechanics",
      "Mercury programme",
      "Apollo programme",
      "Spaceflight trajectory calculations"
    ],
    "references": [
      {
        "name": "Katherine Johnson · NASA Science",
        "url": "https://science.nasa.gov/people/katherine-johnson/"
      },
      {
        "name": "Katherine Johnson biography · NASA",
        "url": "https://www.nasa.gov/centers-and-facilities/langley/katherine-johnson-biography/"
      }
    ]
  }
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
    image: scientist.image,
    personDetails: {
      jobTitle: scientist.jobTitle,
      birthPlace: scientist.birthPlace,
      knowsAbout: scientist.knowsAbout,
      subjectOf: scientist.references.map((reference) => ({ name: reference.name, url: reference.url })),
    },
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
      breadcrumbs: [{ name: "Home", route: "/" }, { name: "Articles", route: "/articles" }, { name: title, route }],
      relatedArticles: (articles ?? [])
        .filter((candidate) => candidate.user_id && candidate.user_id === article.user_id && candidate.slug !== article.slug)
        .filter((candidate) => /^[a-z0-9][a-z0-9-]{0,139}$/i.test(String(candidate.slug ?? "").trim()) && String(candidate.title ?? "").trim())
        .sort((left, right) => new Date(right.published_at || right.created_at || 0).getTime() - new Date(left.published_at || left.created_at || 0).getTime())
        .slice(0, 3)
        .map((candidate) => ({ title: String(candidate.title).trim(), route: `/articles/${encodeURIComponent(String(candidate.slug).trim())}` })),
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
    const authorRecord = (book.author_id && authorById.get(book.author_id)) || authorByName.get(String(book.author ?? "").trim().toLowerCase());
    const authorName = String(authorRecord?.name || book.author || "").trim();
    const description = plainText(book.description, 260) ||
      `Explore ${title}${authorName ? ` by ${authorName}` : ""} on Sahadhyayi. Check its book details, language, genre, and available reading options.`;
    const authorSlug = authorRecord?.name ? slugify(authorRecord.name) : "";
    const bookAuthor = authorName
      ? { name: authorName, ...(authorSlug ? { url: `/authors/${authorSlug}` } : {}) }
      : undefined;
    const relatedBooks = (books ?? [])
      .filter((candidate) => {
        if (String(candidate.id ?? "") === id) return false;
        const sameAuthor = (book.author_id && candidate.author_id === book.author_id) ||
          (!book.author_id && authorName && String(candidate.author ?? "").trim().toLowerCase() === authorName.toLowerCase());
        const sameGenre = book.genre && candidate.genre &&
          String(candidate.genre).trim().toLowerCase() === String(book.genre).trim().toLowerCase();
        return Boolean(sameAuthor || sameGenre);
      })
      .slice(0, 5)
      .map((candidate) => {
        const relatedId = String(candidate.id ?? "").trim();
        const relatedTitle = String(candidate.title ?? "").trim();
        return relatedId && relatedTitle && !relatedId.includes("/") && relatedId !== "." && relatedId !== ".."
          ? { title: relatedTitle, route: `/book/${encodeURIComponent(relatedId)}` }
          : null;
      })
      .filter(Boolean);
    writeRoute(route, createPage({
      title: `${title}${authorName ? ` by ${authorName}` : ""} — Book Details & Reading Options | Sahadhyayi`,
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
      relatedBooks,
      relatedBooksTitle: authorName ? `More books by ${authorName}` : (book.genre ? `More ${book.genre} books` : "Related books"),
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
    const authorImage = typeof author.profile_image_url === "string" && /^https:\/\//i.test(author.profile_image_url)
      ? author.profile_image_url
      : undefined;
    const sameAs = typeof author.website_url === "string" && /^https:\/\//i.test(author.website_url)
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
