export const basePages = [
  {
    path: '/',
    title: 'Sahadhyayi - Digital Reading Community & Book Library | Fellow Readers Platform',
    description: 'Sahadhyayi means "fellow reader" in Sanskrit. Join our vibrant digital reading community and explore thousands of books.'
  },
  {
    path: '/library',
    title: 'Library - Sahadhyayi',
    description: 'Browse thousands of free books in our online library.'
  },
  {
    path: '/authors',
    title: 'Authors - Sahadhyayi',
    description: 'Discover authors on the Sahadhyayi reading platform.'
  },
  {
    path: '/about',
    title: 'About Sahadhyayi',
    description: 'Learn about the Sahadhyayi mission and community.'
  }
];

export const staticPages = [
  ...basePages.map(p => p.path),
  '/groups',
  '/map',
  '/blog',
  '/community-stories',
  '/quotes',
  '/about',
  '/social',
  '/help',
  '/feedback',
  '/signin',
  '/signup',
  '/privacy',
  '/terms',
  '/cookies',
  '/dmca',
  '/investors'
];

export const books = [
  { id: '1', title: 'A Brief History of Time', description: 'An overview of cosmology and the origins of the universe.' },
  { id: '2', title: 'गोदान', description: 'A classic Hindi novel depicting rural life in India.' },
  { id: '3', title: 'Pride and Prejudice', description: 'A romantic novel that critiques the British landed gentry.' },
  { id: '4', title: 'Sapiens', description: 'A brief history of humankind.' },
  { id: '5', title: 'गुनाहों का देवता', description: 'A popular Hindi novel exploring a tragic love story.' }
];

export const authors = [
  { name: 'Rabindranath Tagore', bio: 'Nobel Prize-winning Bengali polymath who reshaped Bengali literature and music.' },
  { name: 'Haruki Murakami', bio: 'Japanese writer known for works blending surrealism with pop culture and magical realism.' }
];
