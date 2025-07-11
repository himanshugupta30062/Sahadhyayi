export interface MockAuthor {
  id: string;
  name: string;
  bio: string;
  profile_image_url: string | null;
  location: string;
  website_url: string | null;
  social_links: any;
  genres: string[];
  books_count: number;
  followers_count: number;
  rating: number;
  upcoming_events: number;
  created_at: string;
  updated_at: string;
}

export const mockAuthors: MockAuthor[] = [
  {
    id: 'mock-1',
    name: 'Rabindranath Tagore',
    bio: 'Nobel Prize-winning Bengali polymath who reshaped Bengali literature and music.',
    profile_image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Rabindranath_Tagore_in_1909.jpg/256px-Rabindranath_Tagore_in_1909.jpg',
    location: 'Kolkata, India',
    website_url: 'https://en.wikipedia.org/wiki/Rabindranath_Tagore',
    social_links: { wikipedia: 'https://en.wikipedia.org/wiki/Rabindranath_Tagore' },
    genres: ['Poetry', 'Literature', 'Philosophy', 'Drama'],
    books_count: 25,
    followers_count: 45000,
    rating: 4.8,
    upcoming_events: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'mock-2',
    name: 'Haruki Murakami',
    bio: 'Japanese writer known for works blending surrealism with pop culture and magical realism.',
    profile_image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Haruki_Murakami_2018.jpg/256px-Haruki_Murakami_2018.jpg',
    location: 'Tokyo, Japan',
    website_url: 'https://en.wikipedia.org/wiki/Haruki_Murakami',
    social_links: { wikipedia: 'https://en.wikipedia.org/wiki/Haruki_Murakami' },
    genres: ['Surrealism', 'Contemporary Fiction', 'Magical Realism'],
    books_count: 22,
    followers_count: 125000,
    rating: 4.7,
    upcoming_events: 4,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
];
