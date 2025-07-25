import { useLocation } from 'react-router-dom';

const SITE_URL = 'https://sahadhyayi.com';

export function useCanonicalUrl() {
  const location = useLocation();
  return `${SITE_URL}${location.pathname}${location.search}`;
}
