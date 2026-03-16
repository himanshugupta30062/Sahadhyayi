import { useEffect } from 'react';

interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  url?: string;
  image?: string;
  type?: 'website' | 'article' | 'book' | 'profile';
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  keywords?: string[];
  schema?: Record<string, unknown>;
  noIndex?: boolean;
  alternateUrls?: { hreflang: string; href: string }[];
  breadcrumbs?: { name: string; url: string }[];
}

const DEFAULT_IMAGE = 'https://sahadhyayi.com/lovable-uploads/sahadhyayi-logo-digital-reading.png';
const SITE_NAME = 'Sahadhyayi';
const SITE_URL = 'https://sahadhyayi.com';

const SEO = ({
  title,
  description,
  canonical,
  url,
  image = DEFAULT_IMAGE,
  type = 'website',
  author,
  publishedTime,
  modifiedTime,
  keywords = [],
  schema,
  noIndex = false,
  alternateUrls = [],
  breadcrumbs = []
}: SEOProps) => {
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const setNamedMeta = (name: string, content: string) => {
      let meta = document.head.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    const setPropertyMeta = (property: string, content: string) => {
      let meta = document.head.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('property', property);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
    const pageUrl = url || canonical || SITE_URL;

    document.title = fullTitle;

    setNamedMeta('description', description);
    setNamedMeta('robots', noIndex ? 'noindex, nofollow' : 'index, follow');

    if (keywords.length > 0) {
      setNamedMeta('keywords', keywords.join(', '));
    }

    setPropertyMeta('og:site_name', SITE_NAME);
    setPropertyMeta('og:type', type === 'book' ? 'article' : type);
    setPropertyMeta('og:title', fullTitle);
    setPropertyMeta('og:description', description);
    setPropertyMeta('og:url', pageUrl);
    setPropertyMeta('og:image', image);

    setNamedMeta('twitter:card', 'summary_large_image');
    setNamedMeta('twitter:title', fullTitle);
    setNamedMeta('twitter:description', description);
    setNamedMeta('twitter:image', image);

    if (author) {
      setNamedMeta('author', author);
    }

    if (publishedTime) {
      setPropertyMeta('article:published_time', publishedTime);
    }

    if (modifiedTime) {
      setPropertyMeta('article:modified_time', modifiedTime);
    }

    let canonicalLink = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', canonical || pageUrl);

    const createdAlternateLinks: HTMLLinkElement[] = [];
    alternateUrls.forEach(({ hreflang, href }) => {
      const altLink = document.createElement('link');
      altLink.setAttribute('rel', 'alternate');
      altLink.setAttribute('hreflang', hreflang);
      altLink.setAttribute('href', href);
      altLink.setAttribute('data-seo-alternate', 'true');
      document.head.appendChild(altLink);
      createdAlternateLinks.push(altLink);
    });

    const graph: Record<string, unknown>[] = [];

    if (schema) {
      graph.push(schema);
    }

    if (breadcrumbs.length > 0) {
      graph.push({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbs.map((crumb, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: crumb.name,
          item: crumb.url
        }))
      });
    }

    const scriptTag = document.createElement('script');
    scriptTag.type = 'application/ld+json';
    scriptTag.setAttribute('data-seo-schema', 'true');
    scriptTag.text = JSON.stringify(
      graph.length === 1
        ? graph[0]
        : {
            '@context': 'https://schema.org',
            '@graph': graph
          }
    );

    if (graph.length > 0) {
      document.head.appendChild(scriptTag);
    }

    return () => {
      createdAlternateLinks.forEach((link) => link.remove());
      if (graph.length > 0) {
        scriptTag.remove();
      }
    };
  }, [
    alternateUrls,
    author,
    breadcrumbs,
    canonical,
    description,
    image,
    keywords,
    modifiedTime,
    noIndex,
    publishedTime,
    schema,
    title,
    type,
    url
  ]);

  return null;
};

export default SEO;
