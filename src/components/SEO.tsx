import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  url?: string;
  image?: string;
}

const DEFAULT_IMAGE = '/lovable-uploads/fff3e49f-a95f-4fcf-ad47-da2dc6626f29.png';

const SEO = ({ title, description, canonical, url, image = DEFAULT_IMAGE }: SEOProps) => {
  const pageUrl = url || canonical;
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      {canonical && <link rel="canonical" href={canonical} />}
      <meta property="og:type" content="website" />
      {pageUrl && <meta property="og:url" content={pageUrl} />}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta name="twitter:card" content="summary_large_image" />
      {pageUrl && <meta name="twitter:url" content={pageUrl} />}
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  );
};

export default SEO;
