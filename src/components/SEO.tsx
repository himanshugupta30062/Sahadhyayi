import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  image?: string;
  url?: string;
  type?: string;
}

const defaultImage = "/lovable-uploads/fff3e49f-a95f-4fcf-ad47-da2dc6626f29.png";
const defaultUrl = "https://sahadhyayi.com";

const SEO = ({ title, description, canonical, image = defaultImage, url = defaultUrl, type = "website" }: SEOProps) => (
  <Helmet>
    <title>{title}</title>
    <meta name="description" content={description} />
    {canonical && <link rel="canonical" href={canonical} />}
    <meta property="og:type" content={type} />
    <meta property="og:url" content={url} />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:image" content={image} />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:site_name" content="Sahadhyayi" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content={url} />
    <meta name="twitter:title" content={title} />
    <meta name="twitter:description" content={description} />
    <meta name="twitter:image" content={image} />
  </Helmet>
);

export default SEO;
