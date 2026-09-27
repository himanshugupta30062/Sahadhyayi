
export interface BookSchema {
  title: string;
  author: string;
  description: string;
  genre?: string;
  isbn?: string;
  publisher?: string;
  publicationYear?: number;
  language?: string;
  pages?: number;
  coverImage?: string;
  price?: number;
  currency?: string;
  rating?: number;
  ratingCount?: number;
  url: string;
}

export interface AuthorSchema {
  name: string;
  bio?: string;
  url: string;
  sameAs?: string[];
  image?: string;
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export const generateBookSchema = (book: BookSchema) => {
  const schema: any = {
    "@context": "https://schema.org",
    "@type": "Book",
    "name": book.title,
    "author": {
      "@type": "Person",
      "name": book.author
    },
    "description": book.description,
    "url": book.url,
    "bookFormat": "EBook",
    "inLanguage": book.language || "en"
  };

  if (book.genre) {
    schema.genre = book.genre;
  }

  if (book.isbn) {
    schema.isbn = book.isbn;
  }

  if (book.publisher) {
    schema.publisher = {
      "@type": "Organization",
      "name": book.publisher
    };
  }

  if (book.publicationYear) {
    schema.datePublished = book.publicationYear.toString();
  }

  if (book.pages) {
    schema.numberOfPages = book.pages;
  }

  if (book.coverImage) {
    schema.image = book.coverImage;
  }

  if (book.price && book.currency) {
    schema.offers = {
      "@type": "Offer",
      "price": book.price.toString(),
      "priceCurrency": book.currency,
      "availability": "https://schema.org/InStock"
    };
  }

  if (book.rating && book.ratingCount) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      "ratingValue": book.rating.toString(),
      "ratingCount": book.ratingCount.toString(),
      "bestRating": "5",
      "worstRating": "1"
    };
  }

  return schema;
};

export const generateAuthorSchema = (author: AuthorSchema) => {
  const schema: any = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": author.name,
    "url": author.url,
    "jobTitle": "Author"
  };

  if (author.bio) {
    schema.description = author.bio;
  }

  if (author.image) {
    schema.image = author.image;
  }

  if (author.sameAs && author.sameAs.length > 0) {
    schema.sameAs = author.sameAs;
  }

  return schema;
};

export const generateBreadcrumbSchema = (items: BreadcrumbItem[]) => {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  };
};

export const generateWebsiteSchema = () => {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Sahadhyayi",
    "alternateName": "Sahadhyayi Reading Community",
    "url": "https://sahadhyayi.com",
    "description": "Join Sahadhyayi's vibrant reading community. Discover books, connect with readers, and explore our digital library.",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://sahadhyayi.com/library?search={search_term_string}",
      "query-input": "required name=search_term_string"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Sahadhyayi",
      "url": "https://sahadhyayi.com",
      "logo": "https://sahadhyayi.com/lovable-uploads/sahadhyayi-logo-digital-reading.png"
    }
  };
};

export const generateOrganizationSchema = () => {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Sahadhyayi",
    "url": "https://sahadhyayi.com",
    "logo": "https://sahadhyayi.com/lovable-uploads/sahadhyayi-logo-digital-reading.png",
    "description": "Digital reading community platform connecting readers and authors worldwide",
    "foundingDate": "2024",
    "sameAs": [
      "https://sahadhyayi.com/about"
    ]
  };
};
