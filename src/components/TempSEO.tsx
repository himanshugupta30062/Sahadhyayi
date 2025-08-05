
import React from 'react';

// Temporary SEO component to prevent errors while we fix the helmet issue
interface TempSEOProps {
  title: string;
  description: string;
  [key: string]: any; // Accept all other props but ignore them
}

const TempSEO = ({ title, description, ...props }: TempSEOProps) => {
  
  
  // Set document title directly without helmet
  if (typeof document !== 'undefined') {
    document.title = title.includes('Sahadhyayi') ? title : `${title} | Sahadhyayi`;
  }
  
  return null; // Don't render anything
};

export default TempSEO;
