
import React from 'react';

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
  
  
  // Temporarily disabled - just set document title
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
  
  if (typeof document !== 'undefined') {
    document.title = fullTitle;
  }

  // Return null instead of Helmet component to prevent errors
  return null;
};

export default SEO;
